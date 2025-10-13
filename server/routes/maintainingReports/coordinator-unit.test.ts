import ReportService from '../../services/reportService'
import { InvolvedStaffService } from '../../services/involvedStaffService'
import ReviewService from '../../services/reviewService'
import OffenderService from '../../services/offenderService'
import UserService from '../../services/userService'
import StatementService from '../../services/statementService'
import AuthService from '../../services/authService'
import LocationService from '../../services/locationService'
import ReportDataBuilder from '../../services/reportDetailBuilder'
import ReportEditService from '../../services/reportEditService'
import logger from '../../../log'
import config from '../../config'
import CoordinatorRoutes from './coordinator'

jest.mock('../../services/reportService')
jest.mock('../../services/involvedStaffService')
jest.mock('../../services/reviewService')
jest.mock('../../services/offenderService')
jest.mock('../../services/userService')
jest.mock('../../services/statementService')
jest.mock('../../services/authService')
jest.mock('../../services/locationService')
jest.mock('../../services/reportDetailBuilder')
jest.mock('../../services/reportEditService')
jest.mock('../../../log')

// Mocks
const reportService = new ReportService(null, null, null, null, null, null) as jest.Mocked<ReportService>
const involvedStaffService = new InvolvedStaffService(null, null, null, null, null) as jest.Mocked<InvolvedStaffService>
const reviewService = new ReviewService(null, null, null, null, null) as jest.Mocked<ReviewService>
const offenderService = new OffenderService(null, null) as jest.Mocked<OffenderService>
const userService = new UserService(null, null) as jest.Mocked<UserService>
const statementService = new StatementService(null, null, null) as jest.Mocked<StatementService>
const authService = new AuthService(null) as jest.Mocked<AuthService>
const locationService = new LocationService(null, null) as jest.Mocked<LocationService>
const reportDetailBuilder = new ReportDataBuilder(null, null, null, null, null) as jest.Mocked<ReportDataBuilder>
const reportEditService = new ReportEditService(
  null,
  null,
  null,
  null,
  null,
  null,
  null
) as jest.Mocked<ReportEditService>
const flash = jest.fn()
config.featureFlagReportEditingEnabled = true

let controller: any
let req
let res

const incidentDate = new Date(Date.UTC(2025, 9, 6, 3, 10, 0, 0))
const report = {
  id: 1,
  username: 'USER',
  incidentDate,
  agencyId: 'ABC',
  submittedDate: '2025-10-10T15:10:00.000Z',
  reporterName: 'User 1',
  form: {
    evidence: {
      cctvRecording: 'NO',
      baggedEvidence: true,
      photographsTaken: false,
    },
    involvedStaff: [],
    incidentDetails: {
      witnesses: [
        {
          name: 'jimmy',
        },
        {
          name: 'tom',
        },
      ],
      authorisedBy: 'Deborah',
      plannedUseOfForce: true,
      incidentLocationId: 'abc-123',
    },
    useOfForceDetails: {
      taserDrawn: false,
      guidingHold: false,
      escortingHold: false,
      bodyWornCamera: 'NO',
      weaponsObserved: 'NO',
      handcuffsApplied: false,
      bittenByPrisonDog: false,
      restraintPositions: 'NONE',
      positiveCommunication: true,
      pavaDrawnAgainstPrisoner: false,
      batonDrawnAgainstPrisoner: false,
      painInducingTechniquesUsed: 'NONE',
      personalProtectionTechniques: false,
    },
    reasonsForUseOfForce: {
      reasons: ['FIGHT_BETWEEN_PRISONERS'],
    },
    relocationAndInjuries: {
      f213CompletedBy: 'Mr Fowler',
      prisonerInjuries: false,
      healthcareInvolved: false,
      prisonerRelocation: 'OWN_CELL',
      relocationCompliancy: true,
      staffMedicalAttention: false,
      prisonerHospitalisation: false,
    },
  },
  bookingId: '123456',
  status: 'SUBMITTED',
}

const incidentDetails = {
  incidentDate,
}

const incidentDetailsResponse = {
  coordinatorEditJourney: true,
  data: {
    displayName: undefined,
    incidentDate: {
      date: '06/10/2025',
      hour: '04',
      minute: '10',
    },
    locations: [
      {
        id: 1,
        name: 'Loc 1',
      },
    ],
    newAgencyId: undefined,
    offenderDetail: {
      name: 'An Offender',
    },
    prison: undefined,
    reportId: '1',
    witnesses: [
      {
        name: 'jimmy',
      },
      {
        name: 'tom',
      },
    ],
  },
  errors: undefined,
  noChangeError: undefined,
  showSaveAndReturnButton: false,
}

