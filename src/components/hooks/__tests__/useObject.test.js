import { renderHook, act } from '@testing-library/react-hooks';
import useObject from '../useObject';

describe('useObject', () => {
  test('should update object', () => {
    const { result } = renderHook(() => useObject({ name: 'bob' }));

    act(() => {
      result.current.updateField('name', 'alice');
    });
    expect(result.current.content).toEqual({ name: 'alice' });
  });


  test('should replace content', () => {
    const { result } = renderHook(() => useObject({}));

    act(() => {
      result.current.replace({ name: 'alice' });
    });

    expect(result.current.content).toEqual({ name: 'alice' });
  });


  test('should return object', () => {
    const { result } = renderHook(() => useObject({ name: 'alice' }));

    expect(result.current.content).toEqual({ name: 'alice' });
  });
});
