import type { RestClient } from './restClient'

export interface Component {
  html: string
  css: string[]
  javascript: string[]
}

export type AvailableComponent = 'header' | 'footer'

export default class FeComponentsClient {
  constructor(private restClient: RestClient) {}

  async getComponents<T extends AvailableComponent[]>(
    components: T,
    token: string
  ): Promise<Record<T[number], Component>> {
    return this.restClient.get({
      path: `/components`,
      query: `component=${components.join('&component=')}`,
      headers: { 'x-user-token': token },
    }) as Promise<Record<T[number], Component>>
  }
}
