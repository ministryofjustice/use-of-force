import NullTokenVerifier from './NullTokenVerifier'
import TokenVerifier from './TokenVerifier'
import { ClientConfiguration, TokenVerificationClient } from './TokenVerificationClient'

interface TokenVerifierConfiguration extends ClientConfiguration {
  enabled: boolean
}

const tokenVerifierFactory = (config: TokenVerifierConfiguration): TokenVerifier =>
  config.enabled ? new TokenVerificationClient(config) : new NullTokenVerifier()

export = tokenVerifierFactory
