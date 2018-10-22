import { expect } from 'chai';
import { Record, Edge, Schema } from '../knowledgebase';

const schema = new Schema({
  classOne: {
    properties: {
      name: { name: 'name', type: 'string' },
      day: { name: 'day', type: 'integer' },
      hour: { name: 'hour', type: 'string' },
      foo: { name: 'foo', type: 'link' },
      bar: { name: 'bar', type: 'link' },
    },
    inherits: ['classTwo', 'V'],
    route: 'root',
  },
  classTwo: {
    properties: {
      name: 'name',
      day: 'day',
      minute: 'minute',
      second: 'second',
      foo: 'foo',
    },
    route: 'pass',
    inherits: [],
  },
});

describe('ontology methods test', () => {
  beforeAll(() => {
    const edges = ['AliasOf', 'SubClassOf'];
    Record.loadEdges(edges);
  });

  it('OntologyEdge getId', () => {
    const data = {
      '@rid': 'pass',
      '#rid': 'fail',
      in: {
        '@rid': 'fail',
      },
    };
    const o = new Edge(data);

    expect(o.getId()).to.eq('pass');
  });

  it('Ontology getId', () => {
    const data = {
      name: 'fail',
      '@rid': 'pass',
      '#rid': 'fail',
      source: {
        name: 'fail',
        '@rid': 'fail',
      },
    };
    const o = new Record(data);

    expect(o.getId()).to.eq('pass');
  });

  it('Ontology loadEdges', () => {
    const data = {
      name: 'fail',
      '@rid': 'pass',
      '#rid': 'fail',
      source: {
        name: 'fail',
        '@rid': 'fail',
      },
      in_AliasOf: [{
        '@class': 'AliasOf',
        '@rid': '#135',
        in: {
          '@rid': 'pass',
        },
        out: {
          '@rid': 'fail',
        },
      }],
      out_SubClassOf: [{
        '@class': 'SubClassOf',
        '@rid': '#5252',
        in: {
          '@rid': 'pass',
        },
        out: {
          '@rid': 'fail',
        },
      }],
    };
    const o = new Record(data);
    expect(o.getEdges()).to.have.length(2);
    expect(o.getEdgeTypes()).to.have.length(2);
  });

  it('isAbstract, getSubClasses', () => {
    expect(schema.isAbstract('classTwo'));
    expect(!schema.isAbstract('classOne'));
    expect(schema.getSubClasses('classTwo').length).to.eq(1);
  });

  it('get', () => {
    expect(schema.get('classOne')).to.deep.eq({
      properties: {
        name: { name: 'name', type: 'string' },
        day: { name: 'day', type: 'integer' },
        hour: { name: 'hour', type: 'string' },
        foo: { name: 'foo', type: 'link' },
        bar: { name: 'bar', type: 'link' },
      },
      inherits: ['classTwo', 'V'],
      route: 'root',
    });
  });

  it('getClass', () => {
    expect(schema.getClass('classOne').properties.length).to.eq(5);
    schema.schema.V = {
      properties: {
        day: 'day',
        minute: 'minute',
        second: 'second',
        bar: 'bar',
      },
      inherits: [],
    };
    expect(schema.getClass('classOne').properties.length).to.eq(3);
    expect(schema.getClass('classTwo').properties.length).to.eq(2);
  });

  it('initModel', () => {
    const testSchema = new Schema({
      testClass: {
        properties: [
          { name: 'name', type: 'string' },
          { name: 'source', type: 'embeddedset' },
          { name: 'alias', type: 'link' },
          { name: 'num', type: 'integer' },
          {
            name: 'embedded prop',
            type: 'embedded',
            linkedClass: {
              properties: {},
              name: 'other class',
            },
          },
          { name: 'bool prop', type: 'boolean' },
        ],
      },
    });

    const testModel = {
      name: 'hello',
    };
    const result = testSchema.initModel(testModel, 'testClass');
    expect(Object.keys(result).length).to.eq(10); // + 3 fields for link, + 1 for @class
    expect(result.name).to.eq('hello');
    expect(Array.isArray(result.source));
    expect(result.source.length).to.eq(0);
  });
});
