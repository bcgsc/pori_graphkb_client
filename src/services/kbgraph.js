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
    const props = this[`${type}Props`];
    validProps.forEach((prop) => {
      let obj;
      let key;
      let superKey;
      if (prop.includes('.')) {
        [superKey, key] = prop.split('.');
        obj = graphObj[superKey];
      } else {
        key = prop;
        obj = graphObj;
      }

      if (
        props[prop]
        && obj
        && !graphObjs.find((n) => {
          let nObj = n.data;

          // Nested prop condition
          if (prop.includes('.')) {
            nObj = n.data[prop.split('.')[0]] || {};
          }
          return nObj[key] === obj[key];
        })
      ) {
        const j = props[prop].indexOf(obj[key]);
        props[prop].splice(j, 1);
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
