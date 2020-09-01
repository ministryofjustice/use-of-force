import Agent, { HttpsAgent } from 'agentkeepalive'
import superagent from 'superagent'
import logger from '../../../log'
import TokenVerifier from './TokenVerifier'

export interface ClientConfiguration {
  url: string
  timeout: {
    response: number
    deadline: number
  }
  agent: {
    maxSockets: number
    maxFreeSockets: number
    freeSocketTimeout: number
  }
}

export class TokenVerificationClient implements TokenVerifier {
  private static PATH = '/token/verify'

  private agent

  private config

  constructor(config: ClientConfiguration) {
    this.agent = config.url.startsWith('https') ? new HttpsAgent(config.agent) : new Agent(config.agent)
    this.config = config
  }

  async verify(token: string): Promise<boolean> {
    try {
      const response = await superagent
        .post(`${this.config.url}${TokenVerificationClient.PATH}`)
        .agent(this.agent)
        .auth(token, { type: 'bearer' })
        .accept('application/json')
        .timeout(this.config.timeout)
        .retry(2, (err, _) => {
          if (err) logger.info(`Retry handler found API error with ${err.code} ${err.message}`)
          return undefined // retry handler only for logging retries, not to influence retry logic
        })

      return response?.body?.active || false
    } catch (error) {
      const response = error?.response?.text
      logger.warn(
        `Error calling Token Verification API, path: '${TokenVerificationClient.PATH}', verb: 'POST', response: '${response}'`,
        error.stack
      )
      return false
    }
  }
}
