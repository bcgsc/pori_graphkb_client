import { credentials } from '../../config';

describe('Query Page Test', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.url().should('includes', '/login');
    cy.get('input[name=username]').type(credentials.username);
    cy.get('input[name=password]').type(`${credentials.password}{enter}`);
    cy.url().should('includes', '/query');
  });

  it('Query, add node, and logout buttons', () => {
    cy.get('header button').each((button, i) => {
      cy.wrap(button).click();
      if (i === 0) {
        cy.url().should('includes', '/query');
      } else if (i === 1) {
        cy.url().should('includes', '/add');
      } else {
        cy.contains('Logout');
      }
    });
  });
});
