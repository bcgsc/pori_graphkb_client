import React from 'react';
import { mount } from 'enzyme';
import { TableComponent } from '..';

const mockData = {
  '#1': {
    '@rid': '#1',
    name: 'test one',
    sourceId: 'test-1',
    out_AliasOf: [{
      '@rid': '#76',
      in: {
        '@rid': '#1',
      },
      out: {
        '@rid': '#4',
      },
    }],
  },
  '#2': {
    '@rid': '#2',
    name: 'test two',
    sourceId: 'test-2',
    source: {
      name: 'test source',
    },
  },
  '#3': {
    '@rid': '#3',
    name: 'test three',
    sourceId: 'test-3',
  },
  '#4': {
    '@rid': '#4',
    name: 'linked',
    sourceId: 'test-4',
    in_AliasOf: [{
      '@rid': '#76',
      in: {
        '@rid': '#1',
      },
      out: {
        '@rid': '#4',
      },
    }],
  },
};

const bigMockData = {};
for (let i = 0; i < 200; i += 1) {
  bigMockData[`#${i}`] = {
    '@rid': `#${i}`,
    name: `a${i}a`,
    sourceId: `b${i}b`,
  };
}

const allProps = [
  '@rid',
  'name',
  'sourceId',
  'in_AliasOf',
  'source.name',
  'out_AliasOf',
  'neither',
];

