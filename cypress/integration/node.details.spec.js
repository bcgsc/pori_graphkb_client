function goToClass(endpoint) {
  cy.get('div.endpoint-selection').click();
  cy.contains(endpoint).click();
  cy.get('input[name=limit').type('{backspace}{backspace}');
  cy.contains('Search').click();
  cy.get('table tbody tr:first td button[tabindex=0]').click({ force: true });
  cy.get('table tbody tr td div div div div.node-properties').should('exist');
}


describe('Node Detail in Table View Test', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.url().should('includes', '/login');
    cy.get('input[name=username]').type(Cypress.env('USER'));
    cy.get('input[name=password]').type(`${Cypress.env('PASSWORD')}{enter}`, { log: false });
    cy.url().should('includes', '/query');
    cy.get('a[href="/query/advanced"]').children().click();
    cy.url().should('includes', '/query/advanced');
  });

  it('Different class details', () => {
    goToClass('Feature');
    cy.contains('Biotype:');
    cy.get('table tbody tr:first td button[tabindex=0]').click({ force: true });
    cy.contains('Class:').should('not.exist');
  });

  it('Nested class expansion', () => {
    goToClass('Feature');
    cy.get('div.nested-container:first div div[tabindex="-1"]').click();
    cy.get('div.nested-container:first div div div div h3').should('visible');
    cy.get('div.nested-container:first div div[tabindex="-1"]').click({ force: true });
    cy.get('div.nested-container:first div div div div h3').should('not.visible');
  });

  it.only('Subset links', () => {
    goToClass('Disease');
    cy.contains('Subsets:').click();
    cy.get('ul>li:first').click();
    cy.url().should('includes', 'subsets=');
  });
});
