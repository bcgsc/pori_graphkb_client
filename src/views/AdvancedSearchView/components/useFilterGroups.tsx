import { produce } from 'immer';
import { useCallback, useState } from 'react';

import { FilterType, QueryBody } from '@/components/types';

/**
 * Unlike cleaning record links, cannot assume there are no intermediary
 * objects that are not also records
 */
const cleanFilterLinks = (content: unknown): unknown => {
  if (Array.isArray(content)) {
    return content.map(cleanFilterLinks);
  }

  function isObj(value: unknown): value is Record<string, unknown> {
    return value != null && typeof value === 'object';
  }

  if (isObj(content)) {
    const newContent: Record<string, unknown> = {};

    if (content['@rid'] !== undefined) {
      return content['@rid'];
    }
    Object.keys(content).forEach((key) => {
      if (content[key] !== undefined) {
        newContent[key] = cleanFilterLinks(content[key]);
      }
    });
    return newContent;
  }
  return content;
};

export interface VerboseFilterType {
  query: FilterType;
  value: unknown;
  attr: string;
  operator: string;
  subqueryType?: string;
}

const useFilterGroups = () => {
  const [groups, setGroups] = useState<VerboseFilterType[][]>([[]]);
  const [selectedGroupIndex, setSelectedGroupIndex] = useState(0);

  const reset = useCallback(() => {
    setGroups([[]]);
  }, []);

  const addGroup = useCallback(() => {
    setGroups((prev) => [...prev, []]);
  }, []);

  const addFilter = useCallback((filter) => {
    setGroups(produce((draft) => {
      if (!draft.length) {
        draft.push([]);
      }
      const group = draft[selectedGroupIndex];
      group.push(filter);
    }));
  }, [selectedGroupIndex]);

  const removeFilter = useCallback((groupIndex: number, filterIndex: number) => {
    setGroups(produce((draft) => {
      draft[groupIndex].splice(filterIndex, 1);
    }));
  }, []);

  const removeGroup = useCallback((groupIndex: number) => {
    setGroups(produce((draft) => {
      draft.splice(groupIndex, 1);

      if (!draft.length) {
        draft.push([]);
      }
    }));

    if (selectedGroupIndex === groupIndex) {
      setSelectedGroupIndex(0);
    }
  }, [selectedGroupIndex]);

  const getQuery = useCallback((target: string): QueryBody => {
    const cleanedContent: FilterType[] = [];
    groups.forEach((group) => {
      const filters: FilterType[] = [];
      group.forEach((filter) => {
        filters.push(cleanFilterLinks(filter.query) as FilterType);
      });

      if (filters.length === 1) {
        cleanedContent.push(filters[0]);
      } else if (filters.length > 1) {
        cleanedContent.push({ AND: filters });
      }
    });

    const content: QueryBody = { target };

    if (cleanedContent.length === 1) {
      content.filters = cleanedContent;
    } else if (cleanedContent.length > 1) {
      content.filters = { OR: cleanedContent };
    }
    return content;
  }, [groups]);

  return {
    groups,
    addFilter,
    removeFilter,
    removeGroup,
    selectedGroupIndex,
    setSelectedGroupIndex,
    addGroup,
    getQuery,
    reset,
  };
};

export default useFilterGroups;
