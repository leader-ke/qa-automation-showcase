export interface ApiTodo {
  userId: number;
  title: string;
  completed: boolean;
}

export const newTodo: ApiTodo = {
  userId: 1,
  title: 'Automate regression suite for new release',
  completed: false,
};

export const completedTodo: ApiTodo = {
  userId: 1,
  title: 'Review test coverage for auth module',
  completed: true,
};
