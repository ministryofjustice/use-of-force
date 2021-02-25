import { DescribedGroups } from '../incidentCountAggregator/aggregatorFunctions'

export const DEFAULT_GROUP = 'UNKNOWN'

export const GROUPS: DescribedGroups = {
  WHITE: { description: 'White', codes: ['W1', 'W2', 'W3', 'W9'] },
  ASIAN: { description: 'Asian or Asian British', codes: ['A1', 'A2', 'A3', 'A4', 'A9'] },
  BLACK: { description: 'Black or Black British', codes: ['B1', 'B2', 'B9'] },
  MIXED: { description: 'Mixed Ethnic Groups', codes: ['M1', 'M2', 'M3', 'M9'] },
  OTHER: { description: 'Other Ethnic Group', codes: ['O2', 'O9'] },
  [DEFAULT_GROUP]: { description: 'Not known', codes: ['NS'] },
}
