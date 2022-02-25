/**
 * @module /components/RelationshipsForm
 */
import 'ag-grid-community/dist/styles/ag-grid.css';
import 'ag-grid-community/dist/styles/ag-theme-material.css';
import './index.scss';

import { Typography } from '@material-ui/core';
import { AgGridReact } from 'ag-grid-react';
import React, { useEffect } from 'react';
import { useQuery } from 'react-query';

import useGrid from '@/components/hooks/useGrid';
import RecordIdLink from '@/components/RecordIdLink';
import api from '@/services/api';
import schema from '@/services/schema';

const isReversed = (nodeId, { out: src, in: tgt }) => {
  if (src && tgt) {
    const srcId = src['@rid'] || src;
    return srcId !== nodeId;
  } if (!tgt) {
    return true;
  }
  return false;
};

interface EdgeTableProps {
  recordId: string;
}

/**
  * Given some source node, summarizes the related nodes by their relationship class
  * and the node they are related to
  */
function EdgeTable({ recordId }: EdgeTableProps) {
  const grid = useGrid();

  const { data: edges, isFetching } = useQuery(
    [
      '/query',
      {
        target: [recordId],
        neighbors: 3,
      },
    ] as const,
    async ({ queryKey: [_, body] }) => api.query(body),
    {
      select: (response) => {
        const [record] = response;
        const newEdges = [];
        Object.entries(record).forEach(([propName, value]) => {
          if ((propName.startsWith('out_') || propName.startsWith('in_')) && value) {
            value.forEach((edge) => {
              const model = schema.get(edge);
              const reversed = isReversed(recordId, edge);

              newEdges.push({
                ...edge,
                reversed,
                relationshipType: reversed
                  ? model.reverseName
                  : model.name,
                target: reversed
                  ? edge.out
                  : edge.in,
              });
            });
          }
        });
        return newEdges;
      },
    },
  );

  useEffect(() => {
    const gridApi = grid.ref?.current?.api;

    if (edges && gridApi && !isFetching) {
      gridApi.setRowData(edges);
      gridApi.sizeColumnsToFit();
    }
  }, [edges, grid.ref, isFetching]);

  const renderCellRenderer = ({ value: cellValue }) => (<RecordIdLink {...cellValue} />);

  if (!isFetching && (!edges || edges.length === 0)) {
    return null;
  }

  return (
    <div className="edge-table">
      <Typography variant="h4">Related Records</Typography>
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
              headerName: 'Relationship',
              field: 'relationshipType',
            },
            {
              headerName: 'Class',
              field: 'target.@class',
            },
            {
              headerName: 'Target',
              valueGetter: ({ data }) => data.target.displayName || data.target.name,
            },
            {
              headerName: 'Actions',
              valueGetter: ({ data }) => ({ recordClass: data.target['@class'], recordId: data.target['@rid'] }),
              cellRenderer: 'renderCellRenderer',
              pinned: 'right',
              sortable: false,
              maxWidth: 150,
            },
          ]}
          defaultColDef={{ resizable: true, sortable: true }}
          frameworkComponents={{ renderCellRenderer }}
          getRowNodeId={(data) => data['@rid']}
          pagination
          paginationAutoPageSize
          suppressHorizontalScroll
        />
      </div>
    </div>
  );
}

export default EdgeTable;
