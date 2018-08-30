describe('Node Form Test', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.url().should('includes', '/login');
    cy.get('input[name=username]').type(Cypress.env('USER'));
    cy.get('input[name=password]').type(`${Cypress.env('PASSWORD')}{enter}`, { log: false });
    cy.url().should('includes', '/query');
  });

  it('Form fields', () => {
    cy.visit('/add');
    cy.contains('Disease');
    cy.get('#submit-btn').should('disabled');
    cy.get('input[name=source][type=text]').type('test').wait(100);
    cy.get('div.droptions ul li:first').click();
    cy.get('textarea[name=sourceId][type=text]').type('test').wait(100);
    cy.get('#submit-btn').should('not.disabled');

    cy.get('input[name=subset]').type('cypress{enter}');
    cy.get('ul div.subset-chip:first').contains('cypress');
    cy.get('#relationship-add td div.resource-select').each((resourceSelect, i) => {
      if (i === 1) {
        cy.wrap(resourceSelect).click();
        cy.get('div[role=document]');
        cy.get('li[data-value="#15:12"]').click();
        cy.contains('test');
        cy.get('#relationship-type').click().wait(100).click();
        cy.contains('SubClassOf').click();
        cy.contains('SubClassOf');

        cy.get('button[name=direction]').click();
        cy.contains('SubClassOf').should('not.exist');
        cy.contains('hasSubClass');

        cy.get('div.relationships-wrapper input[name=name]').type('angiosarcoma').wait(500);
        cy.contains('pediatric angiosarcoma').click();

        cy.get('div.relationships-wrapper input[name=name]').type('{backspace}').wait(500);
        cy.contains('pediatric angiosarcoma').click();

        cy.get('#relationship-add td button[type=button]:first').click();
        cy.get('tbody tr').then(list => expect(list.length).to.be.eq(2));
      }
    });
  });

  it('Submit test', () => {
    cy.visit('/add');
    cy.contains('Disease');
    cy.get('#submit-btn').should('disabled');
    cy.get('input[name=source][type=text]').type('test').wait(100);
    cy.get('div.droptions ul li:first').click();
    cy.get('textarea[name=sourceId][type=text]').type('test').wait(100);
    cy.get('#submit-btn').should('not.disabled');
    cy.get('#submit-btn').click();
    cy.get('path[d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"]')
      .should('exist');
  });

  it('Edit test', () => {
    cy.get('button.advanced-button').click();
    cy.url().should('includes', '/query/advanced');
    cy.get('input[name=source]').type('test');
    cy.get('div.droptions li:first').click();
    cy.get('#search-button').click();
    cy.get('button.detail-btn:first').click();
    cy.get('div.node-edit-btn button').click();
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
