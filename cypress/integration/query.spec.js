
describe('Query Page Test', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.url().should('includes', '/login');
    cy.get('input[name=username]').type(Cypress.env('USER'));
    cy.get('input[name=password]').type(`${Cypress.env('PASSWORD')}{enter}`, { log: false });
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

  it('AutoSearch no results', () => {
    cy.get('input[type=text]').type('AAAAAAAAAAAAAAAAAAAAAA');
    cy.contains('No Results');
    cy.get('div.search-buttons button').click();
    cy.url().should('includes', '/query');
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
    cy.url().should('includes', '/table?limit=100&longName=%21nothing%3F%23%29%24%28%23%24%25&name=pneumonitis&source=%2315%3A0&sourceId=ncit%3Ac113159&sourceIdVersion=%21something');
  });

  it('Other classes', () => {
    cy.contains('Advanced Search').click();
    cy.get('div.endpoint-selection').click();
    const endpoints = ['Feature', 'AnatomicalEntity', 'Pathway', 'Therapy', 'Disease'];
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
      cy.get('div.endpoint-selection').click();
    });
    cy.get(`ul li[data-value=${endpoints[endpoints.length - 1]}]`).click();

    cy.get('input[name=limit]').type('{backspace}{backspace}');
    cy.get('#search-button').click();
    cy.url().should('includes', endpoints[endpoints.length - 1]);
  });
});
