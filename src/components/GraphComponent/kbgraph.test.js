import { expect } from 'chai';
import {
  PropsMap,
  GraphNode,
  GraphLink,
  GraphOptions,
} from './kbgraph';

describe('kbgraph', () => {
  const testColumns = ['name', 'sourceId', 'source'];
  const testData = [
    { name: 'one', sourceId: 'sourceOne', source: 'test' },
    { name: 'three', sourceId: 'sourceThree', source: 'test' },
    { name: 'two', sourceId: 'sourceTwo', source: 'test' },
    { name: 'notname', sourceId: 'notSourceId', source: 'nottest' },
    { name: 'knowledgebase', sourceId: 'kb', source: 'bcgsc' },
  ];

  it('loadColorProps', () => {
    const testPropsMap = new PropsMap();

    // Load
    testData.forEach(node => testPropsMap.loadNode(node, testColumns));

    // Validate
    Object.keys(testPropsMap.nodeProps).forEach((key) => {
      if (key === 'name') {
        testPropsMap.nodeProps.name.forEach((name) => {
          expect(['one', 'three', 'two', 'notname', 'knowledgebase']).to.contain(name);
        });
      } else if (key === 'sourceId') {
        testPropsMap.nodeProps.sourceId.forEach((sourceId) => {
          expect(['sourceOne', 'sourceThree', 'sourceTwo', 'notSourceId', 'kb']).to.contain(sourceId);
        });
      } else if (key === 'source') {
        testPropsMap.nodeProps.source.forEach((source) => {
          expect(['test', 'nottest', 'bcgsc']).to.contain(source);
        });
      }
    });
  });

  it('load links', () => {
    const testPropsMap = new PropsMap();

    // Load
    testData.forEach(link => testPropsMap.loadLink(link, testColumns));

    // Validate
    Object.keys(testPropsMap.linkProps).forEach((key) => {
      if (key === 'name') {
        testPropsMap.linkProps.name.forEach((name) => {
          expect(['one', 'three', 'two', 'notname', 'knowledgebase']).to.contain(name);
        });
      } else if (key === 'sourceId') {
        testPropsMap.linkProps.sourceId.forEach((sourceId) => {
          expect(['sourceOne', 'sourceThree', 'sourceTwo', 'notSourceId', 'kb']).to.contain(sourceId);
        });
      } else if (key === 'source') {
        testPropsMap.linkProps.source.forEach((source) => {
          expect(['test', 'nottest', 'bcgsc']).to.contain(source);
        });
      }
    });
  });

  it('remove node', () => {
    const testPropsMap = new PropsMap();

    // Load
    testData.forEach(node => testPropsMap.loadNode(node, testColumns));

    const deleted = testData.splice(0, 1);
    testPropsMap.removeNode(deleted[0], testData.map(d => ({ data: d })), testColumns);
  });

  it('remove node', () => {
    const testPropsMap = new PropsMap();

    // Load
    testData.forEach(link => testPropsMap.loadLink(link, testColumns));

    const deleted = testData.splice(0, 1);
    testPropsMap.removeLink(deleted[0], testData.map(d => ({ data: d })), testColumns);
  });

  it('GraphOptions', () => {
    const props = {
      defaultColor: 'black',
      autoCollisionRadius: false,
      collisionRadius: 16,
      linksColor: 'name',
    };
    const graphOptions = new GraphOptions(props);
    graphOptions.load();
    expect(GraphOptions.retrieve()).to.deep.equals(graphOptions);
  });

  it('GraphNode', () => {
    const data = { name: 'test name', '@rid': 'pass' };
    const graphNode = new GraphNode(data);

    expect(graphNode.getId()).to.eq('pass');
    expect(graphNode.getLabel('name')).to.eq('test name');
  });

  it('GraphLink', () => {
    const data = { name: 'test name', '@rid': 'pass' };
    const testSource = { data: { '@rid': 'pass' } };
    const testTarget = 'also pass';
    const graphLink = new GraphLink(data, testSource, testTarget);

    expect(graphLink.getId()).to.eq('pass');
    expect(graphLink.getLabel('name')).to.eq('test name');
    expect(graphLink.getOutRid()).to.eq('pass');
    expect(graphLink.getInRid()).to.eq('also pass');
  });
});
