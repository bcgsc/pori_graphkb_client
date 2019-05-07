// create a mock api module

// module should contain methods for post, patch, get and delete
export default {
  get: jest.fn(() => Promise.resolve({ data: null })),

};
