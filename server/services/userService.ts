import logger from '../../log'
import { properCaseName, forenameToInitial } from '../utils/utils'
import validations from '../config/forms/validations'
import type { RestClientBuilder, PrisonClient, AuthClient } from '../data'
import { User, UserWithPrison, FoundUserResult } from '../types/uof'
import { EmailResult } from '../data/authClient'

export default class UserService {
  constructor(
    private readonly prisonClientBuilder: RestClientBuilder<PrisonClient>,
    private readonly authClientBuilder: RestClientBuilder<AuthClient>
  ) {}

  public async getSelf(token: string): Promise<User> {
    try {
      const prisonClient = this.prisonClientBuilder(token)
      const user = await prisonClient.getUser()

      const activeCaseLoads = user.activeCaseLoadId ? await prisonClient.getUserCaseLoads() : []
      const activeCaseLoad = activeCaseLoads.find(caseLoad => caseLoad.caseLoadId === user.activeCaseLoadId)
      const displayName = `${properCaseName(user.firstName)} ${properCaseName(user.lastName)}`

      return {
        ...user,
        displayName,
        displayNameInitial: `${forenameToInitial(displayName)}`,
        activeCaseLoad,
      }
    } catch (error) {
      logger.error('Error during getUser: ', error.stack)
      throw error
    }
  }

  private async getEmailSafely(client: AuthClient, username: string): Promise<EmailResult> {
    return validations.usernamePattern.test(username) ? client.getEmail(username) : { username, exists: false, verified: false }
  }

  public async getUser(token: string, username: string): Promise<FoundUserResult> {
    try {
      const client = this.authClientBuilder(token)
      const email = await this.getEmailSafely(client, username.toUpperCase())
      const user = email.exists && (await client.getUser(email.username))

      return {
        exists: email.exists,
        username: email.username,
        verified: email.verified,
        email: email.email,
        name: user?.name,
        staffId: user?.staffId,
        activeCaseLoadId: user?.activeCaseLoadId,
      }
    } catch (error) {
      logger.error('Error during getEmails: ', error.stack)
      throw error
    }
  }

  public async findUsers(token: string, firstName: string, lastName: string): Promise<FoundUserResult[]> {
    try {
      const client = this.authClientBuilder(token)

      const users = await client.findUsers(firstName, lastName)

      return users
    } catch (error) {
      logger.error('Error during findUsers: ', error.stack)
      throw error
    }
  }

  comparesUsers =
    (agencyId: string) =>
    (user1: UserWithPrison, user2: UserWithPrison): number => {
      if (user1.activeCaseLoadId === user2.activeCaseLoadId) {
        return user1.username.localeCompare(user2.username)
      }
      if (user1.activeCaseLoadId === agencyId || !user2.activeCaseLoadId) {
        return -1
      }
      if (user2.activeCaseLoadId === agencyId || !user1.activeCaseLoadId) {
        return 1
      }
      return user1.prison?.localeCompare(user2.prison) || -1
    }

  public async findUsersWithPrisons(
    token: string,
    agencyId: string,
    firstName: string,
    lastName: string
  ): Promise<UserWithPrison[]> {
    try {
      const eliteClient = this.prisonClientBuilder(token)
      const authClient = this.authClientBuilder(token)
      const users = await authClient.findUsers(firstName, lastName)

      const prisons = await eliteClient.getPrisons()

      return users
        .map(user => ({
          ...user,
          prison: prisons.find(p => p.agencyId === user.activeCaseLoadId)?.description,
        }))
        .sort(this.comparesUsers(agencyId))
    } catch (error) {
      logger.error('Error during findUsers: ', error.stack)
      throw error
    }
  }

  public async getUserLocation(token: string, username: string): Promise<string> {
    try {
      const authClient = this.authClientBuilder(token)
      const prisonClient = this.prisonClientBuilder(token)
      const user = await authClient.getUser(username)
      const caseload = await prisonClient.getPrisonById(user.activeCaseLoadId)
      return caseload.description
    } catch (error) {
      logger.error('Error during getUser: ', error.stack)
      throw error
    }
  }
}
