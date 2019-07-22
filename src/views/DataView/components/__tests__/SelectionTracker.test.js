import { SelectionRange, SelectionTracker } from '../SelectionTracker';

describe('SelectionRange class', () => {
  it('get length returns correct length', () => {
    const largeRange = new SelectionRange(0, 1000);
    expect(largeRange.length).toBe(1001);

    const smallRange = new SelectionRange(0, 5);
    expect(smallRange.length).toBe(6);

    const singleValRange = new SelectionRange(3, 3);
    expect(singleValRange.length).toBe(1);
  });
});
