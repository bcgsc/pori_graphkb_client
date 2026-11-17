import './index.scss';

import React, { useCallback, useState } from 'react';
import { useNavigate } from 'react-router';

import ActionButton from '@/components/ActionButton';
import ModelSelect from '@/components/ModelSelect';
import api from '@/services/api';

import AddFilterGroupButton from './components/AddFilterGroupButton';
import FilterGroup from './components/FilterGroup';
import PropertyFilter from './components/PropertyFilter';
import useFilterGroups from './components/useFilterGroups';

/**
 * Advanced Search Form. Gives users most control on how they can query
 * the knowledgebase. Query consists of different filter groups with their own
 * set of filters.
 */
function AdvancedSearchView() {
  const navigate = useNavigate();
  // set up current model for search
  const [modelName, setModelName] = useState('Statement');
  const {
    groups,
    removeGroup,
    addFilter,
    addGroup,
    selectedGroupIndex,
    setSelectedGroupIndex,
    getQuery,
    removeFilter,
    reset,
  } = useFilterGroups();

  const handleSubmit = useCallback(() => {
    try {
      const query = getQuery(modelName);
      const search = api.encodeQueryComplexToSearch(query, modelName);
      navigate({
        pathname: '/data/table',
        search,
      }, { state: { query } });
    } catch (err) {
      console.error(err);
    }
  }, [getQuery, navigate, modelName]);

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
        modelName={modelName}
        onSubmit={addFilter}
      />
      <div className="advanced-search__filters">
        {groups.map((group, index) => (
          <FilterGroup
            // eslint-disable-next-line react/no-array-index-key
            key={index}
            filters={group}
            groupIndex={index}
            isSelected={index === selectedGroupIndex}
            name={String(index + 1)}
            onDelete={groups.length <= 1
              ? undefined
              : () => removeGroup(index)}
            onDeleteFilter={removeFilter}
            onSelect={() => setSelectedGroupIndex(index)}
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

export default AdvancedSearchView;
