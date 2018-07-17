
function diseases() {
  cy.contains('Advanced Search').click();
  cy.url().should('includes', '/query/advanced');
  cy.get('#class-adv').click();
  cy.get('ul> li[data-value=Disease]').click();
  cy.get('input[name=limit]').type('{backspace}{backspace}{backspace}');
  cy.get('#search-button').click();
  cy.get('table tbody tr:first input[type=checkbox]').click();
  cy.get('div.pag button.graph-btn').click();
}

describe('Graph View Test', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.url().should('includes', '/login');
    cy.get('input[name=username]').type(Cypress.env('USER'));
    cy.get('input[name=password]').type(`${Cypress.env('PASSWORD')}{enter}`, { log: false });
    cy.url().should('includes', '/query');
  });

  it('Diseases actions ring', () => {
    diseases();
    cy.get('circle.node-expandable').click();
    cy.contains('(Details)').click();
    cy.contains('Properties:');
    cy.get('div.graph-close-drawer-btn button').click();

    cy.get('circle.node-expandable').click();
    cy.contains('(Back)').click();
    cy.contains('(Back)').should('not.exist');

    let nodes = 1;
    cy.get('circle.node-expandable').click();
    cy.contains('(Expand)').click().then(() => {
      cy.wait(1000);
      cy.get('circle').then((array) => {
        expect(array.length).to.be.greaterThan(nodes);
        nodes = array.length;
      });
    });

    cy.get('circle:first').click();
    cy.contains('(Hide)').click().then(() => {
      cy.get('circle').then((array) => {
        expect(array.length).to.be.lessThan(nodes);
      });
    });
  });
});
