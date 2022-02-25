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

interface JumpToRecordProps {
  data: {
    '@rid': string
  };
}

function JumpToRecord({ data }: JumpToRecordProps) {
  return (
    <Link className="query-results-table__jump-to-record" target="_blank" to={schema.getLink(data)}>
      <OpenInNewIcon />
      {data['@rid']}
    </Link>
  );
}

interface QueryResultsTableProps {
  columnDefs: object[];
  /** the body of the query request */
  queryBody: object;
  /** the title to put above the table */
  title: string;
  description?: string;
}

/**
 * Given some source node, summarizes the related nodes by their relationship class
 * and the node they are related to
 */
function QueryResultsTable(props: QueryResultsTableProps) {
  const {
    columnDefs,
    queryBody,
    title,
    description,
  } = props;
  const grid = useGrid();

  const { data, isFetching } = useQuery(['/query', queryBody] as const, async ({ queryKey: [route, body] }) => api.post(route, body));

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
          getRowNodeId={(rowData) => rowData['@rid']}
          pagination
          paginationAutoPageSize
          suppressHorizontalScroll
        />
      </div>
    </div>
  );
}

QueryResultsTable.defaultProps = {
  description: '',
};

export default QueryResultsTable;
