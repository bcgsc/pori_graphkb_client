describe('Ontology Form Test', () => {
  beforeEach(() => {
    cy.visit('/login');
    cy.wait(1000).then(() => {
      if (!localStorage.getItem('kcToken')) {
        cy.get('input#username').type(Cypress.env('USER'));
        cy.get('input#password').type(`${Cypress.env('PASSWORD')}{enter}`, { log: false });
      }
      cy.url().should('includes', '/query');
    });
  });

  it('Form fields', () => {
    cy.visit('/add/ontology');
    cy.contains('Disease');
    cy.get('input[name=source][type=text]:first').type('ncit').wait(100);
    cy.get('div.droptions ul li:first').click();
    cy.get('textarea[name=sourceId]').type('ncit').wait(100);
    cy.get('#submit-btn').should('not.disabled');

    cy.get('input[name=subsets]').type('cypress{enter}');
    cy.get('div.embedded-list-chip:first').contains('cypress');

    cy.get('div.relationships-form-wrapper input[name=source][type=text]').type('bcgsc').wait(100);
    cy.get('div.droptions ul li:first').click();

    cy.get('div.relationships-form-wrapper div[role=button]:first').click();
    cy.contains('HasSubClass').click();

    cy.get('button.relationship-direction-btn').click();
    cy.contains('HasSubClass').should('not.exist');
    cy.contains('SubClassOf');

    cy.get('div.relationships-form-wrapper input[name=out][type=text]').type('a1bgas').wait(100);
    cy.get('div[role=listbox] li:first').click();

    cy.get('div.relationship-submit-wrapper button').click();
    cy.get('tbody tr').then(list => expect(list.length).to.be.eq(2));
  });

  it('Submit test', () => {
    cy.visit('/add/ontology');
    cy.contains('Disease');
    cy.get('input[name=source][type=text]:first').type('ncit').wait(100);
    cy.get('div.droptions ul li:first').click();
    cy.get('textarea[name=sourceId]').type('ncit').wait(100);
    cy.get('#submit-btn').should('not.disabled');
  });

  it('Edit test', () => {
    cy.get('button.advanced-button').click();
    cy.url().should('includes', '/query/advanced');
    cy.get('input[name=source]:first').type('ncit');
    cy.get('div.droptions li:first').click();
    cy.get('#search-button').click();
    cy.get('table tbody tr:first').click({ force: true });
    cy.get('div.detail-edit-btn button').click();
    cy.url().should('includes', '/edit');
    cy.get('textarea[name=sourceId]').invoke('text').should('not.empty');
    cy.get('input[name=source]').should('not.have.value', '');
    cy.get('#delete-btn').click();
    cy.contains('Really Delete this Term?').should('exist');
    cy.get('div[role=dialog] button:first').click();
    cy.get('#submit-btn').click();
    cy.get('path[d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"]')
      .should('exist');
    cy.get('div.notification-drawer button').click();
    cy.url().should('includes', '/query');
  });
});
