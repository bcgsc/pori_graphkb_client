import './index.scss';

import { SnackbarContext } from '@bcgsc/react-snackbar-provider';
import {
  Card,
  Typography,
} from '@material-ui/core';
import React, {
  useContext, useEffect, useReducer, useState,
} from 'react';

import ActionButton from '@/components/ActionButton';
import ModelSelect from '@/components/ModelSelect';
import { HistoryPropType } from '@/components/types';
import { cleanLinkedRecords } from '@/components/util';
import api from '@/services/api';

import FilterGroup from './components/FilterGroup';
import PropertyFilter from './components/PropertyFilter';

const defaultFilterGroup = [];

/**
 * Manages state of filter groups and handles action dispatching.
 *
 * @property {string} action.type type of action being dispatched
 * @property {object} action.payload filter being added in the form with shape
 * { attr: 'property name', value: 'value assigned to prop', operator: 'operator'}
 * @property {string} action.filterGroupName name of filterGroup targetted by action
 */
const filterGroupReducer = (state, action) => {
  const {
    type: actionType, payload, filterGroupName,
  } = action;

  if (actionType === 'add-group-and-filter') {
    if (!state.length) {
      return [{ key: 1, name: 'Filter Group 1', filters: [payload] }];
    }
    const { key: lastKey } = state[state.length - 1];
    return [...state, { key: lastKey + 1, name: `Filter Group ${lastKey + 1}`, filters: [payload] }];
  }
  if (actionType === 'add-filter') {
    const targetIndex = state.findIndex(fgroup => fgroup.name === filterGroupName);
    const targetFilterGroup = state[targetIndex];
    const newFilterGroup = { ...targetFilterGroup, filters: [...targetFilterGroup.filters] };
    newFilterGroup.filters.push(payload);

    if (state.length === 1) {
      return [newFilterGroup];
    }
    return [...state.slice(0, targetIndex), newFilterGroup, ...state.slice(targetIndex + 1)];
  }
  if (actionType === 'clear') {
    return [...defaultFilterGroup];
  }
  if (actionType === 'delete') {
    if (state.length === 1) {
      return [...defaultFilterGroup];
    }
    const targetIndex = state.findIndex(fgroup => fgroup.name === filterGroupName);
    return [...state.slice(0, targetIndex), ...state.slice(targetIndex + 1)];
  }
  return [...state];
};

/**
 * Advanced Search Form. Gives users most control on how they can query
 * the knowledgebase. Query consists of different filter groups with their own
 * set of filters.
 *
 * @property {object} props.history history router object to navigate to different views
 */
function AdvancedSearchView(props) {
  const {
    history,
  } = props;

  const snackbar = useContext(SnackbarContext);

  // set up current model for search
  const [modelName, setModelName] = useState('Statement');
  useEffect(() => {
    setModelName(modelName || 'Statement');
  }, [modelName]);


  const [filterGroups, setFilterGroups] = useReducer(filterGroupReducer, defaultFilterGroup);

  useEffect(() => {
    if (modelName) {
      setFilterGroups({ type: 'clear' });
    }
  }, [modelName]);

  const handleFilterGroupDelete = (filterGroupName) => {
    setFilterGroups({ type: 'delete', filterGroupName });
  };

  const handleAddFilter = async ({ group, ...filter }) => {
    if (!group) {
      setFilterGroups({
        type: 'add-group-and-filter',
        payload: filter,
      });
    } else {
      setFilterGroups({
        type: 'add-filter',
        payload: filter,
        filterGroupName: group,
      });
    }
  };

  /**
   * Generates search chip props from filter groups
   */
  const generateSearchChipProps = (FilterGroups) => {
    const filters = FilterGroups.map(fg => (
      fg.filters.map((filter) => {
        const value = Array.isArray(filter.value)
          ? filter.value.map(val => val.displayName || val.name).join(' , ')
          : filter.value.displayName || filter.value.name || filter.value;
        return `${filter.attr} ${filter.operator} ${value}`;
      })));
    return filters;
  };

  const handleSubmit = () => {
    const searchFilters = filterGroups.map(fg => ({
      filters: [...fg.filters],
    }));

    let formContainsError = false;
    // go through filter values and if any of them are objects use rid instead
    filterGroups.forEach((fg, fgIndex) => {
      fg.filters.forEach((filter, filterIndex) => {
        const targetFilterGroup = searchFilters[fgIndex];

        try {
          targetFilterGroup.filters[filterIndex] = cleanLinkedRecords(filter);
        } catch (err) {
          snackbar.add(err.message);
          formContainsError = true;
        }
      });
    });

    if (formContainsError) {
      return;
    }

    const content = {
      target: modelName,
      filters: {
        OR: [],
      },
    };

    searchFilters.forEach((fg) => {
      const filterGroupComparisons = content.filters.OR;

      if (fg.filters.length) {
        filterGroupComparisons.push({
          AND: fg.filters.map(filter => ({ [filter.attr]: filter.value, operator: filter.operator })),
        });
      }
    });

    if (!searchFilters.length) {
      delete content.filters;
    }

    // search chip props need to be added here due to how search is constructed
    const searchChipProps = {};
    searchChipProps.searchType = 'Advanced';
    searchChipProps.filters = generateSearchChipProps(filterGroups);

    try {
      const search = api.encodeQueryComplexToSearch(content, modelName, searchChipProps);
      history.push(`/data/table?${search}`, { search, content });
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <>
      <div className="advanced-search__class-select">
        <ModelSelect
          baseModel="V"
          onChange={({ target: { value: newValue } }) => setModelName(newValue)}
          value={modelName}
        />
      </div>
      <PropertyFilter
        filterGroups={filterGroups.map(f => f.name)}
        modelName={modelName}
        onSubmit={handleAddFilter}
      />
      <Card className="advanced-search__filter-groups">
        <div className="filter-groups__header">
          <Typography variant="h5">
          Active Filter Groups
          </Typography>
        </div>
        <div className="filter-groups__content">
          {filterGroups.map(filterGroup => (
            <FilterGroup
              filterGroup={filterGroup}
              handleDelete={handleFilterGroupDelete}
            />
          ))}
        </div>
        <div className="search-btn">
          <ActionButton
            onClick={handleSubmit}
            requireConfirm={false}
          >
           Search
          </ActionButton>
        </div>
      </Card>
    </>
  );
}

AdvancedSearchView.propTypes = {
  history: HistoryPropType.isRequired,
};

export default AdvancedSearchView;
