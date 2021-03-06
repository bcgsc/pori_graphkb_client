import {
  CircularProgress,
  ListItem,
  ListItemText,
} from '@material-ui/core';
import PropTypes from 'prop-types';
import React from 'react';
import { useQuery } from 'react-query';

import DetailChip from '@/components/DetailChip';
import LetterIcon from '@/components/LetterIcon';
import api from '@/services/api';
import schema from '@/services/schema';


/**
 * @param {Object} props
 * @param {string} props.name the class model name
 * @param {string} props.description the class description
 */
const ClassDescription = ({ name, description }) => {
  const { isFetching: exampleIsFetching, data: example } = useQuery(
    ['/query', { target: name, neighbors: 1, limit: 1 }],
    async (url, body) => {
      const controller = api.post(url, body);
      const [result] = await controller.request();
      return result;
    },
    { staleTime: Infinity, throwOnError: false },
  );

  const { isFetching: countIsFetching, data: count } = useQuery(
    `/stats?classList=${name}`,
    async (url) => {
      const controller = api.get(url);
      const { [name]: value } = await controller.request();
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
    { staleTime: Infinity, throwOnError: false },
  );


  return (
    <React.Fragment key={name}>
      <ListItem>
        <LetterIcon value={count === ''
          ? name.slice(0, 1)
          : count
          }
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

ClassDescription.propTypes = {
  description: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
};

export default ClassDescription;
