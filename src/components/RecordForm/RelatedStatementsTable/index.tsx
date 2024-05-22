import 'ag-grid-community/dist/styles/ag-grid.css';
import 'ag-grid-community/dist/styles/ag-theme-material.css';
import './index.scss';

import { Typography } from '@material-ui/core';
import { AgGridReact } from 'ag-grid-react';
import React, { useEffect } from 'react';
import { useQuery } from 'react-query';

import useGrid from '@/components/hooks/useGrid';
import RecordIdLink from '@/components/RecordIdLink';
import { tuple } from '@/components/util';
import api from '@/services/api';

interface RelatedStatementsTableProps {
  recordId: string;
}

/**
 * Given some source node, summarizes the related nodes by their relationship class
 * and the node they are related to
 */
const RelatedStatementsTable = ({ recordId }: RelatedStatementsTableProps) => {
  const grid = useGrid();

  const { data: statements, isFetching } = useQuery(
    tuple(
      '/query',
      {
        target: 'Statement',
        filters: {
          OR: [
            {
              conditions: recordId,
              operator: 'CONTAINS',
            },
            {
              evidence: recordId,
              operator: 'CONTAINS',
            },
            {
              relevance: recordId,
            },
            {
              subject: recordId,
            },
            {
              evidenceLevel: recordId,
              operator: 'CONTAINS',
            },
          ],
        },
        returnProperties: [
          '@rid',
          '@class',
          'relevance.displayName',
          'conditions.displayName',
          'evidence.displayName',
          'subject.displayName',
        ],
      },
    ),
    async ({ queryKey: [, body] }) => api.query(body),
    { staleTime: 5000, refetchOnWindowFocus: false },
  );

  useEffect(() => {
    const gridApi = grid.ref?.current?.api;

    if (gridApi && statements && !isFetching) {
      gridApi.setRowData(statements);
      gridApi.sizeColumnsToFit();
    }
  }, [grid.ref, isFetching, statements]);

  const renderCellRenderer = ({ value }) => (<><RecordIdLink {...value} /></>);

  if (!isFetching && (!statements || statements.length === 0)) {
    return null;
  }
  return (
    <div className="related-statements">
      <Typography variant="h4">Related Statements</Typography>
      <div
        className="ag-theme-material"
        role="presentation"
        style={{
          width: '100%',
          height: '352px',
        }}
      >
        <AgGridReact
          {...grid.props}
          columnDefs={[
            {
              headerName: 'relevance',
              field: 'relevance.displayName',
            },
            {
              headerName: 'subject',
              field: 'subject.displayName',
            },
            {
              headerName: 'conditions',
              valueGetter: ({ data }) => data.conditions.map((c) => c.displayName).join('; '),
            },
            {
              headerName: 'evidence',
              valueGetter: ({ data }) => data.evidence.map((c) => c.displayName).join('; '),
            },
            {
              headerName: 'Actions',
              valueGetter: ({ data }) => ({ recordId: data['@rid'], recordClass: data['@class'] }),
              cellRenderer: 'renderCellRenderer',
              sortable: false,
              resizable: false,
              maxWidth: 150,
              pinned: 'right',
            },
          ]}
          defaultColDef={{ resizable: true, sortable: true }}
          deltaRowDataMode
          enableCellTextSelection
          frameworkComponents={{ renderCellRenderer }}
          getRowNodeId={(data) => data['@rid']}
          pagination
          paginationAutoPageSize
          suppressHorizontalScroll
        />
      </div>
    </div>
  );
};

export default RelatedStatementsTable;
