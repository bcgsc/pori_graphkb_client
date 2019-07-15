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
      this.selectedRecords = [];
    } else {
      this.selectedRecords = [new SelectionRange(minVal, maxVal)];
    }
  }

  getSelection = () => this.selectedRecords;

  setSelection = (newSelection) => {
    this.selectedRecords = newSelection;
  };

  clone = () => {
    const newSelectionTracker = new SelectionTracker();
    const clonedSelectedRecords = [...this.getSelection()];
    newSelectionTracker.setSelection(clonedSelectedRecords);
    return newSelectionTracker;
  };

  isNodeAlreadySelected = (nodeID) => {
    const selectedRecords = this.getSelection();
    for (let i = 0; i < selectedRecords.length; i++) {
      const currInterval = selectedRecords[i];
      if (nodeID >= currInterval.minVal && nodeID <= currInterval.maxVal) {
        return true;
      }
    }
    return false;
  };

   findIntervalIndex = (nodeID) => {
     const selectedRecords = this.getSelection();
     for (let i = 0; i < selectedRecords.length; i++) {
       const currInterval = selectedRecords[i];
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
    const selectedRecords = this.getSelection();
    const { length } = this.getSelection();
    for (let i = intervalPrevNodeIsIn + 1; i <= length - 1; i++) {
      const targetInterval = selectedRecords[i];
      if ((targetInterval.minVal >= newInterval.minVal) && (targetInterval.maxVal <= newInterval.maxVal)) {
        intervalsToBeDeleted += 1;
      }
    }

    const newSelectionTracker = this.clone();
    let newSelectedRecords = newSelectionTracker.getSelection();
    newSelectedRecords.splice(intervalPrevNodeIsIn, intervalsToBeDeleted, newInterval);
    newSelectedRecords = this.mergeAdjacentIntervals(newSelectedRecords);
    newSelectionTracker.setSelection(newSelectedRecords);
    return newSelectionTracker;
  };

   backwardExtendAndUpdateIntervals = (intervalPrevNodeIsIn, newInterval) => {
     let intervalsToBeDeleted = 1;
     const selectedRecords = this.getSelection();
     for (let i = intervalPrevNodeIsIn; i >= 0; i--) {
       const targetInterval = selectedRecords[i];
       if ((targetInterval.minVal >= newInterval.minVal) && (targetInterval.maxVal <= newInterval.maxVal)) {
         intervalsToBeDeleted += 1;
       }
     }

     const insertPosition = (selectedRecords.length - intervalsToBeDeleted) + 1;
     const newSelectionTracker = this.clone();
     let newSelectedRecords = newSelectionTracker.getSelection();
     newSelectedRecords.splice(insertPosition, intervalsToBeDeleted, newInterval);
     newSelectedRecords = this.mergeAdjacentIntervals(newSelectedRecords);
     newSelectionTracker.setSelection(newSelectedRecords);
     return newSelectionTracker;
   };

   /*
   * In selection range, if there are any adjacent selection ranges, i.e
   * [ SR(2,5), SR(5,8)] merge them => [ SR(2,8)]
   */
  mergeAdjacentIntervals = (selectedRecords) => {
    let newSelectedRecords = [...selectedRecords];
    for (let i = 0; i < newSelectedRecords.length - 1; i++) {
      const currInterval = newSelectedRecords[i];
      if (currInterval.maxVal + 1 === newSelectedRecords[i + 1].minVal) {
        const mergedInterval = new SelectionRange(currInterval.minVal, newSelectedRecords[i + 1].maxVal);
        newSelectedRecords.splice(i, 2, mergedInterval);
        newSelectedRecords = this.mergeAdjacentIntervals(newSelectedRecords);
      }
    }

    return newSelectedRecords;
  };

  /*
   * Inserts the new interval into the appropriate spot to keep the selected Records
   * a sorted array of Selection Ranges.
   */
  insertIntervalIntoSelection = (newInterval, selectedRecords) => {
    let newSelectedRecords = [...selectedRecords];
    const nodeID = newInterval.minVal; // does not matter whether min or max val. min === max

    for (let i = 0; i < selectedRecords.length; i++) {
      const currInterval = selectedRecords[i];
      if (i === 0) {
        if (nodeID < currInterval.minVal) {
          newSelectedRecords.splice(i, 0, newInterval);
          newSelectedRecords = this.mergeAdjacentIntervals(newSelectedRecords);
          return newSelectedRecords;
        }
        if (selectedRecords.length === 1) {
          if (nodeID > currInterval.maxVal) {
            newSelectedRecords.splice(1, 0, newInterval);
            newSelectedRecords = this.mergeAdjacentIntervals(newSelectedRecords);
            return newSelectedRecords;
          }
        }
      } else if (nodeID >= selectedRecords[i - 1].maxVal && nodeID <= currInterval.minVal) {
        newSelectedRecords.splice(i, 0, newInterval);
        newSelectedRecords = this.mergeAdjacentIntervals(newSelectedRecords);
        return newSelectedRecords;
      } else if (i === selectedRecords.length - 1) { // END OF ARRAY
        if (nodeID > currInterval.maxVal) {
          newSelectedRecords.splice(i + 1, 0, newInterval);
          newSelectedRecords = this.mergeAdjacentIntervals(newSelectedRecords);
          return newSelectedRecords;
        }
      }
    }
    newSelectedRecords = this.mergeAdjacentIntervals(newSelectedRecords);
    return newSelectedRecords;
  };
}

export {
  SelectionRange,
  SelectionTracker,
};
