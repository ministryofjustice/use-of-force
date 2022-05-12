import logger from '../../log'
import type { RedisClient } from './redisClient'

export default class TokenStore {
  private readonly prefix = 'systemToken:'

  constructor(private readonly client: RedisClient) {
    client.on('error', (error: Error) => {
      logger.error(`Redis error`, error)
    })
  }

  private async ensureConnected() {
    if (!this.client.isOpen) {
      await this.client.connect()
    }
  }

  public async setToken(key: string, token: string, durationSeconds: number): Promise<void> {
    await this.ensureConnected()
    await this.client.set(`${this.prefix}${key}`, token, { EX: durationSeconds })
  }

  public async getToken(key: string): Promise<string> {
    await this.ensureConnected()
    return this.client.get(`${this.prefix}${key}`)
  }
}
