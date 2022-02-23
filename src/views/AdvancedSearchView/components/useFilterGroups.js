import { useCallback, useState } from 'react';

import useObject from '@/components/hooks/useObject';

const START_GROUP = '1';

/**
 * Unlike cleaning record links, cannot assume there are no intermediary
 * objects that are not also records
 */
const cleanFilterLinks = (content) => {
  if (Array.isArray(content)) {
    return content.map(cleanFilterLinks);
  }
  if (content != null && typeof content === 'object') {
    const newContent = {};

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

const useFilterGroups = () => {
  const {
    content: groups,
    updateField: updateGroup,
    removeField,
    replace: replaceGroups,
  } = useObject({ [START_GROUP]: [] });
  const [selectedGroup, setSelectedGroup] = useState(START_GROUP);

  const reset = useCallback(() => {
    replaceGroups({ [START_GROUP]: [] });
  }, [replaceGroups]);

  const addGroup = useCallback(() => {
    let groupIndex = Object.keys(groups).length;

    while (true) {
      const key = `${groupIndex + 1}`;

      if (!groups[key]) {
        break;
      }
      groupIndex += 1;
    }
    const newGroup = `${groupIndex + 1}`;
    updateGroup(newGroup, []);
    return newGroup;
  }, [groups, updateGroup]);

  const addFilterToGroup = useCallback((filter, newGroup = false) => {
    const group = newGroup
      ? addGroup()
      : selectedGroup;

    if (!groups[group]) {
      groups[group] = [];
    }
    updateGroup(group, [...groups[group], filter]);
  }, [addGroup, groups, selectedGroup, updateGroup]);

  const removeFilterAt = useCallback((pos, group = selectedGroup) => {
    const newFilters = [...groups[group].slice(0, pos), ...groups[group].slice(pos + 1)];
    updateGroup(group, newFilters);
  }, [groups, selectedGroup, updateGroup]);

  const removeGroup = useCallback((group) => {
    if (group !== START_GROUP) {
      if (selectedGroup === group) {
        setSelectedGroup(START_GROUP);
      }
      removeField(group);
    }
  }, [removeField, selectedGroup]);

  const getQuery = useCallback((target) => {
    const cleanedContent = [];
    Object.values(groups).forEach((group) => {
      const filters = [];
      group.forEach((filter) => {
        filters.push(cleanFilterLinks(filter.query));
      });

      if (filters.length === 1) {
        cleanedContent.push(filters[0]);
      } else if (filters.length > 1) {
        cleanedContent.push({ AND: filters });
      }
    });

    const content = {
      target,
    };

    if (cleanedContent.length === 1) {
      content.filters = cleanedContent;
    } else if (cleanedContent.length > 1) {
      content.filters = { OR: cleanedContent };
    }
    return content;
  }, [groups]);

  return {
    groups,
    addFilterToGroup,
    removeFilterAt,
    removeGroup,
    selectedGroup,
    setSelectedGroup,
    addGroup,
    defaultGroup: START_GROUP,
    getQuery,
    reset,
  };
};

export default useFilterGroups;
