describe('Variant Form Test', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.url().should('includes', '/login');
    cy.get('input[name=username]').type(Cypress.env('USER'));
    cy.get('input[name=password]').type(`${Cypress.env('PASSWORD')}{enter}`, { log: false });
    cy.url().should('includes', '/query');
    cy.get('#link-variant').click();
    cy.url().should('includes', '/variant');
  });

  it('Editing shorthand', () => {
    cy.get('input[name=shorthandString]')
      .click()
      .type('kras:y.p12.2_p13.3del');
    cy.get('input[name=type]').should('have.value', 'deletion');
    cy.get('input[name=reference1]').should('have.value', 'kras');

    cy.get('#break1 li:first input')
      .should('have.value', 'CytobandPosition');
    cy.get('#break1 input[name=minorBand]').should('have.value', '2');
    cy.get('#break1 input[name=majorBand]').should('have.value', '12');
    cy.get('#break1 textarea[name=arm]').should('have.value', 'p');

    cy.get('#break2 li:first input')
      .should('have.value', 'CytobandPosition');
    cy.get('#break2 input[name=minorBand]').should('have.value', '3');
    cy.get('#break2 input[name=majorBand]').should('have.value', '13');
    cy.get('#break2 textarea[name=arm]').should('have.value', 'p');
  });

  it('Editing form', () => {
    cy.get('input[name=type]').type('deletion');
    cy.get('div.droptions li:first').click();
    cy.get('input[name=reference1]').type('kras');
    cy.get('div.droptions li:first').click();
    cy.get('#break1 li:first div.resource-select').click();
    cy.get('div li[data-value="ProteinPosition"]').click();
    cy.contains('ProteinPosition').should('exist');
    cy.wait(500);
    cy.get('#break2 li:first div.resource-select div[role=button]').click();
    cy.get('div li[data-value="CytobandPosition"]').click();
    cy.contains('ProteinPosition').should('not.exist');
    cy.contains('CytobandPosition').should('exist');
    cy.contains('Failed to parse the initial position').should('exist');
    cy.get('#break1 textarea[name=arm]').type('p');
    cy.get('#break2 textarea[name=arm]').type('p');
    cy.contains('Failed to parse the initial position').should('not.exist');
  });
});
