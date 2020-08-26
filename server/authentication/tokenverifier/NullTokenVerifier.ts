import TokenVerifier from './TokenVerifier'
import logger from '../../../log'

export default class NullTokenVerifier implements TokenVerifier {
  async verify(_: string): Promise<boolean> {
    logger.debug('Token verification disabled, returning token is valid')
    return true
  }
}
