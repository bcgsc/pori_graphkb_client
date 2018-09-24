import { PropsMap } from '../../src/components/GraphComponent/kbgraph';

it('loadColorProps', () => {
  const testColumns = ['name', 'sourceId', 'source'];
  const testData = [
    { name: 'one', sourceId: 'sourceOne', source: 'test' },
    { name: 'three', sourceId: 'sourceThree', source: 'test' },
    { name: 'two', sourceId: 'sourceTwo', source: 'test' },
    { name: 'notname', sourceId: 'notSourceId', source: 'nottest' },
    { name: 'knowledgebase', sourceId: 'kb', source: 'bcgsc' },
  ];
  const testPropsMap = new PropsMap();

  testData.forEach(node => testPropsMap.loadNode(node, testColumns));
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
