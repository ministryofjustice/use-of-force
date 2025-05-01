import logger from '../../log'
import { QueryPerformer } from '../../server/data/dataAccess/db'
import StatementsClient from '../../server/data/statementsClient'
import { ManageUsersApiClient } from '../../server/data'
import { AuthService } from '../../server/services'

export default class EmailResolver {
  constructor(
    private readonly manageUsersApiClient: ManageUsersApiClient,
    private readonly authService: AuthService,
    private readonly statementsClient: StatementsClient
  ) {}

  async resolveEmail(transactionalClient: QueryPerformer, userId: string, reportId: number): Promise<boolean> {
    logger.info(`Checking to see if previously unverified user: ${userId} now has verified email for statement`)

    const token = await this.authService.getSystemClientToken()
    const { verified, email } = await this.manageUsersApiClient.getEmail(userId, token)
    if (verified) {
      logger.info('Found verified email')
      await this.statementsClient.setEmail(userId, reportId, email, transactionalClient)
      return true
    }

    logger.info(`User still not verified`)
    return false
  }
}
