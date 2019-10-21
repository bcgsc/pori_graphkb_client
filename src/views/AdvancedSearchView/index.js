import React, {
  useState, useContext, useEffect, useReducer, useCallback,
} from 'react';
import PropTypes from 'prop-types';
import useDeepCompareEffect from 'use-deep-compare-effect';
import {
  Typography, Card,
} from '@material-ui/core';


import { SnackbarContext } from '@bcgsc/react-snackbar-provider';
import { KBContext } from '../../components/KBContext';
import FormField from '../../components/RecordForm/FormField';
import { OPERATORS } from './constants';
import './index.scss';
import ActionButton from '../../components/ActionButton';
import FilterGroup from './FilterGroup';
import { cleanLinkedRecords } from '../../components/util';
import api from '../../services/api';

const defaultFilterGroup = [{ key: 1, name: 'Filter Group 1', filters: [] }];

/**
 * Manages state of filter groups and handles action dispatching.
 *
 * @property {string} action.type type of action being dispatched
 * @property {object} action.payload filter being added in the form of
 * { attr: 'property name', value: 'value assigned to prop', operator: 'operator'}
 * @property {string} action.filterGroupName name of filterGroup targetted by action
 */
const filterGroupReducer = (state, action) => {
  const {
    type: actionType, payload, filterGroupName,
  } = action;

  if (actionType === 'addGroup') {
    const { key: lastKey } = state[state.length - 1];
    return [...state, { key: lastKey + 1, name: `Filter Group ${lastKey + 1}`, filters: [] }];
  }
  if (actionType === 'addFilter') {
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
  prop: null,
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


  const { schema } = useContext(KBContext);
  const snackbar = useContext(SnackbarContext);

  // set up current model for search
  const [modelName, setModelName] = useState(initialModelName);
  const [model, setModel] = useState(null);
  const [propertyModel, setPropertyModel] = useState(null);
  useDeepCompareEffect(() => {
    setModel(schema.get(modelName || 'V'));
  }, [schema, modelName]);

  // fetching class model options
  const [modelOptions, setModelOptions] = useState([]);
  useEffect(() => {
    if (schema) {
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
    }
  }, [schema, history]);

  // Based on the selected model, generate property/attribute list
  const queryProps = model ? model.queryProperties : [];
  const [queryProperties, setQueryProperties] = useState(queryProps);
  useEffect(() => {
    if (model) {
      const qProps = Object.values(model.properties);
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
      return { prop: null, value: null, operator: null };
    }
    if (actionType === 'prop-change') {
      return { ...state, value: null, operator: null };
    }
    if (actionType === 'value') {
      // validate value first before changing it
      const { error } = schema.validateValue(propertyModel, payload, false);

      if (error) {
        snackbar.add(`${propertyModel.name} ${error.message}`);
        return { ...state };
      }
    }
    if (actionType === 'operator') {
      if (['CONTAINSALL', 'IN', 'CONTAINSANY', 'CONTAINS'].includes(payload) && !Array.isArray(state.value)) {
        snackbar.add('Operator can only be used for iterables (inputs that take multiple values)');
        return { ...state };
      }
    }
    return { ...state, [actionType]: payload };
  }, [propertyModel, schema, snackbar]);

  const [currFilter, setFilter] = useReducer(activeFilterReducer, initialFilterValues);
  const { prop: currProp, value: currValue, operator: currOperator } = currFilter;


  // set current Property and allowed values
  useEffect(() => {
    if (model) {
      const propModel = model.queryProperties[currProp];

      // set generatated false so that we can search for value
      if (propModel) {
        propModel.generated = false;
      }
      setPropertyModel(propModel);
      setFilter({ type: 'prop-change' });
    }
  }, [currProp, model]);

  // set up filter group reducer and currFilterGroup tracker
  const [filterGroups, setFilterGroups] = useReducer(filterGroupReducer, defaultFilterGroup);
  const [currFilterGroup, setFilterGroup] = useState('');

  const hasActiveFilters = filterGroups.some(fGroup => fGroup.filters.length > 0);

  // clears entire form if modelname changes
  useEffect(() => {
    setFilter({ type: 'clear' });
    setFilterGroup(null);
    setFilterGroups({ type: 'clear' });
  }, [modelName]);

  const handleFilterGroupDelete = (filterGroupName) => {
    if (filterGroupName === currFilterGroup) {
      setFilterGroup(null);
    }
    setFilterGroups({ type: 'delete', filterGroupName });
  };

  const handleSubmit = () => {
    // deep copy filters
    const searchFilters = filterGroups.map(fg => ({
      filters: [...fg.filters],
    }));

    // go through filter values and if any of them are objects use rid instead
    filterGroups.forEach((fg, fgIndex) => {
      fg.filters.forEach((filter, filterIndex) => {
        const targetFilterGroup = searchFilters[fgIndex];
        targetFilterGroup.filters[filterIndex] = cleanLinkedRecords(filter);
      });
    });

    const content = {
      target: modelName,
      filters: {
        OR: [],
      },
    };

    searchFilters.forEach((fg) => {
      const filterGroupComparisons = content.filters.OR;
      filterGroupComparisons.push({
        AND: fg.filters.map(filter => ({ [filter.attr]: filter.value, operator: filter.operator })),
      });
    });

    try {
      const search = api.encodeQueryComplexToSearch(content, modelName);
      history.push(`/data/table?${search}`, { search, content });
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <>
      <div className="class-select">
        <FormField
          model={{
            choices: modelOptions, required: true, name: '@class type to be queried', type: 'string',
          }}
          value={modelName}
          onChange={({ target: { value } }) => setModelName(value)}
          schema={schema}
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
              onChange={({ target: { value } }) => setFilter({ type: 'prop', payload: value })}
              schema={schema}
              className="property-select"
              disabled={!modelName}
            />
          </div>
          <div className="add-filter-box-actions__value">
            {(model) && (
            <FormField
              model={propertyModel || { type: 'nope', choices: [] }}
              value={currValue}
              onChange={({ target: { value } }) => setFilter({
                type: 'value', payload: value,
              })}
              schema={schema}
              className="value-select"
              disabled={!currProp}
              variant="edit"
            />
            )}
          </div>
          <div className="add-filter-box-actions__operator">
            <FormField
              model={{
                choices: OPERATORS, required: true, name: 'operator', type: 'string',
              }}
              value={currOperator}
              onChange={({ target: { value } }) => setFilter({ type: 'operator', payload: value })}
              schema={schema}
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
              choices: filterGroups.map(fg => ({
                label: fg.name, value: fg.name, key: fg.name,
              })),
              required: true,
              name: 'filterGroup',
              type: 'string',
              description: 'add filter to filterGroup',
            }}
            value={currFilterGroup}
            variant="edit"
            onChange={({ target: { value } }) => setFilterGroup(value)}
            schema={schema}
          />
        </div>
        <ActionButton
          requireConfirm={false}
          onClick={() => {
            setFilterGroups({
              type: 'addFilter',
              payload: { attr: currProp, value: currValue, operator: currOperator },
              filterGroupName: currFilterGroup,
            });
          }}
          disabled={!(currProp && currValue && currOperator) || !currFilterGroup}
        >
          Add Filter
        </ActionButton>
      </div>

      <Card className="filter-groups">
        <div className="filter-groups__header">
          <Typography variant="h5">
          Active Filter Groups
          </Typography>
          <ActionButton
            onClick={() => setFilterGroups({ type: 'addGroup' })}
            requireConfirm={false}
            variant="outlined"
          >
          Add Filter Group
          </ActionButton>
        </div>
        <div className="filter-groups__content">
          {filterGroups.map(filterGroup => (
            <FilterGroup
              filterGroup={filterGroup}
              handleDelete={handleFilterGroupDelete}
            />
          ))}
        </div>
        <div className={`search-btn${!hasActiveFilters ? '--disabled' : ''}`}>
          <ActionButton
            requireConfirm={false}
            onClick={handleSubmit}
            disabled={!hasActiveFilters}
          >
          Search
          </ActionButton>
        </div>
      </Card>
    </>
  );
}

AdvancedSearchView.propTypes = {
  history: PropTypes.object.isRequired,
  modelName: PropTypes.string,
};

AdvancedSearchView.defaultProps = {
  modelName: null,
};

export default AdvancedSearchView;
