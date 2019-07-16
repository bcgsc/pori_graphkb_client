/* Represents a single range of selected Records */
class SelectionRange {
  constructor(minVal, maxVal) {
    this.minVal = minVal;
    this.maxVal = maxVal;
  }

  getLength = () => this.maxVal - this.minVal + 1;
}

/* Keeps track of selected nodeRows in DataTable. The selected nodeRows
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

  getSelection = () => this.rangeList;

  setSelection = (newSelection) => {
    this.rangeList = newSelection;
  };

  clone = () => {
    const newSelectionTracker = new SelectionTracker();
    const clonedSelectedRecords = [...this.getSelection()];
    newSelectionTracker.setSelection(clonedSelectedRecords);
    return newSelectionTracker;
  };

  isNodeAlreadySelected = (nodeID) => {
    const rangeList = this.getSelection();
    for (let i = 0; i < rangeList.length; i++) {
      const currInterval = rangeList[i];
      if (nodeID >= currInterval.minVal && nodeID <= currInterval.maxVal) {
        return true;
      }
    }
    return false;
  };

   findIntervalIndex = (nodeID) => {
     const rangeList = this.getSelection();
     for (let i = 0; i < rangeList.length; i++) {
       const currInterval = rangeList[i];
       if (nodeID >= currInterval.minVal && nodeID <= currInterval.maxVal) {
         return i;
       }
     }
     return -1;
   };

   /*
   * Extends the selection range that your previously selected nodeRow was in.
   * Removes any redundant selection ranges that result because of the extension.
   */

  forwardExtendAndUpdateIntervals = (intervalPrevNodeIsIn, newInterval) => {
    let intervalsToBeDeleted = 1;
    const rangeList = this.getSelection();
    const { length } = this.getSelection();
    for (let i = intervalPrevNodeIsIn + 1; i <= length - 1; i++) {
      const targetInterval = rangeList[i];
      if ((targetInterval.minVal >= newInterval.minVal) && (targetInterval.maxVal <= newInterval.maxVal)) {
        intervalsToBeDeleted += 1;
      }
    }

    const newSelectionTracker = this.clone();
    const newRangeList = newSelectionTracker.getSelection();
    newRangeList.splice(intervalPrevNodeIsIn, intervalsToBeDeleted, newInterval);
    const updatedRangeList = this.mergeAdjacentIntervals([...newRangeList]);
    newSelectionTracker.setSelection(updatedRangeList);
    return newSelectionTracker;
  };

   backwardExtendAndUpdateIntervals = (intervalPrevNodeIsIn, newInterval) => {
     let intervalsToBeDeleted = 1;
     const rangeList = this.getSelection();
     for (let i = intervalPrevNodeIsIn; i >= 0; i--) {
       const targetInterval = rangeList[i];
       if ((targetInterval.minVal >= newInterval.minVal) && (targetInterval.maxVal <= newInterval.maxVal)) {
         intervalsToBeDeleted += 1;
       }
     }

     const insertPosition = (rangeList.length - intervalsToBeDeleted) + 1;
     const newSelectionTracker = this.clone();
     const newRangeList = newSelectionTracker.getSelection();
     newRangeList.splice(insertPosition, intervalsToBeDeleted, newInterval);
     const updatedRangeList = this.mergeAdjacentIntervals([...newRangeList]);
     newSelectionTracker.setSelection(updatedRangeList);
     return newSelectionTracker;
   };

  merge = (r1, r2) => new SelectionRange(r1.minVal, r2.maxVal);

  /*
   * In selection range, if there are any adjacent selection ranges, i.e
   * [ SR(2,5), SR(5,8)] merge them => [ SR(2,8)]
   */

  mergeAdjacentIntervals = (rangeList) => {
    const mergedRanges = [];
    const sortRanges = (r1, r2) => r1.minVal - r2.minVal;

    rangeList.sort(sortRanges);
    rangeList.forEach((range) => {
      if (mergedRanges.length) {
        const lastRange = mergedRanges[mergedRanges.length - 1];
        if (lastRange.maxVal + 1 === range.minVal) { // overlapping ranges
          mergedRanges[mergedRanges.length - 1] = this.merge(lastRange, range);
        } else {
          mergedRanges.push(range);
        }
      } else {
        mergedRanges.push(range);
      }
    });

    return mergedRanges;
  };

  /*
   * Inserts the new interval into the appropriate spot to keep the selected Records
   * a sorted array of Selection Ranges.
   */
  insertIntervalIntoSelection = (newInterval, rangeList) => {
    let newRangeList = [...rangeList];
    const nodeID = newInterval.minVal; // does not matter whether min or max val. min === max

    for (let i = 0; i < rangeList.length; i++) {
      const currInterval = rangeList[i];
      if (i === 0) {
        if (nodeID < currInterval.minVal) {
          newRangeList.unshift(newInterval);
          newRangeList = this.mergeAdjacentIntervals(newRangeList);
          return newRangeList;
        }
        if (rangeList.length === 1) {
          if (nodeID > currInterval.maxVal) {
            newRangeList.push(newInterval);
            newRangeList = this.mergeAdjacentIntervals(newRangeList);
            return newRangeList;
          }
        }
      } else if (nodeID >= rangeList[i - 1].maxVal && nodeID <= currInterval.minVal) {
        newRangeList.splice(i, 0, newInterval);
        newRangeList = this.mergeAdjacentIntervals(newRangeList);
        return newRangeList;
      } else if (i === rangeList.length - 1) { // END OF ARRAY
        if (nodeID > currInterval.maxVal) {
          newRangeList.push(newInterval);
          newRangeList = this.mergeAdjacentIntervals(newRangeList);
          return newRangeList;
        }
      }
    }
    newRangeList = this.mergeAdjacentIntervals(newRangeList);
    return newRangeList;
  };
}

export {
  SelectionRange,
  SelectionTracker,
};
