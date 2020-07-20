const moment = require('moment')
const { offender, offender2 } = require('../../mockApis/data')
const YourStatementsPage = require('../../pages/yourStatements/yourStatementsPage')
const { ReportStatus } = require('../../../server/config/types')

context('A user views their statements list', () => {
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubLogin')
    cy.task('stubOffenderDetails', offender)
    cy.task('stubOffenderDetails', offender2)
    cy.task('stubLocations', offender.agencyId)
    cy.task('stubPrison', offender.agencyId)
    cy.task('stubOffenders', [offender, offender2])
    cy.task('stubLocation', '357591')
    cy.task('stubUserDetailsRetrieval', ['MR_ZAGATO', 'MRS_JONES', 'TEST_USER'])
  })

  it('A user can view all of their statements', () => {
    cy.login()

    cy.task('seedReport', {
      status: ReportStatus.SUBMITTED,
      involvedStaff: [
        {
          userId: 'TEST_USER',
          name: 'TEST_USER name',
          email: 'TEST_USER@gov.uk',
        },
      ],
    })

    cy.task('seedReport', {
      status: ReportStatus.SUBMITTED,
      submittedDate: moment().toDate(),
      agencyId: offender.agencyId,
      offenderNumber: offender2.offenderNo,
      bookingId: offender2.bookingId,
      involvedStaff: [
        {
          userId: 'TEST_USER',
          name: 'TEST_USER name',
          email: 'TEST_USER@gov.uk',
        },
      ],
    })

    const yourStatementsPage = YourStatementsPage.goTo()
    yourStatementsPage.selectedTab().contains('Your statements')

    {
      const { date, prisoner, overdue } = yourStatementsPage.getTodoRow(0)
      prisoner().contains('Smith, Norman')
      date().should(elem => expect(elem.text()).to.match(/\d{1,2} .* \d{4}/))
      overdue().should('exist')
    }

    {
      const { date, prisoner, overdue } = yourStatementsPage.getTodoRow(1)
      prisoner().contains('Jones, June')
      date().should(elem => expect(elem.text()).to.match(/\d{1,2} .* \d{4}/))
      overdue().should('not.exist')
    }
  })
})
