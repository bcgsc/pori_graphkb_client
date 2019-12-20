import { indexOfSubArray } from '..';


describe('indexOfSubArray', () => {
  test('returns null for empty subarray', () => {
    expect(indexOfSubArray([], [])).toBe(null);
  });

  test('returns an empty array when there are no matches', () => {
    expect(indexOfSubArray(['1', '2', '3', '4'], ['5', '6'])).toEqual([]);
  });

  test('returns all when there are multiple matches', () => {
    expect(indexOfSubArray(['4', '5', '6', '7', '5', '6'], ['5', '6'])).toEqual([1, 2, 4, 5]);
  });
});
