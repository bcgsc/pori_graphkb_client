import {
  CircularProgress,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@material-ui/core';
import PropTypes from 'prop-types';
import React from 'react';
import { useQuery } from 'react-query';

import DetailChip from '@/components/DetailChip';
import api from '@/services/api';
import schema from '@/services/schema';


/**
 * @param {Object} props
 * @param {string} props.name the class model name
 * @param {string} props.description the class description
 */
const ClassDescription = ({ name, description }) => {
  const { status: exampleStatus, data: example } = useQuery(
    [{ target: name, neighbors: 1, limit: 1 }],
    async () => {
      const controller = api.post('/query', { target: name, neighbors: 1, limit: 1 });
      const [result] = await controller.request();
      return result;
    },
    { staleTime: Infinity },
  );

  const { status: countStatus, data: count } = useQuery(
    `/stats?classList=${name}`,
    async () => {
      const controller = api.get(`/stats?classList=${name}`);
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
    { staleTime: Infinity },
  );

  const inProgress = exampleStatus === 'loading' || countStatus === 'loading';

  return (
    <React.Fragment key={name}>
      <ListItem>
        <ListItemIcon className="letter-icon">
          {count === ''
            ? name.slice(0, 1)
            : count
          }
        </ListItemIcon>
        <ListItemText primary={name} secondary={description} />
      </ListItem>
      <ListItem>
        <ListItemText inset>
          {inProgress && (<CircularProgress size={20} />)}
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
