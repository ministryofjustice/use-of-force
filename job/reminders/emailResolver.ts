import logger from '../../log'
import { AuthClientBuilder } from '../../server/data/authClientBuilder'
import { QueryPerformer } from '../../server/data/dataAccess/db'
import StatementsClient from '../../server/data/statementsClient'
import { SystemToken } from '../../server/types/uof'

export default class EmailResolver {
  constructor(
    private readonly authClientBuilder: AuthClientBuilder,
    private readonly systemToken: SystemToken,
    private readonly statementsClient: StatementsClient
  ) {}

  async resolveEmail(transactionalClient: QueryPerformer, userId: string, reportId: number): Promise<boolean> {
    logger.info(`Checking to see if previously unverified user: ${userId} now has verified email for statement`)

    const authClient = this.authClientBuilder(await this.systemToken())
    const { verified, email } = await authClient.getEmail(userId)
    if (verified) {
      logger.info('Found verified email')
      await this.statementsClient.setEmail(userId, reportId, email, transactionalClient)
      return true
    }

    logger.info(`User still not verified`)
    return false
  }
}
