import { credentials } from '../../config';

describe('Node Detail View Test', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.url().should('includes', '/login');
    cy.get('input[name=username]').type(credentials.username);
    cy.get('input[name=password]').type(`${credentials.password}{enter}`);
    cy.url().should('includes', '/query');
    cy.get('a[href="/query/advanced"]').children().click();
    cy.url().should('includes', '/query/advanced');
    cy.get('div.endpoint-selection').click();
    cy.get('ul >li:first').click();
    cy.get('input[name=limit').type('{backspace}{backspace}');
    cy.contains('Search').click();
    cy.get('table tbody tr:first td button[tabindex=0]').click({ force: true });
    cy.get('table tbody tr td div div div div.node-properties').should('exist');
  });

  it('Different class details', () => {
    cy.contains('Biotype:');
    cy.get('table tbody tr:first td button[tabindex=0]').click({ force: true });
    cy.contains('Class:').should('not.exist');
  });

  it.only('Nested class expansion', () => {
    cy.get('div.nested-container:first div div[tabindex="-1"]').click();
    cy.get('div.nested-container:first div div div div h3').should('visible');
    cy.get('div.nested-container:first div div[tabindex="-1"]').click({ force: true });
    cy.get('div.nested-container:first div div div div h3').should('not.visible');
  });
});
