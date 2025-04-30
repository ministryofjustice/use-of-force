import HmppsAuthClient from '../data/hmppsAuthClient'

export default class AuthService {
  constructor(private readonly hmppsAuthClient: HmppsAuthClient) {}

  async getSystemClientToken(username?: string) {
    return this.hmppsAuthClient.getSystemClientToken(username)
  }
}
