/* eslint-disable no-restricted-syntax */
import {
  RELOCATION_TYPE_DESCRIPTION,
  RELOCATION_LOCATION_DESCRIPTION,
} from '../config/edit/relocationAndInjuriesConfig'

export default class EditRelocationAndInjuriesService {
  //  for displaying data in /reason-for-change
  async buildDetails(questionSet, changes) {
    const result = []

    for (const key of Object.keys(changes)) {
      const { oldValue, newValue } = changes[key]
      const question = questionSet[key]

      let resolvedOldValue: string
      let resolvedNewValue

      switch (key) {
        case 'prisonerRelocation':
          resolvedOldValue = oldValue ? RELOCATION_LOCATION_DESCRIPTION[oldValue] : undefined
          resolvedNewValue = newValue ? RELOCATION_LOCATION_DESCRIPTION[newValue] : undefined
          break

        case 'relocationType':
          resolvedOldValue = oldValue ? RELOCATION_TYPE_DESCRIPTION[oldValue] : undefined
          resolvedNewValue = newValue ? RELOCATION_TYPE_DESCRIPTION[newValue] : undefined
          break

        case 'staffNeedingMedicalAttention':
          resolvedOldValue = oldValue ? oldValue.map(c => this.staffNameAndHospTreatmentCheck(c)).join(', ') : undefined
          resolvedNewValue = newValue ? newValue.map(c => this.staffNameAndHospTreatmentCheck(c)).join(', ') : undefined
          break

        default:
          resolvedOldValue = oldValue
          resolvedNewValue = newValue
      }

      result.push({ question, oldValue: resolvedOldValue, newValue: resolvedNewValue })
    }

    return result
  }

  staffNameAndHospTreatmentCheck(c) {
    return c.hospitalisation ? `${c.name} (went to hosptial)` : c.name
  }
}
