import { alternativeComponentToTitle } from '../page'

const editHistoryPage = () =>
  alternativeComponentToTitle('Edit history', '.govuk-table__caption--m', {
    tableRow: num => cy.get(`.govuk-table__body > .govuk-table__row > :nth-child(${num})`),
    summaryTextLink: () => cy.get('.govuk-details__summary'),
    summaryText: () => cy.get('.govuk-details__text'),
  })

module.exports = {
  verifyOnPage: editHistoryPage,
}
