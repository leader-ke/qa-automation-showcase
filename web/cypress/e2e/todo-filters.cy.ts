/**
 * Cypress — Web UI: Filter flows
 *
 * Covers the Active / Completed / All filter journeys and clear completed.
 */

const ACTIVE_ITEMS = [
  'Write acceptance criteria for login flow',
  'Automate regression suite for checkout',
  'Review PR #42 for null safety issues',
];
const COMPLETED_ITEM = 'Update test plan for v2.1 release';

describe('Todo — filters', () => {
  beforeEach(() => {
    cy.visit('/');

    ACTIVE_ITEMS.forEach((item) => cy.addTodo(item));
    cy.addTodo(COMPLETED_ITEM);
    cy.completeTodo(COMPLETED_ITEM);
  });

  it('"Active" filter shows only incomplete items', () => {
    cy.get('.filters a').contains('Active').click();

    ACTIVE_ITEMS.forEach((item) => {
      cy.get('.todo-list').should('contain', item);
    });
    cy.get('.todo-list').should('not.contain', COMPLETED_ITEM);
  });

  it('"Completed" filter shows only completed items', () => {
    cy.get('.filters a').contains('Completed').click();

    cy.get('.todo-list').should('contain', COMPLETED_ITEM);
    ACTIVE_ITEMS.forEach((item) => {
      cy.get('.todo-list').should('not.contain', item);
    });
  });

  it('"All" filter shows every item', () => {
    cy.get('.filters a').contains('All').click();

    cy.get('.todo-list li').should('have.length', ACTIVE_ITEMS.length + 1);
  });

  it('"Clear completed" removes completed items', () => {
    cy.get('.clear-completed').click();

    cy.get('.todo-list li').should('have.length', ACTIVE_ITEMS.length);
    cy.get('.todo-list').should('not.contain', COMPLETED_ITEM);
  });
});
