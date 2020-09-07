const request = require('supertest')
const { appWithAllRoutes, user } = require('./testutils/appSetup')
const { toDate } = require('../utils/dateSanitiser')

const reportService = {
  getCurrentDraft: jest.fn(),
  update: jest.fn(),
  getValidationErrors: jest.fn().mockReturnValue([]),
  getUpdatedFormObject: jest.fn(),
  isDraftComplete: jest.fn(),
}

let app

beforeEach(() => {
  app = appWithAllRoutes({ reportService })
  reportService.getCurrentDraft.mockResolvedValue({})
  reportService.getUpdatedFormObject.mockResolvedValue({})
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('GET /section/form', () => {
  test('should render use-of-force-details using locations for persisted agency if existing report', () => {
    reportService.getCurrentDraft.mockResolvedValue({ id: '1', agencyId: 'persisted-agency-id' })
    return request(app)
      .get(`/report/1/use-of-force-details`)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Use of force details')
      })
  })
})

const validUseOfForceDetailsRequest = {
  positiveCommunication: 'false',
  personalProtectionTechniques: 'false',
  batonDrawn: 'false',
  pavaDrawn: 'false',
  guidingHold: 'false',
  restraint: 'false',
  painInducingTechniques: 'false',
  handcuffsApplied: 'false',
  submitType: 'save-and-continue',
}

const validUseofForceDetailUpdate = {
  currentUser: user,
  bookingId: 1,
  formId: undefined,
  formObject: {
    useOfForceDetails: {
      batonDrawn: false,
      guidingHold: false,
      handcuffsApplied: false,
      painInducingTechniques: false,
      pavaDrawn: false,
      personalProtectionTechniques: false,
      positiveCommunication: false,
      restraint: false,
    },
  },
}

describe('POST save and continue /section/form', () => {
  test('should redirect to next page', () => {
    return request(app)
      .post(`/report/1/use-of-force-details`)
      .send(validUseOfForceDetailsRequest)
      .expect(302)
      .expect('Location', '/report/1/relocation-and-injuries')
      .expect(() => {
        expect(reportService.update).toBeCalledTimes(1)
        expect(reportService.update).toBeCalledWith(validUseofForceDetailUpdate)
      })
  })

  test('Submitting invalid update is not allowed and user redirected to same page', () =>
    request(app)
      .post(`/report/1/use-of-force-details`)
      .send({ ...validUseOfForceDetailsRequest, batonDrawn: null })
      .expect(302)
      .expect('Location', '/report/1/use-of-force-details')
      .expect(() => {
        expect(reportService.update).not.toBeCalled()
      }))
})

describe('POST save and return to tasklist', () => {
  test('successfully submit valid update', () => {
    return request(app)
      .post(`/report/1/use-of-force-details`)
      .send({ ...validUseOfForceDetailsRequest, submitType: 'save-and-return' })
      .expect(302)
      .expect('Location', '/report/1/report-use-of-force')
      .expect(() => {
        expect(reportService.update).toBeCalledTimes(1)
        expect(reportService.update).toBeCalledWith(validUseofForceDetailUpdate)
      })
  })

  test('Submitting invalid update is allowed', () => {
    return request(app)
      .post(`/report/1/use-of-force-details`)
      .send({ ...validUseOfForceDetailsRequest, batonDrawn: null, submitType: 'save-and-return' })
      .expect(302)
      .expect('Location', '/report/1/report-use-of-force')
      .expect(() => {
        expect(reportService.update).toBeCalledTimes(1)
        expect(reportService.update).toBeCalledWith({
          currentUser: user,
          bookingId: 1,
          formId: undefined,
          formObject: {
            useOfForceDetails: {
              guidingHold: false,
              handcuffsApplied: false,
              painInducingTechniques: false,
              pavaDrawn: false,
              personalProtectionTechniques: false,
              positiveCommunication: false,
              restraint: false,
            },
          },
        })
      })
  })

  test('Submitting bad data is rejected', () =>
    request(app)
      .post(`/report/1/use-of-force-details`)
      .send({
        ...validUseOfForceDetailsRequest,
        restraint: 'true',
        restraintPositions: ['not a valid value'],
        submitType: 'save-and-return',
      })
      .expect(302)
      .expect('Location', `/report/1/use-of-force-details`))
})

describe('POST save and return to check-your-answers', () => {
  test('successfully submit valid update', () => {
    return request(app)
      .post(`/report/1/edit-use-of-force-details`)
      .send(validUseOfForceDetailsRequest)
      .expect(302)
      .expect('Location', '/report/1/check-your-answers')
      .expect(() => {
        expect(reportService.update).toBeCalledTimes(1)
        expect(reportService.update).toBeCalledWith(validUseofForceDetailUpdate)
      })
  })

  test('Submitting invalid update is not allowed', () =>
    request(app)
      .post(`/report/1/edit-use-of-force-details`)
      .send({
        ...validUseOfForceDetailsRequest,
        restraint: 'true',
        restraintPositions: ['not a valid value'],
        submitType: 'save-and-return',
      })
      .expect(302)
      .expect('Location', '/report/1/edit-use-of-force-details')
      .expect(() => {
        expect(reportService.update).not.toBeCalled()
      }))
})

describe('Submitting evidence page', () => {
  test.each`
    submitType             | formComplete | nextPath
    ${'save-and-return'}   | ${true}      | ${'/report/1/report-use-of-force'}
    ${'save-and-return'}   | ${false}     | ${'/report/1/report-use-of-force'}
    ${'save-and-continue'} | ${true}      | ${'/report/1/check-your-answers'}
    ${'save-and-continue'} | ${false}     | ${'/report/1/report-use-of-force'}
  `(
    'should redirect to $nextPath for when submit type is $submitType and form is complete: $formComplete',
    ({ submitType, formComplete, nextPath }) => {
      reportService.isDraftComplete.mockReturnValue(formComplete)
      return request(app)
        .post(`/report/1/evidence`)
        .send({
          submitType,
          baggedEvidence: 'true',
          bodyWornCamera: 'YES',
          bodyWornCameraNumbers: [{ cameraNum: 'ABC123' }],
          cctvRecording: 'YES',
          evidenceTagAndDescription: [{ description: 'A Description', evidenceTagReference: '12345' }],
          photographsTaken: 'true',
        })
        .expect(302)
        .expect('Location', nextPath)
        .expect(() => {
          expect(reportService.update).toBeCalledTimes(1)
          expect(reportService.update).toBeCalledWith({
            currentUser: user,
            bookingId: 1,
            formId: undefined,
            formObject: {
              evidence: {
                baggedEvidence: true,
                bodyWornCamera: 'YES',
                bodyWornCameraNumbers: [{ cameraNum: 'ABC123' }],
                cctvRecording: 'YES',
                evidenceTagAndDescription: [{ description: 'A Description', evidenceTagReference: '12345' }],
                photographsTaken: true,
              },
            },
          })
        })
    }
  )
})

describe('Cancelling from edit', () => {
  test('standard form', () => {
    return request(app)
      .get(`/report/1/cancel-edit/evidence`)
      .expect(302)
      .expect('Location', '/report/1/check-your-answers')
  })
})
