
describe('Query Page Test', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.url().should('includes', '/login');
    cy.get('input[name=username]').type(Cypress.env('USER'));
    cy.get('input[name=password]').type(`${Cypress.env('PASSWORD')}{enter}`, { log: false });
    cy.wait(500);
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
      cy.get('#search-btn').click();
      cy.then(() => {
        cy.url().should('includes', encodeURI(`/data/table?name=~${inputText[0].value}`));
      });
    });
  });

  it('AutoSearch no results', () => {
    cy.get('input[type=text]').type('AAAAAAAAAAAAAAAAAAAAAA');
    cy.contains('No Results');
    cy.get('#search-btn').click();
    cy.wait(6500);
    cy.url().should('includes', '/query');
  });

  it('Advanced search', () => {
    const name = 'pneumonitis';
    const sourceId = 'ncit:c113159';
    cy.contains('Advanced Search').click();
    cy.url().should('includes', '/query/advanced');
    cy.get('textarea[name=name]').type(name);
    cy.get('input[name=source]').type('ncit');
    cy.wait(500);
    cy.get('ul li:first').click();
    cy.get('textarea[name=sourceId]').type(sourceId);
    cy.get('textarea[name=longName]').type('!nothing?#)$(#$%');
    cy.get('textarea[name=sourceIdVersion]').type('!something');
    cy.get('input[name=limit]').type('100');
    cy.get('#search-button').click();
    cy.url().should('includes', '/table?activeOnly=true&limit=100&longName=%21nothing%3F%23%29%24%28%23%24%25&name=pneumonitis&source=%2315%3A0&sourceId=ncit%3Ac113159&sourceIdVersion=%21something');
  });

  it('Other classes', () => {
    cy.contains('Advanced Search').click();
    cy.get('#class-adv').click();
    const endpoints = ['Feature', 'AnatomicalEntity', 'Pathway', 'Therapy', 'Disease', 'Publication'];
    endpoints.sort(
      () => {
        if (Math.random() > 0.5) {
          return -1;
        }
        return 1;
      },
    );

    endpoints.forEach((endpoint) => {
      cy.get(`ul li[data-value=${endpoint}]`).click();
      cy.contains(endpoint);
      cy.get('#class-adv').click();
    });
    cy.get(`ul li[data-value=${endpoints[endpoints.length - 1]}]`).click();

    cy.get('input[name=limit]').type('{backspace}{backspace}');
    cy.get('#search-button').click();
    cy.url().should('includes', endpoints[endpoints.length - 1]);
  });
});
