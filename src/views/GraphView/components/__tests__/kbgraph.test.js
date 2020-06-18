import {
  GraphLink,
  GraphNode,
  GraphOptions,
  PropsMap,
} from '../GraphComponent/kbgraph';

describe('kbgraph method i/o validations', () => {
  const testColumns = ['name', 'sourceId', 'source'];
  const testData = [
    { name: 'one', sourceId: 'sourceOne', source: 'test' },
    { name: 'three', sourceId: 'sourceThree', source: 'test' },
    { name: 'two', sourceId: 'sourceTwo', source: 'test' },
    { name: 'notname', sourceId: 'notSourceId', source: 'nottest' },
    { name: 'knowledgebase', sourceId: 'kb', source: 'bcgsc' },
  ];

  test('loadColorProps', () => {
    const testPropsMap = new PropsMap();

    // Load
    testData.forEach(node => testPropsMap.loadNode(node, testColumns));

    // Validate
    Object.keys(testPropsMap.nodeProps).forEach((key) => {
      if (key === 'name') {
        testPropsMap.nodeProps.name.forEach((name) => {
          expect(['one', 'three', 'two', 'notname', 'knowledgebase']).toEqual(expect.arrayContaining([name]));
        });
      } else if (key === 'sourceId') {
        testPropsMap.nodeProps.sourceId.forEach((sourceId) => {
          expect(['sourceOne', 'sourceThree', 'sourceTwo', 'notSourceId', 'kb']).toEqual(expect.arrayContaining([sourceId]));
        });
      } else if (key === 'source') {
        testPropsMap.nodeProps.source.forEach((source) => {
          expect(['test', 'nottest', 'bcgsc']).toEqual(expect.arrayContaining([source]));
        });
      }
    });
  });

  test('load links', () => {
    const testPropsMap = new PropsMap();

    // Load
    testData.forEach(link => testPropsMap.loadLink(link, testColumns));

    // Validate
    Object.keys(testPropsMap.linkProps).forEach((key) => {
      if (key === 'name') {
        testPropsMap.linkProps.name.forEach((name) => {
          expect(['one', 'three', 'two', 'notname', 'knowledgebase']).toEqual(expect.arrayContaining([name]));
        });
      } else if (key === 'sourceId') {
        testPropsMap.linkProps.sourceId.forEach((sourceId) => {
          expect(['sourceOne', 'sourceThree', 'sourceTwo', 'notSourceId', 'kb']).toEqual(expect.arrayContaining([sourceId]));
        });
      } else if (key === 'source') {
        testPropsMap.linkProps.source.forEach((source) => {
          expect(['test', 'nottest', 'bcgsc']).toEqual(expect.arrayContaining([source]));
        });
      }
    });
  });

  test('remove node', () => {
    const testPropsMap = new PropsMap();

    // Load
    testData.forEach(node => testPropsMap.loadNode(node, testColumns));

    const deleted = testData.splice(0, 1);
    testPropsMap.removeNode(deleted[0], testData.map(d => ({ data: d })), testColumns);
  });

  test('GraphOptions', () => {
    const props = {
      defaultColor: 'black',
      autoCollisionRadius: false,
      collisionRadius: 16,
      linksColor: 'name',
    };
    const graphOptions = new GraphOptions(props);
    graphOptions.load();
    const retrievedGraphOptions = GraphOptions.retrieve();
    expect(retrievedGraphOptions).toMatchObject(graphOptions);
  });

  test('getColor', () => {
    const props = {
      defaultColor: 'black',
      autoCollisionRadius: false,
      collisionRadius: 16,
      linksColor: 'source.name',
    };
    const graphOptions = new GraphOptions(props);
    graphOptions.getColor({ data: { source: { name: 'hello' } } }, 'links');
  });

  test('GraphNode', () => {
    const data = { name: 'test name', '@rid': 'pass' };
    const graphNode = new GraphNode(data);

    expect(graphNode.getId()).toBe('pass');
    expect(graphNode.getLabel('name')).toBe('test name');
  });

  test('GraphLink', () => {
    const data = { name: 'test name', '@rid': 'pass' };
    const testSource = { data: { '@rid': 'pass' } };
    const testTarget = 'also pass';
    const graphLink = new GraphLink(data, testSource, testTarget);

    expect(graphLink.getId()).toBe('pass');
    expect(graphLink.getLabel('name')).toBe('test name');
    expect(graphLink.getOutRid()).toBe('pass');
    expect(graphLink.getInRid()).toBe('also pass');
  });
});
