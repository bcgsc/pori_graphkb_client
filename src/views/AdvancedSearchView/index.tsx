import './index.scss';

import { Alert } from '@mui/material';
import React, { useCallback } from 'react';
import {
  LoaderFunctionArgs, useLoaderData, useNavigate,
} from 'react-router';

import ActionButton from '@/components/ActionButton';
import ModelSelect from '@/components/ModelSelect';
import type {
  FilterType, QueryBody, QueryOptions, SubQuery,
} from '@/components/types';
import {
  decodeJSON, encodeJSON, isFixedSubquery, validateQueryBody,
} from '@/components/util';
import schema from '@/services/schema';

import AddFilterGroupButton from './components/AddFilterGroupButton';
import FilterGroup from './components/FilterGroup';
import PropertyFilter from './components/PropertyFilter';
import useFilterGroups from './components/useFilterGroups';

type SearchBody = QueryOptions & {
  target: string;
  filters: FilterType[][];
};

function formatQueryBody(
  searchBody: SearchBody,
  opts?: { excludeEmpty: boolean },
): string {
  const { filters, ...rest } = searchBody;
  const content: QueryOptions & SubQuery = { ...rest };
  const cleanedContent: FilterType[] = [];
  filters?.forEach((group) => {
    if (group.length === 1) {
      cleanedContent.push(group[0]);
    } else if (group.length > 1) {
      cleanedContent.push({ AND: [...group] });
    } else if (!opts?.excludeEmpty) {
      cleanedContent.push({ AND: [] }); // empty group
    }
  });

  if (cleanedContent.length === 1) {
    content.filters = cleanedContent[0];
  } else if (cleanedContent.length > 1) {
    content.filters = { OR: cleanedContent };
  }
  return encodeJSON(content);
}

export const loader = ({ request }: LoaderFunctionArgs): {
  query: SearchBody;
  warning?: string;
} => {
  const url = new URL(request.url);
  const query = url.searchParams.get('q');

  try {
    if (query) {
      const decodedQuery = decodeJSON<QueryBody>(query);

      if (!validateQueryBody(decodedQuery)) {
        throw new Error('Query body does not match the /query API shape.');
      }
      const body = decodedQuery;

      if (typeof body.target !== 'string') {
        throw new Error('Advanced Search requires a class name as the query target.');
      }
      const model = schema.get(body.target, false);

      if (!model) {
        throw new Error(`${body.target} is not a valid @class.`);
      }
      if (isFixedSubquery(body)) {
        return {
          query: { target: model.name, filters: [[]] },
          warning: `The ${String(body.queryType)} query type is not supported in Advanced Search; its query-specific options have been ignored.`,
        };
      }

      let filters: FilterType[][] = [[]];

      if (body.filters !== undefined) {
        let groups: FilterType[][];

        if (Array.isArray(body.filters)) {
          groups = [body.filters];
        } else if (body.filters.OR !== undefined) {
          groups = body.filters.OR.length
            ? body.filters.OR.map((filter) => [filter])
            : [[]];
        } else if (body.filters.AND !== undefined) {
          groups = [body.filters.AND];
        } else {
          groups = [[body.filters]];
        }

        filters = groups.map((group) => group.flatMap((filter) => (
          filter.AND !== undefined
          && filter.AND.every((nested) => nested.AND === undefined && nested.OR === undefined)
            ? filter.AND
            : [filter]
        )));
      }

      return { query: { ...body, target: model.name, filters } };
    }
  } catch (err) {
    return {
      query: { target: 'Statement', filters: [[]] },
      warning: `Invalid or unsupported query body omitted. ${(err as Error).message || ''}`,
    };
  }
  return {
    query: { target: 'Statement', filters: [[]] },
  };
};

/**
 * Advanced Search Form. Gives users most control on how they can query
 * the knowledgebase. Query consists of different filter groups with their own
 * set of filters.
 */
function AdvancedSearchView() {
  const navigate = useNavigate();
  const { query, warning } = useLoaderData<typeof loader>();
  // set up current model for search
  const handleUpdateFilters = useCallback((newGroups: FilterType[][]) => {
    navigate(`.?${new URLSearchParams({ q: formatQueryBody({ ...query, filters: newGroups }) })}`, { replace: true });
  }, [navigate, query]);

  const {
    removeGroup,
    addFilter,
    addGroup,
    selectedGroupIndex,
    setSelectedGroupIndex,
    removeFilter,
  } = useFilterGroups(query.filters, handleUpdateFilters);

  const handleSubmit = useCallback(() => {
    try {
      navigate(`/data/table?${new URLSearchParams({ q: formatQueryBody(query, { excludeEmpty: true }) })}`);
    } catch (err) {
      console.error(err);
    }
  }, [navigate, query]);

  const handleModelChange = useCallback(({ target: { value: newValue } }) => {
    navigate(`.?${new URLSearchParams({ q: formatQueryBody({ target: newValue, filters: [[]] }) })}`, { replace: true });
  }, [navigate]);

  return (
    <div className="advanced-search">
      {warning && (<Alert severity="warning">{warning}</Alert>)}
      <div className="advanced-search__class-select">
        <ModelSelect
          baseModel="V"
          includeAbstract
          onChange={handleModelChange}
          value={query.target}
        />
      </div>
      <PropertyFilter
        modelName={query.target}
        onSubmit={addFilter}
      />
      <div className="advanced-search__filters">
        {query.filters.map((group, index) => (
          <FilterGroup
            // eslint-disable-next-line react/no-array-index-key
            key={index}
            filters={group}
            groupIndex={index}
            isSelected={index === selectedGroupIndex}
            name={String(index + 1)}
            onDelete={query.filters.length <= 1
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

export { AdvancedSearchView as Component };
