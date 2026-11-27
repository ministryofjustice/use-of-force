import type { Prison } from './prisonClientTypes'
import BaseApiClient from './baseApiClient'
import config from '../config'

// Prison names and the list of prisons come from Prison Register. Its /api/agencies endpoints return the same
// fields as the Prison API agency endpoints they replace. Calls need a system token with HMPPS_REGISTERS_API__R.
export default class PrisonRegisterClient extends BaseApiClient {
  protected static config() {
    return config.apis.prisonRegister
  }

  async getPrisons(token: string): Promise<Prison[]> {
    return PrisonRegisterClient.restClient(token).get({
      path: '/api/agencies/type/PRISON',
      query: { activeOnly: true },
    }) as Promise<Prison[]>
  }

  // Returns the prison whether it is active or not, as reports can belong to a prison that has since closed
  async getPrisonById(agencyId: string, token: string): Promise<Prison> {
    return PrisonRegisterClient.restClient(token).get({
      path: `/api/agencies/${encodeURIComponent(agencyId)}`,
    }) as Promise<Prison>
  }
}
