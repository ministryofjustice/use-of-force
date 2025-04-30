import logger from '../../log'
import { properCaseName, forenameToInitial } from '../utils/utils'
import { usernamePattern } from '../config/forms/validations'
import { type PrisonClient } from '../data'
import { User, UserWithPrison, FoundUserResult } from '../types/uof'
import ManageUsersApiClient, { EmailResult } from '../data/manageUsersApiClient'

export default class UserService {
  constructor(private readonly manageUsersClient: ManageUsersApiClient, private readonly prisonClient: PrisonClient) {}

  public async getSelf(token: string): Promise<User> {
    try {
      const user = await this.prisonClient.getUser(token)
      const activeCaseLoads = user.activeCaseLoadId ? await this.prisonClient.getUserCaseLoads(token) : []
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

  private async getEmailSafely(client: ManageUsersApiClient, username: string, token: string): Promise<EmailResult> {
    return usernamePattern.test(username)
      ? client.getEmail(username, token)
      : { username, exists: false, verified: false }
  }

  public async getUser(token: string, username: string): Promise<FoundUserResult> {
    try {
      const client = this.manageUsersClient
      const email = await this.getEmailSafely(client, username.toUpperCase(), token)
      const user = email.exists && (await client.getUser(email.username, token))

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
      const users = await this.manageUsersClient.findUsers(firstName, lastName, token)

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
      const users = await this.manageUsersClient.findUsers(firstName, lastName, token)

      const prisons = await this.prisonClient.getPrisons(token)

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
      const user = await this.manageUsersClient.getUser(username, token)
      const caseload = await this.prisonClient.getPrisonById(user.activeCaseLoadId, token)
      return caseload.description
    } catch (error) {
      logger.error('Error during getUser: ', error.stack)
      throw error
    }
  }
}
