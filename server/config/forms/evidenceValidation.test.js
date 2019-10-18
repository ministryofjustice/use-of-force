const { complete } = require('./evidenceForm')
const { processInput } = require('../../services/validation')

const check = input => {
  const { payloadFields: formResponse, errors } = processInput({ validationSpec: complete, input })
  return { formResponse, errors }
}

const validInput = {
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
  bodyWornCamera: 'YES',
  bodyWornCameraNumbers: [{ cameraNum: 'ABC123' }, { cameraNum: '' }],
}

describe('check evidence validation', () => {
  it('successful input', () => {
    const { errors, formResponse } = check(validInput)

    expect(errors).toEqual([])

    expect(formResponse).toEqual({
      baggedEvidence: true,
      bodyWornCamera: 'YES',
      bodyWornCameraNumbers: [{ cameraNum: 'ABC123' }],
      cctvRecording: 'YES',
      evidenceTagAndDescription: [{ description: 'A Description', evidenceTagReference: '12345' }],
      photographsTaken: true,
    })
  })

  it('no values supplied', () => {
    const input = {}
    const { errors, formResponse } = check(input)

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
      {
        href: '#bodyWornCamera',
        text: 'Select yes if any part of the incident was captured on a body-worn camera',
      },
    ])

    expect(formResponse).toEqual({})
  })
})

describe('Evidence', () => {
  it('Conditional field not selected  - errors and filters out evidence list', () => {
    const input = {
      ...validInput,
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
      bodyWornCamera: 'YES',
      bodyWornCameraNumbers: [{ cameraNum: 'ABC123' }],
      cctvRecording: 'YES',
      photographsTaken: true,
    })
  })

  it('with invalid bagged and tag evidence input', () => {
    const input = {
      ...validInput,
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
      bodyWornCamera: 'YES',
      bodyWornCameraNumbers: [{ cameraNum: 'ABC123' }],
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
      ...validInput,
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
      bodyWornCamera: 'YES',
      bodyWornCameraNumbers: [{ cameraNum: 'ABC123' }],
      cctvRecording: 'YES',
      photographsTaken: true,
    })
  })

  it('Doesnt allow whitespace only', () => {
    const input = {
      ...validInput,
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
      bodyWornCamera: 'YES',
      bodyWornCameraNumbers: [{ cameraNum: 'ABC123' }],
      cctvRecording: 'YES',
      photographsTaken: true,
      evidenceTagAndDescription: [{ description: '', evidenceTagReference: 'ref-1' }],
    })
  })

  it('Conditional field selected: No, evidence are not required', () => {
    const input = {
      ...validInput,
      baggedEvidence: 'false',
      evidenceTagAndDescription: undefined,
    }

    const { errors, formResponse } = check(input)

    expect(errors).toEqual([])

    expect(formResponse).toEqual({
      baggedEvidence: false,
      bodyWornCamera: 'YES',
      bodyWornCameraNumbers: [{ cameraNum: 'ABC123' }],
      cctvRecording: 'YES',
      photographsTaken: true,
    })
  })
})

