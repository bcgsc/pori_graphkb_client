import './index.scss';

import { util } from '@bcgsc-pori/graphkb-schema';
import {
  Button,
  Card,
  CardActions,
  CardContent,
  CardHeader,
  Chip,
  IconButton,
  Popover,
  Tooltip,
  Typography,
} from '@material-ui/core';
import CopyIcon from '@material-ui/icons/FileCopyOutlined';
import FilterListIcon from '@material-ui/icons/FilterList';
import copy from 'copy-to-clipboard';
import PropTypes from 'prop-types';
import React, { useCallback, useEffect, useState } from 'react';
import { queryCache } from 'react-query';

import api from '@/services/api';
import schema from '@/services/schema';

import JSONView from './JSONView';


const extractRids = (obj) => {
  const recordIds = [];

  const queue = [obj];

  while (queue.length > 0) {
    const current = queue.shift();

    if (Array.isArray(current)) {
      queue.push(...current);
    } else if (current && typeof current === 'object') {
      queue.push(...Object.values(current));
    } else if (util.looksLikeRID(current, false)) {
      recordIds.push(current);
    }
  }
  return Array.from(new Set(recordIds));
};


const ActiveFilters = ({ search }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [payload, setPayload] = useState({});
  const [routeName, setRouteName] = useState('/query');
  const [recordHash, setRecordHash] = useState({});

  useEffect(() => {
    const {
      payload: newPayload,
      routeName: newRouteName,
    } = api.getQueryFromSearch({ search, schema });
    setPayload(newPayload);
    setRouteName(newRouteName);
  }, [search]);

  useEffect(() => {
    const fetchDisplayNames = async () => {
      const recordIds = extractRids(payload);

      if (recordIds.length) {
        const returnProperties = ['@class', '@rid', 'name', 'displayName'];
        const result = await queryCache.prefetchQuery(
          ['/query', {
            target: recordIds,
            returnProperties,
          }],
          async (route, body) => api.post(route, body).request(),
        );
        const hash = {};
        result.forEach((rec) => {
          if (rec['@class'] === 'Statement') {
            hash[rec['@rid']] = 'Statement';
          } else {
            hash[rec['@rid']] = schema.getPreview(rec);
          }
        });
        setRecordHash(hash);
      }
    };
    fetchDisplayNames();
  }, [payload]);

  const handleToggleOpen = useCallback((event) => {
    if (!anchorEl) {
      setAnchorEl(event.currentTarget);
    } else {
      setAnchorEl(null);
    }
  }, [anchorEl]);


  const ValueComponent = useCallback(({ value }) => {
    if (recordHash[value]) {
      return (<Chip label={`${recordHash[value]} (${value})`} />);
    }
    return JSON.stringify(value);
  }, [recordHash]);

  const handleCopyToClipboard = useCallback(() => {
    copy(JSON.stringify(payload));
  }, [payload]);


  return (
    <>
      <Typography variant="h5">Search</Typography>
      <Tooltip title="click here to see active filter groups">
        <span>
          <IconButton
            onClick={handleToggleOpen}
          >
            <FilterListIcon />
          </IconButton>
        </span>
      </Tooltip>
      <div>
        <Popover
          anchorEl={anchorEl}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'center',
          }}
          id="filter-table-popover"
          onClose={handleToggleOpen}
          open={Boolean(anchorEl)}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'center',
          }}
        >
          <Card className="active-filters-card">
            <CardHeader title={routeName} />
            <CardContent className="active-filters-card__content">
              <JSONView data={payload} indent="  " ValueComponent={ValueComponent} />
            </CardContent>
            <CardActions className="active-filters-card__actions">
              <Button onClick={handleCopyToClipboard}>
                <CopyIcon /> Copy
              </Button>
            </CardActions>
          </Card>
        </Popover>
      </div>
    </>
  );
};

ActiveFilters.propTypes = {
  search: PropTypes.string.isRequired,
};

export default ActiveFilters;
