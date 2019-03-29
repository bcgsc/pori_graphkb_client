
class CacheRequest {
  constructor({ search, call, cache }) {
    this.search = search;
    this.call = call;
    this.cache = cache;
    this.result = null;
    this.isLoading = true;
    this.createdAt = (new Date()).valueOf();
  }

  abort() {
    this.call.abort();
  }

  isEqual(otherBlock) {
    if (!otherBlock
      || !otherBlock.key
      || typeof otherBlock.key !== 'function'
      || otherBlock.key() !== this.key()
    ) {
      return false;
    }
    return true;
  }
}


class CacheCountRequest extends CacheRequest {
  init() {
    this.result = (async () => {
      try {
        const result = await this.call.request();
        let count = null;
        if (result) {
          ([{ count }] = result);
        }
        this.isLoading = false;
        this.cache.onReqFinished(this);
        return count;
      } catch (err) {
        console.error(err);
        this.isLoading = false;
        this.cache.onReqFinished(this);
        throw err;
      }
    })();
  }

  key() {
    return `CacheCountRequest|${this.search}`;
  }
}


class CacheRecordRequest extends CacheRequest {
  constructor({ record, call, cache }) {
    super({ search: '', cache, call });
    this.record = record;
    this.size = 1;
  }

  init() {
    this.result = (async () => {
      try {
        const record = await this.call.request();
        this.isLoading = false;
        this.cache.onReqFinished(this);
        return record;
      } catch (err) {
        console.error(err);
        this.isLoading = false;
        this.cache.onReqFinished(this);
        throw err;
      }
    })();
  }

  key() {
    return `CacheRecordRequest|${this.record['@rid'] || this.record}`;
  }
}


class CacheBlockRequest extends CacheRequest {
  constructor({
    cache,
    call = { request: async () => [], abort: () => { } },
    orderBy = null,
    orderByDirection = null,
    search,
    startRow,
  }) {
    super({ cache, call, search });
    this.isEmpty = false;
    this.orderBy = orderBy;
    this.orderByDirection = orderByDirection;
    this.startRow = startRow;
    this.lastRowFound = null;
    this.size = cache.blockSize;
  }

  init() {
    this.result = (async () => {
      try {
        const rows = await this.call.request();

        if (rows) {
          this.size = rows.length;

          this.isLoading = false;
          if (rows.length === 0) {
            this.isEmpty = true;
            if (this.startRow === 0) {
              this.lastRowFound = 0;
            }
          } else if (rows.length < this.cache.blockSize) {
            this.lastRowFound = this.startRow + rows.length;
          }
        }
        this.cache.onReqFinished(this);
        return rows;
      } catch (err) {
        console.error(err);
        this.isLoading = false;
        this.cache.onReqFinished(this);
        throw err;
      }
    })();
  }

  key() {
    return `CacheBlockRequest|${this.search}|${this.startRow}|${this.orderBy}|${this.orderByDirection}`;
  }
}

class PaginationDataCache {
  /**
   * @param {object} opt
   * @param {number} opt.blockSize the size of blocks of data to cache
   * @param {number} opt.cacheBlocks the number of blocks to store in the cache
   * @param {Schema} opt.schema the schema object (for passing to the request builder)
   * @param {function} opt.onLoadCallback callback to be pinged when data is loaded or added to the queue
   * @param {boolean} opt.countFirst send a count call to check the number of expected records
   * @param {number} opt.concurrencyLimit the maximum number of concurrent requests to the api
   * @param {function} opt.blockApiCall a function to create the page requests. Must return an ApiCall object
   */
  constructor({
    blockSize = 250,
    cacheBlocks = 10,
    cacheExpiryMs = null,
    schema,
    onLoadCallback = () => { },
    countFirst = true,
    concurrencyLimit = 2,
    blockApiCall,
    recordApiCall,
    onErrorCallback = () => { },
  } = {}) {
    this.blockSize = blockSize;
    this.cacheBlocks = cacheBlocks;
    this.cacheExpiryMs = cacheExpiryMs;
    this.counts = {}; // by search
    this.schema = schema;
    this.onLoadCallback = onLoadCallback;
    this.onErrorCallback = onErrorCallback;
    this.countFirst = countFirst;
    this.concurrencyLimit = concurrencyLimit;
    this.blockApiCall = blockApiCall;
    this.recordApiCall = recordApiCall;
    this.queued = []; // pending requests
    this.active = []; // currently running requests
    this.cache = {}; // finished and cached blocks by key
  }

