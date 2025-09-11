import request from 'supertest'
import { PrisonLocation, Prison } from '../../data/prisonClientTypes'
import { Report, ReportEdit } from '../../data/incidentClientTypes'
import { paths } from '../../config/incident'
import { InvolvedStaffService } from '../../services/involvedStaffService'
import { appWithAllRoutes, user, reviewerUser, coordinatorUser } from '../__test/appSetup'
import ReportService from '../../services/reportService'
import OffenderService from '../../services/offenderService'
import ReviewService, { ReviewerStatementWithComments } from '../../services/reviewService'
import UserService from '../../services/userService'
import StatementService from '../../services/statementService'
import AuthService from '../../services/authService'
import LocationService from '../../services/locationService'
import ReportDetailBuilder, { ReportDetail } from '../../services/reportDetailBuilder'
import ReportEditService from '../../services/reportEditService'

import config from '../../config'
import logger from '../../../log'

config.featureFlagReportEditingEnabled = true

jest.mock('../../services/authService')
jest.mock('../../services/offenderService')
jest.mock('../../services/reportService')
jest.mock('../../services/involvedStaffService')
jest.mock('../../services/reviewService')
jest.mock('../../services/userService')
jest.mock('../../services/statementService')
jest.mock('../../services/locationService')
jest.mock('../../services/reportDetailBuilder')
jest.mock('../../services/reportEditService')
jest.mock('../../../log')

const offenderService = new OffenderService(null, null) as jest.Mocked<OffenderService>
const reportService = new ReportService(null, null, null, null, null, null) as jest.Mocked<ReportService>
const involvedStaffService = new InvolvedStaffService(null, null, null, null, null) as jest.Mocked<InvolvedStaffService>
const reviewService = new ReviewService(null, null, null, null, null) as jest.Mocked<ReviewService>
const userService = new UserService(null, null) as jest.Mocked<UserService>
const statementService = new StatementService(null, null, null) as jest.Mocked<StatementService>
const authService = new AuthService(null) as jest.Mocked<AuthService>
const locationService = new LocationService(null, null) as jest.Mocked<LocationService>
const reportDetailBuilder = new ReportDetailBuilder(null, null, null, null, null) as jest.Mocked<ReportDetailBuilder>
const reportEditService = new ReportEditService(null, null, null, null, null) as jest.Mocked<ReportEditService>
const userSupplier = jest.fn()

let app
const flash = jest.fn()

const basicPersistedReport = {
  incidentDate: new Date('2025-05-12T10:00:00'),
  agencyId: 'WRI',
  bookingId: 123456,
  form: {
    incidentDetails: {
      witnesses: [
        {
          name: 'jimmy',
        },
        {
          name: 'another person',
        },
      ],
      plannedUseOfForce: false,
      incidentLocationId: 'aaaa-2222',
    },
    relocationAndInjuries: {
      f213CompletedBy: 'Mr Fowler',
      prisonerInjuries: true,
      healthcareInvolved: true,
      prisonerRelocation: 'OWN_CELL',
      relocationCompliancy: true,
      staffMedicalAttention: true,
      prisonerHospitalisation: true,
      healthcarePractionerName: 'Dr Harold',
      staffNeedingMedicalAttention: [
        {
          name: 'Tony',
          hospitalisation: false,
        },
        {
          name: 'John',
          hospitalisation: true,
        },
      ],
    },
  },
}

const reportDetailBuilderResponse = {
  incidentId: 1,
  reporterName: 'Staff Member',
  submittedDate: new Date('2025-05-13T10:00:00'),
  bookingId: null,
  offenderDetail: {},
  useOfForceDetails: {},
  relocationAndInjuries: {},
  evidence: {},
  incidentDetails: {
    incidentDate: new Date('2025-05-12T10:00:00'),
    offenderName: 'Joe Bloggs',
    prison: {
      agencyId: 'NMI',
      description: 'Nottingham (HMP)',
      longDescription: 'HMP NOTTINGHAM',
      agencyType: 'INST',
      active: true,
    },
  },
}

const locations = [
  {
    incidentLocationId: 'abcd-1111',
    description: 'RES-AWING-ONE',
    agencyId: 'NMI',
    locationPrefix: 'NMI-RES-AWING-TWO',
    userDescription: 'Room 1',
  },
  {
    incidentLocationId: 'abcd-2222',
    description: 'RES-AWING-TWO',
    agencyId: 'NMI',
    locationPrefix: 'NMI-RES-AWING-TWO',
    userDescription: 'Room 2',
  },
]

