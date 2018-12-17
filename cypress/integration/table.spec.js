
function getName(name) {
  cy.visit('/query/advanced');
  cy.get('textarea[name=name]').type(name);
  cy.contains('Search').click();
}

describe('Table Test', () => {
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

  /**
   * Tests checkboxes visuals.
   */
  it('Checkboxes', () => {
    getName('~disease');
    cy.get('table tbody tr').then((array) => {
      cy.wrap(array).each((row, i) => {
        if (i !== 0 && i !== array.length - 1) {
          cy.wrap(row).children('td:first').children().click()
            .children('span:first')
            .should('have.css', 'color', 'rgb(84, 177, 152)');

          cy.wrap(row).should('have.css', 'background-color', 'rgba(160, 235, 216, 0.5)');
        }
      });
    });
  });

  /**
   * Tests node detail drawer expansion.
   */
  it('Expand details', () => {
    getName('~disease');
    cy.get('table tbody tr:first').click({ force: true });
    cy.get('#detail-drawer').should('exist');
    cy.get('div.detail-heading div.detail-headline>button').click();
    cy.contains('Properties:').should('not.visible');
  });

  /**
   * Tables paginator navigation buttons.
   */
  it('Paginator', () => {
    getName('~disease');
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
    getName('~diso');
    cy.get('table thead tr th:first input[type=checkbox]').click();
    cy.get('#ellipsis-menu').click();
    cy.contains('Hide selected rows (50)');
    cy.get('table tbody tr').then((array) => {
      cy.wrap(array).each((row, i) => {
        if (i !== 0 && i !== array.length - 1) {
          cy.wrap(row).should('have.css', 'background-color', 'rgba(160, 235, 216, 0.5)');
        }
      });
    });
  });

  /**
   * Tests download as TSV button.
   */
  it('Ellipsis menu: Download as TSV', () => {
    getName('~disease');
    cy.get('#ellipsis-menu').click();
    cy.get('#download-tsv').click();
  });

  /**
   * Tests hiding and showing table rows.
   */
  it('Ellipsis menu: hiding/returning rows', () => {
    getName('~disease');
    cy.get('table tbody tr').then((array) => {
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
        cy.contains(`Show hidden rows (${hiddenRows})`).click();
        cy.contains(`1-50 of ${total}`);
      });
    });
  });

  /**
   * Tests column management.
   */
  it.only('Ellipsis menu: column changes', () => {
    getName('~disease');
    cy.get('#ellipsis-menu').click();
    cy.get('#column-edit').click();
    cy.contains('Select Columns:');
    cy.get('#subsets input[type=checkbox]').click();
    cy.get('#column-dialog-actions button').click();
    cy.get('thead tr th').then((array) => {
      cy.expect(array.length).to.eq(7);
    });
  });

  /**
   * Tests automatic loading of more records.
   */
  it('Subsequent Pagination', () => {
    cy.visit('/data/table?@class=Disease');
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
    cy.visit('/data/table?@class=Disease');
    cy.get('div.more-results-btn button').click();
    cy.contains('loading more results...');
    cy.contains('1000');
    cy.get('div.more-results-btn button').should('disabled');
    cy.contains('2000');
  });

  /**
   * Tests table filters
   */
  it('Filtering', () => {
    cy.visit('/data/table?name=~diso&@class=Disease');
    cy.get('div.filter-btn button').each((button, i) => {
      if (i === 1) {
        cy.wrap(button).click({ force: true });
        cy.get('ul.filter-list>div>div').then((array) => {
          const l = array.length;
          cy.get('#filter-popover ul.filter-list li>div>div>input[type=text]')
            .type('disease or disorder');
          cy.get('ul.filter-list>div>div').then(a => cy.expect(a.length).to.be.lt(l));
          cy.get('ul.filter-list>div>div').each(btn => cy.wrap(btn).click());
          cy.get('tbody>tr>td:first input[type=checkbox]').click({ force: true });
          cy.get('#filter-popover').click(0, 0);
          cy.get('div.pag div.graph-btn button').click();
          cy.get('div.toolbar button.table-btn').click();
          cy.get('tbody>tr').then(a => cy.expect(a.length).to.be.lt(50));
        });
      }
    });
  });
});
