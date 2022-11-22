import { GeneralRecordType } from '@/components/types';

import {
  GraphLink,
  GraphNode,
  GraphOptions,
  PropsMap,
} from '../GraphComponent/kbgraph';

describe('kbgraph method i/o validations', () => {
  const testColumns = ['name', 'sourceId', 'source'];
  const testData: GeneralRecordType[] = [
    {
      name: 'one', sourceId: 'sourceOne', source: 'test', '@rid': '1:1',
    },
    {
      name: 'three', sourceId: 'sourceThree', source: 'test', '@rid': '3:1',
    },
    {
      name: 'two', sourceId: 'sourceTwo', source: 'test', '@rid': '2:1',
    },
    {
      name: 'notname', sourceId: 'notSourceId', source: 'nottest', '@rid': '4:1',
    },
    {
      name: 'knowledgebase', sourceId: 'kb', source: 'bcgsc', '@rid': '5:1',
    },
  ];

  test('loadColorProps', () => {
    const testPropsMap = new PropsMap();

    // Load
    testData.forEach((node) => testPropsMap.loadNode(node, testColumns));

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
    testData.forEach((link) => testPropsMap.loadLink(link, testColumns));

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