  /**
   * Initiate blocks moving from the pending queue to the active queue
   */
  startNextBlocks() {
    while (this.active.length < this.concurrencyLimit && this.queued.length) {
      const next = this.queued.shift();
      if (next) {
        // is this block beyond the row count?
        if (next instanceof CacheCountRequest
          || this.counts[next.search] === undefined
          || next.startRow < this.counts[next.search]
        ) {
          this.active.push(next);
          next.init();
        } else {
          // cache the empty block to make the requests seamless
          next.isEmpty = true;
          next.result = Promise.resolve([]);
          next.lastRowFound = this.counts[next.search];
          this.cache[next.key()] = next;
        }
        this.onLoadCallback();
      }
    }
  }

  /**
   * Callback for cache requests on completion
   *
   * @param {CacheRequest} req the request that has completed
   */
  onReqFinished(req) {
    // remove this block from the active queue
    this.active = this.active.filter(activeReq => !activeReq.isEqual(req));
    // add to the cache
    if (req instanceof CacheCountRequest) {
      req.result.then((count) => {
        this.counts[req.search] = count;
      });
    } else {
      this.cache[req.key()] = req;
      // updates the counts
      if (req.lastRowFound === 0 || req.lastRowFound) {
        this.counts[req.search] = req.lastRowFound;
      }
      this.enforceCacheLimit();
    }

    // start this next block if there is one
    this.startNextBlocks();
    this.onLoadCallback();
  }

  /**
   * Wait for the currently running requests to complete
   */
  async waitForActive() {
    return Promise.all(this.active.map(block => block.result));
  }

  /**
   * Wait for specific requests to complete
   *
   * @param {Array.<CacheRequest>} requests the requests to be held on
   */
  async waitForBlocks(requests) {
    let maxCycleCount = this.queued.length / this.concurrencyLimit + 1;
    while (maxCycleCount >= 0) {
      // check if all blocks are complete
      const incomplete = requests.some(req => !this.cache[req.key()] && !req.isEmpty);
      // if they are return
      if (!incomplete) {
        break;
      }
      // if there is nothing active break and error
      if (this.active.length === 0) {
        throw new Error(`blocks are incomplete (${requests.map(req => req.key()).join(' ')}) but no blocks are active`);
      }
      // otherwise wait for the current running requests to complete
      try {
        await this.waitForActive();  // eslint-disable-line
      } catch (err) {
        // ignore error, handled later
      }
      maxCycleCount -= 1;
    }
    return requests;
  }

  /**
   * Add a block to the queue or return the existing block if it
   * has already been queued
   *
   * @param {CacheRequest} req the block to queue
   *
   * @returns {CacheRequest} the queued block (returns existing if found instead of input)
   */
  queueRequest(req) {
    // add a new block to the queue if it is not already cached
    if (this.cache[req.key()]) {
      return this.cache[req.key()];
    }
    const [active] = this.active.filter(b => b.isEqual(req));
    if (active) {
      return active;
    }
    const [pending] = this.queued.filter(b => b.isEqual(req));
    if (pending) {
      return pending;
    }
    if (req instanceof CacheBlockRequest
      && this.counts[req.search] !== undefined
      && req.startRow > this.counts[req.search]
    ) {
      return null;
    }
    this.queued.push(req);
    this.startNextBlocks();
    this.onLoadCallback();
    return req;
  }

  purgeCache() {
    this.cache = {};
    this.counts = {};
  }

  abortAll() {
    this.queued = []; // to avoid the callback starting the next request
    this.active.forEach(block => block.abort());
  }

  /**
   * Find the number of rows pending (loaded or queued)
   *
   * @param {string} search the search (uri query params string) we are using
   */
  pendingRows(search) {
    let start = null;
    let end = null;
    const starts = [...this.active, ...this.queued]
      .filter(b => b.search === search)
      .map(b => b.startRow);
    if (starts.length > 0) {
      start = Math.min(...starts);
      end = Math.max(...starts) + this.blockSize - 1;
      if (this.counts[search]) {
        end = Math.min(this.counts[search], end);
      }
    }
    return [start, end];
  }

  /**
   * The expected rows for some query
   *
   * @param {string} search the search (uri query params string) we are using
   */
  rowCount(search) {
    return this.counts[search];
  }

