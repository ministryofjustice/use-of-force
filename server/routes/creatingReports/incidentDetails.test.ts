import request from 'supertest'
import moment from 'moment'
import { format, subDays, subWeeks } from 'date-fns'
import { appWithAllRoutes, user } from '../__test/appSetup'
import { toDate } from '../../utils/dateSanitiser'
import DraftReportService from '../../services/drafts/draftReportService'
import OffenderService from '../../services/offenderService'
import LocationService from '../../services/locationService'
import type { Prison } from '../../data/prisonClientTypes'
import AuthService from '../../services/authService'
import config from '../../config'

jest.mock('../../services/drafts/draftReportService')
jest.mock('../../services/offenderService')
jest.mock('../../services/locationService')
jest.mock('../../services/authService')

const draftReportService = new DraftReportService(
  null,
  null,
  null,
  null,
  null,
  null,
  null
) as jest.Mocked<DraftReportService>
const offenderService = new OffenderService(null, null) as jest.Mocked<OffenderService>
const locationService = new LocationService(null, null) as jest.Mocked<LocationService>
const authService = new AuthService(null) as jest.Mocked<AuthService>
const yesterday = format(subDays(new Date(), 1), 'dd/MM/yyyy')

let app
const flash = jest.fn()
const incidentLocationId = 'incident-location-id'
const submissionWindow = config.maxWeeksFromIncidentDateToSubmitOrEditReport
beforeEach(() => {
  app = appWithAllRoutes({ draftReportService, offenderService, locationService, authService }, undefined, false, flash)
  draftReportService.getCurrentDraft.mockResolvedValue({})
  offenderService.getOffenderDetails.mockResolvedValue({
    displayName: 'Bob Smith',
    offenderNo: '1234',
    agencyId: 'current-agency-id',
  })
  locationService.getIncidentLocations.mockResolvedValue([])
  flash.mockReturnValue([])
  draftReportService.getPotentialDuplicates.mockResolvedValue([])
  authService.getSystemClientToken.mockResolvedValue('user1-system-token')
  locationService.getPrisonById.mockResolvedValue({
    agencyId: 'LEI',
    description: 'Leeds prison',
  } as Prison)
})

afterEach(() => {
  jest.resetAllMocks()
  jest.restoreAllMocks()
})

