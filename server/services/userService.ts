import logger from '../../log'
import { properCaseName } from '../utils/utils'
import { usernamePattern } from '../config/forms/validations'
import { Elite2ClientBuilder } from '../data/elite2ClientBuilder'
import { User, UserWithPrison } from '../types/uof'
import { AuthClientBuilder, EmailResult, FoundUserResult } from '../data/authClientBuilder'

export default class UserService {
  constructor(
    private readonly elite2ClientBuilder: Elite2ClientBuilder,
    private readonly authClientBuilder: AuthClientBuilder
  ) {}

  private async emailNotExistPromise(username: string): Promise<EmailResult> {
    return { username, exists: false, verified: false }
  }

  public async getUser(token: string): Promise<User> {
    try {
      const elite2Client = this.elite2ClientBuilder(token)
      const user = await elite2Client.getUser()

      const activeCaseLoads = user.activeCaseLoadId ? await elite2Client.getUserCaseLoads() : []
      const activeCaseLoad = activeCaseLoads.find(caseLoad => caseLoad.caseLoadId === user.activeCaseLoadId)

      return {
        ...user,
        displayName: `${properCaseName(user.firstName)} ${properCaseName(user.lastName)}`,
        activeCaseLoad,
      }
    } catch (error) {
      logger.error('Error during getUser: ', error.stack)
      throw error
    }
  }

  // TODO: multiple username support not required, so rewrite
  public async getUsers(token: string, usernames: string[]): Promise<FoundUserResult[]> {
    try {
      if (!usernames) {
        return []
      }
      const client = this.authClientBuilder(token)

      const getEmailSafely = username =>
        usernamePattern.test(username) ? client.getEmail(username) : this.emailNotExistPromise(username)

      const requests = usernames.map((username, i) =>
        getEmailSafely(username.toUpperCase()).then(email => ({ ...email, i }))
      )
      const responses = await Promise.all(requests)

      const usernamesForExisting = responses
        .filter(email => email.exists)
        .map(email => client.getUser(email.username).then(user => ({ ...user, ...email })))
      const existing = await Promise.all(usernamesForExisting)

      const results = [...existing]
        .sort(({ i }, { i: j }) => i - j)
        .map(({ username, verified, email, name, staffId, activeCaseLoadId }) => ({
          username,
          verified,
          email,
          name,
          staffId,
          activeCaseLoadId,
        }))

      return results
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

  sortUsers = (agencyId: string) => (user1: UserWithPrison, user2: UserWithPrison): number => {
    if (user1.activeCaseLoadId === user2.activeCaseLoadId) {
      return user1.username.localeCompare(user2.username)
    }
    if (user1.activeCaseLoadId === agencyId) {
      return -1
    }
    if (user2.activeCaseLoadId === agencyId) {
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
      const eliteClient = this.elite2ClientBuilder(token)
      const authClient = this.authClientBuilder(token)
      const users = await authClient.findUsers(firstName, lastName)

      const prisons = await eliteClient.getPrisons()

      return users
        .map(user => ({
          ...user,
          prison: prisons.find(p => p.agencyId === user.activeCaseLoadId)?.description,
        }))
        .sort(this.sortUsers(agencyId))
    } catch (error) {
      logger.error('Error during findUsers: ', error.stack)
      throw error
    }
  }
}
