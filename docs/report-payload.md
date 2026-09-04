# The report payload

`report.form_response` is a single `jsonb` column holding the whole report. Its shape is defined by
`UseOfForceReport` in `server/data/UseOfForceReport.ts` and enforced by the Joi schemas in
`server/config/forms/`. There is no database constraint on it.

```ts
export type UseOfForceReport = {
  incidentDetails: IncidentDetails
  involvedStaff: InvolvedStaff[]
  reasonsForUseOfForce: ReasonsForUseOfForce
  useOfForceDetails: UseOfForceDetails
  relocationAndInjuries: RelocationAndInjuries
  evidence: Evidence
}

type PartialValues<T> = { [P in keyof T]?: Partial<T[P]> }
export type UseOfForceDraftReport = PartialValues<UseOfForceReport>
```

Each top-level key corresponds to one form page — the key *is* the `formName` used by the route and
the validation map (see [creating-and-editing-a-report.md](creating-and-editing-a-report.md)).

## Two things are not in the JSON

- **`incidentDate`** is an `EXTRACTED` field — it is validated as part of `incidentDetails` but
  written to the `report.incident_date` column, not into `form_response`.
- **`agencyId`** is a column, stamped at creation from the prison API and updated by the "change
  prison" flow.

Everything a statement holds (`statement`, `lastTrainingMonth`, `lastTrainingYear`, `jobStartYear`)
is likewise `EXTRACTED` into `statement` table columns.

## A complete payload

Based on `integration-tests/integration/seedData.js`, which is the canonical fixture — if you need a
realistic report in a test, start from there rather than hand-writing one.

```json
{
  "incidentDetails": {
    "incidentLocationId": "00000000-1111-2222-3333-444444444444",
    "plannedUseOfForce": true,
    "authorisedBy": "Eric Bloodaxe",
    "witnesses": [{ "name": "Witness A" }, { "name": "Tom Jones" }]
  },
  "involvedStaff": [
    { "name": "Emily Jones", "email": "Emily@gov.uk", "staffId": 5, "username": "EMILY_JONES", "verified": true },
    { "name": "Jo Zagato", "email": "Jo@gov.uk", "staffId": 2, "username": "JO_ZAGATO", "verified": true }
  ],
  "reasonsForUseOfForce": {
    "reasons": ["FIGHT_BETWEEN_PRISONERS", "PHYSICAL_THREAT"],
    "primaryReason": "FIGHT_BETWEEN_PRISONERS"
  },
  "useOfForceDetails": {
    "positiveCommunication": true,
    "bodyWornCamera": "YES",
    "bodyWornCameraNumbers": [{ "cameraNum": "123" }, { "cameraNum": "789" }],
    "personalProtectionTechniques": true,
    "batonDrawnAgainstPrisoner": true,
    "batonUsed": true,
    "pavaDrawnAgainstPrisoner": true,
    "pavaUsed": true,
    "taserDrawn": false,
    "bittenByPrisonDog": true,
    "weaponsObserved": "YES",
    "weaponTypes": [{ "weaponType": "gun" }, { "weaponType": "knife" }],
    "guidingHold": true,
    "guidingHoldOfficersInvolved": 2,
    "escortingHold": true,
    "restraintPositions": ["STANDING", "ON_BACK", "FACE_DOWN", "KNEELING"],
    "painInducingTechniquesUsed": ["FINAL_LOCK_FLEXION", "THUMB_LOCK"],
    "handcuffsApplied": true
  },
  "relocationAndInjuries": {
    "prisonerRelocation": "SEGREGATION_UNIT",
    "relocationCompliancy": true,
    "f213CompletedBy": "Dr Taylor",
    "prisonerInjuries": true,
    "healthcareInvolved": true,
    "healthcarePractionerName": "Dr Smith",
    "prisonerHospitalisation": true,
    "staffMedicalAttention": true,
    "staffNeedingMedicalAttention": [
      { "name": "Eddie Thomas", "hospitalisation": true },
      { "name": "Jayne Eyre", "hospitalisation": true }
    ]
  },
  "evidence": {
    "baggedEvidence": true,
    "evidenceTagAndDescription": [
      { "evidenceTagReference": "Bagged evidence 1", "description": "Collected from the prisoner" },
      { "evidenceTagReference": "Bagged evidence 2", "description": "Clothes samples" }
    ],
    "photographsTaken": true,
    "cctvRecording": "NOT_KNOWN"
  }
}
```

## Conditional fields are absent, not null