beforeEach(() => {
  req = { params: { reportId: '1' }, session: {}, query: {}, flash }
  res = { locals: { user: { username: 'USER' } }, render: jest.fn(), redirect: jest.fn() }

  req.session = { edit: {} }
  req.session.edit.inputsForEditIncidentDetails = undefined

  authService.getSystemClientToken.mockResolvedValue('token')
  locationService.getPrisonById.mockResolvedValue({ id: 'MDI', name: 'Moorland' } as any)
  locationService.getIncidentLocations.mockResolvedValue([{ id: 1, name: 'Loc 1' } as any])
  locationService.getPrisons.mockResolvedValue([{ id: 'MDI', name: 'Moorland' } as any])
  reviewService.getReport.mockResolvedValue(report as any)
  reportDetailBuilder.build.mockResolvedValue({ incidentDetails } as any)
  reviewService.getReportEdits.mockResolvedValue([])
  reviewService.getStatements.mockResolvedValue([])
  offenderService.getOffenderDetails.mockResolvedValue({ name: 'An Offender' })

  controller = new CoordinatorRoutes(
    reportService,
    involvedStaffService,
    reviewService,
    offenderService,
    userService,
    statementService,
    authService,
    locationService,
    reportDetailBuilder,
    reportEditService
  )
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('CoordinatorEditReportController', () => {
  describe('viewEditReport', () => {
    it('should call services correctly return expected data', async () => {
      await controller.viewEditReport(req, res)
      expect(authService.getSystemClientToken).toHaveBeenCalledWith('USER')
      expect(reviewService.getReport).toHaveBeenCalledWith(1)
      expect(reportDetailBuilder.build).toHaveBeenCalledWith('USER', report)
      expect(reviewService.getReportEdits).toHaveBeenCalledWith(1)
      expect(reviewService.getStatements).toHaveBeenCalledWith('token', 1)
      expect(req.session.edit).toEqual({})
      expect(res.render).toHaveBeenCalledWith('pages/coordinator/edit-report.njk', {
        data: {
          bookingId: null,
          hasReportBeenEdited: false,
          hasReportOwnerChanged: false,
          incidentDetails,
          lastEdit: null,
          reportOwner: undefined,
        },
        statements: [],
        user: {
          username: 'USER',
        },
      })
    })
  })

  describe('Incident details', () => {
    describe('viewEditIncidentDetails', () => {
      it('should call services and render page', async () => {
        await controller.viewEditIncidentDetails(req, res)

        expect(authService.getSystemClientToken).toHaveBeenCalledWith('USER')
        expect(reviewService.getReport).toHaveBeenCalledWith(1)
        expect(offenderService.getOffenderDetails).toHaveBeenCalledWith('123456', 'USER')
        expect(locationService.getIncidentLocations).toHaveBeenCalledWith('token', 'ABC')
        expect(res.render).toHaveBeenCalled()
        req.query = { 'new-prison': 'MDI' }
        await controller.viewEditIncidentDetails(req, res)

        incidentDetailsResponse.data.prison = {
          id: 'MDI',
          name: 'Moorland',
        }
        incidentDetailsResponse.data.newAgencyId = 'MDI'
        expect(locationService.getPrisonById).toHaveBeenCalledWith('token', 'MDI')
        expect(res.render).toHaveBeenCalled()
      })

      it('should catch error if new prison not found', async () => {
        req.query = { 'new-prison': 'AAA' }
        locationService.getPrisonById.mockRejectedValue(new Error())
        await controller.viewEditIncidentDetails(req, res)

        incidentDetailsResponse.data.prison = undefined
        incidentDetailsResponse.data.newAgencyId = 'AAA'
        expect(locationService.getPrisonById).toHaveBeenCalledWith('token', 'AAA')
        expect(logger.error).toHaveBeenCalledWith('User attempted to obtain details for prison AAA')
        expect(res.render).toHaveBeenCalled()
        incidentDetailsResponse.data.newAgencyId = undefined
      })

      it('should capture validation error', async () => {
        flash.mockReturnValue([
          {
            text: 'Enter the name of the person who authorised the use of force',
            href: '#authorisedBy',
          },
        ])

        await controller.viewEditIncidentDetails(req, res)

        incidentDetailsResponse.errors = [
          {
            href: '#authorisedBy',
            text: 'Enter the name of the person who authorised the use of force',
          },
        ]

        incidentDetailsResponse.noChangeError = [
          {
            href: '#authorisedBy',
            text: 'Enter the name of the person who authorised the use of force',
          },
        ]

        expect(res.render).toHaveBeenCalled()
      })
    })

    describe('submitEditIncidentDetails', () => {
      it('should redirect to current page if no changes identified', async () => {
        req.body = {
          newAgencyId: '',
          incidentDate: {
            date: '06/10/2025',
            time: {
              hour: '04',
              minute: '10',
            },
          },
          incidentLocationId: 'Loc-1',
          plannedUseOfForce: 'true',
          authorisedBy: 'Mr Smith',
          witnesses: [
            {
              name: 'jimmy',
            },
            {
              name: 'tom',
            },
          ],
          submitType: 'continue-coordinator-edit',
        }
        reportEditService.compareEditsWithReport.mockReturnValue({})
        await controller.submitEditIncidentDetails(req, res)
        expect(reviewService.getReport).toHaveBeenCalledWith(1)
        expect(res.redirect).toHaveBeenCalledWith('incident-details')
      })

      it('should redirect to next page if identifies changes', async () => {
        req.body = {
          newAgencyId: '',
          incidentDate: {
            date: '06/10/2025',
            time: {
              hour: '04',
              minute: '10',
            },
          },
          incidentLocationId: 'Loc-1',
          plannedUseOfForce: 'true',
          authorisedBy: 'Mr Smith',
          witnesses: [
            {
              name: 'jimmy',
            },
            {
              name: 'tom',
            },
          ],
          submitType: 'continue-coordinator-edit',
        }
        reportEditService.compareEditsWithReport.mockReturnValue({
          plannedUseOfForce: {
            question: 'Was use of force planned?',
            oldValue: true,
            newValue: true,
            hasChanged: false,
          },
          witnesses: {
            question: 'Witnesses to the incident',
            oldValue: [
              {
                name: 'jimmy',
              },
            ],
            newValue: [
              {
                name: 'tom',
              },
            ],
            hasChanged: true,
          },
        })

        await controller.submitEditIncidentDetails(req, res)
        expect(reviewService.getReport).toHaveBeenCalledWith(1)
        expect(res.redirect).toHaveBeenCalledWith('reason-for-change')
      })
    })
  })

  describe('Use of force details', () => {
    describe('viewEditWhyWasUOFApplied', () => {
      it('should render page', async () => {
        flash.mockReturnValueOnce([]) // flash.errors
        await controller.viewEditWhyWasUOFApplied(req, res)
        expect(reviewService.getReport).toHaveBeenCalledWith(1)
        expect(offenderService.getOffenderDetails).toHaveBeenCalledWith('123456', 'USER')
        expect(res.render).toHaveBeenCalledWith(
          'pages/coordinator/why-uof-applied.njk',
          expect.objectContaining({ coordinatorEditJourney: true })
        )
        expect(req.session.edit).toEqual({})
      })

      it('should render page with any validation errors', async () => {
        const error = [
          {
            href: '#reasons',
            text: 'Select the reasons why use of force was applied',
          },
        ]
        flash.mockReturnValueOnce(error) // flash.errors
        await controller.viewEditWhyWasUOFApplied(req, res)
        expect(reviewService.getReport).toHaveBeenCalledWith(1)
        expect(res.render).toHaveBeenCalledWith(
          'pages/coordinator/why-uof-applied.njk',
          expect.objectContaining({
            errors: error,
          })
        )
      })
    })
    describe('submitEditWhyWasUOFApplied', () => {
      it('should redirect to current page if no selections made', async () => {
        req.body = {}
        req.originalUrl = '/1/edit-report/why-was-uof-applied'
        await controller.submitEditWhyWasUOFApplied(req, res)
        expect(res.redirect).toHaveBeenCalledWith('/1/edit-report/why-was-uof-applied')
      })

      it('should set session object correctly and redirect', async () => {
        req.body = { reasons: ['ASSAULT_ON_ANOTHER_PRISONER'] }
        req.session.edit.whyWasUOFAppliedReasons = req.body.reasons

        const comparison = {
          reasons: {
            question: 'Why was use of force applied against this prisoner?',
            oldValue: ['HOSTAGE_NTRG', 'OTHER_NTRG_INCIDENT'],
            newValue: req.body.reasons,
            hasChanged: true,
          },
        }
        reportEditService.compareEditsWithReport.mockReturnValue(comparison)

        await controller.submitEditWhyWasUOFApplied(req, res)
        expect(req.session.edit.whyWasUOFAppliedChanges).toEqual(comparison)
        expect(res.redirect).toHaveBeenCalledWith('use-of-force-details')
      })

      it('should set session object correctly and redirect to primary reason page', async () => {
        req.body = { reasons: ['ASSAULT_ON_ANOTHER_PRISONER', 'OTHER_NTRG_INCIDENT'] }
        const comparison = {
          reasons: {
            question: 'Why was use of force applied against this prisoner?',
            oldValue: ['HOSTAGE_NTRG', 'OTHER_NTRG_INCIDENT'],
            newValue: ['ASSAULT_ON_ANOTHER_PRISONER', 'OTHER_NTRG_INCIDENT'],
            hasChanged: true,
          },
        }
        reportEditService.compareEditsWithReport.mockReturnValue(comparison)

        await controller.submitEditWhyWasUOFApplied(req, res)
        expect(req.session.edit.whyWasUOFAppliedChanges).toEqual(comparison)
        expect(res.redirect).toHaveBeenCalledWith('what-was-the-primary-reason-of-uof')
      })
    })

    describe('viewPrimaryReason', () => {
      it('should render page', async () => {
        const reasons = ['ASSAULT_ON_ANOTHER_PRISONER', 'HOSTAGE_NTRG', 'OTHER_NTRG_INCIDENT']
        req.session.edit = { reasons }
        await controller.viewEditPrimaryReasonForUof(req, res)

        expect(reviewService.getReport).toHaveBeenCalledWith(1)
        expect(offenderService.getOffenderDetails).toHaveBeenCalledWith('123456', 'USER')
        expect(res.render).toHaveBeenCalledWith(
          'pages/coordinator/why-uof-applied-primary-reason.njk',
          expect.objectContaining({
            coordinatorEditJourney: true,
            data: {
              offenderDetail: { name: 'An Offender' },
              primaryReason: undefined,
              reasons: [
                { label: 'Assault on another prisoner', value: 'ASSAULT_ON_ANOTHER_PRISONER' },
                { label: 'Hostage (NTRG)', value: 'HOSTAGE_NTRG' },
                { label: 'Other NTRG incident', value: 'OTHER_NTRG_INCIDENT' },
              ],
              reportId: '1',
            },
            errors: undefined,
            showSaveAndReturnButton: false,
          })
        )
      })
    })
    describe('submitEditPrimaryReasonForUof', () => {
      it('should render page', async () => {
        req.body = { primaryReason: 'HOSTAGE_NTRG' }
        await controller.submitEditPrimaryReasonForUof(req, res)
        expect(res.redirect).toHaveBeenCalledWith('use-of-force-details')
      })

      it('should redirect to current page with errors page', async () => {
        req.body = {}
        const originalUrl = 'what-was-the-primary-reason-of-uof'
        req.originalUrl = originalUrl
        await controller.submitEditPrimaryReasonForUof(req, res)
        expect(res.redirect).toHaveBeenCalledWith(originalUrl)
      })
    })

    describe('viewEditUseOfForceDetails', () => {
      it('should render page', async () => {
        req.session = {
          edit: {
            whyWasUOFAppliedReasons: ['HOSTAGE_NTRG', 'OTHER_NTRG_INCIDENT'],
          },
        }
        await controller.viewEditUseOfForceDetails(req, res)
        expect(reviewService.getReport).toHaveBeenCalledWith(1)
        expect(offenderService.getOffenderDetails).toHaveBeenCalledWith('123456', 'USER')
        expect(res.render).toHaveBeenCalled()
      })
    })

    describe('submitEditUseOfForceDetails', () => {
      const userInputUofDetails = {
        positiveCommunication: 'true',
        bodyWornCamera: 'NO',
        bodyWornCameraNumbers: [
          {
            cameraNum: '',
          },
        ],
        personalProtectionTechniques: 'false',
        batonDrawnAgainstPrisoner: 'false',
        pavaDrawnAgainstPrisoner: 'false',
        taserDrawn: 'false',
        bittenByPrisonDog: 'false',
        weaponsObserved: 'NO',
        weaponTypes: [
          {
            weaponType: '',
          },
        ],
        guidingHold: 'false',
        escortingHold: 'false',
        restraintPositions: 'NONE',
        painInducingTechniquesUsed: 'UPPER_ARM_CONTROL',
        handcuffsApplied: 'true',
        submitType: 'continue-coordinator-edit',
      }
      it('should redirect to next page page', async () => {
        req.params = { reportId: 1 }
        req.body = userInputUofDetails
        req.session = {
          edit: {
            reasons: ['ASSAULT_ON_ANOTHER_PRISONER', 'HOSTAGE_NTRG'],
            primaryReason: 'ASSAULT_ON_ANOTHER_PRISONER',
          },
        }
        const useOfForceDetails = {
          positiveCommunication: true,
          bodyWornCamera: 'NO',
          personalProtectionTechniques: false,
          batonDrawnAgainstPrisoner: false,
          pavaDrawnAgainstPrisoner: false,
          taserDrawn: false,
          bittenByPrisonDog: false,
          weaponsObserved: 'NO',
          guidingHold: false,
          escortingHold: false,
          restraintPositions: 'NONE',
          painInducingTechniquesUsed: 'UPPER_ARM_CONTROL',
          handcuffsApplied: true,
        }

        reportEditService.compareEditsWithReport.mockResolvedValue({
          positiveCommunication: {
            question: 'Was positive communication used to de-escalate the situation with this prisoner?',
            oldValue: false,
            newValue: false,
            hasChanged: false,
          },
        } as never)
        await controller.submitEditUseOfForceDetails(req, res)
        expect(reviewService.getReport).toHaveBeenCalledWith(1)
        expect(req.session.edit.useOfForceDetails).toEqual(useOfForceDetails)
        expect(req.session.edit).toEqual({
          pageInputsforReasonsForUofAndPrimaryReason: {
            primaryReason: 'ASSAULT_ON_ANOTHER_PRISONER',
            reasons: ['ASSAULT_ON_ANOTHER_PRISONER', 'HOSTAGE_NTRG'],
          },
          primaryReason: 'ASSAULT_ON_ANOTHER_PRISONER',
          reasons: ['ASSAULT_ON_ANOTHER_PRISONER', 'HOSTAGE_NTRG'],
          useOfForceDetails,
        })
        expect(res.redirect).toHaveBeenCalled()
      })
    })
  })

  describe('Relocation and injuries', () => {
    describe('viewEditRelocationAndInjuries', () => {
      it('should render page', async () => {
        req.session = { edit: { inputsForEditRelocationAndInjuries: {} } }

        await controller.viewEditRelocationAndInjuries(req, res)
        expect(res.render).toHaveBeenCalled()
      })
    })

    describe('submitEditRelocationAndInjuries', () => {
      it('should update session object and redirect', async () => {
        const userInput = {
          prisonerRelocation: 'GATED_CELL',
          relocationCompliancy: 'true',
          userSpecifiedRelocationType: '',
          f213CompletedBy: 'Mr Fowler',
          prisonerInjuries: 'false',
          healthcareInvolved: 'false',
          healthcarePractionerName: '',
          prisonerHospitalisation: 'false',
          staffMedicalAttention: 'false',
          staffNeedingMedicalAttention: [
            {
              name: '',
            },
          ],
        }
        req.body = userInput

        const comparison: any = {
          prisonerRelocation: {
            question: 'Where was the prisoner relocated to?',
            oldValue: 'OWN_CELL',
            newValue: 'OWN_CELL',
            hasChanged: false,
          },
          relocationCompliancy: {
            question: 'Was the prisoner compliant?',
            oldValue: true,
            newValue: true,
            hasChanged: false,
          },
          relocationType: {
            question: 'What was the type of relocation?',
            oldValue: undefined,
            newValue: undefined,
            hasChanged: false,
          },
          userSpecifiedRelocationType: {
            question: 'Type of other relocation?',
            oldValue: undefined,
            newValue: undefined,
            hasChanged: false,
          },
          f213CompletedBy: {
            question: 'Who completed the F213 form?',
            oldValue: 'Mr Fowler',
            newValue: 'Mr Fowler',
            hasChanged: false,
          },
          prisonerInjuries: {
            question: 'Did the prisoner sustain any injuries at the time?',
            oldValue: false,
            newValue: false,
            hasChanged: false,
          },
          healthcareInvolved: {
            question:
              'Was a member of healthcare present throughout the incident (doctor, registered nurse or healthcare officer)?',
            oldValue: false,
            newValue: false,
            hasChanged: false,
          },
          healthcarePractionerName: {
            question: 'Name of healthcare member present?',
            oldValue: undefined,
            newValue: undefined,
            hasChanged: false,
          },
          prisonerHospitalisation: {
            question: 'Did the prisoner need outside hospitalisation at the time?',
            oldValue: false,
            newValue: true,
            hasChanged: true,
          },
          staffMedicalAttention: {
            question: 'Did a member of staff need medical attention at the time?',
            oldValue: false,
            newValue: false,
            hasChanged: false,
          },
          staffNeedingMedicalAttention: {
            question: 'Name of who needed medical attention?',
            oldValue: 'jim',
            newValue: 'tom',
            hasChanged: true,
          },
        }

        reportEditService.compareEditsWithReport.mockReturnValue(comparison)
        reportEditService.removeHasChangedKey.mockReturnValue({
          prisonerHospitalisation: {
            question: 'Did the prisoner need outside hospitalisation at the time?',
            oldValue: false,
            newValue: true,
          },
        } as never)
        await controller.submitEditRelocationAndInjuries(req, res)

        expect(req.session.edit).toEqual({
          backlinkHref: 'relocation-and-injuries',
          changes: {
            prisonerHospitalisation: {
              newValue: true,
              oldValue: false,
              question: 'Did the prisoner need outside hospitalisation at the time?',
            },
          },
          inputsForEditIncidentDetails: undefined,
          inputsForEditRelocationAndInjuries: {
            f213CompletedBy: 'Mr Fowler',
            healthcareInvolved: false,
            prisonerHospitalisation: false,
            prisonerInjuries: false,
            prisonerRelocation: 'GATED_CELL',
            relocationCompliancy: true,
            reportId: '1',
            staffMedicalAttention: false,
          },
          pageInput: {
            f213CompletedBy: 'Mr Fowler',
            healthcareInvolved: false,
            healthcarePractionerName: undefined,
            prisonerHospitalisation: false,
            prisonerInjuries: false,
            prisonerRelocation: 'GATED_CELL',
            relocationCompliancy: true,
            relocationType: undefined,
            staffMedicalAttention: false,
            staffNeedingMedicalAttention: undefined,
            userSpecifiedRelocationType: undefined,
          },
          sectionDetails: {
            section: 'relocationAndInjuries',
            text: 'relocation and injuries',
          },
        })

        expect(res.redirect).toHaveBeenCalledWith('reason-for-change')
      })
    })
  })

  describe('Evidence', () => {
    it('should render page', async () => {
      await controller.viewEditEvidence(req, res)
      expect(res.render).toHaveBeenCalledWith('pages/coordinator/evidence.njk', expect.objectContaining({}))
    })

    it('should redirect ', async () => {
      reportEditService.compareEditsWithReport.mockReturnValue({
        baggedEvidence: {
          question: 'Was any evidence bagged and tagged?',
          oldValue: true,
          newValue: false,
          hasChanged: true,
        },
        evidenceTagAndDescription: {
          question: 'Evidence tag and desciption',
          oldValue: [
            {
              description: 'two',
              evidenceTagReference: '2',
            },
          ],
          newValue: undefined,
          hasChanged: true,
        },
        photographsTaken: {
          question: 'Were any photographs taken?',
          oldValue: false,
          newValue: false,
          hasChanged: false,
        },
        cctvRecording: {
          question: 'Was any part of the incident captured on CCTV?',
          oldValue: 'NO',
          newValue: 'NO',
          hasChanged: false,
        },
      })

      reportEditService.removeHasChangedKey.mockReturnValue({
        baggedEvidence: {
          question: 'Was any evidence bagged and tagged?',
          oldValue: true,
          newValue: false,
        },
        evidenceTagAndDescription: {
          question: 'Evidence tag and desciption',
          oldValue: [
            {
              description: 'two',
              evidenceTagReference: '2',
            },
          ],
          newValue: undefined,
        },
      })

      await controller.submitEditEvidence(req, res)

      expect(reviewService.getReport).toHaveBeenCalled()
      expect(reportEditService.compareEditsWithReport).toHaveBeenCalled()
      expect(reportEditService.removeHasChangedKey).toHaveBeenCalled()

      expect(res.redirect).toHaveBeenCalledWith('reason-for-change')
    })
  })
})
