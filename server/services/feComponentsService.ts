import FeComponentsClient, { AvailableComponent, Component, FeComponentsMeta } from '../data/feComponentsClient'

export default class FeComponentsService {
  constructor(private readonly feComponentsClient: FeComponentsClient) {}

  async getFeComponents<T extends AvailableComponent[]>(
    components: T,
    token: string,
  ): Promise<Record<T[number], Component> & { meta?: FeComponentsMeta }> {
    return this.feComponentsClient.getComponents(components, token) as Promise<
      Record<T[number], Component> & { meta?: FeComponentsMeta }
    >
  }
}