describe('Body Worn Cameras', () => {
  it('Conditional field not selected  - errors and filters out camera number list', () => {
    const input = { ...validInput, bodyWornCamera: undefined, bodyWornCameraNumbers: [{ cameraNum: 'AAA123' }] }
    const { errors, formResponse } = check(input)

    expect(errors).toEqual([
      {
        href: '#bodyWornCamera',
        text: 'Select yes if any part of the incident was captured on a body-worn camera',
      },
    ])

    expect(formResponse).toEqual({
      baggedEvidence: true,
      cctvRecording: 'YES',
      evidenceTagAndDescription: [{ description: 'A Description', evidenceTagReference: '12345' }],
      photographsTaken: true,
    })
  })

  it('Conditional field must be one of allowed values', () => {
    const input = { ...validInput, bodyWornCamera: 'BOB', bodyWornCameraNumbers: [{ cameraNum: 'AAA123' }] }
    const { errors, formResponse } = check(input)

    expect(errors).toEqual([
      {
        href: '#bodyWornCamera',
        text: 'Select yes if any part of the incident was captured on a body-worn camera',
      },
    ])

    expect(formResponse).toEqual({
      baggedEvidence: true,
      cctvRecording: 'YES',
      bodyWornCamera: 'BOB',
      evidenceTagAndDescription: [{ description: 'A Description', evidenceTagReference: '12345' }],
      photographsTaken: true,
    })
  })

  it('Conditional field selected: Yes, check at least one number is present', () => {
    const input = { ...validInput, bodyWornCamera: 'YES', bodyWornCameraNumbers: [] }
    const { errors, formResponse } = check(input)

    expect(errors).toEqual([
      {
        href: '#bodyWornCameraNumbers[0]',
        text: 'Enter the body-worn camera number',
      },
    ])

    expect(formResponse).toEqual({
      baggedEvidence: true,
      bodyWornCamera: 'YES',
      cctvRecording: 'YES',
      evidenceTagAndDescription: [{ description: 'A Description', evidenceTagReference: '12345' }],
      photographsTaken: true,
    })
  })

  it('Conditional field selected: Yes, empty numbers are ignored', () => {
    const input = {
      ...validInput,
      bodyWornCamera: 'YES',
      bodyWornCameraNumbers: [{ cameraNum: 'AAA' }, { cameraNum: '' }, { cameraNum: 'BBB' }],
    }
    const { errors, formResponse } = check(input)

    expect(errors).toEqual([])

    expect(formResponse).toEqual({
      baggedEvidence: true,
      bodyWornCamera: 'YES',
      bodyWornCameraNumbers: [{ cameraNum: 'AAA' }, { cameraNum: 'BBB' }],
      cctvRecording: 'YES',
      evidenceTagAndDescription: [{ description: 'A Description', evidenceTagReference: '12345' }],
      photographsTaken: true,
    })
  })

  it('Duplicate camera numbers are rejected', () => {
    const input = {
      ...validInput,
      bodyWornCamera: 'YES',
      bodyWornCameraNumbers: [{ cameraNum: 'AAA' }, { cameraNum: '' }, { cameraNum: 'AAA' }],
    }
    const { errors, formResponse } = check(input)

    expect(errors).toEqual([
      {
        href: '#bodyWornCameraNumbers[1]',
        text: "Camera 'AAA' has already been added - remove this camera",
      },
    ])

    expect(formResponse).toEqual({
      baggedEvidence: true,
      bodyWornCamera: 'YES',
      bodyWornCameraNumbers: [{ cameraNum: 'AAA' }, { cameraNum: 'AAA' }],
      cctvRecording: 'YES',
      evidenceTagAndDescription: [{ description: 'A Description', evidenceTagReference: '12345' }],
      photographsTaken: true,
    })
  })

  it('Duplicate evidence tags are rejected', () => {
    const input = {
      ...validInput,
      bodyWornCamera: 'NO',
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
      bodyWornCamera: 'NO',
      cctvRecording: 'YES',
      evidenceTagAndDescription: [
        { description: 'D2', evidenceTagReference: '12345' },
        { description: 'D1', evidenceTagReference: '12345' },
      ],
      photographsTaken: true,
    })
  })

  it('Conditional field selected: Yes, unknown fields are ignored, known fields are trimmed', () => {
    const input = {
      ...validInput,
      bodyWornCamera: 'YES',
      bodyWornCameraNumbers: [{ cameraNum: '    AAA  ', age: '29' }, { cameraNum: '' }, { cameraNum: 'BBB' }],
    }
    const { errors, formResponse } = check(input)

    expect(errors).toEqual([])

    expect(formResponse).toEqual({
      baggedEvidence: true,
      bodyWornCamera: 'YES',
      bodyWornCameraNumbers: [{ cameraNum: 'AAA' }, { cameraNum: 'BBB' }],
      cctvRecording: 'YES',
      evidenceTagAndDescription: [{ description: 'A Description', evidenceTagReference: '12345' }],
      photographsTaken: true,
    })
  })

  it('Conditional field selected: No, numbers are not required', () => {
    const input = {
      ...validInput,
      bodyWornCamera: 'NO',
      bodyWornCameraNumbers: [{ cameraNum: 'AAA' }, { cameraNum: '' }, { cameraNum: 'AAA' }],
    }
    const { errors, formResponse } = check(input)

    expect(errors).toEqual([])

    expect(formResponse).toEqual({
      baggedEvidence: true,
      bodyWornCamera: 'NO',
      cctvRecording: 'YES',
      evidenceTagAndDescription: [{ description: 'A Description', evidenceTagReference: '12345' }],
      photographsTaken: true,
    })
  })
})
