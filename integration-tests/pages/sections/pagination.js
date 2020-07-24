module.exports = {
  pagination: () => cy.get('.moj-pagination'),
  pageLinks: () =>
    cy.get(`.moj-pagination__item`).spread((...rest) =>
      rest.map(element => ({
        href: Cypress.$(element).find('a').attr('href'),
        text: Cypress.$(element).text().trim(),
        selected: Cypress.$(element).find('a').attr('href') === undefined,
      }))
    ),
  pageResults: () => cy.get('.moj-pagination__results'),
  clickLinkWithText: text => cy.get(`.moj-pagination__item`).contains(text).click(),
}
