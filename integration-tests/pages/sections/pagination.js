const firstPagination = () => cy.get('.moj-pagination').first()

module.exports = {
  pagination: () => cy.get('.moj-pagination'),
  pageLinks: () =>
    firstPagination()
      .find(`.moj-pagination__item`)
      .spread((...rest) =>
        rest.map(element => ({
          href: Cypress.$(element).find('a').attr('href'),
          text: Cypress.$(element).text().trim(),
          selected:
            Cypress.$(element).find('a').attr('href') === undefined &&
            !Cypress.$(element).hasClass('moj-pagination__item--dots'),
        }))
      ),
  pageResults: () => firstPagination().find('.moj-pagination__results'),
  clickLinkWithText: text => firstPagination().get(`.moj-pagination__item`).contains(text).click(),
}
