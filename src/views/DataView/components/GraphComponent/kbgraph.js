import config from '../../../../static/config';

const DEFAULT_NODE_VPROPS = [
  'source.name',
  '@class',
  'name',
];
const DEFAULT_LINK_VPROPS = [
  'source.name',
  '@class',
  '@rid',
];

const GRAPH_OPTIONS_KEY = 'graphOptions';
const MAX_LABEL_LENGTH = 25;

const {
  LINK_STRENGTH,
  CHARGE_STRENGTH,
  DEFAULT_NODE_COLOR,
  COLLISION_RADIUS,
  CHARGE_MAX,
} = config.GRAPH_DEFAULTS;

const isObject = (val) => {
  if (val === null) { return false; }
  return ((typeof val === 'function') || (typeof val === 'object'));
};

/**
 * Represents an object in the d3 force directed graph.
 */
class GraphObj {
  /**
   * Returns the underlying record ID.
   */
  getId() {
    return this.data['@rid'];
  }

  /**
   * Finds suggested property value and displays it as this nodes label.
   * @param {string} labelKey - Property key to display as node label.
   */
  getLabel(labelKey) {
    let obj = this.data;
    let key = labelKey;
    let parentKey;
    if (labelKey.includes('.')) {
      [parentKey, key] = labelKey.split('.');
      obj = this.data[parentKey];
    }
    const label = obj && obj[key];
    if (label && label.length > MAX_LABEL_LENGTH) {
      return `${label.substring(0, MAX_LABEL_LENGTH - 4).trim()}...`;
    }
    return label;
  }
}


/**
 * Represents a d3 force directed graph node.
 */
class GraphNode extends GraphObj {
  constructor(data, x, y) {
    super();
    this.data = data || {};
    this.x = x || 0;
    this.y = y || 0;
  }
}


/**
 * Represents a d3 force directed graph link object.
 */
class GraphLink extends GraphObj {
  constructor(data, source, target) {
    super();
    this.data = data || {};
    this.source = source;
    this.target = target;
  }

  /**
   * Returns edge 'out' record ID.
   */
  getOutRid() {
    return typeof this.source === 'string' ? this.source : this.source.data['@rid'];
  }

  /**
   * Returns edge 'out' record ID.
   */
  getInRid() {
    return typeof this.target === 'string' ? this.target : this.target.data['@rid'];
  }
}


/**
 * Class to define graph props maps, which keeps track of the different
 * properties that graph objects can be colored by, and the different entries
 * in of each.
 */
class PropsMap {
  constructor() {
    this.nodeProps = {};
    this.linkProps = {};
  }

  /**
   * Loads a node's properties into the propsmap.
   * @param {Object} node - Ontology object (GraphNode.data).
   * @param {Array.<string>} validProps - List of valid ontology properties.
   */
  loadNode(node, validProps = DEFAULT_NODE_VPROPS) {
    this._loadObj('node', node, validProps);
  }

  /**
   * Loads a link's properties into the propsmap.
   * @param {Object} link - KB edge object.
   * @param {Array.<string>} validProps - List of valid edge properties.
   */
  loadLink(link, validProps = DEFAULT_LINK_VPROPS) {
    this._loadObj('link', link, validProps);
  }

  /**
   * Updates the propsMap after a node has been removed from the graph.
   * @param {Object} node - Ontology object
   * @param {Array.<Object>} nodes - Graph nodes list.
   * @param {Array.<string>} validProps - List of valid ontology properties.
   */
  removeNode(node, nodes, validProps = DEFAULT_NODE_VPROPS) {
    this._removeObj('node', node, nodes, validProps);
  }

  /**
   * Updates the propsMap after a link has been removed from the graph.
   * @param {Object} link - KB edge object.
   * @param {Array.<Object>} links - Graph links list.
   * @param {Array.<string>} validProps - List of valid edge properties.
   */
  removeLink(link, links, validProps = DEFAULT_LINK_VPROPS) {
    this._removeObj('link', link, links, validProps);
  }


