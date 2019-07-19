/** Represents a single range of selected Records */
class SelectionRange {
  constructor(minVal, maxVal) {
    this.minVal = minVal;
    this.maxVal = maxVal;
  }

  get length() { return this.maxVal - this.minVal + 1; }
}

/**  Keeps track of selected nodeRows in DataTable. The selected nodeRows
 * are maintained as a sorted list of SelectionRanges. I.E SelectionTracker
 * would maintain selected records: (1,2,3,7,8,9) as [SR(1,3), SR(7,9)]
 */
class SelectionTracker {
  constructor(minVal, maxVal) {
    if (minVal === undefined || maxVal === undefined) {
      this.rangeList = [];
    } else {
      this.rangeList = [new SelectionRange(minVal, maxVal)];
    }
  }

  get selection() { return this.rangeList; }

  set selection(newSelection) {
    this.rangeList = newSelection;
  }

  clone() {
    const newSelectionTracker = new SelectionTracker();
    const clonedSelectedRecords = [...this.rangeList];
    newSelectionTracker.rangeList = clonedSelectedRecords;
    return newSelectionTracker;
  }

  static rangeContainsNode(nodeID, range) {
    if (nodeID >= range.minVal && nodeID <= range.maxVal) {
      return true;
    }
    return false;
  }

  isNodeAlreadySelected(nodeID) {
    const selection = this.rangeList;
    return selection.some(range => SelectionTracker.rangeContainsNode(nodeID, range));
  }

  findRangeIndex(nodeID) {
    const selection = this.rangeList;
    for (let i = 0; i < selection.length; i++) {
      const currRange = selection[i];
      if (SelectionTracker.rangeContainsNode(nodeID, currRange)) {
        return i;
      }
    }
    return -1;
  }


  /**
   * Checks to see if newRange contains the targetRange.
   */
  static rangeRedundant(newRange, targetRange) {
    if ((targetRange.minVal >= newRange.minVal) && (targetRange.maxVal <= newRange.maxVal)) {
      return true;
    }
    return false;
  }

  /**
   * Extends the selection range that contains previously selected nodeRow in
   * the forward direction. I.E if prevNode = 10, currNode = 30.
   * Removes any redundant selection ranges that result because of the extension.
   *
   * @param {integer} rangePrevNodeIsIn - the index of the range that contains the
   * last selected nodeRow
   * @param {SelectionRange} newRange - the new range that will be added to SelectionTracker
   */
  forwardExtendAndUpdateRanges(rangePrevNodeIsIn, newRange) {
    let rangesToBeDeleted = 1;
    const selection = this.rangeList;
    const { length } = this.rangeList;
    for (let i = rangePrevNodeIsIn + 1; i <= length - 1; i++) {
      const targetRange = selection[i];
      if (SelectionTracker.rangeRedundant(newRange, targetRange)) {
        rangesToBeDeleted += 1;
      }
    }

    const newSelectionTracker = this.clone();
    const newRangeList = newSelectionTracker.rangeList;
    newRangeList.splice(rangePrevNodeIsIn, rangesToBeDeleted, newRange);
    const updatedRangeList = this.mergeAdjacentRanges([...newRangeList]);
    newSelectionTracker.rangeList = updatedRangeList;
    return newSelectionTracker;
  }

  /**
   * Extends the selection range that contains your previously selected nodeRow in
   * the backward direction. I.E if prevNode = 20, currNode = 5.
   * Removes any redundant selection ranges that result because of the extension.
   *
   * @param {integer} rangePrevNodeIsIn - the index of the range that contains the
   * last selected nodeRow
   * @param {SelectionRange} newRange - the new range that will be added to SelectionTracker
   */
  backwardExtendAndUpdateRanges(rangePrevNodeIsIn, newRange) {
    let rangesToBeDeleted = 1;
    const selection = this.rangeList;
    for (let i = rangePrevNodeIsIn; i >= 0; i--) {
      const targetRange = selection[i];
      if (SelectionTracker.rangeRedundant(newRange, targetRange)) {
        rangesToBeDeleted += 1;
      }
    }

    const insertPosition = (selection.length - rangesToBeDeleted) + 1;
    const newSelectionTracker = this.clone();
    const newRangeList = newSelectionTracker.rangeList;
    newRangeList.splice(insertPosition, rangesToBeDeleted, newRange);
    const updatedRangeList = this.mergeAdjacentRanges([...newRangeList]);
    newSelectionTracker.rangeList = updatedRangeList;
    return newSelectionTracker;
  }

