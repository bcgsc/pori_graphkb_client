import { produce } from 'immer';
import { useCallback, useState } from 'react';

import { Comparison, FilterType, QueryBody } from '@/components/types';

const useFilterGroups = () => {
  const [groups, setGroups] = useState<Comparison[][]>([[]]);
  const [selectedGroupIndex, setSelectedGroupIndex] = useState(0);

  const reset = useCallback(() => {
    setGroups([[]]);
  }, []);

  const addGroup = useCallback(() => {
    setGroups((prev) => [...prev, []]);
  }, []);

  const addFilter = useCallback((filter: Comparison) => {
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
        filters.push(filter);
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
