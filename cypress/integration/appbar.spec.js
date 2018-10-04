
describe('App Bar Test', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.url().should('includes', '/login');
    cy.get('input[name=username]').type(Cypress.env('USER'));
    cy.get('input[name=password]').type(`${Cypress.env('PASSWORD')}{enter}`, { log: false });
    cy.url().should('includes', '/query');
  });

  it('Query, add node, and logout buttons', () => {
    cy.get('div.drawer ul>li').each((button, i) => {
      cy.wrap(button).click();
      if (i === 0) {
        cy.url().should('includes', '/query');
      } else if (i === 1) {
        cy.contains('Ontology');
        cy.contains('Variant');
        cy.get('div.drawer ul>div>div>div>li').each((nestedButton, j) => {
          if (j === 0) {
            cy.wrap(nestedButton).click();
            cy.url().should('includes', '/add');
          } else if (j === 1) {
            cy.wrap(button).click();
            cy.wrap(nestedButton).click();
            cy.url().should('includes', '/variant');
          }
        });
      }
    });
  });
});
