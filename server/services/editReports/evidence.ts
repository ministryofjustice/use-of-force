import R from 'ramda'
import { QUESTION_SET } from '../../config/edit/evidenceConfig'

export default (report, valuesFromRequestBody) => {
  return {
    baggedEvidence: {
      question: QUESTION_SET.BAGGED_EVIDENCE,
      oldValue: report.form.evidence.baggedEvidence,
      newValue: valuesFromRequestBody.baggedEvidence,
      hasChanged: !R.equals(report.form.evidence.baggedEvidence, valuesFromRequestBody.baggedEvidence),
    },
    evidenceTagAndDescription: {
      question: QUESTION_SET.EVIDENCE_TAG_AND_DESCRIPTION,
      oldValue: report.form.evidence.evidenceTagAndDescription,
      newValue: valuesFromRequestBody.evidenceTagAndDescription,
      hasChanged: compareEvidenceTagAndDescription(
        report.form.evidence.evidenceTagAndDescription || [],
        valuesFromRequestBody.evidenceTagAndDescription || []
      ),
    },
    photographsTaken: {
      question: QUESTION_SET.PHOTOGRAPHS_TAKEN,
      oldValue: report.form.evidence.photographsTaken,
      newValue: valuesFromRequestBody.photographsTaken,
      hasChanged: !R.equals(report.form.evidence.photographsTaken, valuesFromRequestBody.photographsTaken),
    },
    cctvRecording: {
      question: QUESTION_SET.CCTV_RECORDING,
      oldValue: report.form.evidence.cctvRecording,
      newValue: valuesFromRequestBody.cctvRecording,
      hasChanged: !R.equals(report.form.evidence.cctvRecording, valuesFromRequestBody.cctvRecording),
    },
  }
}

const compareEvidenceTagAndDescription = (arr1, arr2) => {
  const normalize = R.map(obj => ({
    evidenceTagReference: R.toLower(obj.evidenceTagReference),
    description: R.toLower(obj.description),
  }))

  const sortFn = R.sortBy(R.prop('evidenceTagReference'))

  return !R.equals(sortFn(normalize(arr1)), sortFn(normalize(arr2)))
}
