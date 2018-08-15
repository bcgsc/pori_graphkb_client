/**
 * Queries endpoint with given params and selects first record to load into
 * graph view.
 * @param {string} endpoint - database endpoint to query.
 * @param {Object} params - query parameters as an object.
 */
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

  /**
   * Tests disease actions buttons and their actions.
   */
  it('Diseases actions ring', () => {
    getClass('Disease');
    cy.get('circle.node').click({ force: true });
    cy.contains('(Details)').click({ force: true });
    cy.contains('Properties:');
    cy.get('div.node-edit-btn button:first').click();

    cy.get('circle.node').click({ force: true });
    cy.contains('(Close)').click({ force: true });
    cy.contains('(Close)').should('not.exist');

    let nodes = 1;
    cy.get('circle.node').click({ force: true });
    cy.contains('(Expand)').click().then(() => {
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

  /**
   * Tests link hovering property for different classes of links.
   */
  it('Features different edges', () => {
    const name = 'a1bg-as1';
    getClass('Feature', { name });
    cy.get('circle.node').click({ force: true });
    cy.contains('(Expand)').click({ force: true });
    cy.get('#graph-options-btn').click();
    cy.get('div.main-options-wrapper div.graph-option').each((div, i) => {
      if (i === 2) {
        cy.wrap(div).click();
      }
    });
    cy.get('ul li[data-value="@class"').click();
    cy.get('#options-close-btn').click();
    cy.contains('DeprecatedBy');
    cy.contains('AliasOf');
  });

  /**
   * Checks graph options panel.
   */
  it('Graph options', () => {
    const name = 'a1bg-as1';
    getClass('Feature', { name });
    cy.contains('Feature');
    cy.contains('(Class)');

    cy.get('circle.node').click({ force: true });
    cy.contains('(Expand)').click({ force: true });

    cy.get('#graph-options-btn').click();

    cy.get('div.main-options-wrapper div.graph-option').each((div, i) => {
      if (i === 1) {
        cy.wrap(div).click();
      }
    });

    cy.get('li[data-value="source.name"]').click();
    cy.get('#options-close-btn').click();
    cy.get('div.legend-wrapper').should('exist');
    cy.contains('Hgnc');
    cy.contains('(Source Name)');

    cy.get('#graph-options-btn').click();
    cy.get('div.main-options-wrapper div.graph-option').each((div, i) => {
      if (i === 1) {
        cy.wrap(div).click();
      }
    });
    cy.get('li[data-value=""]').click();
    cy.get('#options-close-btn').click();
    cy.get('div.legend-wrapper').should('not.exist');

    cy.get('#graph-options-btn').click();
    cy.contains('Name').click();
    cy.contains('Source ID').click();
    cy.get('#options-close-btn').click();
    cy.contains(name).should('not.exist');

    cy.get('#graph-options-btn').click();
    cy.contains('Source ID').click();
    cy.contains('Biotype').click();
    cy.get('#options-close-btn').click();
    cy.contains('gene');
  });

  /**
   * Tests if coloring scheme properly reverts to default coloring if there
   * is too much color diversity of categorizing property among nodes.
   */
  it('Unique property limit exceeding test', () => {
    getClass('Disease');
    cy.get('circle.node').click({ force: true });
    cy.contains('(Expand)').click({ force: true });

    cy.get('#graph-options-btn').click();
    cy.contains('Show Nodes Coloring Legend').click();
    cy.contains('Class').click();
    cy.contains('Source ID').click();
    cy.get('#options-close-btn').click();
    cy.get('circle.node').then((array) => {
      cy.wrap(array).each((node) => {
        cy.wrap(node).parent().children('text').children('tspan')
          .invoke('text')
          .then((text) => {
            if (text === 'polyp') {
              cy.wrap(node).click({ force: true });
              cy.contains('(Expand)').click({ force: true });
              cy.contains('Too many subgroups, choose new coloring property.');
              cy.wait(6500);
              cy.contains('Too many subgroups, choose new coloring property.').should('not.exist');
            }
          });
      });
    });
  });
});