describe('GET /section/form', () => {
  test(`should render 'no edit or submit' banner if incident date over ${submissionWindow} weeks ago`, () => {
    draftReportService.isDraftComplete.mockResolvedValue(true)

    draftReportService.getCurrentDraft.mockResolvedValue({
      form: {
        incidentDetails: {
          plannedUseOfForce: false,
          incidentLocationId: 'bfca41db-f709-4df3-8884-4cc893dba6ba',
        },
      },
      incidentDate: subDays(subWeeks(new Date(), 14), 1),
    })

    draftReportService.isIncidentDateWithinSubmissionWindow.mockReturnValue(false)
    locationService.getLocation.mockResolvedValue('Some location')

    return request(app)
      .get(`/report/1/incident-details`)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain(
          `You can not edit or submit this report. The incident date is over ${submissionWindow} weeks ago`
        )
        expect(res.text).not.toContain('Save and return to report use of force')
        expect(res.text).toContain('Return to use of force incidents')
        expect(res.text).toContain('href="/your-reports"')
      })
  })

  test(`should NOT render 'no edit or submit' banner if incident date is within ${submissionWindow} weeks ago`, () => {
    draftReportService.isDraftComplete.mockResolvedValue(true)

    draftReportService.getCurrentDraft.mockResolvedValue({
      form: {
        incidentDetails: {
          plannedUseOfForce: false,
          incidentLocationId: 'bfca41db-f709-4df3-8884-4cc893dba6ba',
        },
      },
      incidentDate: subWeeks(new Date(), 12),
    })

    draftReportService.isIncidentDateWithinSubmissionWindow.mockReturnValue(true)
    locationService.getLocation.mockResolvedValue('Some location')

    return request(app)
      .get(`/report/1/incident-details`)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Save and continue')
        expect(res.text).not.toContain(
          `You can not edit or submit this report. The incident date is over ${submissionWindow} weeks ago`
        )
        expect(res.text).not.toContain('Return to use of force incidents')
        expect(res.text).not.toContain('href="/your-reports"')
      })
  })

  test('should display correct error message when no incident date input or selected', () => {
    flash.mockReturnValue([
      {
        text: 'Enter or select a date',
        href: '#incidentDate[date]',
      },
    ])

    return request(app)
      .get(`/report/1/incident-details`)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Enter or select a date')
      })
  })

  test('should display correct error message when incident date out of permitted range', () => {
    flash.mockReturnValue([
      {
        text: `Select or enter a date within the last ${config.maxWeeksFromIncidentDateToSubmitOrEditReport} weeks`,
        href: '#incidentDate[date]',
      },
    ])

    return request(app)
      .get(`/report/1/incident-details`)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain(
          `Select or enter a date within the last ${config.maxWeeksFromIncidentDateToSubmitOrEditReport} weeks`
        )
      })
  })

  test('should render Leeds prison', () => {
    return request(app)
      .get(`/report/1/incident-details`)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Leeds prison')
      })
  })

  test('should render incident-details for existing report using system creds', () => {
    draftReportService.getCurrentDraft.mockResolvedValue({ id: '1' })
    return request(app)
      .get(`/report/1/incident-details`)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Incident details')
        expect(offenderService.getOffenderDetails).toHaveBeenCalledWith(1, 'user1')
      })
  })

  test('should render incident-details using locations for current agency if new report', () => {
    draftReportService.getCurrentDraft.mockResolvedValue({ incidentDate: new Date().toISOString() })
    draftReportService.isIncidentDateWithinSubmissionWindow.mockReturnValue(true)
    return request(app)
      .get(`/report/1/incident-details`)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Incident details')
        expect(locationService.getIncidentLocations).toHaveBeenCalledWith('user1-system-token', 'current-agency-id')
      })
  })

  test('should render saved data', () => {
    draftReportService.getCurrentDraft.mockResolvedValue({
      form: {
        incidentDetails: {
          plannedUseOfForce: true,
          authorisedBy: 'Eric Bloodaxe',
        },
      },
    })
    return request(app)
      .get(`/report/1/incident-details`)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Eric Bloodaxe')
        expect(locationService.getIncidentLocations).toHaveBeenCalledWith('user1-system-token', 'current-agency-id')
      })
  })

  test('should preference flash state over persisted data', () => {
    flash.mockReturnValue([{ plannedUseOfForce: true }])
    draftReportService.getCurrentDraft.mockResolvedValue({
      form: {
        incidentDetails: {
          plannedUseOfForce: true,
          authorisedBy: 'Eric Bloodaxe',
        },
      },
    })
    return request(app)
      .get(`/report/1/incident-details`)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).not.toContain('Eric Bloodaxe')
        expect(locationService.getIncidentLocations).toHaveBeenCalledWith('user1-system-token', 'current-agency-id')
      })
  })
  test('should render incident-details using locations for persisted agency if existing report', () => {
    draftReportService.getCurrentDraft.mockResolvedValue({ id: '1', agencyId: 'persisted-agency-id' })
    return request(app)
      .get(`/report/1/incident-details`)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Incident details')
        expect(locationService.getIncidentLocations).toHaveBeenCalledWith('user1-system-token', 'persisted-agency-id')
      })
  })
  test('should redirect to /prison-of-incident if agencyId is TRN', () => {
    draftReportService.getCurrentDraft.mockResolvedValue({ id: '1', agencyId: 'TRN' })
    return request(app)
      .get(`/report/1/incident-details`)
      .expect(302)
      .expect('Location', '/report/1/prison-of-incident')
      .expect(() => {
        expect(locationService.getIncidentLocations).not.toHaveBeenCalled()
      })
  })

  test('should redirect to /prison-of-incident if agencyId is OUT', () => {
    draftReportService.getCurrentDraft.mockResolvedValue({ id: '1', agencyId: 'OUT' })
    return request(app)
      .get(`/report/1/incident-details`)
      .expect(302)
      .expect('Location', '/report/1/prison-of-incident')
      .expect(() => {
        expect(locationService.getIncidentLocations).not.toHaveBeenCalled()
      })
  })
})

