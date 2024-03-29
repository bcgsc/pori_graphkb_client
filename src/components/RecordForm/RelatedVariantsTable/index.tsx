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

interface RelatedVariantsTableProps {
  recordId: string;
}

/**
 * Given some source node, summarizes the related nodes by their relationship class
 * and the node they are related to
 */
const RelatedVariantsTable = ({ recordId }: RelatedVariantsTableProps) => {
  const grid = useGrid();

  const { data: variants, isFetching } = useQuery(
    tuple(
      '/query',
      {
        target: 'Variant',
        filters: {
          OR: [
            {
              reference1: recordId,
            },
            {
              reference2: recordId,
            },
            {
              type: recordId,
            },
          ],
        },
        returnProperties: ['@rid', '@class', 'displayName'],
      },
    ),
    async ({ queryKey: [, body] }) => api.query(body),
  );

  useEffect(() => {
    const gridApi = grid.ref?.current?.api;

    if (gridApi && !isFetching) {
      gridApi.setRowData(variants);
      gridApi.sizeColumnsToFit();
    }
  }, [grid.ref, isFetching, variants]);

  const renderCellRenderer = ({ value }) => (<><RecordIdLink {...value} /></>);

  if (!isFetching && (!variants || variants.length === 0)) {
    return null;
  }
  return (
    <div className="related-variants">
      <Typography variant="h4">Related Variants</Typography>
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
              headerName: 'class',
              field: '@class',
            },
            {
              headerName: 'variant',
              field: 'displayName',
            },
            {
              headerName: 'Actions',
              valueGetter: ({ data }) => ({ recordId: data['@rid'], recordClass: data['@class'] }),
              cellRenderer: 'renderCellRenderer',
              sortable: false,
              resizable: false,
              pinned: 'right',
              maxWidth: 150,
            },
          ]}
          defaultColDef={{ resizable: true, sortable: true }}
          deltaRowDataMode
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

export default RelatedVariantsTable;