describe('coordinator', () => {
  beforeEach(() => {
    flash.mockReturnValue([])
    authService.getSystemClientToken.mockResolvedValue('user1-system-token')
    userSupplier.mockReturnValue(coordinatorUser)
    reviewService.getReport.mockResolvedValue(basicPersistedReport as unknown as Report)
    reportDetailBuilder.build.mockResolvedValue(reportDetailBuilderResponse as ReportDetail)
    locationService.getIncidentLocations.mockResolvedValue(locations as PrisonLocation[])
    reviewService.getReportEdits.mockResolvedValue([] as ReportEdit[])
    reviewService.getStatements.mockResolvedValue([] as ReviewerStatementWithComments[])
    locationService.getPrisonById.mockResolvedValue({} as Prison)
    reportEditService.constructChangesToView.mockResolvedValue([])
    reportEditService.validateReasonForChangeInput.mockReturnValue([])
    offenderService.getOffenderDetails.mockResolvedValue({ status: 'Acive' })
    reportEditService.compareEditsWithReport.mockResolvedValue({
      oldValue: 123,
      newValue: 345,
      hasChanged: true,
    } as never)

    app = appWithAllRoutes(
      {
        involvedStaffService,
        reportService,
        offenderService,
        reviewService,
        userService,
        statementService,
        authService,
        locationService,
        reportDetailBuilder,
        reportEditService,
      },
      userSupplier,
      false,
      flash
    )
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('viewEditReport', () => {
    it('should allow coordinator to access page', async () => {
      userSupplier.mockReturnValue(coordinatorUser)
      await request(app).get('/1/edit-report').expect(200).expect('Content-Type', 'text/html; charset=utf-8')
    })

    it('should not allow reviewer to access page', async () => {
      userSupplier.mockReturnValue(reviewerUser)
      await request(app)
        .get('/1/edit-report')
        .expect(401)
        .expect(res => {
          expect(res.text).toContain('Not authorised to access this resource')
        })
    })

    it('should not allow user (i.e not coordinator) to access page', async () => {
      userSupplier.mockReturnValue(user)
      await request(app)
        .get('/1/edit-report')
        .expect(401)
        .expect(res => {
          expect(res.text).toContain('Not authorised to access this resource')
        })
    })

    it('should render essential page structure', async () => {
      await request(app)
        .get('/1/edit-report')
        .expect(200)
        .expect('Content-Type', 'text/html; charset=utf-8')
        .expect(res => {
          expect(res.text).toContain('Edit Use of force report 1')
          expect(res.text).toContain('Return to use of force incident')
          expect(res.text).toContain('Report details')
          expect(res.text).toContain('Incident details')
          expect(res.text).toContain('Staff involved')
          expect(res.text).toContain('Use of force details')
          expect(res.text).toContain('Relocation and injuries')
          expect(res.text).toContain('Evidence')
          expect(res.text).toContain('Print report and statements')
          expect(res.text).not.toContain('Back')
        })
    })
  })

  describe('viewEditIncidentDetails', () => {
    it('should render page', async () => {
      await request(app)
        .get('/1/edit-report/incident-details')
        .expect(200)
        .expect('Content-Type', 'text/html; charset=utf-8')
        .expect(res => {
          expect(res.text).toContain('Back')
          expect(res.text).toContain('Status') // check that prisoner profile is displayed
          expect(res.text).toContain('Incident details')
          expect(res.text).toContain('Continue')
          expect(res.text).toContain('Cancel')
          expect(res.text).toContain('/1/edit-report')
          expect(res.text).not.toContain('Save and return to report use of force')
          expect(res.text).not.toContain('check-your-answers')
          expect(res.text).not.toContain('Print report and statements')
          expect(res.text).toContain('Back')
          expect(reviewService.getReport).toHaveBeenCalledWith(1)
          expect(locationService.getIncidentLocations).toHaveBeenCalledWith('user1-system-token', 'WRI')
          expect(reportDetailBuilder.build).toHaveBeenCalledWith('user1', basicPersistedReport)
          expect(flash).toHaveBeenCalledWith('reportId')
          expect(flash).toHaveBeenCalledWith('errors')
        })
    })

    it('should render error messages when partial data submitted', async () => {
      flash.mockReturnValue([
        {
          text: 'Select the location of the incident',
          href: '#incidentLocationId',
        },
        {
          text: 'Select yes if the use of force was planned',
          href: '#plannedUseOfForce',
        },
      ])

      await request(app)
        .get('/1/edit-report/incident-details')
        .expect(200)
        .expect('Content-Type', 'text/html; charset=utf-8')
        .expect(res => {
          expect(res.text).toContain('There is a problem')
          expect(res.text).toContain('Select the location of the incident')
          expect(res.text).toContain('Select yes if the use of force was planned')
        })
    })

    it('should get new prison and location details when prison has changed', async () => {
      await request(app)
        .get('/1/edit-report/incident-details?new-prison=WRI')
        .expect(200)
        .expect('Content-Type', 'text/html; charset=utf-8')
        .expect(res => {
          expect(locationService.getPrisonById).toHaveBeenCalledWith('user1-system-token', 'WRI')
          expect(locationService.getIncidentLocations).toHaveBeenCalledWith('user1-system-token', 'WRI')
        })
    })

    it('should log error if new prison not recognised (eg if user manually changed query string)', async () => {
      locationService.getPrisonById.mockRejectedValue(new Error('an error occurred'))
      await request(app)
        .get('/1/edit-report/incident-details?new-prison=XYZ')
        .expect(200)
        .expect('Content-Type', 'text/html; charset=utf-8')
        .expect(res => {
          expect(logger.error).toHaveBeenCalledWith('User attempted to obtain details for prison XYZ')
        })
    })
  })

  describe('submitEditIncidentDetails', () => {
    it('should get the correct current report', async () => {
      await request(app)
        .post('/1/edit-report/incident-details')
        .expect(() => {
          expect(reviewService.getReport).toHaveBeenCalledWith(1)
        })
    })

    it('Validation error redirects back to current page with errors when no data in request body', async () => {
      await request(app)
        .post('/1/edit-report/incident-details')
        .send({})
        .expect(302)
        .expect('Location', '/1/edit-report/incident-details')
        .expect(res => {
          expect(flash).toHaveBeenCalledWith('reportId')
          expect(flash).toHaveBeenCalledWith('reportId', '1')
          expect(flash).toHaveBeenCalledWith('errors', [
            { href: '#incidentLocationId', text: 'Select the location of the incident' },
            { href: '#plannedUseOfForce', text: 'Select yes if the use of force was planned' },
          ])
        })
    })

    it('Validation error redirects back to current page with errors when no change in request body and persisted report', async () => {
      const body = {
        newAgencyId: 'WRI',
        incidentDate: {
          date: '12/05/2025',
          time: {
            hour: '10',
            minute: '00',
          },
        },
        incidentLocationId: 'aaaa-2222',
        plannedUseOfForce: 'false',
        witnesses: [
          {
            name: 'jimmy',
          },
          {
            name: 'another person',
          },
        ],
        submitType: 'continue-coordinator-edit',
      }
      const comparison = {
        anyKey: {
          oldValue: '123',
          newValue: '123',
          hasChanged: false,
        },
      }
      reportEditService.compareEditsWithReport.mockReturnValue(comparison)

      await request(app)
        .post('/1/edit-report/incident-details')
        .send(body)
        .expect(302)
        .expect('Location', 'incident-details')
        .expect(res => {
          expect(flash).toHaveBeenCalledWith('reportId')
          expect(flash).toHaveBeenCalledWith('reportId', '1')
          expect(flash).toHaveBeenCalledWith('pageInput')
        })
    })

    it('Should continue to next page', async () => {
      reviewService.getReport.mockResolvedValue(basicPersistedReport as unknown as Report)

      const incidentDetailsBody = {
        newAgencyId: '',
        incidentDate: {
          date: '22/05/2025',
          time: {
            hour: '02',
            minute: '10',
          },
        },
        incidentLocationId: 'aaaa-2222',
        plannedUseOfForce: 'false',
        authorisedBy: '',
        witnesses: [],
        submitType: 'continue-coordinator-edit',
      }
      const comparisonResult = {
        incidentDate: {
          newValue: new Date('2025-05-22T02:10:00'),
          oldValue: new Date('2025-05-12T10:00:00'),
          hasChanged: true,
        },
        agencyId: {
          oldValue: 'WRI',
          newValue: '',
          hasChanged: false,
        },
        incidentLocation: {
          oldValue: 'aaaa-2222',
          newValue: 'aaaa-2222',
          hasChanged: false,
        },
        plannedUseOfForce: {
          oldValue: false,
          newValue: 'false',
          hasChanged: false,
        },
        authorisedBy: {
          oldValue: undefined,
          newValue: '',
          hasChanged: false,
        },
        witnesses: {
          oldValue: [
            {
              name: 'jimmy',
            },
            {
              name: 'another person',
            },
          ],
          newValue: [],
          hasChanged: false,
        },
      }

      reportEditService.compareEditsWithReport.mockReturnValue(comparisonResult)

      await request(app)
        .post('/1/edit-report/incident-details')
        .send(incidentDetailsBody)
        .expect(302)
        .expect('Location', 'reason-for-change')
        .expect(() => {
          expect(flash).toHaveBeenCalledWith('reportId')
          expect(flash).toHaveBeenCalledWith('reportId', '1')
          expect(flash).toHaveBeenCalledWith('inputsForEditIncidentDetails', {
            incidentDate: {
              date: '22/05/2025',
              time: {
                hour: '02',
                minute: '10',
              },
              value: new Date('2025-05-22T02:10:00'),
            },
            incidentLocationId: 'aaaa-2222',
            plannedUseOfForce: false,
            reportId: '1',
          })
          expect(flash).toHaveBeenCalledWith('sectionDetails')
          expect(flash).toHaveBeenCalledWith('sectionDetails', {
            text: 'the incident details',
            section: 'incidentDetails',
          })
          expect(flash).toHaveBeenCalledWith('backlinkHref')
          expect(flash).toHaveBeenCalledWith('backlinkHref', 'incident-details')
        })
    })
  })

  describe('viewEditRelocationAndInjuries', () => {
    it('should render page', async () => {
      await request(app)
        .get('/1/edit-report/relocation-and-injuries')
        .expect(200)
        .expect('Content-Type', 'text/html; charset=utf-8')
        .expect(res => {
          expect(res.text).toContain('Back')
          expect(res.text).toContain('Status') // check that prisoner profile is displayed
          expect(res.text).toContain('Relocation and injuries')
          expect(res.text).toContain('Continue')
          expect(res.text).toContain('Cancel')
          expect(res.text).toContain('/1/edit-report')
          expect(res.text).not.toContain('Save and return to report use of force')
          expect(res.text).not.toContain('check-your-answers')
          expect(res.text).not.toContain('Print report and statements')
          expect(reviewService.getReport).toHaveBeenCalledWith(1)
          expect(flash).toHaveBeenCalledWith('reportId')
          expect(flash).toHaveBeenCalledWith('errors')
        })
    })

    it('should call upstream service correctly', async () => {
      await request(app)
        .get('/1/edit-report/relocation-and-injuries')
        .expect(200)
        .expect('Content-Type', 'text/html; charset=utf-8')
        .expect(res => {
          expect(offenderService.getOffenderDetails).toHaveBeenCalledWith(123456, 'user1')
        })
    })

    it('should render error messages when partial data submitted', async () => {
      flash.mockReturnValue([
        {
          text: 'Select the type of relocation',
          href: '#relocationType',
        },
        {
          text: 'Enter the name of the member of healthcare',
          href: '#healthcarePractionerName',
        },
        {
          text: 'Enter the name of who needed medical attention',
          href: '#staffNeedingMedicalAttention[0][name]',
        },
      ])

      await request(app)
        .get('/1/edit-report/relocation-and-injuries')
        .expect(200)
        .expect('Content-Type', 'text/html; charset=utf-8')
        .expect(res => {
          expect(res.text).toContain('There is a problem')
          expect(res.text).toContain('Select the type of relocation')
          expect(res.text).toContain('Enter the name of the member of healthcare')
          expect(res.text).toContain('Enter the name of who needed medical attention')
        })
    })

    it('should return the users new input rather than the saved report data', async () => {
      flash.mockReturnValueOnce([])
      flash.mockReturnValueOnce(['1'])
      flash.mockReturnValueOnce([
        {
          prisonerRelocation: 'OTHER_CELL',
          relocationCompliancy: false,
          f213CompletedBy: 'Mr Fowler',
          prisonerInjuries: true,
          healthcareInvolved: true,
          healthcarePractionerName: 'Dr Jones',
          prisonerHospitalisation: true,
          staffMedicalAttention: false,
          reportId: '1',
        },
      ])

      await request(app)
        .get('/1/edit-report/relocation-and-injuries')
        .expect(200)
        .expect('Content-Type', 'text/html; charset=utf-8')
        .expect(res => {
          expect(res.text).toContain('Dr Jones')
          expect(res.text).toContain('Other')
        })
    })
  })

  describe('submitEditRelocationAndInjuries', () => {
    it('should render page', async () => {
      await request(app)
        .get('/1/edit-report/relocation-and-injuries')
        .expect(200)
        .expect('Content-Type', 'text/html; charset=utf-8')
        .expect(res => {
          expect(res.text).toContain('Back')
          expect(res.text).toContain('Status') // check that prisoner profile is displayed
          expect(res.text).toContain('Relocation and injuries')
          expect(res.text).toContain('Continue')
          expect(res.text).toContain('Cancel')
          expect(res.text).toContain('/1/edit-report')
          expect(res.text).not.toContain('Save and return to report use of force')
          expect(res.text).not.toContain('check-your-answers')
          expect(res.text).not.toContain('Print report and statements')
          expect(reviewService.getReport).toHaveBeenCalledWith(1)
          expect(flash).toHaveBeenCalledWith('reportId')
          expect(flash).toHaveBeenCalledWith('errors')
        })
    })

    it('should call upstream service correctly', async () => {
      await request(app)
        .get('/1/edit-report/relocation-and-injuries')
        .expect(200)
        .expect('Content-Type', 'text/html; charset=utf-8')
        .expect(res => {
          expect(offenderService.getOffenderDetails).toHaveBeenCalledWith(123456, 'user1')
        })
    })

    it('should render error messages when partial data submitted', async () => {
      flash.mockReturnValue([
        {
          text: 'Select the type of relocation',
          href: '#relocationType',
        },
        {
          text: 'Enter the name of the member of healthcare',
          href: '#healthcarePractionerName',
        },
        {
          text: 'Enter the name of who needed medical attention',
          href: '#staffNeedingMedicalAttention[0][name]',
        },
      ])

      await request(app)
        .get('/1/edit-report/relocation-and-injuries')
        .expect(200)
        .expect('Content-Type', 'text/html; charset=utf-8')
        .expect(res => {
          expect(res.text).toContain('There is a problem')
          expect(res.text).toContain('Select the type of relocation')
          expect(res.text).toContain('Enter the name of the member of healthcare')
          expect(res.text).toContain('Enter the name of who needed medical attention')
        })
    })

    it('redirects to current page when no difference between request body and persisted report', async () => {
      const body = {
        prisonerRelocation: 'OWN_CELL',
        relocationCompliancy: 'true',
        userSpecifiedRelocationType: '',
        f213CompletedBy: 'Mr Fowler',
        prisonerInjuries: 'true',
        healthcareInvolved: 'true',
        healthcarePractionerName: 'Dr Harold',
        prisonerHospitalisation: 'true',
        staffMedicalAttention: 'true',
        staffNeedingMedicalAttention: [
          {
            name: 'Tony',
            hospitalisation: 'false',
          },
          {
            name: 'John',
            hospitalisation: 'true',
          },
        ],
      }

      reviewService.getReport.mockResolvedValue(basicPersistedReport as unknown as Report)

      await request(app)
        .post('/1/edit-report/relocation-and-injuries')
        .send(body)
        .expect(302)
        .expect('Location', 'relocation-and-injuries')
        .expect(res => {
          expect(flash).toHaveBeenCalledWith('reportId')
          expect(flash).toHaveBeenCalledWith('reportId', '1')
          expect(flash).toHaveBeenCalledWith('inputsForEditRelocationAndInjuries', {
            ...basicPersistedReport.form.relocationAndInjuries,
            reportId: '1',
          })
        })
    })

    it('Should continue to next page', async () => {
      reviewService.getReport.mockResolvedValue(basicPersistedReport as unknown as Report)

      const relocationInjuriesAndInjuriesBody = {
        prisonerRelocation: 'OWN_CELL',
        relocationCompliancy: 'true',
        userSpecifiedRelocationType: '',
        f213CompletedBy: 'Mr Fowler',
        prisonerInjuries: 'true',
        healthcareInvolved: 'true',
        healthcarePractionerName: 'Dr Harold',
        prisonerHospitalisation: 'true',
        staffMedicalAttention: 'true',
        staffNeedingMedicalAttention: [
          {
            name: 'Tony',
            hospitalisation: 'false',
          },
          {
            name: 'John',
            hospitalisation: 'true',
          },
          {
            name: 'Harry',
            hospitalisation: 'false',
          },
        ],
      }

      reportEditService.compareEditsWithReport.mockReturnValue({
        staffNeedingMedicalAttention: {
          question: 'Name of who needed medical attention',
          oldValue: [
            {
              name: 'Tony',
              hospitalisation: false,
            },
            {
              name: 'John',
              hospitalisation: true,
            },
          ],
          newValue: [
            {
              name: 'Tony',
              hospitalisation: false,
            },
            {
              name: 'John',
              hospitalisation: true,
            },
            {
              name: 'Harry',
              hospitalisation: false,
            },
          ],
          hasChanged: true,
        },
      } as never)

      reportEditService.removeHasChangedKey.mockReturnValue({
        staffNeedingMedicalAttention: {
          question: 'Name of who needed medical attention',
          oldValue: [
            {
              name: 'Tony',
              hospitalisation: false,
            },
            {
              name: 'John',
              hospitalisation: true,
            },
          ],
          newValue: [
            {
              name: 'Tony',
              hospitalisation: false,
            },
            {
              name: 'John',
              hospitalisation: true,
            },
            {
              name: 'Harry',
              hospitalisation: false,
            },
          ],
        },
      } as never)

      await request(app)
        .post('/1/edit-report/relocation-and-injuries')
        .send(relocationInjuriesAndInjuriesBody)
        .expect(302)
        .expect('Location', 'reason-for-change')
        .expect(() => {
          expect(flash).toHaveBeenCalledWith('reportId')
          expect(flash).toHaveBeenCalledWith('reportId', '1')
          expect(flash).toHaveBeenCalledWith('inputsForEditRelocationAndInjuries', {
            ...basicPersistedReport.form.relocationAndInjuries,
            reportId: '1',
            staffNeedingMedicalAttention: [
              { hospitalisation: false, name: 'Tony' },
              { hospitalisation: true, name: 'John' },
              { hospitalisation: false, name: 'Harry' },
            ],
          })
          expect(flash).toHaveBeenCalledWith('sectionDetails')
          expect(flash).toHaveBeenCalledWith('sectionDetails', {
            text: 'relocation and injuries',
            section: 'relocationAndInjuries',
          })
          expect(flash).toHaveBeenCalledWith('backlinkHref')
          expect(flash).toHaveBeenCalledWith('backlinkHref', 'relocation-and-injuries')
        })
    })
  })
  describe('viewReasonForChange', () => {
    it('should render page', async () => {
      flash.mockReturnValueOnce([])
      flash.mockReturnValueOnce([
        {
          text: 'the incident details',
          section: 'incidentDetails',
        },
      ])
      flash.mockReturnValueOnce([{}])
      flash.mockReturnValueOnce([])
      reportEditService.constructChangesToView.mockResolvedValue([])
      await request(app)
        .get('/1/edit-report/reason-for-change')
        .expect(200)
        .expect('Content-Type', 'text/html; charset=utf-8')
        .expect(res => {
          expect(res.text).toContain('Back')
          expect(res.text).toContain('Status') // check that prisoner profile is displayed
          expect(res.text).toContain('Reason for changing the incident details')
          expect(res.text).toContain('Save change')
          expect(res.text).toContain('Cancel')
          expect(res.text).toContain('Changes you are making')
          expect(res.text).toContain('Why are you changing the incident details?')
          expect(res.text).toContain('Somebody reported an error in the report')
          expect(res.text).toContain('Something was missing from the report')
          expect(res.text).toContain('New evidence emerged after the report was submitted')
          expect(res.text).toContain('Another reason')
          expect(res.text).toContain('Add additional information to explain this change')
          expect(reportEditService.constructChangesToView).toHaveBeenCalledWith(
            'user1',
            { section: 'incidentDetails', text: 'the incident details' },
            {}
          )
        })
    })
    it('should render the required edits, changing booleans to Yes or No', async () => {
      flash.mockReturnValueOnce([])
      flash.mockReturnValueOnce([
        {
          text: 'the incident details',
          section: 'incidentDetails',
        },
      ])
      flash.mockReturnValueOnce([{}])
      flash.mockReturnValueOnce([
        {
          plannedUseOfForce: {
            oldValue: false,
            newValue: 'true',
            hasChanged: true,
          },
          authorisedBy: {
            newValue: 'Joe bloggs',
            hasChanged: true,
          },
        },
      ])

      reportEditService.constructChangesToView.mockResolvedValue([
        {
          question: 'Was use of force planned',
          oldValue: false,
          newValue: 'true',
        },
        {
          question: 'Who authorised use of force',
          oldValue: undefined,
          newValue: 'Joe bloggs',
        },
      ])

      await request(app)
        .get('/1/edit-report/reason-for-change')
        .expect(200)
        .expect('Content-Type', 'text/html; charset=utf-8')
        .expect(res => {
          expect(res.text).toContain('Joe bloggs')
          expect(res.text).toContain('Yes')
          expect(res.text).toContain('No')
        })
    })
    it('should render correct error when no radio button is selected', async () => {
      flash.mockReturnValueOnce([
        {
          href: '#reason',
          text: 'Select the reason for changing the incident details',
        },
      ])
      flash.mockReturnValueOnce([
        {
          text: 'the incident details',
          section: 'incidentDetails',
        },
      ])
      flash.mockReturnValueOnce([{}])
      flash.mockReturnValueOnce([])
      reportEditService.constructChangesToView.mockResolvedValue([])

      await request(app)
        .get('/1/edit-report/reason-for-change')
        .expect(200)
        .expect('Content-Type', 'text/html; charset=utf-8')
        .expect(res => {
          expect(res.text).toContain('There is a problem')
          expect(res.text).toContain('Select the reason for changing the incident details')
        })
    })

    it('should render correct error when Another reason radio selected but no reason ext entered', async () => {
      flash.mockReturnValueOnce([
        {
          href: '#anotherReasonForEdit',
          text: 'Please specify the reason',
        },
      ])
      flash.mockReturnValueOnce([
        {
          text: 'the incident details',
          section: 'incidentDetails',
        },
      ])
      flash.mockReturnValueOnce([{}])
      flash.mockReturnValueOnce([])
      reportEditService.constructChangesToView.mockResolvedValue([])

      await request(app)
        .get('/1/edit-report/reason-for-change')
        .expect(200)
        .expect('Content-Type', 'text/html; charset=utf-8')
        .expect(res => {
          expect(res.text).toContain('There is a problem')
          expect(res.text).toContain('Please specify the reason')
        })
    })
  })

  describe('submitReasonForChange', () => {
    it('should render reason-for-change page', async () => {
      flash.mockReturnValueOnce([])
      flash.mockReturnValueOnce([
        {
          text: 'the incident details',
          section: 'incidentDetails',
        },
      ])
      flash.mockReturnValueOnce([{}])
      flash.mockReturnValueOnce([])
      reportEditService.constructChangesToView.mockResolvedValue([])
      await request(app)
        .get('/1/edit-report/reason-for-change')
        .expect(200)
        .expect('Content-Type', 'text/html; charset=utf-8')
        .expect(res => {
          expect(res.text).toContain('Reason for changing the incident details')
          expect(res.text).toContain('Save change')
          expect(res.text).toContain('Cancel')
          expect(res.text).toContain('Changes you are making')
          expect(res.text).toContain('Why are you changing the incident details?')
          expect(res.text).toContain('Somebody reported an error in the report')
          expect(res.text).toContain('Something was missing from the report')
          expect(res.text).toContain('New evidence emerged after the report was submitted')
          expect(res.text).toContain('Another reason')
          expect(res.text).toContain('Add additional information to explain this change')
          expect(reportEditService.constructChangesToView).toHaveBeenCalledWith(
            'user1',
            { section: 'incidentDetails', text: 'the incident details' },
            {}
          )
        })
    })

    it('should display the changes, replacing booleans with Yes or No', async () => {
      flash.mockReturnValueOnce([])
      flash.mockReturnValueOnce([
        {
          text: 'the incident details',
          section: 'incidentDetails',
        },
      ])
      flash.mockReturnValueOnce([{}])
      flash.mockReturnValueOnce([
        {
          plannedUseOfForce: {
            oldValue: false,
            newValue: 'true',
            hasChanged: true,
          },
          authorisedBy: {
            newValue: 'Joe bloggs',
            hasChanged: true,
          },
        },
      ])

      reportEditService.constructChangesToView.mockResolvedValue([
        {
          question: 'Was use of force planned',
          oldValue: false,
          newValue: 'true',
        },
        {
          question: 'Who authorised use of force',
          oldValue: undefined,
          newValue: 'Joe bloggs',
        },
      ])

      await request(app)
        .get('/1/edit-report/reason-for-change')
        .expect(200)
        .expect('Content-Type', 'text/html; charset=utf-8')
        .expect(res => {
          expect(res.text).toContain('Joe bloggs')
          expect(res.text).toContain('Yes')
          expect(res.text).toContain('No')
        })
    })

    it('should display correct error when no radio button is selected', async () => {
      flash.mockReturnValueOnce([
        {
          href: '#reason',
          text: 'Select the reason for changing the incident details',
        },
      ])
      flash.mockReturnValueOnce([
        {
          text: 'the incident details',
          section: 'incidentDetails',
        },
      ])
      flash.mockReturnValueOnce([{}])
      flash.mockReturnValueOnce([])

      reportEditService.constructChangesToView.mockResolvedValue([])

      await request(app)
        .get('/1/edit-report/reason-for-change')
        .expect(200)
        .expect('Content-Type', 'text/html; charset=utf-8')
        .expect(res => {
          expect(res.text).toContain('There is a problem')
          expect(res.text).toContain('Select the reason for changing the incident details')
        })
    })

    it("should display correct error when 'Another reason' radio selected but no text entered", async () => {
      flash.mockReturnValueOnce([
        {
          href: '#anotherReasonForEdit',
          text: 'Please specify the reason',
        },
      ])
      flash.mockReturnValueOnce([
        {
          text: 'the incident details',
          section: 'incidentDetails',
        },
      ])
      flash.mockReturnValueOnce([{}])
      flash.mockReturnValueOnce([])
      reportEditService.constructChangesToView.mockResolvedValue([])

      await request(app)
        .get('/1/edit-report/reason-for-change')
        .expect(200)
        .expect('Content-Type', 'text/html; charset=utf-8')
        .expect(res => {
          expect(res.text).toContain('There is a problem')
          expect(res.text).toContain('Please specify the reason')
        })
    })

    it('Successful submit redirects to correct page', async () => {
      flash.mockReturnValueOnce([
        {
          text: 'the incident details',
          section: 'incidentDetails',
        },
      ])

      await request(app)
        .post('/1/edit-report/reason-for-change')
        .send({ reason: 'someReason', reasonText: 'Some text', reasonAdditionalInfo: 'Some addiitonal text' })
        .expect(302)
        .expect('Location', '/1/view-incident')
        .expect(() => {
          expect(reportEditService.validateReasonForChangeInput).toHaveBeenCalledWith({
            reason: 'someReason',
            reasonText: 'Some text',
            reportSection: { section: 'incidentDetails', text: 'the incident details' },
          })
          expect(reportEditService.persistChanges).toHaveBeenCalledWith(
            {
              activeCaseLoadId: 'LEI',
              displayName: 'First Last',
              firstName: 'first',
              isAdmin: false,
              isCoordinator: true,
              isReviewer: true,
              lastName: 'last',
              token: 'token',
              userId: 'id',
              username: 'user1',
            },
            {
              changes: [],
              pageInput: [],
              reason: 'someReason',
              reasonAdditionalInfo: 'Some addiitonal text',
              reasonText: 'Some text',
              reportId: '1',
              reportSection: { section: 'incidentDetails', text: 'the incident details' },
            }
          )
        })
    })

    it('should log and throw error when persistChanges fails', async () => {
      reportEditService.persistChanges.mockRejectedValueOnce(new Error('Something failed'))
      const res = await request(app)
        .post('/1/edit-report/reason-for-change')
        .send({ reason: 'someReason', reasonText: 'Some text', reasonAdditionalInfo: 'Some additional text' })

      expect(res.status).toBe(500)
      expect(res.text).toContain('Error')

      expect(logger.error).toHaveBeenCalledWith('Could not persist changes for reportId 1', expect.any(Error))
    })
  })

  // all the below are existing tests and will be changed in the future
  describe('Delete statement', () => {
    it('Validation error redirects back to current page', async () => {
      userSupplier.mockReturnValue(coordinatorUser)

      await request(app)
        .post('/coordinator/report/123/statement/2/delete')
        .expect(302)
        .expect('Location', paths.confirmStatementDelete(123, 2, false))
        .expect(() => {
          expect(involvedStaffService.removeInvolvedStaff).not.toHaveBeenCalled()
        })
    })

    it('On removal request, validation error preserves correct navigation', async () => {
      userSupplier.mockReturnValue(coordinatorUser)

      await request(app)
        .post('/coordinator/report/123/statement/2/delete')
        .send({ removalRequest: 'true' })
        .expect(302)
        .expect('Location', paths.confirmStatementDelete(123, 2, true))
        .expect(() => {
          expect(involvedStaffService.removeInvolvedStaff).not.toHaveBeenCalled()
        })
    })

    it('when confirming to delete statement', async () => {
      userSupplier.mockReturnValue(coordinatorUser)

      await request(app)
        .post('/coordinator/report/123/statement/2/delete')
        .send({ confirm: 'yes' })
        .expect(302)
        .expect('Location', '/123/view-report')
        .expect(() => {
          expect(involvedStaffService.removeInvolvedStaff).toHaveBeenCalledWith(123, 2)
        })
    })
  })
})
