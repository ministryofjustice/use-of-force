import { alternativeComponentToTitle } from '../page'

const row = i => cy.get('.edit-history-table tbody tr').eq(i)
const tableCell = (i, colName) => row(i - 1).find(`[data-qa=${colName}]`)
const summaryText = i => row(i - 1).find('.govuk-details__text')
const textLink = i => row(i - 1).find('.govuk-details__summary-text')

const editHistoryPage = () =>
  alternativeComponentToTitle('Edit history', '.govuk-table__caption--m', {
    tableRowAndColHeading: (i, colName) => tableCell(i, colName),
    summaryTextLink: i => textLink(i),
    tableRowAndSummaryText: i => summaryText(i),
  })

module.exports = {
  verifyOnPage: editHistoryPage,
}
