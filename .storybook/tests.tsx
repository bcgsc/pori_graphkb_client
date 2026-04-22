import { waitFor } from '@testing-library/react';
import { expect, test } from 'vitest';

export function createSnapshotTest(testName: string, story: { run: () => Promise<void>; composed: { parameters: { snapshot: boolean; }}}) {
  if (!story.composed.parameters?.snapshot) return;
  return test(testName, { timeout: 30000 }, async () => {
    await story.run();
    // make sure done loading
    await waitFor(() => {
      expect(document.querySelectorAll('.MuiTouchRipple-childLeaving'), 'has no button ripples in progress').toHaveLength(0);
    });
    const children = Array.from(document.body.childNodes).filter((node) => (node.nodeName !== '#text' || node.textContent?.trim() != '') && !(node as Element).classList?.contains('sb-wrapper'));
    const child = children.length <= 1 ? children[0] : children;
    expect(child).toMatchSnapshot();
  });
}