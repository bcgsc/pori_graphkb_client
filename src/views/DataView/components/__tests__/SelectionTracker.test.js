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
});

describe('SelectionTracker Class', () => {
  it('initializes with correct selection range', () => {
    const emptySelectionTracker = new SelectionTracker();
    expect(emptySelectionTracker.rangeList.length).toBe(0);
    expect(emptySelectionTracker.rangeList).toEqual([]);

    const selectionTracker = new SelectionTracker(10, 1000);
    expect(selectionTracker.rangeList.length).toBe(1);
    expect(selectionTracker.rangeList).toEqual([new SelectionRange(10, 1000)]);
  });

  it('clone method works', () => {
    const selectionTracker = new SelectionTracker(10, 100);
    const clonedSelectionTracker = selectionTracker.clone();
    expect(selectionTracker).toEqual(clonedSelectionTracker);
    expect(selectionTracker).not.toBe(clonedSelectionTracker);
  });

  it('testing extension methods', () => {
    const selectionTracker = new SelectionTracker(10, 20);
    // forward extend [SR(10,20)] -> [SR(10, 30)]
    const forwardExtendedST = SelectionTracker.extendRangeUpdateSelection(10, 30, selectionTracker);
    expect(forwardExtendedST.rangeList.length).toBe(1);
    expect(forwardExtendedST.getTotalNumOfSelectedRows()).toBe(21);

    // backward extend [SR(10,30)] -> [SR(0, 30)]
    const backwardExtendedST = SelectionTracker.extendRangeUpdateSelection(10, 0, forwardExtendedST);
    expect(backwardExtendedST.rangeList.length).toBe(1);
    expect(backwardExtendedST.getTotalNumOfSelectedRows()).toBe(31);

    // add a selection range to tracker
    // [SR(0,30), SR(50,50)]
    const newSelectionTracker = SelectionTracker.addSingleRange(50, backwardExtendedST);
    expect(newSelectionTracker.rangeList.length).toBe(2);
    expect(newSelectionTracker.getTotalNumOfSelectedRows()).toBe(32);

    const forwardExtST = SelectionTracker.extendRangeUpdateSelection(50, 100, newSelectionTracker);
    expect(forwardExtST.rangeList.length).toBe(2);
    expect(forwardExtST.getTotalNumOfSelectedRows()).toBe(82);

    // backward extend and merge ranges
    // [SR(0,30), SR(50,100)] -> [SR(0,100)]
    const backwardExtST = SelectionTracker.extendRangeUpdateSelection(50, 31, forwardExtST);
    expect(backwardExtST.rangeList.length).toBe(1);
    expect(backwardExtST.getTotalNumOfSelectedRows()).toBe(101);
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
    let selectionTracker = new SelectionTracker(0, 5);
    for (let i = 1; i <= 10; i++) {
      selectionTracker = SelectionTracker.addSingleRange(i * 10, selectionTracker);
    }

    expect(selectionTracker.rangeList.length).toBe(11);

    for (let i = 0; i <= 10; i++) {
      expect(selectionTracker.findRangeIndex(i * 10)).toBe(i);
    }

    const badValues = [6, 11, 21, 31, 41, 51, 61, 200];
    badValues.forEach((id) => {
      expect(selectionTracker.findRangeIndex(id)).toBe(-1);
    });
  });

  it('rangeRedundant method', () => {
    let selectionTracker = new SelectionTracker(0, 5);
    for (let i = 1; i <= 10; i++) {
      selectionTracker = SelectionTracker.addSingleRange(i * 10, selectionTracker);
    }
    expect(selectionTracker.rangeList.length).toBe(11);

    const rangeRedundantSpy = jest.spyOn(SelectionRange.prototype, 'rangeRedundant');
    const forwardExtST = SelectionTracker.extendRangeUpdateSelection(5, 200, selectionTracker);

    expect(forwardExtST.rangeList.length).toBe(1);
    expect(rangeRedundantSpy).toHaveBeenCalledTimes(10);
  });

  it('get total number of rows returns correct values', () => {
    const emptySelectionTracker = new SelectionTracker();
    expect(emptySelectionTracker.getTotalNumOfSelectedRows()).toBe(0);

    const selectionTracker = new SelectionTracker(10, 100);
    expect(selectionTracker.getTotalNumOfSelectedRows()).toBe(91);
  });

  it('checkAndUpdate method', () => {
    let selectionTracker = new SelectionTracker(0, 5);
    for (let i = 1; i <= 10; i++) {
      selectionTracker = SelectionTracker.addSingleRange(i * 10, selectionTracker);
    }

    expect(selectionTracker.rangeList.length).toBe(11);

    const sameSelectionTracker = selectionTracker.checkAndUpdate(3, selectionTracker);
    expect(sameSelectionTracker).toEqual(selectionTracker);

    const diffSelectionTracker = selectionTracker.checkAndUpdate(7, selectionTracker);
    expect(diffSelectionTracker).not.toEqual(selectionTracker);
    expect(diffSelectionTracker.rangeList.length).toBe(12);
  });

  it('rangeFitsInBetween method', () => {
    const lowRange = new SelectionRange(0, 5);
    const highRange = new SelectionRange(10, 20);
    expect(SelectionTracker.rangeFitsInBetween(3, lowRange, highRange)).toBe(false);
    expect(SelectionTracker.rangeFitsInBetween(7, lowRange, highRange)).toBe(true);
    expect(SelectionTracker.rangeFitsInBetween(9, lowRange, highRange)).toBe(true);
    expect(SelectionTracker.rangeFitsInBetween(30, lowRange, highRange)).toBe(false);
  });
});
