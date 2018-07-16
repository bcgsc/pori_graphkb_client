
function successfulLogIn() {
  cy.get('input[name=username]').type(Cypress.env('USER'));
  cy.get('input[name=password]').type(`${Cypress.env('PASSWORD')}{enter}`, { log: false });
}

describe('Login Test', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.url().should('includes', '/login');
    cy.contains('Log in with your BC GSC web credentials');
  });

  it('incorrectly logs in', () => {
    cy.get('button[type=button]').each(($button) => {
      cy.wrap($button).should('disabled');
    });
    cy.get('input[name=username]').type('invalid user');
    cy.get('input[name=password]').type('invalid password{enter}');
    cy.url().should('includes', '/login').should(() => {
      /* eslint-disable */
      expect(localStorage.getItem('kbToken')).to.be.null;
      /* eslint-enable */
    });
    cy.contains('Invalid Username or Password');

    cy.get('input[name=password]').type('invalid password');
    cy.contains('Invalid Username or Password').should('not.exist');

    cy.get('button[type=submit]').click();
    cy.url().should('includes', '/login');
    cy.contains('Invalid Username or Password');
  });

  it('correctly logs in', () => {
    successfulLogIn();

    cy.get('button[type=button]').each(($button) => {
      cy.wrap($button).should('not.disabled');
    });

    cy.url().should('includes', '/query').should(() => {
      /* eslint-disable */
      expect(localStorage.getItem('kbToken')).to.not.be.null;
      /* eslint-enable */
    });
    cy.contains(Cypress.env('USER'));
  });

  it('logs out', () => {
    successfulLogIn();

    cy.get('div.user-dropdown button').click();
    cy.get('ul li[role=menuitem]').contains('Logout').click();

    cy.url().should('includes', '/login').should(() => {
      /* eslint-disable */
      expect(localStorage.getItem('kbToken')).to.be.null;
      /* eslint-enable */
    });

    cy.get('button[type=button]').each(($button) => {
      cy.wrap($button).should('disabled');
    });
    cy.url();
    cy.contains('Log in with your BC GSC web credentials');
    cy.contains('Invalid Username or Password').should('not.exist');
    cy.contains('Logged Out');
  });
});
