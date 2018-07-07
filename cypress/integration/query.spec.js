import { credentials } from '../../config';

describe('Query Page Test', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.url().should('includes', '/login');
    cy.get('input[name=username]').type(credentials.username);
    cy.get('input[name=password]').type(`${credentials.password}{enter}`);
    cy.url().should('includes', '/query');
  });

  it('Buttons are enabled', () => {
    cy.get('button').each(($button) => {
      cy.wrap($button).should('not.disabled');
    });
  });

  it('AutoSearch valid input', () => {
    cy.get('input[type=text]').type('angiosarcoma');
    cy.wait(700);
    cy.get('div.droptions ul li').each(($li) => {
      cy.wrap($li).contains('angiosarcoma');
    });

    cy.get('div.droptions ul li:first span:first').click();

    cy.get('input[type=text]').then((inputText) => {
      cy.get('div.search-buttons button').click();
      cy.then(() => {
        cy.url().should('includes', encodeURI(`/data/table?name=~${inputText[0].value}`));
      });
    });
  });

  it('AutoSearch invalid input', () => {
    cy.get('input[type=text]').type('&angiosarcoma');
    cy.contains('Invalid Request');
    cy.get('div.search-buttons button').click();
    cy.url().should('includes', '/error');
  });

  it('AutoSearch no results', () => {
    cy.get('input[type=text]').type('AAAAAAAAAAAAAAAAAAAAAA');
    cy.contains('No Results');
    cy.get('div.search-buttons button').click();
    cy.url().should('includes', '/query');
    cy.contains('No results found');
    cy.wait(3500);
    cy.contains('No results found').should('not.exist');
  });

  it('Advanced search button', () => {
    cy.get('a button').click();
    cy.url().should('includes', '/query/advanced');
  });
});
