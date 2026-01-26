import { offender } from '../../mockApis/data'
import { ReportStatus } from '../../../server/config/types'
import ViewIncidentPage from '../../pages/coordinator/viewIncidentPage'
import EditReportPage from '../../pages/coordinator/editReportPage'
import ViewInvolvedStaffPage from '../../pages/coordinator/viewInvolvedStaffPage'
import StaffInvolvedSearchPage from '../../pages/coordinator/staffInvolvedSearchPage'
import AddNewStaffInvolvedPage from '../../pages/coordinator/addNewStaffInvolvedPage'
import AddInvolvedStaffInvolvedSearchNoResultsPage from '../../pages/coordinator/addInvolvedStaffSearchNoResultsPage'

import NotCompletedIncidentsPage from '../../pages/reviewer/notCompletedIncidentsPage'

context('A coordinator manages involved staff by editing a submitted report', () => {
  const submittedDate = new Date()
  const incidentDate = new Date()
  const seedReport = () =>
    cy.task('seedReport', {
      status: ReportStatus.SUBMITTED,
      submittedDate,
      incidentDate,
      agencyId: 'MDI',
      bookingId: 1001,
      involvedStaff: [
        {
          username: 'TEST_USER',
          name: 'TEST_USER name',
          email: 'TEST_USER@gov.uk',
        },
      ],
    })

  beforeEach(() => {
    cy.task('reset')
    seedReport()
    cy.task('stubComponents')
    cy.task('stubOffenderDetails', offender)
    cy.task('stubPrison', offender.agencyId)
    cy.task('stubOffenders', [offender])
    cy.task('stubUserDetailsRetrieval', ['MR_ZAGATO', 'MRS_JONES', 'TEST_USER'])
    cy.task('stubGetUser', 'A_BCD')

    cy.task('stubStaffMemberSearch', {
      searchText: 'A_BCD',
      response: {
        content: [
          {
            username: 'A_BCD',
            staffId: 123465,
            firstName: 'June',
            lastName: 'Jones',
            active: true,
          },
        ],
        totalPages: 1,
        totalElements: 1,
        number: 1,
        numberOfElements: 1,
        first: true,
        empty: false,
      },
    })
    cy.task('stubStaffMemberSearch', {
      searchText: 'UNKNOWN_USER',
      response: {
        numberOfElements: 0,
      },
    })
    cy.task('stubCoordinatorLogin')
    cy.login()
  })

  it('they can add staff involved when that staff member exists', () => {
    const notCompletedIncidentsPage = NotCompletedIncidentsPage.goTo()
    notCompletedIncidentsPage.getTodoRows().should('have.length', 1)

    notCompletedIncidentsPage.viewIncidentLink().click()

    const viewIncidentPage = ViewIncidentPage.verifyOnPage()
    viewIncidentPage.editReportButton().click()

    const editReportPage = EditReportPage.verifyOnPage()
    editReportPage.changeStaffInvolvedLink().click()

    const viewInvolvedStaffPage = ViewInvolvedStaffPage.verifyOnPage()
    viewInvolvedStaffPage.addSomeoneButton().click()

    const staffInvolvedSearchPage = StaffInvolvedSearchPage.verifyOnPage()
    staffInvolvedSearchPage.username().type('A_BCD')
    staffInvolvedSearchPage.searchButton().click()

    StaffInvolvedSearchPage.verifyOnPage()
    staffInvolvedSearchPage.getRowAndCol(1, 1).contains('June Jones')
    staffInvolvedSearchPage.getRowAndCol(1, 3).contains('A_BCD')
    staffInvolvedSearchPage.getRowAndCol(1, 5).contains('Add June Jones')
    staffInvolvedSearchPage.getRowAndCol(1, 5).click()

    const addNewStaffInvolvedPage = AddNewStaffInvolvedPage.verifyOnPage()
    addNewStaffInvolvedPage.errorInReportRadio().click()
    addNewStaffInvolvedPage.additionalInfo().type('Added by coordinator in test')
    addNewStaffInvolvedPage.saveAndContinue().click()

    ViewInvolvedStaffPage.verifyOnPage()
  })

  it('can not add involved staff involved, if they do not exist', () => {
    const notCompletedIncidentsPage = NotCompletedIncidentsPage.goTo()
    notCompletedIncidentsPage.getTodoRows().should('have.length', 1)

    notCompletedIncidentsPage.viewIncidentLink().click()

    const viewIncidentPage = ViewIncidentPage.verifyOnPage()
    viewIncidentPage.editReportButton().click()

    const editReportPage = EditReportPage.verifyOnPage()
    editReportPage.changeStaffInvolvedLink().click()

    const viewInvolvedStaffPage = ViewInvolvedStaffPage.verifyOnPage()
    viewInvolvedStaffPage.addSomeoneButton().click()

    const staffInvolvedSearchPage = StaffInvolvedSearchPage.verifyOnPage()
    staffInvolvedSearchPage.username().type('UNKNOWN_USER')
    staffInvolvedSearchPage.searchButton().click()

    AddInvolvedStaffInvolvedSearchNoResultsPage.verifyOnPage()
  })
})
