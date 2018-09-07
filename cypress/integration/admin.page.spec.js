describe('Admin Page Test', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.url().should('includes', '/login');
    cy.get('input[name=username]').type(Cypress.env('USER'));
    cy.get('input[name=password]').type(`${Cypress.env('PASSWORD')}{enter}`, { log: false });
    cy.url().should('includes', '/query');
  });

  it('Admin Page', () => {
    cy.get('div.user-dropdown').click();
    cy.contains('Admin').click();
    cy.url().should('includes', '/admin');
    cy.contains('Admin');
    cy.contains('Users');
    cy.contains('User Groups');
    cy.get('div.admin-users table tbody tr').then((array) => {
      const { length } = array;
      cy.get('div.admin-users table thead tr th:first').click();
      cy.get('div.admin-section-heading-btns button').each((btn, i) => {
        if (i === 0) {
          cy.wrap(btn).contains(length);
        } else if (i === 1) {
          cy.wrap(btn).click();
          cy.contains('New User');
          cy.contains('Cancel').click();
        }
      });
    });
    cy.get('div.admin-user-groups div[role=button]').each((row, i) => {
      if (i === 1) {
        cy.wrap(row).click({ force: true });
        cy.get('div.user-group-toolbar button:first').click({ force: true });
        cy.get('input[placeholder="Enter Group Name"]').should('exist');
      } else if (i !== 0) {
        cy.wrap(row).click({ force: true });
      }
    });
  });
});
