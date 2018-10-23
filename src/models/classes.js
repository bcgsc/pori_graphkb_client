import util from '../services/util';

let edges = [];

class Edge {
  constructor(data) {
    Object.keys(data).forEach((k) => { this[k] = data[k]; });
  }

  getId() {
    return this['@rid'];
  }
}

class Record {
  constructor(data) {
    Object.keys(data).forEach((k) => { this[k] = data[k]; });
  }

  static getIdentifiers() {
    return [this['@rid']];
  }

  static loadEdges(newEdges) {
    edges = util.expandEdges(newEdges);
  }

  getId() {
    return this['@rid'];
  }

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

class Ontology extends Record {
  /**
   * @override
   */
  static getIdentifiers() {
    const { name, sourceId, source } = this;
    const ids = [];
    if (name) { ids.push(name); }
    if (sourceId) { ids.push(sourceId); }
    if (source && source.name) { ids.push(source.name); }
    return ids;
  }
}

class PositionalVariant extends Record {
  /**
   * @override
   */
  static getIdentifiers() {
    const { type, sourceId, source } = this;
    const ids = [];
    if (type && type.name) { ids.push(type.name); }
    if (sourceId) { ids.push(sourceId); }
    if (source && source.name) { ids.push(source.name); }
    return ids;
  }
}

const classes = {
  Record,
  Edge,
  Ontology,
  PositionalVariant,
};

const newRecord = (obj) => {
  if (obj['@class'] && classes[obj['@class']]) {
    return new classes[obj['@class']](obj);
  }
  return new Record(obj);
};

classes.newRecord = newRecord;

export default classes;
