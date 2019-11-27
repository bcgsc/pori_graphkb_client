import {
  CircularProgress,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@material-ui/core';
import PropTypes from 'prop-types';
import React, { useEffect, useState } from 'react';

import DetailChip from '@/components/DetailChip';
import api from '@/services/api';
import schema from '@/services/schema';


/**
 * @param {Object} props
 * @param {string} props.name the class model name
 * @param {string} props.description the class description
 */
const ClassDescription = ({ name, description }) => {
  const [example, setExample] = useState(null);
  const [count, setCount] = useState('');
  const [inProgress, setInProgress] = useState(false);

  // get the example
  useEffect(() => {
    let controller;

    const getData = async () => {
      setInProgress(true);
      controller = api.post('/query', { target: name, neighbors: 1, limit: 1 });
      const [result] = await controller.request();
      setInProgress(false);
      setExample(result);
    };

    getData();
    return () => controller && controller.abort();
  }, [name]);

  // get the count
  useEffect(() => {
    let controller;

    const getData = async () => {
      controller = api.get(`/stats?classList=${name}`);
      const { [name]: value } = await controller.request();
      let newCount = value;

      if (value / 1000000 > 1) {
        newCount = `${Math.round(value / 1000000)}M`;
      } else if (value / 1000 > 1) {
        newCount = `${Math.round(value / 1000)}K`;
      } else {
        newCount = `${value}`;
      }
      setCount(newCount);
    };
    getData();
    return () => controller && controller.abort();
  }, [name]);

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
