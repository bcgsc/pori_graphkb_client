import * as qs from 'qs';

const hashRecordsByRID = (data) => {
  const newData = {};
  data.forEach((obj) => {
    if (obj) {
      newData[obj['@rid']] = obj;
    }
  });
  return newData;
};

/**
 * Save graph state (nodeRIDS) to URL and jump to graphview with nodeRIDs as initial seed
 *
 * @param {Arrayof.<strings>} nodeRIDs an array of node RIDs
 * @param {object} history history object
 * @param {function} onErrorCallback callback function to call if error occurs
 */
const navigateToGraphview = (nodeRIDs, history, onErrorCallback) => {
  const savedState = {};
  let encodedState;

  try {
    const stringifiedState = JSON.stringify(nodeRIDs);
    const base64encodedState = btoa(stringifiedState);
    const encodedContent = encodeURIComponent(base64encodedState);

    savedState.nodes = encodedContent;
    encodedState = qs.stringify(savedState);
  } catch (err) {
    onErrorCallback(err);
  }

  history.push({
    pathname: '/data/graph',
    search: `${encodedState}`,
  });
};

/**
 * parses through URL and decodes it to return an array of node RIDs.
 */
const getNodeRIDsFromURL = () => {
  const URLBeforeNodeEncoding = window.location.href.split('nodes')[0];
  const encodedData = window.location.href.split(URLBeforeNodeEncoding)[1];
  const { nodes } = qs.parse(encodedData.replace(/^\?/, ''));

  const decodedContent = decodeURIComponent(nodes);
  const base64decoded = atob(decodedContent);
  const decodedNodes = JSON.parse(base64decoded);
  return decodedNodes;
};

export {
  getNodeRIDsFromURL,
  hashRecordsByRID,
  navigateToGraphview,
};
