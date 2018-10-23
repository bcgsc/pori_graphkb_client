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

export {
  Record,
  Edge,
};
