describe('Node Form Test', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.url().should('includes', '/login');
    cy.get('input[name=username]').type(Cypress.env('USER'));
    cy.get('input[name=password]').type(`${Cypress.env('PASSWORD')}{enter}`, { log: false });
    cy.url().should('includes', '/query');
    cy.get('button.advanced-button').click();
    cy.url().should('includes', '/query/advanced');
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
    cy.get('ul.list li:first').contains('cypress');
    cy.get('li.relationship-add-wrapper div div.resource-select:first').click();
    cy.get('div[role=document]').scrollTo('bottom');
    cy.get('li[data-value="#15:12"]').click();
    cy.contains('test');
    cy.get('#relationship-type').click().wait(100).click();
    cy.contains('SubClassOf').click();
    cy.contains('SubClassOf');

    cy.get('button[name=direction]').click();
    cy.contains('SubClassOf').should('not.exist');
    cy.contains('hasSubClass');

    cy.get('input[name=targetName]').type('angiosarcoma').wait(500);
    cy.get('div.droptions ul li:first').click();
    cy.get('#relationship-add').click();
    cy.get('div.relationship-item').should('exist');
  });
});
