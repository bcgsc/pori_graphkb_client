import {
  CircularProgress,
  ListItem,
  ListItemText,
} from '@material-ui/core';
import React from 'react';
import { useQuery } from 'react-query';

import DetailChip from '@/components/DetailChip';
import LetterIcon from '@/components/LetterIcon';
import { tuple } from '@/components/util';
import api from '@/services/api';
import schema from '@/services/schema';

interface ClassDescriptionProps {
  /** the class description */
  description: string;
  /** the class model name */
  name: string;
}

const ClassDescription = ({ name, description }: ClassDescriptionProps) => {
  const { isFetching: exampleIsFetching, data: example } = useQuery(
    tuple('/query', { target: name, neighbors: 1, limit: 1 }),
    async ({ queryKey: [, body] }) => {
      const [result] = await api.query(body);
      return result;
    },
    { staleTime: Infinity, throwOnError: false },
  );

  const { isFetching: countIsFetching, data: count } = useQuery(
    `/stats?classList=${name}`,
    async ({ queryKey: [route] }) => api.get(route),
    {
      staleTime: Infinity,
      select: (response) => {
        const { [name]: value } = response;
        let newCount = value;

        if (value / 1000000 > 1) {
          newCount = `${Math.round(value / 1000000)}M`;
        } else if (value / 1000 > 1) {
          newCount = `${Math.round(value / 1000)}K`;
        } else {
          newCount = `${value}`;
        }
        return newCount;
      },
    },
  );

  return (
    <React.Fragment key={name}>
      <ListItem>
        <LetterIcon value={count === ''
          ? name.slice(0, 1)
          : count}
        />
        <ListItemText primary={name} secondary={description} />
      </ListItem>
      <ListItem>
        <ListItemText inset>
          {(exampleIsFetching || countIsFetching) && (<CircularProgress size={20} />)}
          {example && (
            <DetailChip
              className="record-autocomplete__chip record-autocomplete__chip--single"
              details={example}
              label={schema.getLabel(example)}
              valueToString={(value) => {
                if (Array.isArray(value)) {
                  return `Array(${value.length})`;
                } if (typeof value === 'object') {
                  return schema.getLabel(value);
                }
                return `${value}`;
              }}
            />
          )}
        </ListItemText>
      </ListItem>
    </React.Fragment>
  );
};

export default ClassDescription;
