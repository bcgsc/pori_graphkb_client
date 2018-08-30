function goToClass(endpoint) {
  cy.get('#class-adv').click();
  cy.contains(endpoint).click();
  cy.get('input[name=limit]').type('10');
  cy.contains('Search').click();
  cy.get('table tbody tr:first td button[tabindex=0]').click({ force: true });
  cy.get('table tbody tr td div div div div.node-properties').should('exist');
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
    cy.contains('Biotype:');
    cy.get('div.nested-container:first div div[tabindex="-1"]').click();
    cy.get('div.nested-container:first div div div div h3').should('visible');
    cy.get('div.nested-container:first div div[tabindex="-1"]').click({ force: true });
    cy.get('div.nested-container:first div div div div h3').should('not.visible');
    cy.get('table tbody tr:first td button[tabindex=0]').click({ force: true });
    cy.contains('Class:').should('not.exist');
  });

  it('Subset links', () => {
    goToClass('Disease');
    cy.contains('Subsets:').click();
    cy.get('ul>li:first').click();
    cy.url().should('not.includes', 'subsets=');
  });

  it('Graph view details', () => {
    goToClass('Disease');
    cy.get('table tbody tr:first input[type=checkbox]').click();
    cy.get('div.graph-btn button:first').click();
    cy.url().should('includes', '/graph');
    cy.get('circle.node:first').click();
    cy.contains('(Details)').click();
    cy.contains('Properties:');
    cy.get('div.node-properties').parent().scrollTo('bottom');
    cy.contains('hasSubClass').click();
    cy.get('div.node-properties').parent().scrollTo('bottom');
    cy.contains('cancer-related condition').click();
    cy.contains('c8278');
  });

  it('Detail Page details & edge drop down lists', () => {
    cy.visit('/ontology/36:10795');
    // Gets length indicator
    cy.get('div.length-box h3:first').invoke('text').then((length) => {
      // Expands dropdown list
      cy.get('div.length-box h3:first').parent().parent().click();
      // Counts child containers and asserts same length.
      cy.get('#hasSubClass div div div div div.detail-edge')
        .should('have.length', length);
    });
  });
});
