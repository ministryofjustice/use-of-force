import type FeComponentsClient from '../data/feComponentsClient'
import type { AvailableComponent, FeComponentsResponse } from '../data/feComponentsClient'

export default class FeComponentsService {
  constructor(private readonly feComponentsClient: FeComponentsClient) {}

  async getFeComponents(components: AvailableComponent[], token: string): Promise<FeComponentsResponse> {
    return this.feComponentsClient.getComponents(components, token)
  }
}
