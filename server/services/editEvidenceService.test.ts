import EditEvidenceService from './editEvidenceService'

describe('EditEvidenceService', () => {
  let service: EditEvidenceService

  const questionSet = {
    baggedEvidence: 'Was any evidence bagged and tagged?',
    evidenceTagAndDescription: 'Evidence tag and desciption',
    photographsTaken: 'Were any photographs taken?',
    cctvRecording: 'Was any part of the incident captured on CCTV?',
  }
  beforeEach(() => {
    service = new EditEvidenceService()
  })

  describe('buildDetails', () => {
    it('resolves full details correctly', async () => {
      const changes = {
        baggedEvidence: {
          question: 'Was any evidence bagged and tagged?',
          oldValue: true,
          newValue: false,
        },
        evidenceTagAndDescription: {
          question: 'Evidence tag and desciption',
          oldValue: [
            { description: 'two', evidenceTagReference: '2' },
            { description: 'one one', evidenceTagReference: '11' },
          ],
        },
        photographsTaken: {
          question: 'Were any photographs taken?',
          oldValue: true,
          newValue: false,
        },
        cctvRecording: {
          question: 'Was any part of the incident captured on CCTV?',
          oldValue: 'NOT_KNOWN',
          newValue: 'NO',
        },
      }

      const result = await service.buildDetails(questionSet, changes)

      expect(result).toEqual([
        {
          question: 'Was any evidence bagged and tagged?',
          oldValue: 'Yes',
          newValue: 'No',
        },
        {
          question: 'Evidence tag and desciption',
          oldValue: '2- two, 11- one one',
          newValue: '',
        },
        {
          question: 'Were any photographs taken?',
          oldValue: 'Yes',
          newValue: 'No',
        },
        {
          question: 'Was any part of the incident captured on CCTV?',
          oldValue: 'Not known',
          newValue: 'No',
        },
      ])
    })
  })

  describe('evidenceTagAndDescriptionDisplay', () => {
    it('formats list of evidence items into string', () => {
      const input = [
        { evidenceTagReference: 'TAG1', description: 'Knife' },
        { evidenceTagReference: 'TAG2', description: 'Gun' },
      ]
      const result = service.evidenceTagAndDescriptionDisplay(input)
      expect(result).toBe('TAG1- Knife, TAG2- Gun')
    })

    it('returns empty string when input is null or empty', () => {
      expect(service.evidenceTagAndDescriptionDisplay(null)).toBe('')
      expect(service.evidenceTagAndDescriptionDisplay([])).toBe('')
    })
  })

  describe('toYesNoNotKnown', () => {
    it('returns "Yes" for YES', () => {
      expect(service.toYesNoNotKnown('YES')).toBe('Yes')
    })

    it('returns "No" for NO', () => {
      expect(service.toYesNoNotKnown('NO')).toBe('No')
    })

    it('returns "Not known" for NOT_KNOWN or anything else', () => {
      expect(service.toYesNoNotKnown('NOT_KNOWN')).toBe('Not known')
      expect(service.toYesNoNotKnown(undefined)).toBe('Not known')
    })
  })
})
