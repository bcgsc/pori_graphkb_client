import { SelectionRange, SelectionTracker } from '../SelectionTracker';

describe('SelectionRange Class', () => {
  it('get length returns correct length', () => {
    const largeRange = new SelectionRange(0, 1000);
    expect(largeRange.length).toBe(1001);

    const smallRange = new SelectionRange(0, 5);
    expect(smallRange.length).toBe(6);

    const singleValRange = new SelectionRange(3, 3);
    expect(singleValRange.length).toBe(1);
  });

  it('rangeRedundant method', () => {
    const selectionRange = new SelectionRange(10, 20);
    const containedByRange = new SelectionRange(0, 30);
    const frontOverlapRange = new SelectionRange(0, 11);
    const rearOverlapRange = new SelectionRange(17, 25);

    expect(selectionRange.rangeRedundant(containedByRange)).toBe(true);
    expect(selectionRange.rangeRedundant(frontOverlapRange)).toBe(false);
    expect(selectionRange.rangeRedundant(rearOverlapRange)).toBe(false);
  });
});

describe('SelectionTracker Class', () => {
  let multiRangeST;
  // creates rangeList [SR(0,5), SR(10,10), SR(20,20)... SR(100,100)]
  beforeEach(() => {
    multiRangeST = new SelectionTracker(0, 5);
    for (let i = 1; i <= 10; i++) {
      multiRangeST = SelectionTracker.addSingleRange(i * 10, multiRangeST);
    }
  });
  it('initializes with correct selection range', () => {
    const emptySelectionTracker = new SelectionTracker();
    expect(emptySelectionTracker.selection.length).toBe(0);
    expect(emptySelectionTracker.selection).toEqual([]);

    const selectionTracker = new SelectionTracker(10, 1000);
    expect(selectionTracker.selection.length).toBe(1);
    expect(selectionTracker.selection).toEqual([new SelectionRange(10, 1000)]);
  });

  it('clone method works', () => {
    const selectionTracker = new SelectionTracker(10, 100);
    const clonedSelectionTracker = selectionTracker.clone();
    expect(selectionTracker).toEqual(clonedSelectionTracker);
    expect(selectionTracker).not.toBe(clonedSelectionTracker);
  });

  it('backward extension method', () => {
    expect(multiRangeST.selection.length).toBe(11);
    const backwardExtendedST = SelectionTracker.extendRangeUpdateSelection(100, 6, multiRangeST);
    expect(backwardExtendedST.selection.length).toBe(1);
    expect(backwardExtendedST.getTotalNumOfSelectedRows()).toBe(101);
  });

  it('forward extension method', () => {
    expect(multiRangeST.selection.length).toBe(11);
    let forwardExtendedST = SelectionTracker.extendRangeUpdateSelection(10, 101, multiRangeST);
    expect(forwardExtendedST.selection.length).toBe(2);
    expect(forwardExtendedST.getTotalNumOfSelectedRows()).toBe(98);

    forwardExtendedST = SelectionTracker.extendRangeUpdateSelection(5, 9, forwardExtendedST);
    expect(forwardExtendedST.selection.length).toBe(1);
    expect(forwardExtendedST.getTotalNumOfSelectedRows()).toBe(102);
  });

  it('isNodeAlreadySelected method ', () => {
    const selectionTracker = new SelectionTracker(50, 100);
    const updatedST = SelectionTracker.addSingleRange(200, selectionTracker);
    const forwardExtendedST = SelectionTracker.extendRangeUpdateSelection(200, 300, updatedST);

    const valuesExpectedToBeTrue = [50, 75, 100, 200, 250, 300];
    const valuesExpectedToBeFalse = [0, 190, 199, 301];
    valuesExpectedToBeTrue.forEach((id) => {
      expect(forwardExtendedST.isNodeAlreadySelected(id)).toBe(true);
    });

    valuesExpectedToBeFalse.forEach((id) => {
      expect(forwardExtendedST.isNodeAlreadySelected(id)).toBe(false);
    });
  });

  it('findRangeIndex method', () => {
    expect(multiRangeST.selection.length).toBe(11);

    for (let i = 0; i <= 10; i++) {
      expect(multiRangeST.findRangeIndex(i * 10)).toBe(i);
    }

    const badValues = [6, 11, 21, 31, 41, 51, 61, 200];
    badValues.forEach((id) => {
      expect(multiRangeST.findRangeIndex(id)).toBe(-1);
    });
  });

  it('rangeRedundant method', () => {
    expect(multiRangeST.selection.length).toBe(11);

    const rangeRedundantSpy = jest.spyOn(SelectionRange.prototype, 'rangeRedundant');
    const forwardExtST = SelectionTracker.extendRangeUpdateSelection(5, 200, multiRangeST);

    expect(forwardExtST.selection.length).toBe(1);
    expect(rangeRedundantSpy).toHaveBeenCalledTimes(10);
  });

  it('get total number of rows returns correct values', () => {
    const emptySelectionTracker = new SelectionTracker();
    expect(emptySelectionTracker.getTotalNumOfSelectedRows()).toBe(0);

    const selectionTracker = new SelectionTracker(10, 100);
    expect(selectionTracker.getTotalNumOfSelectedRows()).toBe(91);
  });

  it('checkAndUpdate method', () => {
    expect(multiRangeST.selection.length).toBe(11);

    const sameSelectionTracker = multiRangeST.checkAndUpdate(3, multiRangeST);
    expect(sameSelectionTracker).toEqual(multiRangeST);

    const diffSelectionTracker = multiRangeST.checkAndUpdate(7, multiRangeST);
    expect(diffSelectionTracker).not.toEqual(multiRangeST);
    expect(diffSelectionTracker.selection.length).toBe(12);
  });

  it('rangeFitsInBetween method', () => {
    const lowRange = new SelectionRange(0, 5);
    const highRange = new SelectionRange(10, 20);
    expect(SelectionTracker.rangeFitsInBetween(3, lowRange, highRange)).toBe(false);
    expect(SelectionTracker.rangeFitsInBetween(7, lowRange, highRange)).toBe(true);
    expect(SelectionTracker.rangeFitsInBetween(9, lowRange, highRange)).toBe(true);
    expect(SelectionTracker.rangeFitsInBetween(30, lowRange, highRange)).toBe(false);
  });

  it('mergeAdjacentRanges method', () => {
    let evenSelectionRange = new SelectionTracker();
    for (let i = 0; i < 12; i += 2) {
      evenSelectionRange = SelectionTracker.addSingleRange(i, evenSelectionRange);
    }
    expect(evenSelectionRange.selection.length).toBe(6);
    evenSelectionRange = SelectionTracker.addSingleRange(1, evenSelectionRange);
    expect(evenSelectionRange.selection.length).toBe(5);
    evenSelectionRange = SelectionTracker.addSingleRange(3, evenSelectionRange);
    expect(evenSelectionRange.selection.length).toBe(4);
    evenSelectionRange = SelectionTracker.addSingleRange(5, evenSelectionRange);
    expect(evenSelectionRange.selection.length).toBe(3);
    evenSelectionRange = SelectionTracker.addSingleRange(7, evenSelectionRange);
    expect(evenSelectionRange.selection.length).toBe(2);
    evenSelectionRange = SelectionTracker.addSingleRange(9, evenSelectionRange);
    expect(evenSelectionRange.selection.length).toBe(1);
  });
});
