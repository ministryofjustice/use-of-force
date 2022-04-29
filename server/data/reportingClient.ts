import format from 'pg-format'
import type { QueryPerformer } from './dataAccess/db'
import type { AgencyId, DateRange, OffenderNoWithIncidentCount, OffenderNoWithIncidentDate } from '../types/uof'
import type { LabelledValue } from '../config/types'

export default class ReportingClient {
  constructor(private readonly query: QueryPerformer) {}

}
