export interface TodoItem {
  text: string;
  completed?: boolean;
}

// Represents tasks a QA lead might track — gives the fixture data a realistic feel
export const todoItems: TodoItem[] = [
  { text: 'Write acceptance criteria for login flow' },
  { text: 'Automate regression suite for checkout' },
  { text: 'Review PR #42 for null safety issues' },
  { text: 'Update test plan for v2.1 release', completed: true },
  { text: 'Run exploratory session on new onboarding' },
];

export const singleTodo: TodoItem = {
  text: 'Define test strategy for payments module',
};
