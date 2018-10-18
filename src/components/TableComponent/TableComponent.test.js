import React from 'react';
import { expect } from 'chai';
import { mount } from 'enzyme';
import { spy } from 'sinon';
import TableComponent from './TableComponent';
import { Ontology } from '../../services/ontology';

const mockData = {
  '#1': new Ontology({
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
  }),
  '#2': new Ontology({
    '@rid': '#2',
    name: 'test two',
    sourceId: 'test-2',
    source: {
      name: 'test source',
    },
  }),
  '#3': new Ontology({
    '@rid': '#3',
    name: 'test three',
    sourceId: 'test-3',
  }),
  '#4': new Ontology({
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
  }),
};

const bigMockData = {};
for (let i = 0; i < 200; i += 1) {
  bigMockData[`#${i}`] = new Ontology({
    '@rid': `#${i}`,
    name: `a${i}a`,
    sourceId: `b${i}b`,
  });
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
  let wrapper;

  beforeAll(() => {
    spy(TableComponent.prototype, 'componentDidMount');
    spy(TableComponent.prototype, 'createTSV');
    spy(TableComponent.prototype, 'handleChangePage');
    spy(TableComponent.prototype, 'handleChange');
    spy(TableComponent.prototype, 'handleHeaderMouseLeave');
    spy(TableComponent.prototype, 'handleFilterExclusions');
    spy(TableComponent.prototype, 'handleFilterCheckAll');
    spy(TableComponent.prototype, 'handleColumnCheck');
  });

  it('init', () => {
    wrapper = mount(
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
    expect(TableComponent.prototype.componentDidMount).to.have.property('callCount', 1);
  });

  it('with data', () => {
    wrapper = mount(
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
    expect(wrapper.find('tbody tr')).to.have.lengthOf(4);
  });

  it('table header and row change simulations', () => {
    const handleDetailDrawerOpen = jest.fn();
    const handleCheckbox = jest.fn();
    const handleCheckAll = jest.fn();
    const handleGraphRedirect = jest.fn();
    wrapper = mount(
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
    expect(handleDetailDrawerOpen.mock.calls.length).to.eq(1);

    wrapper.find('tbody tr input[type="checkbox"]').first().simulate('click');
    expect(handleCheckbox.mock.calls.length).to.eq(1);

    wrapper.find('thead tr th input[type="checkbox"]').simulate('change');
    expect(handleCheckAll.mock.calls.length).to.eq(1);

    wrapper.find('thead tr th span[role="button"] svg')
      .forEach(btn => btn.simulate('click'));

    wrapper.find('thead tr th').forEach((btn, i) => {
      if (i !== 0) {
        btn.simulate('mouseenter');
        btn.simulate('mouseleave');
      }
    });
    expect(TableComponent.prototype.handleHeaderMouseLeave).to.have.property('callCount', 3);

    wrapper.find('thead tr th button[title="Filter this column"]').first().simulate('click');

    wrapper.find('.filter-wrapper .filter-exclusions-list div[role="button"]').first().simulate('click');
    expect(TableComponent.prototype.handleFilterExclusions).to.have.property('callCount', 1);

    wrapper.find('.filter-list input').first().simulate('change', { target: { value: 'test' } });

    wrapper.find('div#select-all-checkbox').simulate('click');
    wrapper.find('div#select-all-checkbox').simulate('click');
    expect(TableComponent.prototype.handleFilterCheckAll).to.have.property('callCount', 2);

    wrapper.find('div#filter-popover div').first().simulate('close');
    wrapper.find('button#ellipsis-menu').simulate('click');
    expect(wrapper.find('div[role="document"] ul[role="menu"] li#clear-filters')).to.have.lengthOf(1);
    wrapper.find('div[role="document"] ul[role="menu"] div#download-tsv li').first().simulate('click');

    expect(TableComponent.prototype.createTSV).to.have.property('callCount', 1);

    wrapper.find('div.graph-btn button').simulate('click');
    expect(handleGraphRedirect.mock.calls.length).to.eq(1);
  });

  it('pagination', () => {
    const handleSubsequentPagination = jest.fn();
    wrapper = mount(
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
    expect(handleSubsequentPagination.mock.calls.length).to.eq(1);

    wrapper.find('div.pag div.paginator-spacing button')
      .forEach((btn, i) => {
        if (i === 1) {
          btn.simulate('click');
        }
      });
    wrapper.find('div.pag div.paginator-spacing button').first().simulate('click');

    expect(TableComponent.prototype.handleChangePage).to.have.property('callCount', 2);

    wrapper.find('div.pag div.paginator-spacing div[role="button"]').first().simulate('click');
    wrapper.find('div[role="document"] ul[role="listbox"] li').forEach((btn, i) => {
      if (i === 2) {
        btn.simulate('click');
      }
    });
    expect(TableComponent.prototype.handleChange).to.have.property('callCount', 1);
  });

  it('column dialog', () => {
    wrapper = mount(
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
    expect(TableComponent.prototype.handleColumnCheck).to.have.property('callCount', 1);
    wrapper.find('input[type="radio"]').simulate('change');
    wrapper.find('#column-dialog-actions button').simulate('click');
    expect(wrapper.state().tableColumns.find(t => t.id === 'name'))
      .to.have.property('checked', false);
  });
});
