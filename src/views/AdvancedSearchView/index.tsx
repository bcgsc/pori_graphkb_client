import './index.scss';

import React, {
  useCallback,
  useEffect, useState,
} from 'react';

import ActionButton from '@/components/ActionButton';
import ModelSelect from '@/components/ModelSelect';
import { HistoryPropType } from '@/components/types';
import api from '@/services/api';

import AddFilterGroupButton from './components/AddFilterGroupButton';
import FilterGroup from './components/FilterGroup';
import PropertyFilter from './components/PropertyFilter';
import useFilterGroups from './components/useFilterGroups';

/**
 * Advanced Search Form. Gives users most control on how they can query
 * the knowledgebase. Query consists of different filter groups with their own
 * set of filters.
 *
 * @property {object} props.history history router object to navigate to different views
 */
function AdvancedSearchView({ history }) {
  // set up current model for search
  const [modelName, setModelName] = useState('Statement');
  const {
    groups,
    removeGroup,
    addFilterToGroup,
    addGroup,
    selectedGroup,
    setSelectedGroup,
    defaultGroup,
    getQuery,
    removeFilterAt,
    reset,
  } = useFilterGroups();

  useEffect(() => {
    setModelName(modelName || 'Statement');
  }, [modelName, reset]);

  const handleSubmit = useCallback(() => {
    try {
      const query = getQuery(modelName);
      const search = api.encodeQueryComplexToSearch(query, modelName);
      history.push(`/data/table?${search}`, { search, query });
    } catch (err) {
      console.error(err);
    }
  }, [getQuery, history, modelName]);

  const handleModelChange = useCallback(({ target: { value: newValue } }) => {
    setModelName(newValue);
    reset();
  }, [reset]);

  return (
    <div className="advanced-search">
      <div className="advanced-search__class-select">
        <ModelSelect
          baseModel="V"
          includeAbstract
          onChange={handleModelChange}
          value={modelName}
        />
      </div>
      <PropertyFilter
        className="advanced-search__property-filter"
        group={selectedGroup}
        modelName={modelName}
        onSubmit={addFilterToGroup}
      />
      <div className="advanced-search__filters">
        {Object.keys(groups).map(groupId => (
          <FilterGroup
            key={groupId}
            filters={groups[groupId]}
            isSelected={groupId === selectedGroup}
            name={groupId}
            onDelete={groupId === defaultGroup
              ? null
              : () => removeGroup(groupId)}
            onDeleteFilter={removeFilterAt}
            onSelect={() => setSelectedGroup(groupId)}
          />
        ))}
        <AddFilterGroupButton onClick={addGroup} />
      </div>
      <ActionButton
        className="advanced-search__search"
        onClick={handleSubmit}
        requireConfirm={false}
      >
        Search
      </ActionButton>
    </div>
  );
}

AdvancedSearchView.propTypes = {
  history: HistoryPropType.isRequired,
};

export default AdvancedSearchView;
