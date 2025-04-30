import config from '../config'
import RestClient from './restClient'

export interface Component {
  html: string
  css: string[]
  javascript: string[]
}

export type AvailableComponent = 'header' | 'footer'

type CaseLoad = {
  caseLoadId: string
  description: string
  type: string
  caseloadFunction: string
  currentlyActive: boolean
}

type Service = {
  description: string
  heading: string
  href: string
  id: string
}

export interface FeComponentsMeta {
  activeCaseLoad: CaseLoad
  caseLoads: CaseLoad[]
  services: Service[]
}

export interface FeComponentsResponse {
  header?: Component
  footer?: Component
  meta: FeComponentsMeta
}

export default class FeComponentsClient {
  private static restClient(token: string): RestClient {
    return new RestClient('HMPPS Components Client', config.apis.frontendComponents, token)
  }

  getComponents<T extends AvailableComponent[]>(components: T, userToken: string): Promise<FeComponentsResponse> {
    return FeComponentsClient.restClient(userToken).get<FeComponentsResponse>({
      path: `/components`,
      query: `component=${components.join('&component=')}`,
      headers: { 'x-user-token': userToken },
    })
  }
}
