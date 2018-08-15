
function getName(name) {
  cy.get('input').type(`${name}{enter}`);
  cy.url().should('includes', `/table?name=~${name}`);
}

describe('Table Test', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.url().should('includes', '/login');
    cy.get('input[name=username]').type(Cypress.env('USER'));
    cy.get('input[name=password]').type(`${Cypress.env('PASSWORD')}{enter}`, { log: false });
    cy.url().should('includes', '/query');
  });

  /**
   * Tests selected row visuals.
   */
  it('Selected indicator', () => {
    getName('melanoma');
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

  /**
   * Tests checkboxes visuals.
   */
  it('Checkboxes', () => {
    getName('melanoma');
    cy.get('table tbody tr').then((array) => {
      cy.wrap(array).each((row, i) => {
        if (i !== 0 && i !== array.length - 1) {
          cy.wrap(row).children('td:first').children().click()
            .children('span:first')
            .should('have.css', 'color', 'rgb(84, 177, 152)');
        }
      });
    });
  });

  /**
   * Tests node detail drawer expansion.
   */
  it('Expand details', () => {
    getName('melanoma');
    cy.get('table tbody tr:first td button[tabindex=0]').click({ force: true });
    cy.get('table tbody tr td div div div div.node-properties').should('exist');
    cy.get('table tbody tr:first td button[tabindex=0]').click({ force: true });
    cy.contains('Class:').should('not.exist');
  });

  /**
   * Tables paginator navigation buttons.
   */
  it('Paginator', () => {
    getName('melanoma');
    cy.get('div.pag div div div button').each((button, i) => {
      if (i !== 0) {
        cy.wrap(button).click();
        cy.contains('51-100');
        cy.wrap(button).click();
        cy.contains('101-150');
      }
    });
    cy.get('div.pag div div div div').contains(50).click();
    cy.get('#menu- div ul li:first').click();
    cy.contains('51-75');
    cy.get('div.pag div div div button:first').click();
    cy.contains('26-50');
  });

  /**
   * Check all checkbox
   */
  it('Check-all', () => {
    getName('dis');
    cy.get('table thead tr th:first input[type=checkbox]').click();
    cy.get('#ellipsis-menu').click();
    cy.contains('Hide Selected Rows (50)');
  });

  /**
   * Tests download as TSV button.
   */
  it('Ellipsis menu: Download as TSV', () => {
    getName('melanoma');
    cy.get('#ellipsis-menu').click();
    cy.get('#download-tsv').click();
  });

  /**
   * Tests hiding and showing table rows.
   */
  it('Ellipsis menu: hiding/returning rows', () => {
    getName('melanoma');
    cy.get('table tbody tr').then((array) => {
      cy.contains(319);
      cy.contains('1-50').invoke('text').then((text) => {
        cy.log(text);
        const total = text.split('1-50 of ')[1];
        cy.contains(total);
        const hiddenRows = Math.min(50, Math.round(total / 6));

        cy.wrap(array).each((row, i) => {
          if (i <= hiddenRows) {
            cy.wrap(row).children('td:first').children().click();
          }
        });
        cy.get('#ellipsis-menu').click();
        cy.get('#hide-selected').click();
        cy.contains(total - hiddenRows);
        cy.get('#ellipsis-menu').click();
        cy.contains(`Show Hidden Rows (${hiddenRows})`).click();
        cy.contains(`1-50 of ${total}`);
      });
    });
  });

  /**
   * Tests column management.
   */
  it('Ellipsis menu: column changes', () => {
    getName('melanoma');
    cy.get('#ellipsis-menu').click();
    cy.get('#column-edit').click();
    cy.contains('Select Columns:');
    cy.get('#subsets input[type=checkbox]').click();
    cy.get('#deprecated').scrollIntoView();
    cy.get('#deprecated input[type=checkbox]').click();
    cy.get('#column-dialog-actions button').click();
    cy.get('thead tr th').then((array) => {
      cy.expect(array.length).to.eq(7);
    });
  });

  /**
   * Tests automatic loading of more records.
   */
  it('Subsequent Pagination', () => {
    getName('dis');
    cy.get('div.pag div div div button').each((button, i) => {
      // Chooses second button.
      if (i !== 0) {
        for (let j = 0; j < 15; j += 1) {
          cy.wrap(button).click();
          cy.contains(`${1 + (j + 1) * 50}-${50 + (j + 1) * 50}`);
        }
        cy.contains('loading more results...');
        cy.contains('1000');
        cy.contains('2000');
      }
    });
  });

  /**
   * Tests manual add button for loading more records.
   */
  it('Forced Subsequent Pagination', () => {
    getName('dis');
    cy.get('div.more-results-btn button').click();
    cy.contains('loading more results...');
    cy.contains('1000');
    cy.get('div.more-results-btn button').should('disabled');
    cy.contains('2000');
  });
});
