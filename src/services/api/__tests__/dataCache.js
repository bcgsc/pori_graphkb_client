import DataCache from '../dataCache';


const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));


const mockApiCalls = (results, waitMs = 1) => {
  const fn = jest.fn();
  const abort = jest.fn();
  const requestSpy = jest.fn();

  results.forEach((result) => {
    fn.mockImplementationOnce(
      () => {
        const request = async () => {
          await sleep(waitMs);
          requestSpy();
          if (!result) {
            throw new Error('test api error');
          }
          return result;
        };
        const call = {
          request,
          abort,
        };
        return call;
      },
    );
  });
  fn.abort = abort;
  fn.request = requestSpy;
  return fn;
};

describe('DataCache', () => {
  const onLoadCallback = jest.fn();
  const onErrorCallback = jest.fn();

  test('calls the load callback', async () => {
    const blockApiCall = mockApiCalls([
      [1, 2],
      [3],
    ]);
    const cache = new DataCache({
      onLoadCallback,
      onErrorCallback,
      concurrencyLimit: 1,
      blockApiCall,
      countFirst: false,
      blockSize: 2,
    });
    await expect(cache.getRows({
      search: '',
      startRow: 0,
      endRow: 3,
    })).resolves.toEqual([1, 2, 3]);
    // the load callback is called when a request completes
    // is queued or started
    expect(onLoadCallback).toBeCalledTimes(6);
    expect(onErrorCallback).not.toHaveBeenCalled();
    expect(blockApiCall.abort).not.toHaveBeenCalled();
  });
  test('calls the error callback', async () => {
    const blockApiCall = mockApiCalls([
      [1, 2],
      null,
      [3, 4],
    ]);
    const cache = new DataCache({
      onLoadCallback,
      onErrorCallback,
      concurrencyLimit: 1,
      blockApiCall,
      countFirst: false,
      blockSize: 2,
    });
    await expect(
      cache.getRows({
        search: '',
        startRow: 0,
        endRow: 5,
      }),
    ).rejects.toThrow('test api error');
    expect(onErrorCallback).toHaveBeenCalledTimes(1);
    expect(blockApiCall.abort).not.toHaveBeenCalled();
    expect(onLoadCallback).toBeCalledTimes(9);
  });
  test('sets count on first call if no results', async () => {
    const blockApiCall = mockApiCalls([
      [],
      [],
      [],
    ]);
    const cache = new DataCache({
      onLoadCallback,
      onErrorCallback,
      concurrencyLimit: 1,
      blockApiCall,
      countFirst: false,
      blockSize: 2,
    });
    await expect(cache.getRows({
      search: '',
      startRow: 0,
      endRow: 5,
    })).resolves.toEqual([]);
    expect(blockApiCall.abort).not.toHaveBeenCalled();
    expect(blockApiCall.request).toHaveBeenCalledTimes(1);
    // instantly resolves the last 2 blocks so that onFinished never calls load callback
    expect(onLoadCallback).toBeCalledTimes(7);
  });
  test('grab from cache', async () => {
    const blockApiCall = mockApiCalls([
      [1, 2],
      [3, 4],
      [5, 6],
    ]);
    const cache = new DataCache({
      onLoadCallback,
      onErrorCallback,
      concurrencyLimit: 1,
      blockApiCall,
      countFirst: false,
      blockSize: 2,
    });
    await expect(cache.getRows({
      search: '',
      startRow: 0,
      endRow: 3,
    })).resolves.toEqual([1, 2, 3]);
    expect(onLoadCallback).toBeCalledTimes(6);
    expect(onErrorCallback).not.toHaveBeenCalled();
    expect(blockApiCall.abort).not.toHaveBeenCalled();

    await expect(cache.getRows({
      search: '',
      startRow: 0,
      endRow: 3,
    })).resolves.toEqual([1, 2, 3]);
    // should not change the call numbers
    expect(onLoadCallback).toBeCalledTimes(6);
    expect(onErrorCallback).not.toHaveBeenCalled();
    expect(blockApiCall.abort).not.toHaveBeenCalled();
  });
  test('do not add if active already', async () => {
    const blockApiCall = mockApiCalls([
      [1, 2],
      [3, 4],
      [5, 6],
    ]);
    const cache = new DataCache({
      onLoadCallback,
      onErrorCallback,
      concurrencyLimit: 1,
      blockApiCall,
      countFirst: false,
      blockSize: 2,
    });
    expect(cache.pendingRows('')).toEqual([null, null]);
    cache.getRows({
      search: '',
      startRow: 0,
      endRow: 3,
    });
    expect(cache.active).toHaveLength(1);
    const [activeBlock] = cache.active;
    expect(activeBlock.size).toEqual(2);
    expect(activeBlock.isLoading).toBe(true);
    expect(activeBlock.startRow).toEqual(0);

    expect(cache.queued).toHaveLength(1);
    const [qBlock] = cache.queued;
    expect(qBlock.size).toEqual(2);
    expect(qBlock.isLoading).toBe(true);
    expect(qBlock.startRow).toEqual(2);

    expect(cache.pendingRows('')).toEqual([0, 3]);
    await expect(cache.getRows({
      search: '',
      startRow: 0,
      endRow: 3,
    })).resolves.toEqual([1, 2, 3]);
    expect(onLoadCallback).toBeCalledTimes(6);
    expect(onErrorCallback).not.toHaveBeenCalled();
    expect(blockApiCall.abort).not.toHaveBeenCalled();
  });
  test.skip('adjust pending when count is known', async () => {
    const blockApiCall = mockApiCalls([
      [1, 2],
      [3, 4],
      [5, 6],
    ]);
    const cache = new DataCache({
      onLoadCallback,
      onErrorCallback,
      concurrencyLimit: 1,
      blockApiCall,
      countFirst: true,
      blockSize: 2,
    });
    expect(cache.pendingRows('')).toEqual([null, null]);
    cache.getRows({
      search: '',
      startRow: 0,
      endRow: 2,
    });
    expect(cache.pendingRows('')).toEqual([0, 2]);
    cache.getRows({
      search: '',
      startRow: 0,
      endRow: 3,
    });
    await expect(cache.getRows({
      search: '',
      startRow: 0,
      endRow: 3,
    })).resolves.toEqual([1, 2, 3]);
    expect(onLoadCallback).toBeCalledTimes(6);
    expect(onErrorCallback).not.toHaveBeenCalled();
    expect(blockApiCall.abort).not.toHaveBeenCalled();
  });
  test('request new blocks when sort changes', async () => {
    const blockApiCall = mockApiCalls([
      [1, 2], [3, 4],
      [4, 3], [2, 1],
    ]);
    const cache = new DataCache({
      onLoadCallback,
      onErrorCallback,
      concurrencyLimit: 1,
      blockApiCall,
      countFirst: false,
      blockSize: 2,
    });

    await expect(cache.getRows({
      search: '',
      startRow: 0,
      endRow: 3,
    })).resolves.toEqual([1, 2, 3]);
    expect(onLoadCallback).toBeCalledTimes(6);

    await expect(cache.getRows({
      search: '',
      startRow: 0,
      endRow: 3,
      sortModel: [{ colId: '1', sort: 'asc' }],
    })).resolves.toEqual([4, 3, 2]);
    expect(onLoadCallback).toBeCalledTimes(12);
  });
  test('count first', async () => {
    const blockApiCall = mockApiCalls([
      [{ count: 4 }],
      [1, 2],
      null, // ignore next count setup request (won't be called)
      [3, 4],
      null, // ignore next count setup request (won't be called)
      [],
      null, // ignore next count setup request (won't be called)
      [],
      null, // ignore next count setup request (won't be called)
      [],
    ]);
    const cache = new DataCache({
      onLoadCallback,
      onErrorCallback,
      concurrencyLimit: 1,
      blockApiCall,
      countFirst: true,
      blockSize: 2,
    });

    const rows = await cache.getRows({
      search: '',
      startRow: 0,
      endRow: 10,
    });
    expect(cache.counts['']).toEqual(4);
    expect(rows).toEqual([1, 2, 3, 4]);
    // 10 for regular requests
    // 2 for the count request
    // 3 for the returns of the requests
    expect(onLoadCallback).toBeCalledTimes(15);
  });
  test('grab from single block', async () => {
    const blockApiCall = mockApiCalls([
      [0, 1, 2, 3, 4, 5, 6, 7, 8],
    ]);
    const cache = new DataCache({
      onLoadCallback,
      onErrorCallback,
      concurrencyLimit: 1,
      blockApiCall,
      countFirst: false,
      blockSize: 10,
    });

    await expect(cache.getRows({
      search: '',
      startRow: 2,
      endRow: 6,
    })).resolves.toEqual([2, 3, 4, 5]);
    expect(cache.counts['']).toEqual(9);
  });
  afterEach(() => {
    jest.clearAllMocks();
  });
});