describe('POST save and continue /section/form', () => {
  test('should redirect to the staff-involved page', () => {
    draftReportService.getPotentialDuplicates.mockResolvedValue([])

    return request(app)
      .post(`/report/1/incident-details`)
      .send({
        submitType: 'save-and-continue',
        incidentDate: {
          date: yesterday,
          time: { hour: '12', minute: '45' },
        },
        incidentLocationId,
        plannedUseOfForce: 'false',
        witnesses: [{ name: 'User bob' }, { name: '' }],
      })
      .expect(302)
      .expect('Location', '/report/1/staff-involved')
      .expect(() => {
        expect(flash).toHaveBeenCalledTimes(2)
        expect(draftReportService.process).toHaveBeenCalledTimes(1)
        expect(draftReportService.process).toHaveBeenCalledWith(
          user,
          1,
          'incidentDetails',
          {
            incidentLocationId,
            plannedUseOfForce: false,
            witnesses: [{ name: 'User bob' }],
          },
          toDate({ date: yesterday, time: { hour: '12', minute: '45' } }).value
        )
      })
  })

  test('should redirect to the report-may-already-exist page', () => {
    const reports = {
      date: moment(yesterday, 'DDMMYYYY'),
      form: {},
      reporter: 'Harry',
      status: 'SUBMITTED',
    } as undefined

    draftReportService.getPotentialDuplicates.mockResolvedValue([reports])
    return request(app)
      .post(`/report/1/incident-details`)
      .send({
        submitType: 'save-and-continue',
        incidentDate: {
          date: yesterday,
          time: { hour: '12', minute: '45' },
        },
        incidentLocationId,
        plannedUseOfForce: 'false',
      })
      .expect(302)
      .expect('Location', '/report/1/report-may-already-exist?submission=save-and-continue')
  })

  test('Submitting invalid update is not allowed and user redirected to same page', () =>
    request(app)
      .post(`/report/1/incident-details`)
      .send({
        submitType: 'save-and-continue',
        incidentDate: {
          date: yesterday,
          time: { hour: '12', minute: '45' },
        },
        incidentLocationId,
        witnesses: [{ name: 'User bob' }, { name: '' }],
      })
      .expect(302)
      .expect('Location', '/report/1/incident-details')
      .expect(() => {
        expect(draftReportService.process).not.toHaveBeenCalled()
      }))
})

