import R from 'ramda'
import { QUESTION_SET } from '../../config/edit/reasonsForUoFConfig'

export default (report, valuesFromRequestBody) => {
  return {
    reasons: {
      question: QUESTION_SET.REASONS,
      oldValue: report.form.reasonsForUseOfForce.reasons,
      newValue: valuesFromRequestBody.reasons,
      hasChanged: !R.equals(report.form.reasonsForUseOfForce.reasons, valuesFromRequestBody.reasons),
    },
    primaryReason: {
      question: QUESTION_SET.PRIMARY_REASON,
      oldValue: report.form.reasonsForUseOfForce.primaryReason,
      newValue: valuesFromRequestBody.primaryReason,
      hasChanged: !R.equals(report.form.reasonsForUseOfForce.primaryReason, valuesFromRequestBody.primaryReason),
    },
  }
}
