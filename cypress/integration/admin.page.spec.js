describe('Admin Page Test', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.url().should('includes', '/login');
    cy.get('input[name=username]').type(Cypress.env('USER'));
    cy.get('input[name=password]').type(`${Cypress.env('PASSWORD')}{enter}`, { log: false });
    cy.url().should('includes', '/query');
  });

  it('Open Admin Page', () => {
    cy.get('div.user-dropdown').click();
    cy.contains('Admin').click();
    cy.url().includes('/admin');
  });
});
