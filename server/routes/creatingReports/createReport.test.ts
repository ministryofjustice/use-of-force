import request from 'supertest'
import { subDays, subWeeks } from 'date-fns'
import DraftReportService from '../../services/drafts/draftReportService'
import { appWithAllRoutes, user } from '../__test/appSetup'
import AuthService from '../../services/authService'
import OffenderService from '../../services/offenderService'
import config from '../../config'

jest.mock('../../services/drafts/draftReportService')
jest.mock('../../services/authService')
jest.mock('../../services/offenderService')

const draftReportService = new DraftReportService(
  null,
  null,
  null,
  null,
  null,
  null,
  null
) as jest.Mocked<DraftReportService>
const authService = new AuthService(null) as jest.Mocked<AuthService>
const offenderService = new OffenderService(null, null) as jest.Mocked<OffenderService>
const isWithinSubmissionWindow = config.maxWeeksFromIncidentDateToSubmitOrEditReport
let app

beforeEach(() => {
  app = appWithAllRoutes({ draftReportService, authService, offenderService })
  draftReportService.getCurrentDraft.mockResolvedValue({})
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('GET /section/form', () => {
  test(`should render 'no edit or submit banner' if incident date more than ${isWithinSubmissionWindow} weeks ago`, () => {
    draftReportService.getCurrentDraft.mockResolvedValue({
      incidentDate: subDays(subWeeks(new Date(), isWithinSubmissionWindow), 1).toISOString(),
    })

    offenderService.getOffenderDetails.mockResolvedValue({
      displayName: 'First Last',
    })

    draftReportService.isIncidentDateWithinSubmissionWindow.mockReturnValue(false)
    return request(app)
      .get(`/report/1/evidence`)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('You can not edit or submit this report.')
        expect(res.text).toContain('Evidence')
        expect(res.text).toContain('Evidence bagged and tagged')
        expect(res.text).toContain('Were any photographs taken?')
        expect(res.text).toContain('Was any part of the incident captured on CCTV?')
        const matches = res.text.match(/No data entered/g) || []
        expect(matches).toHaveLength(3)
        expect(res.text).toContain('Return to use of force incidents')
        expect(res.text).toContain('href="/your-reports"')
      })
  })

  test(`should render 'No data entered' correct number of times`, () => {
    draftReportService.getCurrentDraft.mockResolvedValue({
      form: {
        evidence: {
          photographsTaken: true,
        },
      },
      incidentDate: subDays(subWeeks(new Date(), isWithinSubmissionWindow), 1).toISOString(),
    })

    offenderService.getOffenderDetails.mockResolvedValue({
      displayName: 'First Last',
    })

    draftReportService.isIncidentDateWithinSubmissionWindow.mockReturnValue(false)
    return request(app)
      .get(`/report/1/evidence`)
      .expect('Content-Type', /html/)
      .expect(res => {
        const noDataEnteredMatches = res.text.match(/No data entered/g) || []
        expect(noDataEnteredMatches).toHaveLength(2)

        const yesMatches = res.text.match(/Yes/g) || []
        expect(res.text).toContain('Yes')
        expect(yesMatches).toHaveLength(1)
      })
  })

  test('should render use-of-force-details using locations for persisted agency if existing report', () => {
    draftReportService.getCurrentDraft.mockResolvedValue({ id: '1', agencyId: 'persisted-agency-id' })
    return request(app)
      .get(`/report/1/use-of-force-details`)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Use of force details')
        expect(res.text).not.toContain('You can not edit or submit this report.')
        expect(res.text).not.toContain('href="/your-reports"')
      })
  })
})

const validUseOfForceDetailsRequest = {
  bodyWornCamera: 'YES',
  bodyWornCameraNumbers: [{ cameraNum: 'ABC123' }],
  positiveCommunication: 'false',
  personalProtectionTechniques: 'false',
  batonDrawnAgainstPrisoner: 'false',
  pavaDrawnAgainstPrisoner: 'false',
  bittenByPrisonDog: 'false',
  taserDrawn: 'false',
  weaponsObserved: 'NO',
  guidingHold: 'false',
  escortingHold: 'false',
  painInducingTechniquesUsed: 'NONE',
  handcuffsApplied: 'false',
  restraintPositions: 'NONE',
  submitType: 'save-and-continue',
}

const validUseOfForceDetailUpdate = [
  user,
  1,
  'useOfForceDetails',
  {
    bodyWornCamera: 'YES',
    bodyWornCameraNumbers: [{ cameraNum: 'ABC123' }],
    batonDrawnAgainstPrisoner: false,
    pavaDrawnAgainstPrisoner: false,
    taserDrawn: false,
    bittenByPrisonDog: false,
    guidingHold: false,
    escortingHold: false,
    handcuffsApplied: false,
    painInducingTechniquesUsed: 'NONE',
    weaponsObserved: 'NO',
    personalProtectionTechniques: false,
    positiveCommunication: false,
    restraintPositions: 'NONE',
  },
]

