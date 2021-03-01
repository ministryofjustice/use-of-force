import superagent from 'superagent'
import Agent, { HttpsAgent } from 'agentkeepalive'
import { Readable } from 'stream'
import logger from '../../log'
import sanitiseError from '../utils/errorSanitiser'

interface GetRequest {
  path?: string
  query?: any
  headers?: any
  responseType?: string
}

export interface ClientOptions {
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

export default function RestClientBuilder(name: string, config: ClientOptions) {
  return (token: string): RestClient => new RestClient(name, config, token)
}

export class RestClient {
  constructor(private readonly name: string, private readonly config: ClientOptions, private readonly token: string) {}

  private timeoutSpec = {
    response: this.config.timeout.response,
    deadline: this.config.timeout.deadline,
  }

  private apiUrl = this.config.url

  private agentOptions = {
    maxSockets: this.config.agent.maxSockets,
    maxFreeSockets: this.config.agent.maxFreeSockets,
    freeSocketTimeout: this.config.agent.freeSocketTimeout,
  }

  private agent = this.apiUrl.startsWith('https') ? new HttpsAgent(this.agentOptions) : new Agent(this.agentOptions)

  private defaultErrorLogger = error => logger.warn(sanitiseError(error), `Error calling ${this.name}`)

  async get<T>({ path = null, query = '', headers = {}, responseType = '' }: GetRequest = {}): Promise<T> {
    logger.info(`Get using user credentials: calling ${this.name}: ${path} ${query}`)
    try {
      const result = await superagent
        .get(`${this.apiUrl}${path}`)
        .agent(this.agent)
        .retry(2, (err, res) => {
          if (err) logger.info(`Retry handler found API error with ${err.code} ${err.message}`)
          return undefined // retry handler only for logging retries, not to influence retry logic
        })
        .query(query)
        .auth(this.token, { type: 'bearer' })
        .set(headers)
        .responseType(responseType)
        .timeout(this.timeoutSpec)

      return result.body
    } catch (error) {
      const response = error.response && error.response.text
      logger.warn(
        `Error calling ${this.name}, path: '${path}', verb: 'GET', query: '${query}', response: '${response}'`,
        error.stack
      )
      throw error
    }
  }

  async post<T>({ path = null, headers = {}, responseType = '', data = {}, raw = false } = {}): Promise<T> {
    logger.info(`Post using user credentials: calling ${this.name}: ${path}`)
    try {
      const result = await superagent
        .post(`${this.apiUrl}${path}`)
        .send(data)
        .agent(this.agent)
        .retry(2, (err, res) => {
          if (err) logger.info(`Retry handler found API error with ${err.code} ${err.message}`)
          return undefined // retry handler only for logging retries, not to influence retry logic
        })
        .auth(this.token, { type: 'bearer' })
        .set(headers)
        .responseType(responseType)
        .timeout(this.timeoutSpec)

      return raw ? result : result.body
    } catch (error) {
      const response = error.response && error.response.text
      logger.warn(
        `Error calling ${this.name}, path: '${path}', verb: 'GET', query: 'POST', response: '${response}'`,
        error.stack
      )
      throw error
    }
  }

  stream({ path, headers = {}, errorLogger = this.defaultErrorLogger }): Promise<Readable> {
    logger.info(`Get using user credentials: calling ${this.name}: ${path}`)
    return new Promise((resolve, reject) => {
      superagent
        .get(`${this.apiUrl}${path}`)
        .agent(this.agent)
        .auth(this.token, { type: 'bearer' })
        .retry(2, (err, res) => {
          if (err) logger.info(`Retry handler found API error with ${err.code} ${err.message}`)
          return undefined // retry handler only for logging retries, not to influence retry logic
        })
        .timeout(this.timeoutSpec)
        .set(headers)
        .end((error, response) => {
          if (error) {
            errorLogger(error)
            reject(error)
          } else if (response) {
            const s = new Readable()
            // eslint-disable-next-line no-underscore-dangle,@typescript-eslint/no-empty-function
            s._read = () => {}
            s.push(response.body)
            s.push(null)
            resolve(s)
          }
        })
    })
  }
}