  merge = (r1, r2) => new SelectionRange(r1.minVal, r2.maxVal);

  static rangesAdjacent(lastRange, currRange) {
    if (lastRange.maxVal + 1 === currRange.minVal) {
      return true;
    }
    return false;
  }

  /**
   * In selection range, if there are any adjacent selection ranges, i.e
   * [ SR(2,5), SR(5,8)] merge them => [ SR(2,8)]
   * @param {Array of SelectionRanges} rangeList - represents row selection
   */
  mergeAdjacentRanges(rangeList) {
    const mergedRanges = [];
    const sortRanges = (r1, r2) => r1.minVal - r2.minVal;

    rangeList.sort(sortRanges);
    rangeList.forEach((range) => {
      if (mergedRanges.length) {
        const lastRange = mergedRanges[mergedRanges.length - 1];
        if (SelectionTracker.rangesAdjacent(lastRange, range)) { // overlapping ranges
          mergedRanges[mergedRanges.length - 1] = this.merge(lastRange, range);
        } else {
          mergedRanges.push(range);
        }
      } else {
        mergedRanges.push(range);
      }
    });

    return mergedRanges;
  }

  static rangeFitsInBetween(nodeID, prevRange, currRange) {
    if (nodeID >= prevRange.maxVal && nodeID <= currRange.minVal) {
      return true;
    }
    return false;
  }

  /**
   * Inserts the new range into the appropriate spot to keep the selected Records
   * a sorted array of Selection Ranges.
   * @param {SelectionRange} newRange - new Range to be inserted
   * @param {Array of SelectionRanges} rangeList - represents row selection
   */
  insertRangeIntoSelection(newRange, rangeList) {
    let newRangeList = [...rangeList];
    const nodeID = newRange.minVal; // does not matter whether min or max val. min === max

    for (let i = 0; i < rangeList.length; i++) {
      const currRange = rangeList[i];
      if (i === 0) {
        if (nodeID < currRange.minVal) {
          newRangeList.unshift(newRange);
          newRangeList = this.mergeAdjacentRanges(newRangeList);
          const newSelectionTracker = new SelectionTracker();
          newSelectionTracker.rangeList = newRangeList;
          return newSelectionTracker;
        }
        if (rangeList.length === 1) {
          if (nodeID > currRange.maxVal) {
            newRangeList.push(newRange);
            newRangeList = this.mergeAdjacentRanges(newRangeList);
            const newSelectionTracker = new SelectionTracker();
            newSelectionTracker.rangeList = newRangeList;
            return newSelectionTracker;
          }
        }
      } else if (SelectionTracker.rangeFitsInBetween(nodeID, rangeList[i - 1], currRange)) {
        newRangeList.splice(i, 0, newRange);
        newRangeList = this.mergeAdjacentRanges(newRangeList);
        const newSelectionTracker = new SelectionTracker();
        newSelectionTracker.rangeList = newRangeList;
        return newSelectionTracker;
      } else if (i === rangeList.length - 1) { // END OF ARRAY
        if (nodeID > currRange.maxVal) {
          newRangeList.push(newRange);
          newRangeList = this.mergeAdjacentRanges(newRangeList);
          const newSelectionTracker = new SelectionTracker();
          newSelectionTracker.rangeList = newRangeList;
          return newSelectionTracker;
        }
      }
    }
    newRangeList = this.mergeAdjacentRanges(newRangeList);
    const newSelectionTracker = new SelectionTracker();
    newSelectionTracker.rangeList = newRangeList;
    return newSelectionTracker;
  }


  getTotalNumOfSelectedRows() {
    const selectedRecords = this.rangeList;
    let totalNumOfRows = 0;
    selectedRecords.forEach((range) => {
      const partialSum = range.length;
      totalNumOfRows += partialSum;
    });
    return totalNumOfRows;
  }
}


export {
  SelectionRange,
  SelectionTracker,
};