describe('POST save and return to tasklist', () => {
  test('successfully submit valid update', () => {
    return request(app)
      .post(`/report/1/incident-details`)
      .send({
        submitType: 'save-and-return',
        incidentDate: { date: yesterday, time: { hour: '12', minute: '45' } },
        incidentLocationId,
        plannedUseOfForce: 'true',
        witnesses: [{ name: 'User bob' }, { name: '' }],
      })
      .expect(302)
      .expect('Location', '/report/1/report-use-of-force')
      .expect(() => {
        expect(draftReportService.process).toHaveBeenCalledTimes(1)
        expect(draftReportService.process).toHaveBeenCalledWith(
          user,
          1,
          'incidentDetails',
          {
            incidentLocationId,
            plannedUseOfForce: true,
            witnesses: [{ name: 'User bob' }],
          },
          toDate({ date: yesterday, time: { hour: '12', minute: '45' } }).value
        )
      })
  })

  test('successfully submit change prison', () => {
    return request(app)
      .post(`/report/1/incident-details`)
      .send({
        submitType: 'save-and-change-prison',
        incidentDate: {
          date: yesterday,
          time: { hour: '12', minute: '45' },
        },
        incidentLocationId,
        plannedUseOfForce: 'true',
        witnesses: [{ name: 'User bob' }, { name: '' }],
      })
      .expect(302)
      .expect('Location', '/report/1/prison-of-incident')
      .expect(() => {
        expect(flash).toHaveBeenCalledTimes(1)
        expect(draftReportService.getPotentialDuplicates).not.toHaveBeenCalled()
        expect(draftReportService.process).toHaveBeenCalledTimes(1)
        expect(draftReportService.process).toHaveBeenCalledWith(
          user,
          1,
          'incidentDetails',
          {
            incidentLocationId,
            plannedUseOfForce: true,
            witnesses: [{ name: 'User bob' }],
          },
          toDate({ date: yesterday, time: { hour: '12', minute: '45' } }).value
        )
      })
  })

  test('Submitting partial update is allowed', () => {
    return request(app)
      .post(`/report/1/incident-details`)
      .send({
        submitType: 'save-and-return',
        incidentDate: {
          date: yesterday,
          time: { hour: '12', minute: '45' },
        },
        incidentLocationId,
        witnesses: [{ name: 'User bob' }, { name: '' }],
      })
      .expect(302)
      .expect('Location', '/report/1/report-use-of-force')
      .expect(() => {
        expect(draftReportService.process).toHaveBeenCalledTimes(1)
        expect(draftReportService.process).toHaveBeenCalledWith(
          user,
          1,
          'incidentDetails',
          {
            incidentLocationId,
            witnesses: [{ name: 'User bob' }],
          },
          toDate({ date: yesterday, time: { hour: '12', minute: '45' } }).value
        )
      })
  })

  test('Submitting an update to a draft report without an incident date is allowed', () => {
    return request(app)
      .post(`/report/1/incident-details`)
      .send({
        submitType: 'save-and-return',
        incidentLocationId,
        witnesses: [{ name: 'User bob' }, { name: '' }],
      })
      .expect(302)
      .expect('Location', '/report/1/report-use-of-force')
      .expect(() => {
        expect(draftReportService.process).toHaveBeenCalledTimes(1)
        expect(draftReportService.process).toHaveBeenCalledWith(
          user,
          1,
          'incidentDetails',
          {
            incidentLocationId,
            witnesses: [{ name: 'User bob' }],
          },
          null
        )
      })
  })

  test('Submitting bad data is rejected', () =>
    request(app)
      .post(`/report/1/incident-details`)
      .send({
        submitType: 'save-and-return',
        incidentDate: {
          date: yesterday,
          time: { hour: '12', minute: '45' },
        },
        witnesses: [{ name: '$% bob' }, { name: '' }],
      })
      .expect(302)
      .expect('Location', `/report/1/incident-details`))
})

describe('POST save and return to check-your-answers', () => {
  test('aa successfully submit valid update', () => {
    draftReportService.isDraftComplete.mockResolvedValue(true)
    return request(app)
      .post(`/report/1/incident-details`)
      .send({
        submitType: 'save-and-continue',
        incidentDate: { date: yesterday, time: { hour: '12', minute: '45' } },
        incidentLocationId,
        plannedUseOfForce: 'true',
        authorisedBy: 'Eric Bloodaxe',
        witnesses: [{ name: 'User bob' }, { name: '' }],
      })
      .expect(302)
      .expect('Location', '/report/1/check-your-answers')
      .expect(() => {
        expect(draftReportService.process).toHaveBeenCalledTimes(1)
        expect(draftReportService.process).toHaveBeenCalledWith(
          user,
          1,
          'incidentDetails',
          {
            incidentLocationId,
            plannedUseOfForce: true,
            authorisedBy: 'Eric Bloodaxe',
            witnesses: [{ name: 'User bob' }],
          },
          toDate({ date: yesterday, time: { hour: '12', minute: '45' } }).value
        )
      })
  })

  test('Submitting invalid update is not allowed', () => {
    draftReportService.isDraftComplete.mockResolvedValue(true)
    return request(app)
      .post(`/report/1/incident-details`)
      .send({
        submitType: 'save-and-continue',
        incidentLocationId,
        witnesses: [{ name: 'User bob' }, { name: '' }],
      })
      .expect(302)
      .expect('Location', '/report/1/incident-details')
      .expect(() => {
        expect(draftReportService.process).not.toHaveBeenCalled()
      })
  })
})
