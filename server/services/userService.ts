import R from 'ramda'
import logger from '../../log'
import { properCaseName } from '../utils/utils'
import { usernamePattern } from '../config/forms/validations'
import { Elite2ClientBuilder } from '../data/elite2ClientBuilder'
import { User, GetUsersResults } from '../types/uof'

export default class UserService {
  constructor(private readonly elite2ClientBuilder: Elite2ClientBuilder, private readonly authClientBuilder) {}

  private emailNotExistPromise(username: string) {
    return Promise.resolve({ username, exists: false, verified: false })
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

  public async getUsers(token: string, usernames: string[]): Promise<GetUsersResults[]> {
    try {
      if (!usernames) {
        return []
      }
      const client = this.authClientBuilder(token)

      const getEmailSafely = R.ifElse(R.test(usernamePattern), client.getEmail, this.emailNotExistPromise)

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
        .map(({ username, verified, email, name, staffId }) => ({
          username,
          verified,
          email,
          name,
          staffId,
        }))

      return results
    } catch (error) {
      logger.error('Error during getEmails: ', error.stack)
      throw error
    }
  }
}
