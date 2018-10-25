import kbp from 'knowledgebase-parser';
import util from '../services/util';

let edges = [];

class Record {
  constructor(data, schema, ignoreRecursive) {
    Object.keys(data).forEach((k) => {
      if (
        data[k] !== null
        && typeof data[k] === 'object'
        && data[k]['@class']
        && !ignoreRecursive
      ) {
        this[k] = schema.newRecord(data[k], true); // Avoid stack overflows...
      } else {
        this[k] = data[k];
      }
    });

    if (edges.length === 0 || !edges) {
      edges = util.expandEdges(schema.getEdges());
    }
  }

  static getIdentifiers() {
    return ['@rid'];
  }

  getId() {
    return this['@rid'];
  }


  /**
   * Returns a representative field of a given object. Defaults to:
   * name, then sourceId (defined in config.json: DEFAULT_PROPS), then if
   * neither are present, the first primitive type field in the object.
   * @example
   * > util.getPreview({name: 'bob', ...other})
   * > 'bob'
   * @example
   * > util.getPreview({sourceId: '123', color: 'blue'})
   * > '123'
   * @example
   * > util.getPreview({colors: ['red', 'green], height: '6ft'})
   * > '6ft'
   * @param {Object} obj - target data object.
   */
  getPreview() {
    let preview;
    this.constructor.getIdentifiers().forEach((prop) => {
      const [key, nestedKey] = prop.split('.');
      if (this[key] && !preview) {
        preview = nestedKey ? this[key][nestedKey] : this[key];
      }
    });
    if (!preview) {
      const prop = Object.keys(this).find(key => (
        typeof this[key] !== 'object'
        && typeof this[key] !== 'function'
      ));
      preview = this[prop];
    }
    return util.formatStr(preview);
  }
}

class V extends Record {
  getEdges() {
    return edges.reduce((array, edge) => {
      if (this[edge] && this[edge].length > 0) {
        array.push(...this[edge].filter((e) => {
          const inRid = e.in['@rid'];
          const outRid = e.out['@rid'];
          return (inRid !== this.getId() || outRid !== this.getId());
        }));
      }
      return array;
    }, []);
  }

  getEdgeTypes() {
    return edges.reduce((array, edge) => {
      if (this[edge] && this[edge].length > 0 && !array.includes(this[edge][0]['@class'])) {
        array.push(this[edge][0]['@class']);
      }
      return array;
    }, []);
  }
}

class Edge extends Record {
  /**
   * @override
   */
  static getIdentifiers() {
    return ['@class', 'source.name'];
  }
}


class Ontology extends V {
  /**
   * @override
   */
  static getIdentifiers() {
    return ['@class', 'name', 'sourceId', 'source.name'];
  }

  /**
   * @override
   */
  getPreview() {
    return this.name || this.sourceId;
  }
}

class PositionalVariant extends V {
  /**
   * @override
   */
  static getIdentifiers() {
    return ['@class', 'type.name', 'reference1.name', 'reference2.name'];
  }

  getPreview() {
    const notation = {};
    Object.keys(this).forEach((key) => {
      if (typeof this[key] === 'function') return;

      if (this[key] && typeof this[key] === 'object' && this[key]['@class']) {
        if (key === 'reference1' || key === 'reference2') {
          notation[key] = this[key].name || this[key].sourceId;
        } else if (
          key.startsWith('break')
        ) {
          notation.prefix = kbp.position.CLASS_PREFIX[this[key]['@class']];
          notation[key] = this[key];
        } else if (key === 'type') {
          notation[key] = this[key].sourceId;
        } else {
          notation[key] = this[key];
        }
      }
    });
    return (new kbp.variant.VariantNotation(notation)).toString();
  }
}

class Statement extends V {
  /**
   * @override
   */
  static getIdentifiers() {
    return ['appliesTo.name', 'relevance.name', 'source.name'];
  }
}

class Source extends V {
  /**
   * @override
   */
  static getIdentifiers() {
    return ['name'];
  }
}

class Position extends V {
  /**
   * @override
   */
  static getIdentifiers() {
    return ['@class', 'pos', 'refAA'];
  }
}

class Publication extends Ontology {
  getPreview() {
    return `${util.formatStr(this.source.name)}: ${this.sourceId}`;
  }
}

const classes = {
  Record,
  V,
  Edge,
  Ontology,
  PositionalVariant,
  Statement,
  Source,
  Position,
  Publication,
};

export default classes;