Joi `.strip()`s a field whose gate is false, so it does **not appear** in the JSON at all. Your code
must handle absence, not `null`.

| Field | Present only when |
| --- | --- |
| `incidentDetails.authorisedBy` | `plannedUseOfForce === true` |
| `useOfForceDetails.bodyWornCameraNumbers` | `bodyWornCamera === 'YES'` |
| `useOfForceDetails.batonUsed` | `batonDrawnAgainstPrisoner === true` |
| `useOfForceDetails.pavaUsed` | `pavaDrawnAgainstPrisoner === true` |
| `taserOperativePresent`, `redDotWarning`, `arcWarningUsed`, `taserDeployed`, `taserCycleExtended`, `taserReenergised` | `taserDrawn === true` |
| `useOfForceDetails.weaponTypes` | `weaponsObserved === 'YES'` |
| `useOfForceDetails.guidingHoldOfficersInvolved` | `guidingHold === true` (value is 1 or 2) |
| `relocationAndInjuries.relocationType` | `relocationCompliancy === false` |
| `relocationAndInjuries.userSpecifiedRelocationType` | `relocationType === 'OTHER'` |
| `relocationAndInjuries.healthcarePractionerName` | `healthcareInvolved === true` |
| `relocationAndInjuries.staffNeedingMedicalAttention` | `staffMedicalAttention === true` |
| `evidence.evidenceTagAndDescription` | `baggedEvidence === true` |
| `reasonsForUseOfForce.primaryReason` | two or more `reasons` selected |

Note `healthcarePractionerName` is spelled that way in the data. It is a typo of long standing;
renaming it needs a data migration.

## Legacy fields

Old rows carry field names that current forms no longer write. Handle both.

| Current | Legacy | Notes |
| --- | --- | --- |
| `incidentDetails.incidentLocationId` (DPS location UUID) | `incidentDetails.locationId` (NOMIS numeric id) | Both may be present on old rows. `reportDetailBuilder.getLocationId()` falls back to a NOMIS → DPS lookup via `nomisMappingService`. |
| `batonDrawnAgainstPrisoner` | `batonDrawn` | |
| `pavaDrawnAgainstPrisoner` | `pavaDrawn` | |

`restraintPositions` and `painInducingTechniquesUsed` are typed `string | string[]` — a single
selection is stored as a bare string, multiple as an array. Normalise before iterating.

## Enum values

Every coded value (`SEGREGATION_UNIT`, `FIGHT_BETWEEN_PRISONERS`, `STANDING`, `NOT_KNOWN`…) comes
from `server/config/types.ts`, which defines labelled enums via `toEnum`:

```ts
export const ReportStatus = toEnum({
  IN_PROGRESS: { value: 'IN_PROGRESS', label: 'In progress' },
  SUBMITTED: { value: 'SUBMITTED', label: 'Submitted' },
  COMPLETE: { value: 'COMPLETE', label: 'Complete' },
})
```

Use `toLabel(EnumType, value)` to render one, and `findEnum` to look one up. Never hard-code a
display string — the enums are the single source of truth, shared by validation, the check-your-
answers summary and the edit-history display.

The enums defined there include `ReportStatus`, `StatementStatus`, `BodyWornCameras`,
`WeaponsObserved`, `Cctv`, `ControlAndRestraintPosition` (which has a parent/sub-option hierarchy),
`PainInducingTechniquesUsed`, `RelocationLocation`, `RelocationType` and `UofReasons`.

## Related JSON columns

### `report_log.details`

Free-form, shaped by the action:

```json
{ "old": "SUBMITTED", "new": "COMPLETE" }
{ "formName": "evidence", "originalSection": { }, "updatedSection": { } }
{ }
```

### `report_edit.changes`

`Record<string, Change>` where `Change = { oldValue, newValue, question }`
(`server/services/editReports/types/reportEditServiceTypes.ts`):

```json
{
  "involvedStaff": {
    "oldValue": "Emily Jones (EMILY_JONES)",
    "newValue": "Emily Jones (EMILY_JONES), Jo Zagato (JO_ZAGATO)",
    "question": "Staff involved"
  }
}
```

Display order comes from `server/config/edit/questionSequence.ts`; the human-readable `question`
text from `server/config/edit/questionSets.ts` and the per-section `*Config.ts` files.

## Inspecting a payload

```bash
psql -h localhost -p 5433 -U use-of-force use-of-force \
  -c "select id, status, jsonb_pretty(form_response) from v_report order by id desc limit 1;"
```
