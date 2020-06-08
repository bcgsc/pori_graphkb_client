/**
 * @module /components/RelationshipsForm
 */
import './index.scss';
import 'ag-grid-community/dist/styles/ag-grid.css';
import 'ag-grid-community/dist/styles/ag-theme-material.css';

import { Typography } from '@material-ui/core';
import OpenInNewIcon from '@material-ui/icons/OpenInNew';
import { AgGridReact } from 'ag-grid-react';
import { formatDistanceToNow } from 'date-fns';
import PropTypes from 'prop-types';
import React, {
  useContext, useEffect, useRef, useState,
} from 'react';
import { Link } from 'react-router-dom';

import useGrid from '@/components/hooks/useGrid';
import { SecurityContext } from '@/components/SecurityContext';
import api from '@/services/api';
import { getUser } from '@/services/auth';
import schema from '@/services/schema';


const TWO_WEEK_MILLISECONDS = 2 * 7 * 24 * 60 * 60 * 1000;

const JumpToRecord = ({ data }) => (
  <Link className="activity-view__jump-to-record" target="_blank" to={schema.getLink(data)}>
    <OpenInNewIcon />
    {data['@rid']}
  </Link>
);

JumpToRecord.propTypes = {
  data: PropTypes.shape({
    '@rid': PropTypes.string.isRequired,
  }).isRequired,
};

/**
 * Given some source node, summarizes the related nodes by their relationship class
 * and the node they are related to
 *
 * @param {object} props
 * @param {function} props.itemToKey the function to create a uique key for each edge record
 * @param {string} props.sourceNodeId the ID of the node we are summarizing relationships for
 * @param {Array.<object>} props.values the edge records
 */
const ActivityView = () => {
  const {
    onGridReady, gridApi, gridReady,
  } = useGrid();

  const securityContext = useContext(SecurityContext);
  const user = getUser(securityContext);
  const [recentRecords, setRecentRecords] = useState([]);

  const currentTime = new Date().getTime(); // current time stamp in seconds
  const cutOff = useRef(currentTime - TWO_WEEK_MILLISECONDS);

  // fetch recent records data
  useEffect(() => {
    const controllers = [];

    const getData = async () => {
      let controller = api.post('/query', {
        target: 'V',
        filters: [
          {
            updatedAt: cutOff.current,
            operator: '>=',
          },
        ],
        orderBy: ['createdAt'],
        orderByDirection: 'DESC',
        returnProperties: ['@rid', '@class', 'updatedBy.name', 'updatedAt', 'displayName'],
      });
      controllers.push(controller);
      const records = await controller.request();

      // get recent Edge records
      controller = api.post('/query', {
        target: 'E',
        filters: [
          {
            createdAt: cutOff.current,
            operator: '>=',
          },
        ],
        orderBy: ['createdAt'],
        orderByDirection: 'DESC',
        returnProperties: ['@rid', '@class', 'createdBy.name', 'createdAt'],
      });
      controllers.push(controller);
      const edges = await controller.request();
      setRecentRecords([...records, ...edges]);
    };
    getData();
    return () => controllers.forEach(controller => controller.abort());
  }, [cutOff, user.name]);

  // resize the columns to fit once the data and grid are ready
  useEffect(() => {
    if (gridReady) {
      gridApi.setRowData(recentRecords);
      gridApi.setColumnDefs([
        {
          headerName: 'class',
          field: '@class',
          sortable: true,
        },
        {
          headerName: 'last updated by',
          valueGetter: ({ data: record }) => (record.updatedBy
            ? record.updatedBy.name
            : record.createdBy.name),
          sortable: true,
        },
        {
          headerName: 'last updated at',
          valueGetter: ({ data: record }) => record.updatedAt || record.createdAt,
          sortable: true,
          valueFormatter: ({ value }) => `${formatDistanceToNow(value)} ago`,
        },
        {
          headerName: 'name',
          field: 'displayName',
          sortable: true,
        },
        {
          headerName: 'record',
          field: '@rid',
          cellRenderer: 'JumpToRecord',
          sortable: true,
        },
      ]);
      gridApi.sizeColumnsToFit();
    }
  }, [recentRecords, gridReady, gridApi]);

  return (
    <div className="activity-view">
      <Typography className="activity-view__title" variant="h3">
        Recent Activity
      </Typography>
      <div
        className="ag-theme-material activity-view__table"
        role="presentation"
        style={{
          width: '100%',
        }}
      >
        <AgGridReact
          deltaRowDataMode
          frameworkComponents={{ JumpToRecord }}
          getRowNodeId={data => data['@rid']}
          onGridReady={onGridReady}
          pagination
          paginationAutoPageSize
          reactNext
          suppressHorizontalScroll
        />
      </div>
    </div>
  );
};


export default ActivityView;
