import util from './util';

let edges = [];

export default class Ontology {
  constructor(data) {
    this.data = data;
  }

  static loadEdges(newEdges) {
    edges = util.expandEdges(newEdges);
  }

  getId() {
    return this.data['@rid'];
  }

  getEdges() {
    return edges.reduce((array, edge) => {
      if (this.data[edge] && this.data[edge].length > 0) {
        array.push(...this.data[edge].filter((e) => {
          const inRid = e.in['@rid'];
          const outRid = e.out['@rid'];
          return (inRid !== this.getId() || outRid !== this.getId())
            && e.in['@class'] !== 'Statement'
            && e.out['@class'] !== 'Statement';
        }));
      }
      return array;
    }, []);
  }

  getEdgeTypes() {
    return edges.reduce((array, edge) => {
      if (this.data[edge] && this.data[edge].length > 0) {
        array.push(edge);
      }
      return array;
    }, []);
  }
}
