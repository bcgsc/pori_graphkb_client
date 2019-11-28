import { Drawer } from '@material-ui/core';
import { mount, shallow } from 'enzyme';
import React from 'react';
import { BrowserRouter } from 'react-router-dom';

import { KBContext } from '@/components/KBContext';

import DetailDrawer from '../DetailDrawer';


const ProvideSchema = ({ children = [], schema }) => (  // eslint-disable-line
  <BrowserRouter>
    <KBContext.Provider value={{}}>
      {children}
    </KBContext.Provider>
  </BrowserRouter>
);

describe('DetailDrawer', () => {
  let wrapper;
  const spies = {};
  [
    'formatRelationships',
    'formatIdentifiers',
    'formatOtherProps',
    'componentDidUpdate',
    'formatLongValue',
    'handleLinkExpand',
    'handleExpand',
  ].forEach((method) => {
    spies[method] = jest.spyOn(DetailDrawer.prototype, method);
  });

  beforeEach(() => {
    wrapper = null;
  });

  test('inits and does not call field formatting functions', () => {
    wrapper = shallow(<DetailDrawer />);
    expect(spies.formatRelationships).toHaveBeenCalledTimes(0);
    expect(spies.formatIdentifiers).toHaveBeenCalledTimes(0);
    expect(spies.formatOtherProps).toHaveBeenCalledTimes(0);
  });

  test('does not crash with test node', () => {
    const node = {
      '@class': 'Ontology',
      name: 'test node',
      displayName: 'testNode',
      sourceId: 'test sourceId',
      source: {
        '@class': 'Ontology',
        name: 'test source',
      },
      subsets: ['one', 'two', 'three'],
      '@rid': '#1:0',
    };

    wrapper = mount((
      <ProvideSchema>
        <DetailDrawer node={node} />
      </ProvideSchema>
    ));
    expect(spies.formatRelationships).toHaveBeenCalledTimes(1);
    expect(spies.formatIdentifiers).toHaveBeenCalledTimes(2);
    expect(spies.formatOtherProps).toHaveBeenCalledTimes(1);
    expect(wrapper.find(Drawer)).toHaveLength(1);
  });

  test('does not crash when componentDidUpdate is called', () => {
    wrapper = mount((
      <ProvideSchema>
        <DetailDrawer />
      </ProvideSchema>
    ));
    wrapper.find(DetailDrawer).instance().setState({});
    expect(spies.componentDidUpdate).toHaveBeenCalledTimes(1);
  });

  test('formatLongValue function is triggered on long inputs only', () => {
    const node = {
      '@class': 'Ontology',
      // 1st long field
      name: 'test node. this is a long value so that formatlongvalue is called and this test passes, ASHDhkdjhjsdhkJAHDSkjhsdkajsdhaksjdhakjshda blargh blargh',
      // 2nd long field
      longName: 'test node. this is a long value so that formatlongvalue is called and this test passes, ASHDhkdjhjsdhkJAHDSkjhsdkajsdhaksjdhakjshda blargh blargh',
      displayName: 'testNode',
      sourceId: 'test sourceId',
      source: {
        '@class': 'Ontology',
        name: 'test source',
      },
      subsets: ['one', 'two', 'three'],
      '@rid': '#1:0',
    };
    wrapper = mount((
      <ProvideSchema>
        <DetailDrawer node={node} />
      </ProvideSchema>
    ));
    expect(spies.formatLongValue).toHaveBeenCalledTimes(2);
  });

  test('clicking expanding list items triggers handler', () => {
    const node = {
      '@class': 'Ontology',
      '@rid': '#135:0',
      name: 'test node best node',
      sourceId: 'test sourceId',
      longName: 'test node. this is a long value so that formatlongvalue is called and this test passes, ASHDhkdjhjsdhkJAHDSkjhsdkajsdhaksjdhakjshda blargh blargh',
    };
    wrapper = mount((
      <ProvideSchema>
        <DetailDrawer node={node} />
      </ProvideSchema>
    ));
    wrapper.find('div[role="button"]').simulate('click');
    wrapper.find('div[role="button"]').simulate('click');
    expect(spies.handleExpand).toHaveBeenCalledTimes(2);
  });

  test('initializes relationships and properly applies handlers to DOM nodes', () => {
    const node = {
      '@class': 'Ontology',
      '@rid': '#135:1',
      name: 'test node best node',
      sourceId: 'test sourceId',
      in_AliasOf: [{
        '@class': 'AliasOf',
        '@rid': '#141:2',
        in: {
          '@rid': '#135:0',
        },
        out: {
          '@class': 'AliasOf',
          '@rid': '#136:0',
          source: {
            name: 'test source also',
          },
          name: 'hello',
        },
      }],
    };
    wrapper = mount((
      <ProvideSchema>
        <DetailDrawer node={node} />
      </ProvideSchema>
    ));
    expect(spies.formatRelationships).toHaveBeenCalled();
    wrapper.find('div.detail-link-wrapper[role="button"]').first().simulate('click');
    wrapper.find('div.detail-link-wrapper[role="button"]').first().simulate('click');
    expect(spies.handleLinkExpand).toHaveBeenCalledTimes(2);
  });

  test('expect detail-drawer__nested-list class to be rendered for nested property', () => {
    const node = {
      '@class': 'Ontology',
      '@rid': '#135:0',
      name: 'test node best node',
      sourceId: 'test sourceId',
      dependency: {
        '@class': 'Ontology',
        '@rid': '#42:13',
        name: 'dependency one',
        source: {
          '@class': 'Ontology',
          name: 'ncit',
        },
      },
    };

    wrapper = mount((
      <ProvideSchema>
        <DetailDrawer node={node} />
      </ProvideSchema>
    ));
    wrapper.find('div[role="button"]').first().simulate('click');
    expect(wrapper.find('.detail-drawer__nested-list').length).toBeGreaterThan(0);
  });

  test('handles node property type linkset correctly ', () => {
    const node = {
      '@class': 'Statement',
      '@rid': '#135:0',
      name: 'linkset node',
      sourceId: 'test sourceId',
      conditions: [
        {
          '@class': 'Ontology',
          '@rid': '19:1',
          displayName: 'linkedRecord1',
          sourceId: 'BBC',
        },
        {
          '@class': 'Ontology',
          '@rid': '19:1',
          displayName: 'linkedRecord2',
          sourceId: 'CBC',
        },
      ],
    };

    wrapper = mount((
      <ProvideSchema>
        <DetailDrawer node={node} />
      </ProvideSchema>
    ));

    expect(wrapper.find('.detail-identifiers-linkset').length).toEqual(2);
    expect(wrapper.find('.detail-identifiers-nested').length).toEqual(0);
    expect(wrapper.find('div[role="button"]').at(1).text()).toEqual('OntologylinkedRecord2 (19:1)');
    wrapper.find('div[role="button"]').at(1).simulate('click');
    expect(wrapper.find('.detail-identifiers-nested').length).toBeGreaterThan(0);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });
});
