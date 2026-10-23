const firstPagination = () => cy.get('.moj-pagination').first()

const paginationLinkSelector = '.govuk-pagination__prev, .govuk-pagination__item, .govuk-pagination__next'

module.exports = {
  pagination: () => cy.get('.moj-pagination'),
  pageLinks: () =>
    firstPagination()
      .find(paginationLinkSelector)
      .spread((...rest) =>
        rest.map(element => {
          const selected = Cypress.$(element).hasClass('govuk-pagination__item--current')
          return {
            href: selected ? undefined : Cypress.$(element).find('a').attr('href'),
            text: Cypress.$(element).text().replace(/\s+/g, ' ').trim(),
            selected,
          }
        }),
      ),
  pageResults: () => firstPagination().find('.moj-pagination__results'),
  clickLinkWithText: text => firstPagination().find(paginationLinkSelector).contains(text).click(),
}
