import { NotImplemented } from 'http-errors'
import config from '../config'
import RestClient from './restClient'

export default class BaseApiClient {
  protected static config(): typeof config.apis.location {
    throw NotImplemented()
  }

  protected static restClient(token: string): RestClient {
    return new RestClient(this.name, this.config(), token)
  }
}
