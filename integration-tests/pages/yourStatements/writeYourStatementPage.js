const page = require('../page')
const ConfirmStatementPage = require('./checkYourStatementPage')

const submitStatementPage = () =>
  page('Your use of force statement', {
    offenderName: () => cy.get('[data-qa=offender-name]'),
    lastTrainingMonth: () => cy.get('[name=lastTrainingMonth]'),
    lastTrainingYear: () => cy.get('[name=lastTrainingYear]'),
    jobStartYear: () => cy.get('[name=jobStartYear]'),
    statement: () => cy.get('[name=statement]'),

    saveAndExit: () => cy.get('[data-qa=submit]'),
    submit: () => {
      cy.get('[data-qa=submit]').click()
      return ConfirmStatementPage.verifyOnPage()
    },
  })

export default {
  verifyOnPage: submitStatementPage,
}