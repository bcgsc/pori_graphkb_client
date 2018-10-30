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

  /**
   * Returns list of strings representing the main fields used to identify the
   * record.
   */
  static getIdentifiers() {
    return ['@rid'];
  }

  /**
   * Returns record id.
   */
  getId() {
    return this['@rid'];
  }


  /**
   * Returns a string preview for the record.
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
  /**
   * Returns edges connected to vertex.
   */
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

  /**
   * Returns edge types that are connected to vertex.
   */
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
   * Returns list of strings representing the main fields used to identify the
   * record.
   */
  static getIdentifiers() {
    return ['@class', 'source.name'];
  }
}


class Ontology extends V {
  /**
   * @override
   * Returns list of strings representing the main fields used to identify the
   * record.
   */
  static getIdentifiers() {
    return ['@class', 'name', 'sourceId', 'source.name'];
  }

  /**
   * @override
   * Returns a string preview for the record.
   */
  getPreview() {
    return this.name
      || this.sourceId
      || Object.values(this).find(v => typeof v !== 'object' && typeof v !== 'function');
  }
}

class Variant extends V {
  /**
   * @override
   * Returns list of strings representing the main fields used to identify the
   * record.
   */
  static getIdentifiers() {
    return ['@class', 'type.name', 'reference1.name', 'preview', 'reference2.name'];
  }

  /**
   * @override
   * Returns a string preview for the record.
   */
  getPreview() {
    const {
      type,
      reference1,
      reference2,
    } = this;
    const t = type.name || type.sourceId;
    const r1 = reference1 ? reference1.name || reference1.sourceId : '';
    const r1t = reference1 ? reference1.biotype || '' : '';
    const r2 = reference2 ? reference2.name || reference2.sourceId : '';
    const r2t = reference2 ? reference2.biotype || '' : '';
    return `${t} variant on ${r1t && `${r1t} `}${r1}${r2 && ` and ${r1t && `${r2t} `}${r2}`}`;
  }
}

class PositionalVariant extends Variant {
  /**
   * @override
   * Returns list of strings representing the main fields used to identify the
   * record.
   */
  static getIdentifiers() {
    return Variant.getIdentifiers().slice(1);
  }

  /**
   * @override
   * Returns a string preview for the record.
   */
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
   * Returns list of strings representing the main fields used to identify the
   * record.
   */
  static getIdentifiers() {
    return ['appliesTo.name', 'relevance.name', 'source.name'];
  }

  /**
   * @override
   * Returns a string preview for the record.
   */
  getPreview() {
    const { relevance, appliesTo } = this;
    const rel = relevance ? util.formatStr(relevance.name || relevance.sourceId) : undefined;
    const appl = appliesTo ? util.formatStr(appliesTo.name || appliesTo.sourceId) : undefined;
    return `${rel}${appl ? ` to ${appl}` : ''}`;
  }
}

class Source extends V {
  /**
   * @override
   * Returns list of strings representing the main fields used to identify the
   * record.
   */
  static getIdentifiers() {
    return ['name'];
  }
}

class Position extends V {
  /**
   * @override
   * Returns list of strings representing the main fields used to identify the
   * record.
   */
  static getIdentifiers() {
    return ['@class', 'pos', 'refAA', 'arm', 'majorBand', 'minorBand'];
  }
}

class Publication extends Ontology {
  /**
   * @override
   * Returns a string preview for the record.
   */
  getPreview() {
    return `${util.formatStr(this.source.name)}: ${this.sourceId}`;
  }
}

const classes = {
  Record,
  V,
  Edge,
  Ontology,
  Variant,
  Statement,
  Source,
  Position,
  Publication,
  PositionalVariant,
};

export default classes;
