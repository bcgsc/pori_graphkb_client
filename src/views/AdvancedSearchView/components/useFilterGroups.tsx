import { produce } from 'immer';
import { useCallback, useEffect, useState } from 'react';

import { Comparison, FilterType } from '@/components/types';

const useFilterGroups = (groups: FilterType[][], onChange: (groups: FilterType[][]) => void) => {
  const [selectedGroupIndex, setSelectedGroupIndex] = useState(0);

  useEffect(() => {
    setSelectedGroupIndex((index) => Math.min(index, Math.max(groups.length - 1, 0)));
  }, [groups.length]);

  const addGroup = useCallback(() => {
    onChange([...groups, []]);
  }, [groups, onChange]);

  const addFilter = useCallback((filter: Comparison) => {
    onChange(produce(groups, (draft) => {
      if (!draft.length) {
        draft.push([]);
      }
      const group = draft[selectedGroupIndex];
      group.push(filter);
    }));
  }, [groups, selectedGroupIndex, onChange]);

  const removeFilter = useCallback((groupIndex: number, filterIndex: number) => {
    onChange(produce(groups, (draft) => {
      draft[groupIndex].splice(filterIndex, 1);
    }));
  }, [groups, onChange]);

  const removeGroup = useCallback((groupIndex: number) => {
    onChange(produce(groups, (draft) => {
      draft.splice(groupIndex, 1);

      if (!draft.length) {
        draft.push([]);
      }
    }));

    if (selectedGroupIndex >= groupIndex) {
      setSelectedGroupIndex(Math.max(0, selectedGroupIndex - 1));
    }
  }, [groups, selectedGroupIndex, onChange]);

  return {
    groups,
    addFilter,
    removeFilter,
    removeGroup,
    selectedGroupIndex,
    setSelectedGroupIndex,
    addGroup,
  };
};

export default useFilterGroups;
