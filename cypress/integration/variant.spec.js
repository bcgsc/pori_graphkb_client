describe('Variant Form Test', () => {
  beforeEach(() => {
    cy.visit('/login');
    cy.wait(1000).then(() => {
      if (!localStorage.getItem('kcToken')) {
        cy.get('input#username').type(Cypress.env('USER'));
        cy.get('input#password').type(`${Cypress.env('PASSWORD')}{enter}`, { log: false });
      }
      cy.url().should('includes', '/query');
    });
    cy.visit('/add/variant');
  });

  it('Editing shorthand', () => {
    const reference1 = 'kras';
    const prefix = 'y';
    const break1 = { arm: 'p', majorBand: '12', minorBand: '2' };
    const break2 = { arm: 'p', majorBand: '13', minorBand: '3' };
    const type = { shorthand: 'del', name: 'deletion' };
    cy.get('input[name=shorthand]')
      .click()
      .type(`${reference1}:${prefix}.${break1.arm}${break1.majorBand}.${break1.minorBand}_${break2.arm}${break2.majorBand}.${break2.minorBand}${type.shorthand} `);
    cy.wait(200);
    cy.get('input[name=shorthand]').type('{backspace}{backspace}l');
    cy.get('#break1 li:first input')
      .should('have.value', 'CytobandPosition');
    cy.get('#break1 input[name=minorBand]').should('have.value', break1.minorBand);
    cy.get('#break1 input[name=majorBand]').should('have.value', break1.majorBand);
    cy.get('#break1 textarea[name=arm]').should('have.value', break1.arm);

    cy.get('#break2 li:first input')
      .should('have.value', 'CytobandPosition');
    cy.get('#break2 input[name=minorBand]').should('have.value', break2.minorBand);
    cy.get('#break2 input[name=majorBand]').should('have.value', break2.majorBand);
    cy.get('#break2 textarea[name=arm]').should('have.value', break2.arm);
  });

  it('Editing form', () => {
    cy.get('input[name=type]').type('deletion');
    cy.get('div.droptions li:first').click();
    cy.get('input[name=reference1]').type('kras');
    cy.get('div.droptions li:first').click();
    cy.get('#break1 li:first div.resource-select').click();
    cy.get('div li[data-value="ProteinPosition"]').click();
    cy.contains('Protein Position').should('exist');
    cy.wait(500);
    cy.get('#break2 li:first div.resource-select div[role=button]').click();
    cy.get('div li[data-value="CytobandPosition"]').click();
    cy.contains('Protein Position').should('not.exist');
    cy.contains('Cytoband Position').should('exist');
    cy.contains('cytoband arm must be p or q ()').should('exist');
    cy.get('#break1 textarea[name=arm]').type('p');
    cy.get('#break2 textarea[name=arm]').type('p');
    cy.contains('cytoband arm must be p or q ()').should('not.exist');
    cy.contains('majorBand must be a positive integer ()');
    cy.get('#break1 input[name=minorBand]').type('23');
    cy.get('#break2 input[name=minorBand]').type('52');
    cy.contains('minorBand must be a positive integer ()').should('not.exist');
  });
});
