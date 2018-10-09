function goToClass(endpoint) {
  cy.get('#class-adv').click();
  cy.contains(endpoint).click();
  cy.get('input[name=limit]').type('10');
  cy.contains('Search').click();
  cy.get('table tbody tr:first').click({ force: true });
  cy.get('#detail-drawer').should('exist');
}

function getRecord(name, sourceId) {
  cy.get('input[name=limit]').type('10');
  cy.get('textarea[name=name]').type(name);
  cy.get('textarea[name=sourceId]').type(sourceId);
  cy.contains('Search').click();
  cy.get('table tbody tr:first').click({ force: true });
  cy.get('#detail-drawer').should('exist');
}

describe('Node Detail ', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.url().should('includes', '/login');
    cy.get('input[name=username]').type(Cypress.env('USER'));
    cy.get('input[name=password]').type(`${Cypress.env('PASSWORD')}{enter}`, { log: false });
    cy.url().should('includes', '/query');
    cy.get('button.advanced-button').click();
    cy.url().should('includes', '/query/advanced');
  });

  it('Node Detail in Table View', () => {
    goToClass('Feature');
    cy.contains('Biotype');
  });

  it('Subset links', () => {
    getRecord('disease by infectious agent', 'doid:0050117');
    cy.contains('Subsets').click();
    cy.get('ul>li:first').click();
    cy.url().should('not.includes', 'subsets=');
  });

  it('Graph view details', () => {
    goToClass('Disease');
    cy.get('table tbody tr:first input[type=checkbox]').click();
    cy.get('div.graph-btn button:first').click();
    cy.url().should('includes', '/graph');
    cy.get('circle.node:first').click({ force: true });
    cy.contains('(Details)').click({ force: true });
    cy.contains('Properties:');
  });
});
