import request from 'supertest'
import { paths } from '../../config/incident'
import { UofReasons } from '../../config/types'
import { DraftReportService } from '../../services'
import { appWithAllRoutes, user } from '../__test/appSetup'

jest.mock('../../services')

const draftReportService = new DraftReportService(
  null,
  null,
  null,
  null,
  null,
  null,
  null,
) as jest.Mocked<DraftReportService>

let app
const flash = jest.fn()

beforeEach(() => {
  app = appWithAllRoutes({ draftReportService }, undefined, undefined, flash)
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('/why-was-uof-applied', () => {
  describe('GET /why-was-uof-applied', () => {
    test('should render content', () => {
      draftReportService.getUoFReasonState.mockResolvedValue({ isComplete: false, reasons: [] })
      return request(app)
        .get(paths.whyWasUofApplied(-19))
        .expect('Content-Type', /html/)
        .expect(res => {
          expect(res.text).toContain('Why was use of force applied against this prisoner?')
          expect(res.text).toContain(UofReasons.ASSAULT_BY_A_MEMBER_OF_PUBLIC.label)
        })
    })

    test('should render errors', () => {
      draftReportService.getUoFReasonState.mockResolvedValue({ isComplete: false, reasons: [] })
      flash
        .mockReturnValueOnce('true')
        .mockReturnValueOnce([{ href: '#reasons', text: 'Select the reasons why use of force was applied' }])
      return request(app)
        .get(paths.whyWasUofApplied(-19))
        .expect('Content-Type', /html/)
        .expect(res => {
          expect(res.text).toContain('Select the reasons why use of force was applied')
        })
    })
  })

  describe('POST /why-was-uof-applied', () => {
    it('should redirect to report use of force when save-and-return is selected', () => {
      return request(app)
        .post(paths.whyWasUofApplied(-19))
        .send({
          submitType: 'save-and-return',
          reasons: [UofReasons.ASSAULT_ON_ANOTHER_PRISONER.value, UofReasons.ASSAULT_ON_A_MEMBER_OF_STAFF.value],
        })
        .expect(302)
        .expect('Location', paths.reportUseOfForce(-19))
        .expect(() => {
          expect(draftReportService.process).toHaveBeenCalledWith(user, -19, 'reasonsForUseOfForce', {
            reasons: ['ASSAULT_ON_ANOTHER_PRISONER', 'ASSAULT_ON_A_MEMBER_OF_STAFF'],
          })
          expect(flash).not.toHaveBeenCalled()
        })
    })
    it('should redirect to select primary reason page when more than one reason selected', () => {
      return request(app)
        .post(paths.whyWasUofApplied(-19))
        .send({
          reasons: [UofReasons.ASSAULT_ON_ANOTHER_PRISONER.value, UofReasons.ASSAULT_ON_A_MEMBER_OF_STAFF.value],
        })
        .expect(302)
        .expect('Location', paths.whatWasPrimaryReasonForUoF(-19))
        .expect(() => {
          expect(draftReportService.process).not.toHaveBeenCalled()
          expect(flash).toHaveBeenCalledWith('reasons', [
            UofReasons.ASSAULT_ON_ANOTHER_PRISONER.value,
            UofReasons.ASSAULT_ON_A_MEMBER_OF_STAFF.value,
          ])
        })
    })

    it('should redirect to uof details page when single reason selected', () => {
      return request(app)
        .post(paths.whyWasUofApplied(-19))
        .send({ reasons: [UofReasons.ASSAULT_ON_ANOTHER_PRISONER.value] })
        .expect(302)
        .expect('Location', paths.useOfForceDetails(-19))
        .expect(() => {
          expect(draftReportService.process).toHaveBeenCalledWith(user, -19, 'reasonsForUseOfForce', {
            reasons: [UofReasons.ASSAULT_ON_ANOTHER_PRISONER.value],
          })
        })
    })

    it('validation should kick in when no reasons selected', () => {
      return request(app)
        .post(paths.whyWasUofApplied(-19))
        .send({ reasons: undefined })
        .expect(302)
        .expect('Location', paths.whyWasUofApplied(-19))
        .expect(() => {
          expect(flash).toHaveBeenCalledWith('errors', [
            { href: '#reasons', text: 'Select the reasons why use of force was applied' },
          ])
          expect(flash).toHaveBeenCalledWith('clearingOutReasons', true)
        })
    })
  })
})

describe('/what-was-the-primary-reason-of-uof', () => {
  describe('GET /what-was-the-primary-reason-of-uof', () => {
    test('should render content from flash', () => {
      flash.mockReturnValue([UofReasons.ASSAULT_ON_ANOTHER_PRISONER.value, UofReasons.HOSTAGE_NTRG.value])

      draftReportService.getUoFReasonState.mockResolvedValue({
        isComplete: false,
        reasons: [UofReasons.ASSAULT_ON_ANOTHER_PRISONER.value, UofReasons.ASSAULT_BY_A_MEMBER_OF_PUBLIC.value],
      })

      return request(app)
        .get(paths.whatWasPrimaryReasonForUoF(-19))
        .expect('Content-Type', /html/)
        .expect(res => {
          expect(res.text).toContain('What was the primary reason use of force was applied against this prisoner?')
          expect(res.text).toContain(UofReasons.ASSAULT_ON_ANOTHER_PRISONER.label)
          expect(res.text).toContain(UofReasons.HOSTAGE_NTRG.label)
          // Not present as reasons from flash used rather than DB
          expect(res.text).not.toContain(UofReasons.ASSAULT_BY_A_MEMBER_OF_PUBLIC.label)
        })
    })

    test('should render content from db when flash absent (on back)', () => {
      flash.mockReturnValue([])

      draftReportService.getUoFReasonState.mockResolvedValue({
        isComplete: false,
        reasons: [UofReasons.ASSAULT_ON_ANOTHER_PRISONER.value, UofReasons.ASSAULT_BY_A_MEMBER_OF_PUBLIC.value],
      })
      return request(app)
        .get(paths.whatWasPrimaryReasonForUoF(-19))
        .expect('Content-Type', /html/)
        .expect(res => {
          expect(res.text).toContain('What was the primary reason use of force was applied against this prisoner?')
          expect(res.text).toContain(UofReasons.ASSAULT_ON_ANOTHER_PRISONER.label)
          expect(res.text).toContain(UofReasons.ASSAULT_BY_A_MEMBER_OF_PUBLIC.label)
        })
    })

    test('should redirect back when single option and flash absent (on refresh with single item)', () => {
      flash.mockReturnValue([])

      draftReportService.getUoFReasonState.mockResolvedValue({
        isComplete: false,
        reasons: [UofReasons.ASSAULT_ON_ANOTHER_PRISONER.value],
      })
      return request(app)
        .get(paths.whatWasPrimaryReasonForUoF(-19))
        .expect(302)
        .expect('Location', paths.whyWasUofApplied(-19))
    })
  })

  describe('POST /what-was-the-primary-reason-of-uof', () => {
    it('should persist reasons and redirect to use of details page', () => {
      return request(app)
        .post(paths.whatWasPrimaryReasonForUoF(-19))
        .send({
          primaryReason: UofReasons.ASSAULT_ON_ANOTHER_PRISONER.value,
          reasons: [UofReasons.ASSAULT_ON_ANOTHER_PRISONER.value, UofReasons.ASSAULT_ON_A_MEMBER_OF_STAFF.value],
        })
        .expect(302)
        .expect('Location', paths.useOfForceDetails(-19))
        .expect(() => {
          expect(draftReportService.process).toHaveBeenCalledWith(user, -19, 'reasonsForUseOfForce', {
            primaryReason: UofReasons.ASSAULT_ON_ANOTHER_PRISONER.value,
            reasons: [UofReasons.ASSAULT_ON_ANOTHER_PRISONER.value, UofReasons.ASSAULT_ON_A_MEMBER_OF_STAFF.value],
          })
        })
    })

    it('validation should kick in when no primary reasons', () => {
      return request(app)
        .post(paths.whatWasPrimaryReasonForUoF(-19))
        .send({
          primaryReason: undefined,
          reasons: [UofReasons.ASSAULT_ON_ANOTHER_PRISONER.value, UofReasons.ASSAULT_ON_A_MEMBER_OF_STAFF.value],
        })
        .expect(302)
        .expect('Location', paths.whatWasPrimaryReasonForUoF(-19))
        .expect(() => {
          expect(flash).toHaveBeenCalledWith('errors', [
            { href: '#primaryReason', text: 'Select the primary reason why use of force was applied' },
          ])
          expect(flash).toHaveBeenCalledWith('reasons', [
            UofReasons.ASSAULT_ON_ANOTHER_PRISONER.value,
            UofReasons.ASSAULT_ON_A_MEMBER_OF_STAFF.value,
          ])
        })
    })
  })
})
