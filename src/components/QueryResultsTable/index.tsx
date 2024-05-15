import './index.scss';
import 'ag-grid-community/dist/styles/ag-grid.css';
import 'ag-grid-community/dist/styles/ag-theme-material.css';

import { Typography } from '@material-ui/core';
import OpenInNewIcon from '@material-ui/icons/OpenInNew';
import { AgGridReact } from 'ag-grid-react';
import React, {
  useEffect,
} from 'react';
import { useQuery } from 'react-query';
import { Link } from 'react-router-dom';

import useGrid from '@/components/hooks/useGrid';
import api from '@/services/api';
import schema from '@/services/schema';

import { QueryBody } from '../types';
import { tuple } from '../util';

interface JumpToRecordProps {
  data: {
    '@rid': string;
  }
}

const JumpToRecord = ({ data }: JumpToRecordProps) => (
  <Link className="query-results-table__jump-to-record" target="_blank" to={schema.getLink(data)}>
    <OpenInNewIcon />
    {data['@rid']}
  </Link>
);

interface QueryResultsTableProps {
  columnDefs: NonNullable<React.ComponentProps<typeof AgGridReact>['columnDefs']>;
  /** the body of the query request */
  queryBody: QueryBody;
  /** the title to put above the table */
  title: string;
  description?: string;
}

/**
 * Given some source node, summarizes the related nodes by their relationship class
 * and the node they are related to
 */
const QueryResultsTable = ({
  columnDefs, queryBody, title, description,
}: QueryResultsTableProps) => {
  const grid = useGrid();

  const { data, isFetching } = useQuery(tuple('/query', queryBody), async ({ queryKey: [, body] }) => api.query(body));

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
          enableCellTextSelection
          frameworkComponents={{ JumpToRecord }}
          getRowNodeId={(rowData) => rowData['@rid']}
          pagination
          paginationAutoPageSize
          suppressHorizontalScroll
        />
      </div>
    </div>
  );
};

QueryResultsTable.defaultProps = {
  description: '',
};

export default QueryResultsTable;
