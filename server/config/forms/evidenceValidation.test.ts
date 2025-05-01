import evidenceForm from './evidenceForm'
import validation from '../../services/validation'

const { complete, partial } = evidenceForm
const { processInput } = validation

const buildCheck = schema => input => {
  const { payloadFields: formResponse, errors } = processInput({ validationSpec: schema, input })
  return { formResponse, errors }
}

const validInput = () => ({
  baggedEvidence: 'true',
  evidenceTagAndDescription: [
    {
      evidenceTagReference: '12345',
      description: 'A Description',
    },
    {
      evidenceTagReference: '',
      description: '',
    },
  ],
  photographsTaken: 'true',
  cctvRecording: 'YES',
})

describe("'complete' validation", () => {
  const check = buildCheck(complete)
  describe('check evidence validation', () => {
    it('successful input', () => {
      const { errors, formResponse } = check(validInput())

      expect(errors).toEqual([])

      expect(formResponse).toEqual({
        baggedEvidence: true,
        cctvRecording: 'YES',
        evidenceTagAndDescription: [{ description: 'A Description', evidenceTagReference: '12345' }],
        photographsTaken: true,
      })
    })

    it('no values supplied', () => {
      const { errors, formResponse } = check({})

      expect(errors).toEqual([
        {
          href: '#baggedEvidence',
          text: 'Select yes if any evidence was bagged and tagged',
        },
        {
          href: '#photographsTaken',
          text: 'Select yes if any photographs were taken',
        },
        {
          href: '#cctvRecording',
          text: 'Select yes if any part of the incident captured on CCTV',
        },
      ])

      expect(formResponse).toEqual({})
    })
  })

  describe('Evidence', () => {
    it('Conditional field not selected  - errors and filters out evidence list', () => {
      const input = {
        ...validInput(),
        baggedEvidence: undefined,
        evidenceTagAndDescription: [{ description: 'A Description', evidenceTagReference: '12345' }],
      }
      const { errors, formResponse } = check(input)

      expect(errors).toEqual([
        {
          href: '#baggedEvidence',
          text: 'Select yes if any evidence was bagged and tagged',
        },
      ])

      expect(formResponse).toEqual({
        cctvRecording: 'YES',
        photographsTaken: true,
      })
    })

    it('with invalid bagged and tag evidence input', () => {
      const input = {
        ...validInput(),
        baggedEvidence: 'true',
        evidenceTagAndDescription: [
          { description: 'A Description', evidenceTagReference: '12345' },
          { description: 'A Description', evidenceTagReference: '   ' },
          { description: '   ', evidenceTagReference: '12345' },
        ],
      }

      const { errors, formResponse } = check(input)

      expect(errors).toEqual([
        {
          href: '#evidenceTagAndDescription[1][evidenceTagReference]',
          text: 'Enter the evidence tag number',
        },
        {
          href: '#evidenceTagAndDescription[2][description]',
          text: 'Enter a description of the evidence',
        },
        {
          href: '#evidenceTagAndDescription[2]',
          text: "Evidence tag '12345' has already been added - remove this evidence tag",
        },
      ])

      expect(formResponse).toEqual({
        baggedEvidence: true,
        cctvRecording: 'YES',
        evidenceTagAndDescription: [
          { description: 'A Description', evidenceTagReference: '12345' },
          { description: 'A Description', evidenceTagReference: '' },
          { description: '', evidenceTagReference: '12345' },
        ],
        photographsTaken: true,
      })
    })

    it('missing both fields when required', () => {
      const input = {
        ...validInput(),
        baggedEvidence: 'true',
        evidenceTagAndDescription: [{ description: '', evidenceTagReference: '' }],
      }

      const { errors, formResponse } = check(input)

      expect(errors).toEqual([
        {
          href: '#baggedEvidence',
          text: 'Please input both the evidence tag number and the description',
        },
      ])

      expect(formResponse).toEqual({
        baggedEvidence: true,
        cctvRecording: 'YES',
        photographsTaken: true,
      })
    })

    it('Doesnt allow whitespace only', () => {
      const input = {
        ...validInput(),
        baggedEvidence: 'true',
        evidenceTagAndDescription: [{ description: '    ', evidenceTagReference: 'ref-1' }],
      }

      const { errors, formResponse } = check(input)

      expect(errors).toEqual([
        {
          href: '#evidenceTagAndDescription[0][description]',
          text: 'Enter a description of the evidence',
        },
      ])

      expect(formResponse).toEqual({
        baggedEvidence: true,
        cctvRecording: 'YES',
        photographsTaken: true,
        evidenceTagAndDescription: [{ description: '', evidenceTagReference: 'ref-1' }],
      })
    })

    it('Conditional field selected: No, evidence are not required', () => {
      const input = {
        ...validInput(),
        baggedEvidence: 'false',
        evidenceTagAndDescription: undefined,
      }

      const { errors, formResponse } = check(input)

      expect(errors).toEqual([])

      expect(formResponse).toEqual({
        baggedEvidence: false,
        cctvRecording: 'YES',
        photographsTaken: true,
      })
    })
  })

  describe('Evidence tags', () => {
    it('Duplicate evidence tags are rejected', () => {
      const input = {
        ...validInput(),
        evidenceTagAndDescription: [
          { description: 'D2', evidenceTagReference: '12345' },
          { description: 'D1', evidenceTagReference: '12345' },
        ],
      }
      const { errors, formResponse } = check(input)

      expect(errors).toEqual([
        {
          href: '#evidenceTagAndDescription[1]',
          text: "Evidence tag '12345' has already been added - remove this evidence tag",
        },
      ])

      expect(formResponse).toEqual({
        baggedEvidence: true,
        cctvRecording: 'YES',
        evidenceTagAndDescription: [
          { description: 'D2', evidenceTagReference: '12345' },
          { description: 'D1', evidenceTagReference: '12345' },
        ],
        photographsTaken: true,
      })
    })
  })
})

describe("'partial' validation", () => {
  const check = buildCheck(partial)
  it('No values supplied', () => {
    const { errors, formResponse } = check({})
    expect(formResponse).toEqual({})
    expect(errors).toEqual([])
  })

  it('successful input', () => {
    const { errors, formResponse } = check(validInput())
    expect(formResponse).toEqual({
      baggedEvidence: true,
      cctvRecording: 'YES',
      evidenceTagAndDescription: [
        {
          description: 'A Description',
          evidenceTagReference: '12345',
        },
      ],
      photographsTaken: true,
    })
    expect(errors).toEqual([])
  })

  it('empty nested input', () => {
    const { errors, formResponse } = check({
      baggedEvidence: 'true',
      evidenceTagAndDescription: [],
    })
    expect(formResponse).toEqual({
      baggedEvidence: true,
    })
    expect(errors).toEqual([])
  })

  it('partial nested input', () => {
    const { errors, formResponse } = check({
      baggedEvidence: 'true',
      evidenceTagAndDescription: [{ evidenceTagReference: ' 12345 ' }],
    })
    expect(formResponse).toEqual({
      baggedEvidence: true,
      evidenceTagAndDescription: [
        {
          evidenceTagReference: '12345',
        },
      ],
    })
    expect(errors).toEqual([])
  })
})
