/**
 * Custom Cypress commands
 * Encapsulate repeated interactions — same principle as Page Object Model in Playwright.
 */

Cypress.Commands.add('addTodo', (text: string) => {
  cy.get('.new-todo').type(`${text}{enter}`);
});

Cypress.Commands.add('completeTodo', (text: string) => {
  cy.get('.todo-list li').contains(text).parent().find('.toggle').click();
});

Cypress.Commands.add('deleteTodo', (text: string) => {
  cy.get('.todo-list li')
    .contains(text)
    .parent()
    .then(($el) => {
      cy.wrap($el).trigger('mouseover');
      cy.wrap($el).find('.destroy').click({ force: true });
    });
});

export {};

declare global {
  namespace Cypress {
    interface Chainable {
      addTodo(text: string): Chainable<void>;
      completeTodo(text: string): Chainable<void>;
      deleteTodo(text: string): Chainable<void>;
    }
  }
}
