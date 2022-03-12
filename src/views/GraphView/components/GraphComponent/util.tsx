const TREE_LINK = 'SubClassOf';

const getId = node => (node.data
  ? node.data['@rid']
  : node['@rid'] || node);

/**
 * Use the graph links to rank nodes in the graph based on their subclass relationships. Root nodes
 * are given 0 and child nodes are given 1 more than the rank of their highest ranked parent node
 */
const computeNodeLevels = (graphLinks) => {
  const nodes = {};
  graphLinks.forEach((edge) => {
    const { data: { out: src, in: tgt, '@class': edgeType } } = edge;

    if (edgeType === TREE_LINK) {
      const srcId = getId(src);
      const tgtId = getId(tgt);
      nodes[srcId] = nodes[srcId] || { id: srcId, children: [], parents: [] };
      nodes[tgtId] = nodes[tgtId] || { id: tgtId, children: [], parents: [] };
      nodes[srcId].children.push(tgtId);
      nodes[tgtId].parents.push(srcId);
    }
  });

  const queue = Object.values(nodes).filter(node => node.parents.length === 0);
  const ranks = {};

  queue.forEach((root) => {
    ranks[root.id] = 0;
  });

  while (queue.length) {
    const curr = queue.shift();

    curr.children.forEach((childId) => {
      if (childId) {
        ranks[childId] = Math.max(ranks[childId] || 0, ranks[curr.id] + 1);
        queue.push(nodes[childId]);
      }
    });
  }
  return ranks;
};

const copyURLToClipBoard = (snackbar) => {
  const URL = window.location.href;
  // create temp dummy element to select and copy text to clipboard
  const dummy = document.createElement('input');
  document.body.appendChild(dummy);
  dummy.value = URL;
  dummy.select();
  document.execCommand('copy');
  document.body.removeChild(dummy);

  // const snackbar = this.context;
  snackbar.enqueueSnackbar('URL has been copied to your clip-board!', { variant: 'success' });
};

export {
  computeNodeLevels,
  copyURLToClipBoard,
  getId,
  TREE_LINK,
};
