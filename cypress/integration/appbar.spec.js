
describe('App Bar Test', () => {
  beforeEach(() => {
    cy.visit('/login');
    cy.wait(1000).then(() => {
      if (!localStorage.getItem('kcToken')) {
        cy.get('input#username').type(Cypress.env('USER'));
        cy.get('input#password').type(`${Cypress.env('PASSWORD')}{enter}`, { log: false });
      }
      cy.url().should('includes', '/query');
    });
  });

  it('Query, add node, and logout buttons', () => {
    cy.visit('/feedback');

    const numlinks = 4;

    for (let i = 0; i < numlinks; i += 1) {
      cy.get('header.banner>button').click();
      if (i === 0) {
        cy.get('ul.drawer-links a[href="/query"] li').click();
        cy.url().should('includes', '/query');
      }
      if (i === 1) {
        cy.contains('Add new record').click();
        cy.get('ul.drawer-links a[href="/add/ontology"] li').click();
        cy.url().should('includes', '/add/ontology');
      }
      if (i === 2) {
        cy.contains('Add new record').click();
        cy.get('ul.drawer-links a[href="/add/variant"] li').click();
        cy.url().should('includes', '/add/variant');
      }
      if (i === 3) {
        cy.contains('Add new record').click();
        cy.get('ul.drawer-links a[href="/add/statement"] li').click();
        cy.url().should('includes', '/add/statement');
      }
    }
  });
});
