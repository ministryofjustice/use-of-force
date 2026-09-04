import fs from 'fs'
import {
  BodyWornCameras,
  Cctv,
  ControlAndRestraintPosition,
  LabelledValue,
  PainInducingTechniquesUsed,
  RelocationLocation,
  RelocationType,
  ReportStatus,
  StatementStatus,
  UofReasons,
  WeaponsObserved,
} from '../server/config/types'
import { REASON } from '../server/config/edit/incidentDetailsConfig'
import type { Action } from '../server/data/reportLogClient'

/**
 * Writes reference-data.csv, the permitted values behind every coded column in this schema.
 *
 * Every code here is an unconstrained varchar or a string inside the form_response jsonb - there are no
 * reference tables and no check constraints - so a consumer reading the schema alone sees a varchar(20)
 * with no idea which values are legal. This also decodes form_response, which no schema report can
 * describe.
 *
 * Labels are read from the source constants rather than restated here, so the CSV cannot drift from the
 * code. The three sets with no label in code (report_log.action, the report_edit delete reasons, and
 * the deletion reasons in the Nunjucks template) carry descriptions below, and are typed so that adding
 * a value without describing it fails to compile.
 *
 * Needs no database.
 */

type Row = { columnRef: string; code: string; description: string; notes: string }

const escape = (value: string) => `"${value.replace(/"/g, '""')}"`
const toCsv = (r: Row) => [r.columnRef, r.code, r.description, r.notes].map(escape).join(',')

const labelled = (columnRef: string, values: Readonly<Record<string, LabelledValue>>, notes = ''): Row[] =>
  Object.values(values).map(v => ({
    columnRef,
    code: v.value,
    description: v.label,
    notes: [
      notes,
      v.inactive ? 'no longer offered; historic rows only' : '',
      v.parent ? `sub-option of ${v.parent}` : '',
      v.sub_options ? 'has sub-options' : '',
      v.exclusive ? 'exclusive - cannot be combined with other values' : '',
    ]
      .filter(Boolean)
      .join('; '),
  }))

const described = (columnRef: string, values: Record<string, string>, notes = ''): Row[] =>
  Object.entries(values).map(([code, description]) => ({ columnRef, code, description, notes }))

// report_log.action. Typed as Record<Action, string> so a seventh action cannot be added without a
// description - the compiler rejects it.
const ACTIONS: Record<Action, string> = {
  REPORT_CREATED: 'A report was created',
  REPORT_MODIFIED: 'An existing report was changed',
  REPORT_DELETED: 'A report was soft-deleted',
  REPORT_SUBMITTED: 'A report was submitted, creating the statements it requires',
  REPORT_STATUS_CHANGED: 'The report moved between IN_PROGRESS, SUBMITTED and COMPLETE',
  REPORT_COMPLETED: 'Every required statement had been submitted, completing the report',
}

// report_edit.reason. REASON is a flat object of KEY / KEY_DESCRIPTION string pairs rather than a
// LabelledValue map, so the pairs are resolved rather than read off a .label.
const editReasonRows = (): Row[] =>
  Object.keys(REASON)
    .filter(key => !key.endsWith('_DESCRIPTION'))
    .map(key => {
      const description = REASON[`${key}_DESCRIPTION` as keyof typeof REASON]
      if (!description) throw new Error(`REASON.${key} has no matching ${key}_DESCRIPTION`)
      return {
        columnRef: 'report_edit.reason',
        code: REASON[key as keyof typeof REASON],
        description,
        notes: 'set by the coordinator edit and involved-staff flows',
      }
    })

// Deletion reasons exist only as radio values in the Nunjucks template - there is no constant to
// import. See server/views/pages/coordinator/delete-incident-reason.njk.
const DELETE_REASONS: Record<string, string> = {
  duplicateReport: 'It is a duplicate report',
  notUofIncident: 'The incident was not a use of force incident',
  anotherReason: 'Another reason, given in free text',
}

describe('reference data', () => {
  it('exports reference data', () => {
    const rows: Row[] = [
      ...labelled('report.status', ReportStatus),
      ...labelled('statement.statement_status', StatementStatus),
      ...described('report_log.action', ACTIONS, "username is 'SYSTEM' for automatic transitions"),
      ...editReasonRows(),
      ...described('report_edit.reason', DELETE_REASONS, 'used when the edit is a report deletion'),

      // Values inside the report.form_response jsonb. No schema report can describe them, which is why
      // they are here rather than left to the column comment.
      ...labelled('report.form_response -> reasonsForUseOfForce.reasons[]', UofReasons),
      ...labelled('report.form_response -> useOfForceDetails.restraintPositions', ControlAndRestraintPosition),
      ...labelled('report.form_response -> useOfForceDetails.painInducingTechniquesUsed', PainInducingTechniquesUsed),
      ...labelled('report.form_response -> useOfForceDetails.weaponsObserved', WeaponsObserved),
      ...labelled('report.form_response -> useOfForceDetails.bodyWornCamera', BodyWornCameras),
      ...labelled('report.form_response -> evidence.cctvRecording', Cctv),
      ...labelled('report.form_response -> relocationAndInjuries.prisonerRelocation', RelocationLocation),
      ...labelled('report.form_response -> relocationAndInjuries.relocationType', RelocationType),
    ]

    const undescribed = rows.filter(r => !r.description.trim()).map(r => `${r.columnRef}.${r.code}`)
    expect(undescribed).toEqual([]) // an undescribed code is not reference data

    const output = process.env.REFERENCE_DATA_OUTPUT ?? 'reference-data.csv'
    fs.writeFileSync(output, `column_ref,code,description,notes\n${rows.map(toCsv).join('\n')}\n`)
    // eslint-disable-next-line no-console
    console.log(`Wrote ${rows.length} reference data rows to ${output}`)
  })
})
