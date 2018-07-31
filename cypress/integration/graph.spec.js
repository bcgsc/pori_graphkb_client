function getClass(endpoint, params) {
  cy.contains('Advanced Search').click();
  cy.url().should('includes', '/query/advanced');
  cy.get('#class-adv').click();
  cy.get(`ul> li[data-value=${endpoint}]`).click();
  cy.get('input[name=limit]').type('10');
  if (Object.keys(params || {}).length !== 0) {
    Object.keys(params).forEach((param) => {
      cy.get(`textarea[name=${param}]`).type(params[[param]]);
    });
  }
  cy.get('#search-button').click();
  cy.get('table tbody tr:first input[type=checkbox]').click();
  cy.get('div.pag div.graph-btn').click();
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
    getClass('Disease');
    cy.get('circle.node').click();
    cy.contains('(Details)').click();
    cy.contains('Properties:');
    cy.get('div.node-edit-btn button:first').click();

    cy.get('circle.node').click();
    cy.contains('(Close)').click();
    cy.contains('(Close)').should('not.exist');

    let nodes = 1;
    cy.get('circle.node').click();
    cy.contains('(Expand)').click().then(() => {
      cy.wait(1000);
      cy.get('circle').then((array) => {
        expect(array.length).to.be.greaterThan(nodes);
        nodes = array.length;
      });
    });

    cy.get('circle.node:first').click({ force: true });
    cy.contains('(Hide)').click().then(() => {
      cy.get('circle').then((array) => {
        expect(array.length).to.be.lessThan(nodes);
      });
    });
  });

  it('Features different edges', () => {
    const name = 'a1bg-as1';
    getClass('Feature', { name });
    cy.get('circle.node').click();
    cy.contains('(Expand)').click();
    cy.get('path.link:first').trigger('mouseover');
    cy.contains('DeprecatedBy');
    cy.get('path.link:first').trigger('mouseout', { force: true });
    cy.contains('DeprecatedBy').should('not.exist');
  });

  it('Graph options', () => {
    const name = 'a1bg-as1';
    getClass('Feature', { name });
    cy.get('circle.node').click();
    cy.contains('(Expand)').click();

    cy.get('#graph-options-btn').click();

    cy.contains('Show Coloring Legend').click();
    cy.get('#options-close-btn').click();
    cy.get('div.legend-wrapper').should('exist');
    cy.contains('Feature');
    cy.contains('(@class)');

    cy.get('#graph-options-btn').click();

    cy.contains('Class').click();
    cy.contains('Source').click();
    cy.get('#options-close-btn').click();
    cy.get('div.legend-wrapper').should('exist');
    cy.contains('Hgnc');
    cy.contains('(source)');

    cy.get('#graph-options-btn').click();
    cy.contains('Source').click();
    cy.contains('No Coloring').click();
    cy.get('#options-close-btn').click();
    cy.get('div.legend-wrapper').should('not.exist');

    cy.get('#graph-options-btn').click();
    cy.contains('Name').click();
    cy.contains('Source ID').click();
    cy.get('#options-close-btn').click();
    cy.contains(name).should('not.exist');
  });
});