describe('POST save and continue /section/form', () => {
  test('should redirect to next page', () => {
    return request(app)
      .post(`/report/1/use-of-force-details`)
      .send(validUseOfForceDetailsRequest)
      .expect(302)
      .expect('Location', '/report/1/relocation-and-injuries')
      .expect(() => {
        expect(draftReportService.process).toHaveBeenCalledTimes(1)
        expect(draftReportService.process).toHaveBeenCalledWith(...validUseOfForceDetailUpdate)
      })
  })

  test('Submitting invalid update is not allowed and user redirected to same page', () =>
    request(app)
      .post(`/report/1/use-of-force-details`)
      .send({ ...validUseOfForceDetailsRequest, batonDrawnAgainstPrisoner: null })
      .expect(302)
      .expect('Location', '/report/1/use-of-force-details')
      .expect(() => {
        expect(draftReportService.process).not.toHaveBeenCalled()
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
        expect(draftReportService.process).toHaveBeenCalledTimes(1)
        expect(draftReportService.process).toHaveBeenCalledWith(...validUseOfForceDetailUpdate)
      })
  })

  test('Submitting invalid update is allowed', () => {
    return request(app)
      .post(`/report/1/use-of-force-details`)
      .send({
        ...validUseOfForceDetailsRequest,
        taserDrawn: undefined,
        bodyWornCamera: null,
        submitType: 'save-and-return',
      })
      .expect(302)
      .expect('Location', '/report/1/report-use-of-force')
      .expect(() => {
        expect(draftReportService.process).toHaveBeenCalledTimes(1)
        expect(draftReportService.process).toHaveBeenCalledWith(user, 1, 'useOfForceDetails', {
          guidingHold: false,
          escortingHold: false,
          handcuffsApplied: false,
          painInducingTechniquesUsed: 'NONE',
          pavaDrawnAgainstPrisoner: false,
          bittenByPrisonDog: false,
          batonDrawnAgainstPrisoner: false,
          weaponsObserved: 'NO',
          personalProtectionTechniques: false,
          positiveCommunication: false,
          restraintPositions: 'NONE',
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
        bodyWornCamera: ['another invalid input'],
        submitType: 'save-and-return',
      })
      .expect(302)
      .expect('Location', `/report/1/use-of-force-details`))
})

describe('POST save once complete and return to check-your-answers', () => {
  test('successfully submit valid update', () => {
    draftReportService.isDraftComplete.mockResolvedValue(true)
    return request(app)
      .post(`/report/1/use-of-force-details`)
      .send(validUseOfForceDetailsRequest)
      .expect(302)
      .expect('Location', '/report/1/check-your-answers')
      .expect(() => {
        expect(draftReportService.process).toHaveBeenCalledTimes(1)
        expect(draftReportService.process).toHaveBeenCalledWith(...validUseOfForceDetailUpdate)
      })
  })

  test('Submitting invalid update is not allowed', () => {
    draftReportService.isDraftComplete.mockResolvedValue(true)
    return request(app)
      .post(`/report/1/use-of-force-details`)
      .send({
        ...validUseOfForceDetailsRequest,
        restraintPositions: ['not a valid value'],
        submitType: 'save-and-return',
      })
      .expect(302)
      .expect('Location', '/report/1/use-of-force-details')
      .expect(() => {
        expect(draftReportService.process).not.toHaveBeenCalled()
      })
  })
})

describe('Submitting evidence page', () => {
  test.each`
    submitType             | formComplete | nextPath
    ${'save-and-return'}   | ${true}      | ${'/report/1/check-your-answers'}
    ${'save-and-return'}   | ${false}     | ${'/report/1/report-use-of-force'}
    ${'save-and-continue'} | ${true}      | ${'/report/1/check-your-answers'}
    ${'save-and-continue'} | ${false}     | ${'/report/1/report-use-of-force'}
  `(
    'should redirect to $nextPath for when submit type is $submitType and form is complete: $formComplete',
    ({ submitType, formComplete, nextPath }) => {
      draftReportService.isDraftComplete.mockReturnValue(formComplete)
      return request(app)
        .post(`/report/1/evidence`)
        .send({
          submitType,
          baggedEvidence: 'true',
          cctvRecording: 'YES',
          evidenceTagAndDescription: [{ description: 'A Description', evidenceTagReference: '12345' }],
          photographsTaken: 'true',
        })
        .expect(302)
        .expect('Location', nextPath)
        .expect(() => {
          expect(draftReportService.process).toHaveBeenCalledTimes(1)

          expect(draftReportService.process).toHaveBeenCalledWith(user, 1, 'evidence', {
            baggedEvidence: true,
            cctvRecording: 'YES',
            evidenceTagAndDescription: [{ description: 'A Description', evidenceTagReference: '12345' }],
            photographsTaken: true,
          })
        })
    }
  )
})
