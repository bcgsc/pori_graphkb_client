import { fn } from 'storybook/test';

export default fn().mockImplementation(() => ({
  init: fn().mockResolvedValue(true),
  login: fn(),
  logout: fn(),
  updateToken: fn().mockResolvedValue(true),
}));
