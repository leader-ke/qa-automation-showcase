export interface User {
  id: number;
  name: string;
  username: string;
  email: string;
}

export interface NewPost {
  title: string;
  body: string;
  userId: number;
}

// Subset of known users from JSONPlaceholder — used for deterministic assertions
export const knownUsers: User[] = [
  { id: 1, name: 'Leanne Graham', username: 'Bret', email: 'Sincere@april.biz' },
  { id: 2, name: 'Ervin Howell', username: 'Antonette', email: 'Shanna@melissa.tv' },
  { id: 3, name: 'Clementine Bauch', username: 'Samantha', email: 'Nathan@yesenia.net' },
];

export const validNewPost: NewPost = {
  title: 'Test automation reduces release risk',
  body: 'Shifting tests left and automating the critical path gives teams faster, safer delivery.',
  userId: 1,
};

export const invalidPost = {
  title: '',
  body: '',
  userId: null,
};
