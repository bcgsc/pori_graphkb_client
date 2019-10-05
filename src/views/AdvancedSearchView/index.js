import React, {
  useState, useContext, useEffect, useReducer,
} from 'react';
import PropTypes from 'prop-types';
import useDeepCompareEffect from 'use-deep-compare-effect';
import { Typography, Chip } from '@material-ui/core';

import { KBContext } from '../../components/KBContext';
import FormField from '../../components/RecordForm/FormField';
import { OPERATORS } from './util';
import './index.scss';
import ActionButton from '../../components/ActionButton';


const defaultFilterGroup = [{ name: 'filterGroup1', filters: [] }];

const filterGroupReducer = (state, action) => {
  const {
    type: actionType, payload, filterGroupName, resetFunctions,
  } = action;

  if (actionType === 'addGroup') {
    return [...state, { name: `filterGroup${state.length + 1}`, filters: [] }];
  } if (actionType === 'addFilter') {
    const { setCurrProp, setCurrValue, setCurrOperater } = resetFunctions;
    // setCurrProp(null);
    // setCurrValue(null);
    // setCurrOperater(null);
    const targetIndex = state.findIndex(fgroup => fgroup.name === filterGroupName);
    const targetFilterGroup = state[targetIndex];
    const newFilterGroup = { name: targetFilterGroup.name, filters: [...targetFilterGroup.filters] };
    newFilterGroup.filters.push(payload);

    if (state.length === 1) {
      return [newFilterGroup];
    }
    return [...state.slice(0, targetIndex), newFilterGroup, ...state.slice(targetIndex + 1)];
  } if (actionType === 'clear') {
    return [...defaultFilterGroup];
  }
};

function AdvancedSearchView(props) {
  const {
    modelName: initialModelName,
    history,
  } = props;


  const { schema } = useContext(KBContext);
  const [modelName, setModelName] = useState(initialModelName);


  const [model, setModel] = useState(null);
  // setting model
  useDeepCompareEffect(() => {
    setModel(schema.get(modelName || 'V'));
  }, [schema, modelName]);

  // fetching class model options
  const [modelOptions, setModelOptions] = useState([]);

  const [currOperater, setCurrOperater] = useState('');
  const operatorOptions = [];
  OPERATORS.forEach((op) => {
    const operatorOpt = {};
    ['label', 'value', 'key'].forEach((val) => { operatorOpt[val] = op; });
    operatorOptions.push(operatorOpt);
  });


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

  // set query property options
  const queryProps = model ? model.queryProperties : [];
  const [queryProperties, setQueryProperties] = useState(queryProps);
  useEffect(() => {
    if (model) {
      const qProps = Object.values(model._properties);
      const queryPropOptions = qProps.map(p => ({
        label: p.name, value: p.name, key: p.name, caption: p.description,
      }));
      setQueryProperties(queryPropOptions);
    }
  }, [model]);

  // set current Property and allowed values
  const [currProp, setCurrProp] = useState(null);
  const [propertyModel, setPropertyModel] = useState(null);
  const [currValue, setCurrValue] = useState('');
  useEffect(() => {
    if (model) {
      const propModel = model.queryProperties[currProp];
      setPropertyModel(propModel);
      setCurrValue(null);
      setCurrOperater(null);
    }
  }, [currProp, model]);

  // set up filter group reducer
  const [filterGroups, setFilterGroups] = useReducer(filterGroupReducer, defaultFilterGroup);
  console.log('TCL: AdvancedSearchView -> filterGroups', filterGroups);

  const [currFilterGroup, setFilterGroup] = useState('');
  console.log('TCL: AdvancedSearchView -> currFilterGroup', currFilterGroup);


  useEffect(() => {
    console.log('clearing current values');
    setCurrProp(null);
    setCurrValue(null);
    setCurrOperater(null);
    setFilterGroup(null);
    setFilterGroups({ type: 'clear' });
  }, [modelName]);

  return (
    <>
      <div className="class-select">
        <FormField
          model={{
            choices: modelOptions, required: true, name: '@class', type: 'string',
          }}
          value={modelName}
          onChange={({ target: { value } }) => setModelName(value)}
          schema={schema}
          className="class-select"
        />
      </div>

      {/* Add New Filter Box */}
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
              onChange={({ target: { value } }) => setCurrProp(value)}
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
              onChange={({ target: { value } }) => setCurrValue(value)}
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
                choices: operatorOptions, required: true, name: 'operator', type: 'string',
              }}
              value={currOperater}
              onChange={({ target: { value } }) => setCurrOperater(value)}
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
            }}
            value={currFilterGroup}
            onChange={({ target: { value } }) => setFilterGroup(value)}
            schema={schema}
          />
        </div>
        <ActionButton
          requireConfirm={false}
          onClick={() => {
            setFilterGroups({
              type: 'addFilter',
              payload: { name: currProp, value: currValue, operator: currOperater },
              filterGroupName: currFilterGroup,
              resetFunctions: { setCurrOperater, setCurrProp, setCurrValue },
            });
          }}
          disabled={!(currProp && currValue && currOperater) || !currFilterGroup}
        >
          Add Filter
        </ActionButton>
      </div>

      {/* Filter Groups  */}
      <div className="filter-groups">
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
            <div className={`filter-groups__box${filterGroup.filters.length ? '' : '--empty'}`}>
              <>
                {filterGroup.filters.map(filter => (
                  <div className="filter-chip">
                    <Typography>
                      {`${filter.name} = ${typeof filter.value === 'object' ? filter.value.name : filter.value}`}
                    </Typography>
                  </div>
                ))}
              </>
            </div>
          ))}
        </div>
      </div>
      <div className="search-btn">
        <ActionButton
          requireConfirm={false}
          onClick={() => console.log('searching!')}
        >
          Search
        </ActionButton>
      </div>
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
