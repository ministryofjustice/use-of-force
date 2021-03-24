const YourStatements = require('../pages/yourStatements/yourStatementsPage')

context('Login functionality', () => {
  beforeEach(() => {
    cy.clearCookies()
    cy.task('reset')
  })

  it('Root (/) redirects to the auth login page if not logged in', () => {
    cy.task('stubLogin')
    cy.visit('/')
    cy.url().should('include', 'authorize')
    cy.get('h1').should('contain.text', 'Sign in')
  })

  it('Login page redirects to the auth login page if not logged in', () => {
    cy.task('stubLogin')
    cy.visit('/login')
    cy.url().should('include', 'authorize')
    cy.get('h1').should('contain.text', 'Sign in')
  })
  it('Page redirects to the auth login page if not logged in', () => {
    cy.task('stubLogin')
    cy.visit('/login')
    cy.url().should('include', 'authorize')
    cy.get('h1').should('contain.text', 'Sign in')
  })

  it('Logout takes user to login page', () => {
    cy.task('stubLogin', { firstName: 'James', lastName: 'Stuart' })
    cy.login()
    const yourStatements = YourStatements.verifyOnPage()
    yourStatements.loggedInName().contains('James Stuart')
    cy.request('/logout/').its('body').should('contain', 'Sign in')
  })

  it('New user login should log current user out', () => {
    // login as James Stuart
    cy.task('stubLogin', { firstName: 'James', lastName: 'Stuart' })
    cy.login()
    const yourStatements = YourStatements.verifyOnPage()
    yourStatements.loggedInName().contains('James Stuart')

    cy.task('stubVerifyToken', false)
    cy.request('/').its('body').should('contain', 'Sign in')

    // now login as Bobby Brown
    cy.task('stubLogin', { firstName: 'Bobby', lastName: 'Brown' })
    cy.login()
    yourStatements.loggedInName().contains('Bobby Brown')
  })

  it('Favicon is successfully displayed in tab', () => {
    cy.request({
      url: '/favicon.ico',
    }).then(resp => {
      expect(resp.status).to.eq(200)
    })
  })
})
