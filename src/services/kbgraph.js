const DEFAULT_NODE_VPROPS = [
  'source.name',
  '@class',
  'name',
];
const DEFAULT_LINK_VPROPS = [
  'source.name',
  '@class',
];


export default class PropsMap {
  constructor() {
    this.nodeProps = {};
    this.linkProps = {};
  }

  loadNode(node, validProps = DEFAULT_NODE_VPROPS) {
    this._loadObj('node', node, validProps);
  }

  loadLink(link, validProps = DEFAULT_LINK_VPROPS) {
    this._loadObj('link', link, validProps);
  }

  removeNode(node, nodes, validProps = DEFAULT_NODE_VPROPS) {
    this._removeObj('node', node, nodes, validProps);
  }

  removeLink(link, links, validProps = DEFAULT_LINK_VPROPS) {
    this._removeObj('link', link, links, validProps);
  }


  _removeObj(type, graphObj, graphObjs, validProps) {
    this[`${type}Props`] = {};
    graphObjs.forEach((g) => {
      if (g.data !== graphObj) {
        this._loadObj(type, g.data, validProps);
      }
    });
  }

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