  /**
   * Updates propsMap after an object is removed.
   * @param {string} type - Type of object: ['node', 'link'].
   * @param {Object} graphObj - Removed object.
   * @param {Array.<Object>} graphObjs - Graph objects (of type 'type') list.
   * @param {Array.<string>} validProps - List of valid properties for object
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
   * @param {Array.<string>} validProps - List of valid properties for object
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

      if (typeof obj === 'number') {
        obj = obj.toString(10);
      }

      if (obj && (obj.length < 50 || prop === 'name' || typeof obj === 'object')
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


/**
 * Represents possible graph options for the graph view.
 */
class GraphOptions {
  /**
   * Retrieves stored graph options data from localstorage.
   */
  static retrieve() {
    const data = localStorage.getItem(GRAPH_OPTIONS_KEY);
    if (data) {
      const obj = JSON.parse(data);
      return new GraphOptions(obj);
    }
    return null;
  }

  constructor(props) {
    const initial = props === undefined || props === null ? {} : props;
    this.defaultColor = initial.defaultColor || DEFAULT_NODE_COLOR;
    this.linkStrength = initial.linkStrength || LINK_STRENGTH;
    this.chargeStrength = initial.chargeStrength || CHARGE_STRENGTH;
    this.collisionRadius = initial.collisionRadius || COLLISION_RADIUS;
    this.autoCollisionRadius = !!initial.autoCollisionRadius;
    this.linkHighlighting = initial.linkHighlighting === null
      || initial.linkHighlighting === undefined
      ? true
      : initial.linkHighlighting;
    this.nodeLabelProp = initial.nodeLabelProp || 'name';
    this.linkLabelProp = initial.linkLabelProp || '';
    this.nodesColor = initial.nodesColor || '@class';
    this.linksColor = initial.linksColor || '';
    this.nodesColors = initial.nodesColors || {};
    this.linksColors = initial.linksColors || {};
    this.nodesLegend = !!initial.nodesLegend;
    this.linksLegend = !!initial.linksLegend;
    this.chargeMax = initial.chargeMax || CHARGE_MAX;
    this.nodePreview = initial.nodePreview || true;
  }

  /**
   * Returns the color of the given object, given the current color property.
   */
  getColor(obj, type) {
    const { [`${type}Color`]: targetColor, [`${type}Colors`]: ColorMap } = this;
    let colorKey = '';
    if (targetColor && targetColor.includes('.')) {
      const keys = targetColor.split('.');
      colorKey = (obj.data[keys[0]] || {})[keys[1]];
    } else if (targetColor) {
      const colorKeyIsObject = isObject(obj.data[targetColor]);
      if (colorKeyIsObject) {
        colorKey = obj.data[targetColor].name;
      } else {
        colorKey = obj.data[targetColor];
      }
    }
    return ColorMap[colorKey];
  }

  /**
   * Loads graph options state into localstorage.
   */
  load() {
    localStorage.setItem(GRAPH_OPTIONS_KEY, JSON.stringify({
      defaultColor: this.defaultColor,
      linkStrength: this.linkStrength,
      chargeStrength: this.chargeStrength,
      collisionRadius: this.collisionRadius,
      chargeMax: this.chargeMax,
      autoCollisionRadius: this.autoCollisionRadius,
      linkHighlighting: this.linkHighlighting,
      nodeLabelProp: this.nodeLabelProp,
      nodesColor: this.nodesColor,
      linksColor: this.linksColor,
      nodesColors: this.nodesColors,
      linksColors: this.linksColors,
      nodesLegend: this.nodesLegend,
      linksLegend: this.linksLegend,
      nodePreview: this.nodePreview,
    }));
  }
}

export {
  GraphOptions,
  PropsMap,
  GraphNode,
  GraphLink,
};
