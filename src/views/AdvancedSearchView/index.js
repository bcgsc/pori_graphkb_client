import React, {
  useState, useContext, useEffect, useReducer, useCallback,
} from 'react';
import PropTypes from 'prop-types';
import {
  Typography, Card,
} from '@material-ui/core';


import { SnackbarContext } from '@bcgsc/react-snackbar-provider';

import schema from '../../services/schema';
import FormField from '../../components/RecordForm/FormField';
import { OPERATORS, BLACKLISTED_PROPERTIES } from './constants';
import './index.scss';
import ActionButton from '../../components/ActionButton';
import FilterGroup from './FilterGroup';
import { cleanLinkedRecords } from '../../components/util';
import api from '../../services/api';
import { HistoryPropType } from '../../components/types';

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

const initialFilterValues = {
  attr: null,
  value: null,
  operator: null,
};

/**
 * Advanced Search Form. Gives users most control on how they can query
 * the knowledgebase. Query consists of different filter groups with their own
 * set of filters.
 *
 * @property {string} props.modelName name of target model of query
 * @property {object} props.history history router object to navigate to different views
 */
function AdvancedSearchView(props) {
  const {
    modelName: initialModelName,
    history,
  } = props;


  const snackbar = useContext(SnackbarContext);

  // set up current model for search
  const [modelName, setModelName] = useState(initialModelName || 'Statement');
  const [model, setModel] = useState(null);
  const [propertyModel, setPropertyModel] = useState(null);
  useEffect(() => {
    setModelName(modelName || 'Statement');
    setModel(schema.get(modelName || 'Statement'));
  }, [modelName]);

  // fetching class model options
  const [modelOptions, setModelOptions] = useState([]);
  useEffect(() => {
    try {
      const options = schema.get('V').descendantTree(true).map(m => ({
        label: m.name, value: m.name, key: m.name, caption: m.description,
      }));
      setModelOptions(options);

      if (options.length === 1) {
        setModelName(options[0].label);
      } else {
        setModelName('');
      }
    } catch (err) {
      history.push('/error', { error: { name: err.name, message: err.toString() } });
    }
  }, [history]);

  // Based on the selected model, generate property/attribute list
  const queryProps = model ? model.queryProperties : [];
  const [queryProperties, setQueryProperties] = useState(queryProps);
  useEffect(() => {
    if (model) {
      const qProps = Object.values(model.properties)
        .filter(qprop => !BLACKLISTED_PROPERTIES.includes(qprop.name))
        .sort((a, b) => a.name.localeCompare(b.name));
      const queryPropOptions = qProps.map(p => ({
        label: p.name, value: p.name, key: p.name, caption: p.description,
      }));
      setQueryProperties(queryPropOptions);
    }
  }, [model]);


  /**
   * Manages current attr, value and operator for active filter.
   * State will be current filter. Action will either clear values or set values.
   *
   * */
  const activeFilterReducer = useCallback((state, action) => {
    const {
      type: actionType, payload,
    } = action;

    if (actionType === 'clear') {
      return { attr: null, value: null, operator: null };
    }
    if (actionType === 'value-clear') {
      return { ...state, value: null, operator: null };
    }
    if (actionType === 'value') {
      if (propertyModel && propertyModel.name === '@rid') {
        return { ...state, [actionType]: payload };
      }
      // validate value first before changing it
      const { error } = schema.validateValue(propertyModel, payload, false);

      if (error) {
        snackbar.add(`${propertyModel.name} ${error.message}`);
        return { ...state };
      }
    }
    return { ...state, [actionType]: payload };
  }, [propertyModel, snackbar]);

  const [currFilter, setFilter] = useReducer(activeFilterReducer, initialFilterValues);
  const { attr: currProp, value: currValue, operator: currOperator } = currFilter;


  const constructOperatorOptions = (pModel, currentVal, OperatorOptions) => {
    let iterableOptCheck = OperatorOptions;

    // check if property is iterable and set corresponding option values
    if (pModel && !pModel.iterable) {
      iterableOptCheck = OperatorOptions.filter(op => !op.iterable || op.label === '=');

      if (currentVal && !Array.isArray(currentVal)) {
        iterableOptCheck = iterableOptCheck.filter(op => !(op.label === 'IN'));
      }
    } else if (pModel) {
      const { name } = pModel;

      if (name === 'relevance' || name === 'subject') {
        if (currentVal && currentVal.length > 1) {
          iterableOptCheck = OperatorOptions.filter(op => (op.label === 'CONTAINSANY'));
        } else {
          iterableOptCheck = OperatorOptions.filter(op => (op.label === '='));
        }
      } else {
        iterableOptCheck = OperatorOptions.filter(op => op.iterable || op.label === '=');

        if (currentVal && currentVal.length > 1) {
          iterableOptCheck = iterableOptCheck.filter(op => !(op.label === 'CONTAINS'));
        }
      }
    }

    let finalOptionSet = iterableOptCheck;

    // eslint-disable-next-line no-restricted-globals
    if (currentVal && isNaN(currentVal)) {
      finalOptionSet = iterableOptCheck.filter(op => !op.isNumOperator || op.label === '=');
    }

    if (currentVal && !(typeof currentVal === 'string')) {
      finalOptionSet = finalOptionSet.filter(op => !(op.label === 'CONTAINSTEXT'));
    }
    return finalOptionSet || [];
  };
  // set current Property and allowed values
  const [operatorOps, setOperatorOps] = useState(OPERATORS);
  useEffect(() => {
    if (model) {
      const propModel = model.queryProperties[currProp];

      let clonedPropModel;

      if (propModel) {
        // set generatated false so that we can search for value
        clonedPropModel = Object.create(propModel);
        clonedPropModel.generated = false;
        const { name: propName } = clonedPropModel;

        if (propName === 'relevance' || propName === 'subject') {
          // allow both properties to take in a list
          clonedPropModel.iterable = true;
          clonedPropModel.type = 'linkset';
        }
        setPropertyModel(clonedPropModel);
      }


      const finalOptions = constructOperatorOptions(clonedPropModel, currValue, OPERATORS);
      setOperatorOps(finalOptions);

      if (finalOptions.length === 1) {
        setFilter({ type: 'operator', payload: finalOptions[0].label });
      }
    }
  }, [currProp, currValue, model]);

  useEffect(() => {
    if (currProp) {
      setFilter({ type: 'value-clear' });
    }
  }, [currProp]);


  const [filterGroups, setFilterGroups] = useReducer(filterGroupReducer, defaultFilterGroup);
  const [currFilterGroup, setFilterGroup] = useState('Filter Group 1');
  useEffect(() => {
    if (!currFilterGroup) {
      const doesFilterGroup1Exist = filterGroups.some(fg => fg.name === 'Filter Group 1');

      if (doesFilterGroup1Exist) {
        setFilterGroup('Filter Group 1');
      } else {
        setFilterGroup('Add to new Filter Group');
      }
    }
  }, [currFilterGroup, filterGroups]);

  useEffect(() => {
    if (modelName) {
      setFilter({ type: 'clear' });
      setPropertyModel(null);
      setFilterGroup(null);
      setFilterGroups({ type: 'clear' });
    }
  }, [modelName]);

  const handleFilterGroupDelete = (filterGroupName) => {
    if (filterGroupName === currFilterGroup) {
      setFilterGroup(null);
    }
    setFilterGroups({ type: 'delete', filterGroupName });
  };

  const handleFilterGroupAction = async () => {
    if (currFilterGroup === 'Add to new Filter Group') {
      setFilterGroups({
        type: 'add-group-and-filter',
        payload: { attr: currProp, value: currValue, operator: currOperator },
      });
    } else {
      setFilterGroups({
        type: 'add-filter',
        payload: { attr: currProp, value: currValue, operator: currOperator },
        filterGroupName: currFilterGroup,
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

  const filterGroupOptions = filterGroups.map(fg => ({
    label: fg.name, value: fg.name, key: fg.name,
  }));
  filterGroupOptions.push({ label: 'Add to new Filter Group', value: 'Add to new Filter Group', key: 'Add to new Filter Group' });

  return (
    <>
      <div className="class-select">
        <FormField
          model={{
            choices: modelOptions, required: true, name: '@class type to be queried', type: 'string',
          }}
          value={modelName}
          onChange={({ target: { value } }) => setModelName(value)}
          className="class-select"
        />
      </div>

      <div className="add-filter-box">
        <Typography variant="h5">
          Add New Filter
        </Typography>
        <div className="add-filter-box-actions">
          <div className="add-filter-box-actions__property">
            <FormField
              model={{
                choices: queryProperties, required: true, name: 'properties', type: 'string',
              }}
              value={currProp}
              innerProps={{ 'data-testid': 'prop-select' }}
              onChange={({ target: { value } }) => setFilter({ type: 'attr', payload: value })}
              className="property-select"
              disabled={!modelName}
            />
          </div>
          <div className="add-filter-box-actions__value">
            {(model) && (
            <FormField
              model={propertyModel || { type: 'nope', choices: [] }}
              value={currValue}
              innerProps={{ 'data-testid': 'value-select' }}
              onChange={({ target: { value } }) => setFilter({
                type: 'value', payload: value,
              })}
              className="value-select"
              disabled={!currProp}
              variant="edit"
            />
            )}
          </div>
          <div className="add-filter-box-actions__operator">
            <FormField
              model={{
                choices: operatorOps, required: true, name: 'operator', type: 'string',
              }}
              value={currOperator}
              innerProps={{ 'data-testid': 'operator-select' }}
              onChange={({ target: { value } }) => setFilter({ type: 'operator', payload: value })}
              className="operator-select"
              disabled={!currValue}
            />
          </div>
        </div>
      </div>
      <div className="add-filter-group-box">
        <div className="add-filter-group-box__dropdown">
          <FormField
            model={{
              choices: filterGroupOptions,
              required: true,
              name: 'filterGroup',
              type: 'string',
              description: `${currFilterGroup === 'Add to new Filter Group'
                ? 'Create new filter group and filter to it'
                : 'add active filter to filter group'}`,
            }}
            value={currFilterGroup}
            variant="edit"
            onChange={({ target: { value } }) => setFilterGroup(value)}
          />
        </div>
        <ActionButton
          requireConfirm={false}
          onClick={handleFilterGroupAction}
          disabled={!(currProp && currValue && currOperator) || !currFilterGroup}
          variant="outlined"
        >
          ADD FILTER
        </ActionButton>
      </div>

      <Card className="filter-groups">
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
            requireConfirm={false}
            onClick={handleSubmit}
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
  modelName: PropTypes.string,
};

AdvancedSearchView.defaultProps = {
  modelName: null,
};

export default AdvancedSearchView;
