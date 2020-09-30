import format from 'pg-format'
import type { QueryPerformer } from './dataAccess/db'
import type { AgencyId, DateRange, OffenderNoWithIncidentCount, OffenderNoWithIncidentDate } from '../types/uof'

export default class ReportingClient {
  constructor(private readonly query: QueryPerformer) {}

  async getMostOftenInvolvedStaff(
    agencyId: AgencyId,
    [startDate, endDate]: DateRange
  ): Promise<{ name: string; count: number }[]> {
    const results = await this.query({
      text: `
          select 
            s.name, count(*) 
          from 
            statement s
            join report r on r.id = s.report_id
          where 
            r.agency_id = $1
            and   r.incident_date >= $2
            and   r.incident_date <= $3
            and   s.deleted is null
          group by s.user_id, s.name
          order by 2 desc
          limit 10`,
      values: [agencyId, startDate.toDate(), endDate.toDate()],
    })
    return results.rows
  }

  public async getMostOftenInvolvedPrisoners(
    agencyId: AgencyId,
    [startDate, endDate]: DateRange
  ): Promise<{ offenderNo: string; count: number }[]> {
    const results = await this.query({
      text: `
            select 
              r.offender_no "offenderNo", count(*)
            from 
              v_report r
            where 
              r.agency_id = $1
              and   r.incident_date >= $2
              and   r.incident_date <= $3
            group by offender_no
            order by 2 desc
            limit 10`,
      values: [agencyId, startDate.toDate(), endDate.toDate()],
    })
    return results.rows
  }

  public async getIncidentsOverview(
    agencyId: AgencyId,
    [startDate, endDate]: DateRange,
    statuses
  ): Promise<Record<string, number>[]> {
    const statusValues = statuses.map(s => s.value)
    const results = await this.query({
      text: format(
        `
          select
            count(*) "total",
            count(*) filter (where (incidentDetails ->> 'plannedUseOfForce')::boolean = true) "planned",
            count(*) filter (where (incidentDetails ->> 'plannedUseOfForce')::boolean = false) "unplanned",
            count(*) filter (where (useOfForceDetails ->> 'handcuffsApplied')::boolean = true) "handcuffsApplied",
            count(*) filter (where (useOfForceDetails ->> 'batonDrawn')::boolean = true) "batonDrawn",
            count(*) filter (where (useOfForceDetails ->> 'batonUsed')::boolean = true) "batonUsed",
            count(*) filter (where (useOfForceDetails ->> 'pavaDrawn')::boolean = true) "pavaDrawn",
            count(*) filter (where (useOfForceDetails ->> 'pavaUsed')::boolean = true) "pavaUsed",
            count(*) filter (where (useOfForceDetails ->> 'personalProtectionTechniques')::boolean = true) "personalProtectionTechniques",
            count(*) filter (where evidence ->> 'cctvRecording' = 'YES') "cctvRecording",
            count(*) filter (where evidence ->> 'bodyWornCamera' = 'YES') "bodyWornCamera",
            count(*) filter (where evidence ->> 'bodyWornCamera' = 'NOT_KNOWN') "bodyWornCameraUnknown"
          from
            (
            select
              form_response  -> 'incidentDetails'   incidentDetails,
              form_response  -> 'useOfForceDetails' useOfForceDetails,
              form_response  -> 'evidence'          evidence
            from
              v_report
            where
              status in (%L)
              and agency_id = %L
              and incident_date between %L and %L) incidents`,
        statusValues,
        agencyId,
        startDate.toDate(),
        endDate.toDate()
      ),
    })

    return results.rows
  }

  public async getIncidentLocationsAndTimes(
    agencyId: AgencyId,
    [startDate, endDate]: DateRange
  ): Promise<{ incidentDate: Date; locationId: number }[]> {
    const results = await this.query({
      text: `
          select
            incident_date "incidentDate",
            form_response -> 'incidentDetails' -> 'locationId' "locationId"
          from
            report
          where
            agency_id = $1
            and submitted_date between $2 and $3`,
      values: [agencyId, startDate.toDate(), endDate.toDate()],
    })

    return results.rows
  }

  public async getIncidentCountByOffenderNo(
    agencyId: AgencyId,
    [startDate, endDate]: DateRange
  ): Promise<Array<OffenderNoWithIncidentCount>> {
    const results = await this.query<OffenderNoWithIncidentCount>({
      text: `
        select
          count(*) "incidentCount",
          offender_no "offenderNo"
        from
          v_report
        where
          agency_id = $1
          and incident_date between $2 and $3
        group by
            offender_no`,
      values: [agencyId, startDate.toDate(), endDate.toDate()],
    })

    return results.rows
  }

  public async getIncidentsForAgencyAndDateRange(
    agencyId: AgencyId,
    [startDate, endDate]: DateRange
  ): Promise<Array<OffenderNoWithIncidentDate>> {
    const results = await this.query<OffenderNoWithIncidentDate>({
      text: `
        select
          offender_no "offenderNo",
          incident_date "incidentDate"
        from
          v_report
        where
          agency_id = $1
          and incident_date between $2 and $3`,
      values: [agencyId, startDate.toDate(), endDate.toDate()],
    })

    return results.rows
  }
}