  /**
   * Checks if items need to be removed from the cache and purges any required items
   */
  enforceCacheLimit() {
    // delete all the empty blocks first
    Object.values(this.cache).forEach((block) => {
      if (block.isEmpty && block.startRow !== 0) {
        delete this.cache[block.key()];
      }
    });
    // if still above the limit, remove the oldest block(s) first
    const orderedBlocks = Object.values(this.cache)
      .filter(block => !block.isLoading)
      .sort((block1, block2) => block1.createdAt < block2.createdAt);

    const maxCacheSize = this.cacheBlocks * this.blockSize;
    let cacheSize = orderedBlocks.length > 0
      ? orderedBlocks.reduce((prev, curr) => prev + curr.size)
      : 0;

    while (cacheSize > maxCacheSize && orderedBlocks.length > 0) {
      const block = orderedBlocks.shift();
      delete this.cache[block.key()];
      cacheSize -= block.size;
    }
  }

  /**
   * Request a block from the cache/api
   *
   * @param {string} search the query search string
   * @param {number} startRow the first row (ex. skip)
   * @param {SortModel} sortModel the sorting model (follows ag-grid format)
   */
  requestBlock({ search, startRow, sortModel }) {
    let orderBy;
    let orderByDirection;
    if (sortModel && sortModel.length > 0) {
      ([{ colId: orderBy, sort: orderByDirection }] = sortModel);
      orderByDirection = orderByDirection.toUpperCase();
    }

    if (this.countFirst && this.counts[search] === undefined) {
      const count = new CacheCountRequest({
        search,
        call: this.blockApiCall({
          search,
          schema: this.schema,
          count: true,
        }),
        cache: this,
      });
      this.queueRequest(count);
    }

    const block = new CacheBlockRequest({
      search,
      startRow,
      orderBy,
      orderByDirection,
      call: this.blockApiCall({
        search,
        schema: this.schema,
        skip: startRow,
        limit: this.blockSize,
        sortModel,
        count: false,
      }),
      cache: this,
    });

    // is this block already requested
    return this.queueRequest(block);
  }

  /**
   * Gets a subset of rows for a table request
   * retrieves from the cache first
   *
   * exclusive [startRow, endRow)
   *
   * @param {number} startRow the first row index to fetch
   * @param {number} endRow the index one past the last row to be fetched
   * @param {string} search the request queryParam string
   * @param {SortModel} sortModel the sotring model (follows ag-grid format)
   */
  async getRows({
    search, startRow, endRow, sortModel,
  }) {
    // what blocks do we need ?
    if (endRow <= startRow) {
      console.error(`Unexpected end (${endRow}) <= start (${startRow})`);
      return [];
    }
    const firstBlockIndex = Math.floor(startRow / this.blockSize);
    const lastBlockIndex = Math.floor((endRow - 1) / this.blockSize);

    const blocks = [];

    for (let blockIndex = firstBlockIndex; blockIndex < lastBlockIndex + 1; blockIndex += 1) {
      const blockStart = blockIndex * this.blockSize;
      const block = this.requestBlock({ startRow: blockStart, search, sortModel });
      if (block) {
        blocks.push(block);
      }
    }
    await this.waitForBlocks(blocks);
    let dataBlocks;
    try {
      dataBlocks = await Promise.all(blocks.map(async block => block.result));
    } catch (err) {
      this.onErrorCallback(err);
      throw err;
    }

    if (dataBlocks.length === 1) {
      return dataBlocks[0].slice(
        startRow - (firstBlockIndex * this.blockSize),
        endRow - (firstBlockIndex * this.blockSize),
      );
    }
    const totalRows = dataBlocks[0].slice(startRow - (firstBlockIndex * this.blockSize));
    dataBlocks.slice(1, dataBlocks.length - 1).forEach((rows) => {
      totalRows.push(...rows);
    });
    totalRows.push(...dataBlocks[dataBlocks.length - 1].slice(0, endRow - lastBlockIndex * this.blockSize));
    return totalRows;
  }

  /**
   * Request a set of records
   */
  async getRecords(records) {
    const requests = [];
    records.forEach((record) => {
      const block = new CacheRecordRequest({
        call: this.recordApiCall({ schema: this.schema, record }),
        record,
        cache: this,
      });

      requests.push(this.queueRequest(block));
    });

    await this.waitForBlocks(requests);
    let result;
    try {
      result = await Promise.all(requests.map(async block => block.result));
    } catch (err) {
      this.onErrorCallback(err);
    }
    return result;
  }

  /**
   * request a single record
   */
  async getRecord(record) {
    const block = new CacheRecordRequest({
      call: this.recordApiCall({ schema: this.schema, record }),
      record,
      cache: this,
    });

    const req = this.queueRequest(block);
    await this.waitForBlocks([req]);
    let result;
    try {
      result = await req.result;
    } catch (err) {
      this.onErrorCallback(err);
    }
    return result;
  }
}


export default PaginationDataCache;