describe('<TableComponent />', () => {
  const spies = {
    componentDidMount: jest.spyOn(TableComponent.prototype, 'componentDidMount'),
    createTSV: jest.spyOn(TableComponent.prototype, 'createTSV'),
    handleChangePage: jest.spyOn(TableComponent.prototype, 'handleChangePage'),
    handleChange: jest.spyOn(TableComponent.prototype, 'handleChange'),
    handleHeaderMouseLeave: jest.spyOn(TableComponent.prototype, 'handleHeaderMouseLeave'),
    handleFilterExclusions: jest.spyOn(TableComponent.prototype, 'handleFilterExclusions'),
    handleFilterCheckAll: jest.spyOn(TableComponent.prototype, 'handleFilterCheckAll'),
    handleColumnCheck: jest.spyOn(TableComponent.prototype, 'handleColumnCheck'),
  };


  it('correctly calls componentDidMount and does not blow up', () => {
    mount(
      <TableComponent
        data={{}}
        handleCheckAll={() => { }}
        handleCheckbox={() => { }}
        handleTableRedirect={() => { }}
        handleHideSelected={() => { }}
        handleShowAllNodes={() => { }}
        handleGraphRedirect={() => { }}
        handleDetailDrawerOpen={() => { }}
        completedNext
      />,
    );
    expect(spies.componentDidMount).toHaveBeenCalledTimes(1);
  });

  it('renders correct number of rows given input data', () => {
    const wrapper = mount(
      <TableComponent
        data={mockData}
        handleCheckAll={() => { }}
        handleCheckbox={() => { }}
        handleTableRedirect={() => { }}
        handleHideSelected={() => { }}
        handleShowAllNodes={() => { }}
        handleGraphRedirect={() => { }}
        handleDetailDrawerOpen={() => { }}
        completedNext
        edgeTypes={['AliasOf']}
        allProps={allProps}
      />,
    );
    expect(wrapper.find('tbody tr')).toHaveLength(4);
  });

  it('table header and row change simulations trigger correct handlers', () => {
    const handleDetailDrawerOpen = jest.fn();
    const handleCheckbox = jest.fn();
    const handleCheckAll = jest.fn();
    const handleGraphRedirect = jest.fn();
    const wrapper = mount(
      <TableComponent
        data={mockData}
        handleCheckAll={handleCheckAll}
        handleCheckbox={handleCheckbox}
        handleTableRedirect={() => { }}
        handleHideSelected={() => { }}
        handleShowAllNodes={() => { }}
        handleGraphRedirect={handleGraphRedirect}
        handleDetailDrawerOpen={handleDetailDrawerOpen}
        completedNext
        edgeTypes={['AliasOf']}
        allProps={allProps}
        displayed={['1']}
      />,
    );
    wrapper.find('tbody tr').first().simulate('click');
    expect(handleDetailDrawerOpen.mock.calls.length).toBe(1);

    wrapper.find('tbody tr input[type="checkbox"]').first().simulate('click');
    expect(handleCheckbox.mock.calls.length).toBe(1);

    wrapper.find('thead tr th input[type="checkbox"]').simulate('change');
    expect(handleCheckAll.mock.calls.length).toBe(1);

    wrapper.find('thead tr th span[role="button"] svg')
      .forEach(btn => btn.simulate('click'));
    wrapper.find('thead tr th').forEach((btn, i) => {
      if (i !== 0) {
        btn.simulate('mouseenter');
        btn.simulate('mouseleave');
      }
    });
    expect(spies.handleHeaderMouseLeave).toHaveBeenCalledTimes(4);

    wrapper.find('thead tr th button[title="Filter this column"]').first().simulate('click');

    wrapper.find('.filter-wrapper .filter-exclusions-list div[role="button"]').first().simulate('click');
    expect(spies.handleFilterExclusions).toHaveBeenCalledTimes(1);

    wrapper.find('.filter-list input').first().simulate('change', { target: { value: 'test' } });

    wrapper.find('div#select-all-checkbox').simulate('click');
    wrapper.find('div#select-all-checkbox').simulate('click');
    expect(spies.handleFilterCheckAll).toHaveBeenCalledTimes(2);

    wrapper.find('div#filter-popover div').first().simulate('close');
    wrapper.find('button#ellipsis-menu').simulate('click');
    expect(wrapper.find('div[role="document"] ul[role="menu"] li#clear-filters')).toHaveLength(1);
    wrapper.find('div[role="document"] ul[role="menu"] div#download-tsv').first().simulate('click');

    expect(spies.createTSV).toHaveBeenCalledTimes(1);

    wrapper.find('div.graph-btn button').simulate('click');
    expect(handleGraphRedirect.mock.calls.length).toBe(1);
  });

  it('pagination triggers handlers correctly', () => {
    const handleSubsequentPagination = jest.fn();
    const wrapper = mount(
      <TableComponent
        data={bigMockData}
        handleCheckAll={() => { }}
        handleCheckbox={() => { }}
        handleTableRedirect={() => { }}
        handleHideSelected={() => { }}
        handleShowAllNodes={() => { }}
        handleGraphRedirect={() => { }}
        handleDetailDrawerOpen={() => { }}
        handleSubsequentPagination={handleSubsequentPagination}
        moreResults
        edgeTypes={['AliasOf']}
        allProps={allProps}
      />,
    );
    wrapper.find('div.pag div.more-results-btn button').simulate('click');
    expect(handleSubsequentPagination.mock.calls.length).toBe(1);

    wrapper.find('div.pag div.paginator-spacing button')
      .forEach((btn, i) => {
        if (i === 1) {
          btn.simulate('click');
        }
      });
    wrapper.find('div.pag div.paginator-spacing button').first().simulate('click');

    expect(spies.handleChangePage).toHaveBeenCalledTimes(2);

    wrapper.find('div.pag div.paginator-spacing div[role="button"]').first().simulate('click');
    wrapper.find('div[role="document"] ul[role="listbox"] li').forEach((btn, i) => {
      if (i === 2) {
        btn.simulate('click');
      }
    });
    expect(spies.handleChange).toHaveBeenCalledTimes(1);
  });

  it('column dialog is opened correctly', () => {
    const wrapper = mount(
      <TableComponent
        data={mockData}
        handleCheckAll={() => { }}
        handleCheckbox={() => { }}
        handleTableRedirect={() => { }}
        handleHideSelected={() => { }}
        handleShowAllNodes={() => { }}
        handleGraphRedirect={() => { }}
        handleDetailDrawerOpen={() => { }}
        moreResults
        edgeTypes={['AliasOf']}
        allProps={allProps}
      />,
    );

    wrapper.find('button#ellipsis-menu').simulate('click');
    wrapper.find('div[role="document"] ul[role="menu"] li#column-edit').simulate('click');
    wrapper.find('#name input[type="checkbox"]').simulate('change');
    expect(spies.handleColumnCheck).toHaveBeenCalledTimes(1);
    wrapper.find('input[type="radio"]').simulate('change');
    wrapper.find('#column-dialog-actions button').simulate('click');
    expect(wrapper.state().tableColumns.find(t => t.id === 'name')).toHaveProperty('checked', false);
  });
  afterEach(() => {
    Object.values(spies).forEach((spy) => {
      spy.mockClear();
    });
  });
});
