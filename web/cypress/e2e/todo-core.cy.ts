/**
 * Cypress — Web UI: Core todo flows
 *
 * Same journeys as the Playwright suite, written in Cypress syntax.
 * Demonstrates the key differences: cy.get() chaining, implicit retries,
 * and custom commands as the equivalent of Page Object methods.
 *
 * Target: https://demo.playwright.dev/todomvc
 */

const TODO_ITEMS = [
  'Write acceptance criteria for login flow',
  'Automate regression suite for checkout',
  'Review PR #42 for null safety issues',
];

describe('Todo — core user journeys', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('user can add a todo item', () => {
    cy.addTodo(TODO_ITEMS[0]);

    cy.get('.todo-list li').should('have.length', 1);
    cy.get('.todo-list li').first().should('contain.text', TODO_ITEMS[0]);
  });

  it('user can add multiple todo items', () => {
    TODO_ITEMS.forEach((item) => cy.addTodo(item));

    cy.get('.todo-list li').should('have.length', TODO_ITEMS.length);
  });

  it('user can complete a todo item', () => {
    cy.addTodo(TODO_ITEMS[0]);
    cy.completeTodo(TODO_ITEMS[0]);

    cy.get('.todo-list li').first().should('have.class', 'completed');
  });

  it('user can delete a todo item', () => {
    cy.addTodo(TODO_ITEMS[0]);
    cy.deleteTodo(TODO_ITEMS[0]);

    cy.get('.todo-list li').should('have.length', 0);
  });

  it('active count decrements when a todo is completed', () => {
    TODO_ITEMS.forEach((item) => cy.addTodo(item));
    cy.get('.todo-count').should('contain', '3');

    cy.completeTodo(TODO_ITEMS[0]);
    cy.get('.todo-count').should('contain', '2');
  });

  it('input is cleared after adding a todo', () => {
    cy.addTodo(TODO_ITEMS[0]);
    cy.get('.new-todo').should('have.value', '');
  });
});
