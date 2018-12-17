function goToClass(endpoint) {
  cy.get('#class-adv').click();
  cy.contains(endpoint).click();
  cy.get('input[name=limit]').type('10');
  cy.contains('Search').click();
  cy.get('table tbody tr:first').click({ force: true });
  cy.get('#detail-drawer').should('exist');
}

describe('Node Detail ', () => {
  beforeEach(() => {
    cy.visit('/login');
    cy.wait(1000).then(() => {
      if (!localStorage.getItem('kcToken')) {
        cy.get('input#username').type(Cypress.env('USER'));
        cy.get('input#password').type(`${Cypress.env('PASSWORD')}{enter}`, { log: false });
      }
      cy.url().should('includes', '/query');
    });
    cy.get('button.advanced-button').click();
    cy.url().should('includes', '/query/advanced');
  });

  it('Node Detail in Table View', () => {
    goToClass('Feature');
    cy.contains('Biotype');
  });

  it('Graph view details', () => {
    goToClass('Disease');
    cy.get('table tbody tr:first input[type=checkbox]').click();
    cy.get('div.graph-btn button:first').click();
    cy.url().should('includes', '/graph');
    cy.get('circle.node:first').click({ force: true });
    cy.contains('(Details)').click({ force: true });
    cy.contains('Edit');
  });
});
