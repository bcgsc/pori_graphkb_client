import './index.scss';

import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { Typography } from '@mui/material';
import { ColDef, themeMaterial } from 'ag-grid-community';
import { AgGridReact } from 'ag-grid-react';
import React, {
  useEffect,
} from 'react';
import { useQuery } from 'react-query';
import { Link } from 'react-router';

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
  columnDefs: ColDef[];
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
  columnDefs, queryBody, title, description = '',
}: QueryResultsTableProps) => {
  const grid = useGrid();

  const { data, isFetching } = useQuery({ queryKey: tuple('/query', queryBody), queryFn: async ({ queryKey: [, body] }) => api.query(body) });

  // resize the columns to fit once the data and grid are ready
  useEffect(() => {
    const gridApi = grid.ref?.current?.api;

    if (gridApi) {
      gridApi.sizeColumnsToFit();

      if (gridApi && data) {
        gridApi.setGridOption('rowData', data);
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
          components={{ JumpToRecord }}
          enableCellTextSelection
          getRowId={(params) => params.data['@rid']}
          pagination
          paginationAutoPageSize
          rowData={data}
          suppressHorizontalScroll
          theme={themeMaterial}
        />
      </div>
    </div>
  );
};

export default QueryResultsTable;
