/* eslint-disable no-restricted-syntax */
import { ControlAndRestraintPosition, PainInducingTechniquesUsed, UofReasons } from '../config/types'

export default class EditUseOfForceDetailsService {
  //  for displaying data in /reason-for-change
  async buildDetails(questionSet, changes) {
    const result = []

    // changes to display for use-of-force-details
    for (const key of Object.keys(changes)) {
      const { oldValue, newValue } = changes[key]
      const question = questionSet[key]

      let resolvedOldValue: string
      let resolvedNewValue: string

      switch (key) {
        case 'bodyWornCameraNumbers':
          resolvedOldValue = this.formatObjectArrayToString(oldValue, 'cameraNum')
          resolvedNewValue = this.formatObjectArrayToString(newValue, 'cameraNum')
          break

        case 'weaponTypes':
          resolvedOldValue = this.formatObjectArrayToString(oldValue, 'weaponType')
          resolvedNewValue = this.formatObjectArrayToString(newValue, 'weaponType')
          break

        case 'guidingHoldOfficersInvolved':
          resolvedOldValue = oldValue
          resolvedNewValue = newValue
          break

        case 'restraintPositions':
          resolvedOldValue = this.formatDisplayOfRestraintAndPainInducingQuestions(
            oldValue,
            ControlAndRestraintPosition,
            'No control and restraint positions were used'
          )
          resolvedNewValue = this.formatDisplayOfRestraintAndPainInducingQuestions(
            newValue,
            ControlAndRestraintPosition,
            'No control and restraint positions were used'
          )
          break

        case 'painInducingTechniquesUsed':
          resolvedOldValue = this.formatDisplayOfRestraintAndPainInducingQuestions(
            oldValue,
            PainInducingTechniquesUsed,
            'No pain inducing techniques were used'
          )
          resolvedNewValue = this.formatDisplayOfRestraintAndPainInducingQuestions(
            newValue,
            PainInducingTechniquesUsed,
            'No pain inducing techniques were used'
          )
          break

        // reasons and PrimaryReasons aren't in same data set as use-of-force-details but they are in the same
        // section within the report in UI hence checking all values here
        case 'reasons':
          resolvedOldValue = this.formatDisplayOfReasonsQuestion(oldValue, UofReasons)
          resolvedNewValue = this.formatDisplayOfReasonsQuestion(newValue, UofReasons)
          break

        case 'primaryReason':
          resolvedOldValue = this.formatDisplayOfPrimaryReasonQuestion(oldValue, UofReasons)
          resolvedNewValue = this.formatDisplayOfPrimaryReasonQuestion(newValue, UofReasons)
          break

        default:
          resolvedOldValue = this.toYesNoNone(oldValue)
          resolvedNewValue = this.toYesNoNone(newValue)
      }

      result.push({ question, oldValue: resolvedOldValue, newValue: resolvedNewValue })
    }

    return result
  }

  toYesNoNone(val: string | boolean): string {
    let response = ''
    if (val === true) response = 'Yes'
    if (val === false) response = 'No'
    if (val === 'YES') response = 'Yes'
    if (val === 'NO') response = 'No'
    return response
  }

  formatDisplayOfRestraintAndPainInducingQuestions(inputValue, labelSet, noneMessage): string {
    if (inputValue !== 'NONE') {
      const valArray = Array.isArray(inputValue) ? inputValue : [inputValue]
      const labels = valArray.map(v => labelSet[v].label)
      return labels.length === 1 ? labels[0] : `${labels[0]}: ${labels.slice(1).join(', ')}`
    }
    return noneMessage
  }

  formatObjectArrayToString(arr: Record<string, string>[], key: string): string {
    if (arr) {
      return arr.map(item => item[key]).join(', ')
    }
    return ''
  }

  formatDisplayOfReasonsQuestion(inputValue, reasons) {
    return inputValue ? inputValue.map(v => reasons[v].label).join(', ') : ''
  }

  formatDisplayOfPrimaryReasonQuestion(inputValue, reasons) {
    return inputValue ? reasons[inputValue].label : ''
  }
}
