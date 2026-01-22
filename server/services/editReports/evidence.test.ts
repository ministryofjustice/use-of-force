import mapEvidenceChanges from './evidence'

import { QUESTION_SET } from '../../config/edit/evidenceConfig'

describe('mapEvidenceChanges (full return value)', () => {
  let report
  let valuesFromRequestBody

  beforeEach(() => {
    report = {
      form: {
        evidence: {
          baggedEvidence: true,
          evidenceTagAndDescription: [{ evidenceTagReference: 'TAG1', description: 'Desc1' }],
          photographsTaken: false,
          cctvRecording: 'NOT_KNOWN',
        },
      },
    }

    valuesFromRequestBody = {
      baggedEvidence: false,
      evidenceTagAndDescription: [{ evidenceTagReference: 'TAG2', description: 'Desc2' }],
      photographsTaken: true,
      cctvRecording: 'YES',
    }
  })

  it('returns the expected structure when all inputs are different to current report', () => {
    const result = mapEvidenceChanges(report, valuesFromRequestBody)

    expect(result).toEqual({
      baggedEvidence: {
        question: QUESTION_SET.BAGGED_EVIDENCE,
        oldValue: true,
        newValue: false,
        hasChanged: true,
      },
      evidenceTagAndDescription: {
        question: QUESTION_SET.EVIDENCE_TAG_AND_DESCRIPTION,
        oldValue: [{ evidenceTagReference: 'TAG1', description: 'Desc1' }],
        newValue: [{ evidenceTagReference: 'TAG2', description: 'Desc2' }],
        hasChanged: true,
      },
      photographsTaken: {
        question: QUESTION_SET.PHOTOGRAPHS_TAKEN,
        oldValue: false,
        newValue: true,
        hasChanged: true,
      },
      cctvRecording: {
        question: QUESTION_SET.CCTV_RECORDING,
        oldValue: 'NOT_KNOWN',
        newValue: 'YES',
        hasChanged: true,
      },
    })
  })

  it('returns hasChanged = false when nothing changes', () => {
    valuesFromRequestBody = { ...report.form.evidence }
    const result = mapEvidenceChanges(report, valuesFromRequestBody)

    expect(result).toEqual({
      baggedEvidence: {
        question: QUESTION_SET.BAGGED_EVIDENCE,
        oldValue: true,
        newValue: true,
        hasChanged: false,
      },
      evidenceTagAndDescription: {
        question: QUESTION_SET.EVIDENCE_TAG_AND_DESCRIPTION,
        oldValue: [{ evidenceTagReference: 'TAG1', description: 'Desc1' }],
        newValue: [{ evidenceTagReference: 'TAG1', description: 'Desc1' }],
        hasChanged: false,
      },
      photographsTaken: {
        question: QUESTION_SET.PHOTOGRAPHS_TAKEN,
        oldValue: false,
        newValue: false,
        hasChanged: false,
      },
      cctvRecording: {
        question: QUESTION_SET.CCTV_RECORDING,
        oldValue: 'NOT_KNOWN',
        newValue: 'NOT_KNOWN',
        hasChanged: false,
      },
    })
  })

  it('handles case when baggedEvidence is false and evidenceTagAndDescription is undefined', () => {
    report.form.evidence.baggedEvidence = false
    report.form.evidence.evidenceTagAndDescription = undefined

    valuesFromRequestBody.baggedEvidence = false
    valuesFromRequestBody.evidenceTagAndDescription = undefined

    const result = mapEvidenceChanges(report, valuesFromRequestBody)

    expect(result).toEqual({
      baggedEvidence: {
        question: QUESTION_SET.BAGGED_EVIDENCE,
        oldValue: false,
        newValue: false,
        hasChanged: false,
      },
      evidenceTagAndDescription: {
        question: QUESTION_SET.EVIDENCE_TAG_AND_DESCRIPTION,
        oldValue: undefined,
        newValue: undefined,
        hasChanged: false,
      },
      photographsTaken: {
        question: QUESTION_SET.PHOTOGRAPHS_TAKEN,
        oldValue: false,
        newValue: true,
        hasChanged: true,
      },
      cctvRecording: {
        question: QUESTION_SET.CCTV_RECORDING,
        oldValue: 'NOT_KNOWN',
        newValue: 'YES',
        hasChanged: true,
      },
    })
  })

  it('detects change when baggedEvidence changes from true to false', () => {
    report.form.evidence.baggedEvidence = true
    report.form.evidence.evidenceTagAndDescription = [{ evidenceTagReference: 'TAG1', description: 'Desc1' }]

    valuesFromRequestBody.baggedEvidence = false
    valuesFromRequestBody.evidenceTagAndDescription = undefined

    const result = mapEvidenceChanges(report, valuesFromRequestBody)

    expect(result.baggedEvidence.hasChanged).toBe(true)
    expect(result.evidenceTagAndDescription.hasChanged).toBe(true)
  })

  it('detects change when baggedEvidence changes from false to true', () => {
    report.form.evidence.baggedEvidence = false
    report.form.evidence.evidenceTagAndDescription = undefined

    valuesFromRequestBody.baggedEvidence = true
    valuesFromRequestBody.evidenceTagAndDescription = [{ evidenceTagReference: 'TAG1', description: 'Desc1' }]

    const result = mapEvidenceChanges(report, valuesFromRequestBody)

    expect(result.baggedEvidence.hasChanged).toBe(true)
    expect(result.evidenceTagAndDescription.hasChanged).toBe(true)
  })

  it('ignores order in evidenceTagAndDescription', () => {
    report.form.evidence.evidenceTagAndDescription = [
      { evidenceTagReference: 'TAG1', description: 'Desc1' },
      { evidenceTagReference: 'TAG2', description: 'Desc2' },
    ]
    valuesFromRequestBody.evidenceTagAndDescription = [
      { evidenceTagReference: 'TAG2', description: 'Desc2' },
      { evidenceTagReference: 'TAG1', description: 'Desc1' },
    ]

    const result = mapEvidenceChanges(report, valuesFromRequestBody)

    expect(result.evidenceTagAndDescription.hasChanged).toBe(false)
  })

  it('ignores case differences in evidenceTagAndDescription', () => {
    valuesFromRequestBody.evidenceTagAndDescription = [{ evidenceTagReference: 'tag1', description: 'desc1' }]

    const result = mapEvidenceChanges(report, valuesFromRequestBody)

    expect(result.evidenceTagAndDescription.hasChanged).toBe(false)
  })

  it('detects change when only description differs', () => {
    valuesFromRequestBody.evidenceTagAndDescription = [{ evidenceTagReference: 'TAG1', description: 'Other' }]

    const result = mapEvidenceChanges(report, valuesFromRequestBody)

    expect(result.evidenceTagAndDescription.hasChanged).toBe(true)
  })

  it('detects change when only evidenceTagReference differs', () => {
    valuesFromRequestBody.evidenceTagAndDescription = [{ evidenceTagReference: 'TAG2', description: 'Desc1' }]

    const result = mapEvidenceChanges(report, valuesFromRequestBody)

    expect(result.evidenceTagAndDescription.hasChanged).toBe(true)
  })

  it('handles empty evidenceTagAndDescription arrays gracefully', () => {
    report.form.evidence.evidenceTagAndDescription = []
    valuesFromRequestBody.evidenceTagAndDescription = []

    const result = mapEvidenceChanges(report, valuesFromRequestBody)

    expect(result.evidenceTagAndDescription.hasChanged).toBe(false)
  })

  it('handles one empty evidenceTagAndDescription vs non-empty as a change', () => {
    report.form.evidence.evidenceTagAndDescription = []
    valuesFromRequestBody.evidenceTagAndDescription = [{ evidenceTagReference: 'TAG1', description: 'Desc1' }]

    const result = mapEvidenceChanges(report, valuesFromRequestBody)

    expect(result.evidenceTagAndDescription.hasChanged).toBe(true)
  })
})
