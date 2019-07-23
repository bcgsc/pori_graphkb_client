/** Represents a single range of selected Records */
class SelectionRange {
  constructor(minVal, maxVal) {
    this.minVal = minVal;
    this.maxVal = maxVal;
  }

  get length() { return this.maxVal - this.minVal + 1; }

  merge(range) { return new SelectionRange(this.minVal, range.maxVal); }

  rangeContainsNode(nodeID) {
    if (nodeID >= this.minVal && nodeID <= this.maxVal) {
      return true;
    }
    return false;
  }

  /**
   * Check to see if the inputed range is directly behind current range.
   */
  rangesAdjacent(range) {
    if (this.maxVal + 1 === range.minVal) {
      return true;
    }
    return false;
  }

  /**
   * Checks to see if current Range contains the target Range.
   */
  rangeRedundant(range) {
    if ((this.minVal >= range.minVal) && (this.maxVal <= range.maxVal)) {
      return true;
    }
    return false;
  }
}

/**
 * Keeps track of selected nodeRows in DataTable. The selected nodeRows
 * are maintained as a sorted list of SelectionRanges. I.E SelectionTracker
 * would maintain selected records: (1,2,3,7,8,9) as [SR(1,3), SR(7,9)]
 */
class SelectionTracker {
  constructor(minVal, maxVal) {
    if (minVal === undefined || maxVal === undefined) {
      this.selection = [];
    } else {
      this.selection = [new SelectionRange(minVal, maxVal)];
    }
  }

  clone() {
    const newSelectionTracker = new SelectionTracker();
    const clonedSelectedRecords = [];
    this.selection.forEach((range) => {
      const newRange = new SelectionRange(range.minVal, range.maxVal);
      clonedSelectedRecords.push(newRange);
    });
    newSelectionTracker.selection = clonedSelectedRecords;
    return newSelectionTracker;
  }

  /**
   * Checks to see whether the selected range extension should be executed
   * in the forward or backward direction. Returns the updated SelectionTracker.
   * @param {integer} prevNodeID - ID of the last selected nodeRow
   * @param {integer} nodeID - ID of the currently selected nodeRow
   * @param {SelectionTracker} selectionTracker - current selection to be updated
   */
  static extendRangeUpdateSelection(prevNodeID, nodeID, selectionTracker) {
    const prevNodeRangeIndex = selectionTracker.findRangeIndex(prevNodeID);
    const prevNodeRange = selectionTracker.selection[prevNodeRangeIndex];
    let newSelectionTracker;
    if (nodeID > prevNodeID) {
      const newRange = new SelectionRange(prevNodeRange.minVal, nodeID);
      newSelectionTracker = selectionTracker.forwardExtendAndUpdateRanges(prevNodeRangeIndex, newRange);
    } else {
      const newRange = new SelectionRange(nodeID, prevNodeRange.maxVal);
      newSelectionTracker = selectionTracker.backwardExtendAndUpdateRanges(prevNodeRangeIndex, newRange);
    }
    return newSelectionTracker;
  }

  /**
   * Adds a single SelectionRange SR[x,x] into the current SelectionTracker with
   * a length of 1. Updates the selection and returns an updated Selection.
   * @param {integer} nodeID - ID of the currently selected nodeRow
   * @param {SelectionTracker} selectionTracker - current selection to be updated
   */
  static addSingleRange(nodeID, selectionTracker) {
    const newRange = new SelectionRange(nodeID, nodeID);
    const selectedRecords = selectionTracker.selection;

    // Add new Range in selection at it's appropriate spot.
    const newSelectionTracker = SelectionTracker.insertRangeIntoSelection(newRange, selectedRecords);
    return newSelectionTracker;
  }

  /**
   * In selection range, if there are any adjacent selection ranges, i.e
   * [ SR(2,5), SR(5,8)] merge them => [ SR(2,8)]
   * @param {Array of SelectionRanges} selection - represents row selection
   */
  static mergeAdjacentRanges(selection) {
    const mergedRanges = [];
    const sortRanges = (r1, r2) => r1.minVal - r2.minVal;

    selection.sort(sortRanges);
    selection.forEach((range) => {
      if (mergedRanges.length) {
        const lastRange = mergedRanges[mergedRanges.length - 1];
        if (lastRange.rangesAdjacent(range)) { // overlapping ranges
          mergedRanges[mergedRanges.length - 1] = lastRange.merge(range);
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
   * @param {Array of SelectionRanges} selection - represents row selection
   */
  static insertRangeIntoSelection(newRange, selection) {
    const newRangeList = [...selection];
    newRangeList.push(newRange);
    const sortRanges = (r1, r2) => r1.minVal - r2.minVal;
    newRangeList.sort(sortRanges);

    const updatedRangeList = SelectionTracker.mergeAdjacentRanges(newRangeList);
    const newSelectionTracker = new SelectionTracker();
    newSelectionTracker.selection = updatedRangeList;
    return newSelectionTracker;
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
    const { length } = this.selection;
    for (let i = rangePrevNodeIsIn + 1; i <= length - 1; i++) {
      const targetRange = this.selection[i];
      if (targetRange.rangeRedundant(newRange)) {
        rangesToBeDeleted += 1;
      }
    }

    const newSelectionTracker = this.clone();
    const newRangeList = newSelectionTracker.selection;
    newRangeList.splice(rangePrevNodeIsIn, rangesToBeDeleted, newRange);
    const updatedRangeList = SelectionTracker.mergeAdjacentRanges([...newRangeList]);
    newSelectionTracker.selection = updatedRangeList;
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
    for (let i = rangePrevNodeIsIn; i >= 0; i--) {
      const targetRange = this.selection[i];
      if (targetRange.rangeRedundant(newRange)) {
        rangesToBeDeleted += 1;
      }
    }

    const insertPosition = (this.selection.length - rangesToBeDeleted) + 1;
    const newSelectionTracker = this.clone();
    const newRangeList = newSelectionTracker.selection;
    newRangeList.splice(insertPosition, rangesToBeDeleted, newRange);
    const updatedRangeList = SelectionTracker.mergeAdjacentRanges([...newRangeList]);
    newSelectionTracker.selection = updatedRangeList;
    return newSelectionTracker;
  }

  isNodeAlreadySelected(nodeID) {
    return this.selection.some(range => range.rangeContainsNode(nodeID));
  }

  findRangeIndex(nodeID) {
    for (let i = 0; i < this.selection.length; i++) {
      const currRange = this.selection[i];
      if (currRange.rangeContainsNode(nodeID)) {
        return i;
      }
    }
    return -1;
  }

  getTotalNumOfSelectedRows() {
    const selectedRecords = this.selection;
    let totalNumOfRows = 0;
    selectedRecords.forEach((range) => {
      const partialSum = range.length;
      totalNumOfRows += partialSum;
    });
    return totalNumOfRows;
  }

  /**
   * Returns the same selection if nodeID already exists in the selection,
   * otherwise it adds a single selection range SR[x, x] to the selection tracker
   * @param {integer} nodeID - ID of the currently selected nodeRow
   * @param {SelectionTracker} selectionTracker - current selection to be updated
   */
  checkAndUpdate(nodeID, selectionTracker) {
    const isCurrNodeInSelection = this.isNodeAlreadySelected(nodeID);
    let newSelectionTracker;
    if (isCurrNodeInSelection) {
      newSelectionTracker = selectionTracker;
    } else {
      newSelectionTracker = SelectionTracker.addSingleRange(nodeID, selectionTracker);
    }
    return newSelectionTracker;
  }
}

export {
  SelectionRange,
  SelectionTracker,
};
