
describe('Query Page Test', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.url().should('includes', '/login');
    cy.get('input[name=username]').type(Cypress.env('USER'));
    cy.get('input[name=password]').type(`${Cypress.env('PASSWORD')}{enter}`);
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

  it.only('Advanced search', () => {
    const name = 'pneumonitis';
    const sourceId = 'ncit:c113159';
    cy.contains('Advanced Search').click();
    cy.url().should('includes', '/query/advanced');
    cy.get('input[name=name]').type(name);
    cy.get('#source-adv').click();
    cy.get('ul > li:first').click();
    cy.get('input[name=sourceId]').type(sourceId);
    cy.get('input[name=longName]').type('!nothing?#)$(#$%');
    cy.get('input[name=sourceIdVersion]').type('!something');
    cy.get('input[name=limit]').type('{backspace}');
    cy.get('#search-button').click();
    cy.url().should('includes', '/data/table?limit=100&longName=%21nothing%3F%23%29%24%28%23%24%25&name=pneumonitis&source=%2318%3A0&sourceId=ncit%3Ac113159&sourceIdVersion=%21something');
  });
});
