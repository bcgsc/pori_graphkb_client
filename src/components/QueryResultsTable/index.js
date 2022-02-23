import './index.scss';
import 'ag-grid-community/dist/styles/ag-grid.css';
import 'ag-grid-community/dist/styles/ag-theme-material.css';

import { Typography } from '@material-ui/core';
import OpenInNewIcon from '@material-ui/icons/OpenInNew';
import { AgGridReact } from 'ag-grid-react';
import PropTypes from 'prop-types';
import React, {
  useEffect,
} from 'react';
import { useQuery } from 'react-query';
import { Link } from 'react-router-dom';

import useGrid from '@/components/hooks/useGrid';
import api from '@/services/api';
import schema from '@/services/schema';


const JumpToRecord = ({ data }) => (
  <Link className="query-results-table__jump-to-record" target="_blank" to={schema.getLink(data)}>
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
 * @param {object} props.queryBody the body of the query request
 * @param {string} props.title the title to put above the table
 */
const QueryResultsTable = ({
  columnDefs, queryBody, title, description,
}) => {
  const grid = useGrid();

  const { data, isFetching } = useQuery(['/query', queryBody], async ({ queryKey: [route, body] }) => api.post(route, body));

  // resize the columns to fit once the data and grid are ready
  useEffect(() => {
    const gridApi = grid.ref?.current?.api;

    if (gridApi) {
      gridApi.sizeColumnsToFit();

      if (gridApi && data) {
        gridApi.setRowData(data);
      }
    }
  }, [grid.ref, data]);

  return (
    <div className="query-results-table">
      <Typography className="query-results-table__title" variant="h3">
        {title} ({isFetching ? '?' : data && data.length})
      </Typography>
      {description && (<Typography paragraph variant="caption">{description}</Typography>)}
      <div
        className="ag-theme-material query-results-table__content"
        role="presentation"
      >
        <AgGridReact
          {...grid.props}
          columnDefs={columnDefs}
          data={data}
          deltaRowDataMode
          frameworkComponents={{ JumpToRecord }}
          getRowNodeId={rowData => rowData['@rid']}
          pagination
          paginationAutoPageSize
          suppressHorizontalScroll
        />
      </div>
    </div>
  );
};

QueryResultsTable.propTypes = {
  columnDefs: PropTypes.arrayOf(PropTypes.object).isRequired,
  queryBody: PropTypes.object.isRequired,
  title: PropTypes.string.isRequired,
  description: PropTypes.string,
};

QueryResultsTable.defaultProps = {
  description: '',
};


export default QueryResultsTable;
