import { RestClientBuilder } from '../data'
import FeComponentsClient, { AvailableComponent, Component } from '../data/feComponentsClient'

export default class FeComponentsService {
  constructor(private readonly feComponentsClientBuilder: RestClientBuilder<FeComponentsClient>) {}

  async getFeComponents<T extends AvailableComponent[]>(
    components: T,
    token: string,
  ): Promise<Record<T[number], Component>> {
    const feComponentsClient = this.feComponentsClientBuilder(token)
    const allComponents = await feComponentsClient.getComponents(components, token)
    return allComponents
  }
}
