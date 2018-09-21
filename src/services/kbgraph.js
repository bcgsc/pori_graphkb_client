const DEFAULT_NODE_VPROPS = [
  'source.name',
  '@class',
  'name',
];
const DEFAULT_LINK_VPROPS = [
  'source.name',
  '@class',
];


/**
 * Class to define graph props maps, which keeps track of the different
 * properties that graph objects can be colored by, and the different entries
 * in of each.
 */
export default class PropsMap {
  constructor() {
    this.nodeProps = {};
    this.linkProps = {};
  }

  /**
   * Loads a node's properties into the propsmap.
   * @param {Object} node - Ontology object (GraphNode.data).
   * @param {Array<string>} validProps - List of valid ontology properties.
   */
  loadNode(node, validProps = DEFAULT_NODE_VPROPS) {
    this._loadObj('node', node, validProps);
  }

  /**
   * Loads a link's properties into the propsmap.
   * @param {Object} link - KB edge object.
   * @param {Array<string>} validProps - List of valid edge properties.
   */
  loadLink(link, validProps = DEFAULT_LINK_VPROPS) {
    this._loadObj('link', link, validProps);
  }

  /**
   * Updates the propsMap after a node has been removed from the graph.
   * @param {Object} node - Ontology object
   * @param {Array<Object>} nodes - Graph nodes list.
   * @param {Array<string>} validProps - List of valid ontology properties.
   */
  removeNode(node, nodes, validProps = DEFAULT_NODE_VPROPS) {
    this._removeObj('node', node, nodes, validProps);
  }

  /**
   * Updates the propsMap after a link has been removed from the graph.
   * @param {Object} link - KB edge object.
   * @param {Array<Object>} links - Graph links list.
   * @param {Array<string>} validProps - List of valid edge properties.
   */
  removeLink(link, links, validProps = DEFAULT_LINK_VPROPS) {
    this._removeObj('link', link, links, validProps);
  }


  /**
   * Updates propsMap after an object is removed.
   * @param {string} type - Type of object: ['node', 'link'].
   * @param {Object} graphObj - Removed object.
   * @param {Array<Object>} graphObjs - Graph objects (of type 'type') list.
   * @param {Array<string>} validProps - List of valid properties for object
   * type.
   */
  _removeObj(type, graphObj, graphObjs, validProps) {
    this[`${type}Props`] = {};
    graphObjs.forEach((g) => {
      if (g.data !== graphObj) {
        this._loadObj(type, g.data, validProps);
      }
    });
  }

  /**
   * Loads a object's properties into the propsMap.
   * @param {string} type - Type of object: ['node', 'link']
   * @param {Object} graphObj - Loaded object.
   * @param {Array<string>} validProps - List of valid properties for object
   * type.
   */
  _loadObj(type, graphObj, validProps) {
    const props = this[`${type}Props`];
    validProps.forEach((prop) => {
      if (props[prop] === undefined) {
        props[prop] = [];
      }

      let obj;
      if (prop.includes('.')) {
        const [key, nestedKey] = prop.split('.');
        obj = (graphObj[key] || {})[nestedKey];
      } else {
        obj = graphObj[prop];
      }

      if (obj && (obj.length < 50 || prop === 'name')
        && !Array.isArray(obj)
      ) {
        if (props[prop] && !props[prop].includes(obj)) {
          props[prop].push(obj);
        }
      } else if (props[prop] && !props[prop].includes('null')) {
        // This null represents nodes that do not contain specified property.
        props[prop].push('null');
      }

      if ((obj && obj.length >= 50 && prop !== 'name') || Array.isArray(obj)) {
        props[prop] = null;
      }
    });
  }
}
