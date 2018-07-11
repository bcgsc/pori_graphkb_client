import { credentials } from '../../config';

describe('Query Page Test', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.url().should('includes', '/login');
    cy.get('input[name=username]').type(credentials.username);
    cy.get('input[name=password]').type(`${credentials.password}{enter}`);
    cy.url().should('includes', '/query');
    cy.get('input').type('melanoma{enter}');
    cy.url().should('includes', '/table?name=~melanoma');
  });

  it('Selected indicator', () => {
    cy.contains('Rows per page');
    cy.get('table tbody tr:first').should('has.css', 'background-color', 'rgba(214, 219, 245, 0.7)');
    cy.get('table tbody tr').then((array) => {
      cy.wrap(array).each((row, i) => {
        if (i !== 0 && i !== array.length - 1) {
          cy.wrap(row).click().should('has.css', 'background-color', 'rgba(214, 219, 245, 0.7)');
        }
      });
    });
  });

  it('Checkboxes', () => {
    cy.get('table tbody tr').then((array) => {
      cy.wrap(array).each((row, i) => {
        if (i !== 0 && i !== array.length - 1) {
          cy.wrap(row).children('td:first').children().click()
            .children('span:first')
            .should('have.css', 'color', 'rgb(0, 137, 123)');
        }
      });
    });
  });

  it('Expand details', () => {
    cy.get('table tbody tr:first td button[tabindex=0]').click({ force: true });
    cy.get('table tbody tr td div div div div.node-properties').should('exist');
    cy.get('table tbody tr:first td button[tabindex=0]').click({ force: true });
    cy.contains('Class:').should('not.exist');
  });

  it('Paginator', () => {
    cy.get('table tbody tr td div div div button').each((button, i) => {
      if (i !== 0) {
        cy.wrap(button).click();
        cy.contains('51-100');
        cy.wrap(button).click();
        cy.contains('101-150');
      }
    });
    cy.get('table tbody tr td[colspan=4] div div div div div').click();
    cy.get('#menu- div ul li:first').click();
    cy.contains('51-75');
    cy.get('table tbody tr td div div div button:first').click();
    cy.contains('26-50');
  });

  it('Ellipsis menu: Download as TSV', () => {

  });

  it('Ellipsis menu: hiding rows', () => {

  });

  it('Ellipsis menu: returning hidden rows', () => {

  });
});
