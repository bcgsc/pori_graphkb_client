class SelectionTracker {

}

class SelectionRange {
  constructor(minVal, maxVal) {
    this.minVal = minVal;
    this.maxVal = maxVal;
    this.count = maxVal - minVal + 1;
  }
}
