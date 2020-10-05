import superagent from 'superagent'
/** @type {any} */
import Agent, { HttpsAgent } from 'agentkeepalive'
import querystring from 'querystring'
import sanitiseError from '../utils/errorSanitiser'
import logger from '../../log'
import config from '../config'
import { generateOauthClientToken } from '../authentication/clientCredentials'
import { SystemToken } from '../types/uof'

const timeoutSpec = {
  response: config.apis.oauth2.timeout.response,
  deadline: config.apis.oauth2.timeout.deadline,
}
const apiUrl = config.apis.oauth2.url

const agentOptions = {
  maxSockets: config.apis.oauth2.agent.maxSockets,
  maxFreeSockets: config.apis.oauth2.agent.maxFreeSockets,
  freeSocketTimeout: config.apis.oauth2.agent.freeSocketTimeout,
}

const keepaliveAgent = apiUrl.startsWith('https') ? new HttpsAgent(agentOptions) : new Agent(agentOptions)

async function getSystemClientToken(username?: string) {
  const clientToken = generateOauthClientToken(config.apis.oauth2.systemClientId, config.apis.oauth2.systemClientSecret)

  const oauthRequest = username
    ? querystring.stringify({ grant_type: 'client_credentials', username })
    : querystring.stringify({ grant_type: 'client_credentials' })

  logger.info(
    `Oauth request '${oauthRequest}' for client id '${config.apis.oauth2.apiClientId}' and user '${username}'`
  )

  const result = await superagent
    .post(`${apiUrl}/oauth/token`)
    .set('Authorization', clientToken)
    .set('content-type', 'application/x-www-form-urlencoded')
    .send(oauthRequest)
    .timeout(timeoutSpec)
  return result.body
}

type GetParams = {
  path: string
  query: string
  headers: Record<string, string>
  responseType: string
  raw: boolean
}

function getBuilder(token) {
  return async ({ path = null, query = '', headers = {}, responseType = '', raw = false }: GetParams): Promise<any> => {
    logger.info(`Get using user credentials: calling auth: ${path} ${query}`)
    try {
      const result = await superagent
        .get(path)
        .ok(res => [200, 204, 404].includes(res.status))
        .agent(keepaliveAgent)
        .retry(2, (err, res) => {
          if (err) logger.info(`Retry handler found API error with ${err.code} ${err.message}`)
          return undefined // retry handler only for logging retries, not to influence retry logic
        })
        .query(query)
        .auth(token, { type: 'bearer' })
        .set(headers)
        .responseType(responseType)
        .timeout(timeoutSpec)

      return raw ? result : result.body
    } catch (error) {
      logger.warn({ path, ...sanitiseError(error), query }, `Error calling auth: ${path}`)
      throw error
    }
  }
}

export type EmailResult = {
  email?: string
  username: string
  exists: boolean
  verified: boolean
}

type UserResult = {
  name: string
  staffId: number
}

export type FoundUserResult = {
  username: string
  verified: boolean
  email?: string // only if verified
  name: string
  staffId: number
}

export class AuthClient {
  private get;

  constructor(token: string) {
    this.get = getBuilder(token)
  }

  async getEmail(username: string): Promise<EmailResult> {
    const path = `${apiUrl}/api/user/${username}/email`
    const { status, body } = await this.get({ path, raw: true })
    return {
      email: body.email,
      username: body.username || username,
      exists: status < 400,
      verified: status === 200,
    }
  }

  async getUser(username: string): Promise<UserResult> {
    const path = `${apiUrl}/api/user/${username}`
    const body = await this.get({ path })
    return body
  }

  async findUsers(firstName: string, lastName: string): Promise<FoundUserResult[]> {
    const path = `${apiUrl}/api/prisonuser`
    const body = await this.get({ path, query: querystring.stringify({ firstName, lastName }) })
    return body
  }
}
export function authClientBuilder(token: string): AuthClient {
  return new AuthClient(token)
}

export type AuthClientBuilder = typeof authClientBuilder

export const systemToken: SystemToken = async (username?: string): Promise<string> => {
  const systemClientToken = await getSystemClientToken(username)
  return systemClientToken.access_token
}
