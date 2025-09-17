/* eslint-disable no-restricted-syntax */

export default class EditEvidenceService {
  //  for displaying data in /reason-for-change
  async buildDetails(questionSet, changes) {
    const result = []

    for (const key of Object.keys(changes)) {
      const { oldValue, newValue } = changes[key]
      const question = questionSet[key]

      let resolvedOldValue: string
      let resolvedNewValue

      switch (key) {
        case 'evidenceTagAndDescription':
          resolvedOldValue = this.evidenceTagAndDescriptionDisplay(oldValue)
          resolvedNewValue = this.evidenceTagAndDescriptionDisplay(newValue)
          break

        case 'cctvRecording':
          resolvedOldValue = this.toYesNoNotKnown(oldValue)
          resolvedNewValue = this.toYesNoNotKnown(newValue)
          break

        default:
          resolvedOldValue = oldValue === true ? 'Yes' : 'No'
          resolvedNewValue = newValue === true ? 'Yes' : 'No'
      }

      result.push({ question, oldValue: resolvedOldValue, newValue: resolvedNewValue })
    }

    return result
  }

  evidenceTagAndDescriptionDisplay(val): string {
    return val
      ? val
          .filter(item => item.evidenceTagReference) // keep only valid items
          .map(item => `${item.evidenceTagReference}- ${item.description}`)
          .join(', ')
      : ''
  }

  toYesNoNotKnown(val): string {
    let response = 'Not known'
    if (val === 'NO') response = 'No'
    if (val === 'YES') response = 'Yes'
    return response
  }
}
