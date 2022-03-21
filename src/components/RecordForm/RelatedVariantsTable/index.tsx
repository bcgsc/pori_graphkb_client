/**
 * @module /components/RelationshipsForm
 */
import 'ag-grid-community/dist/styles/ag-grid.css';
import 'ag-grid-community/dist/styles/ag-theme-material.css';
import './index.scss';

import { Typography } from '@material-ui/core';
import { AgGridReact } from 'ag-grid-react';
import PropTypes from 'prop-types';
import React, { useEffect } from 'react';
import { useQuery } from 'react-query';

import useGrid from '@/components/hooks/useGrid';
import RecordIdLink from '@/components/RecordIdLink';
import api from '@/services/api';

/**
 * Given some source node, summarizes the related nodes by their relationship class
 * and the node they are related to
 *
 * @param {object} props
 * @param {function} props.itemToKey the function to create a uique key for each edge record
 * @param {string} props.sourceNodeId the ID of the node we are summarizing relationships for
 * @param {Array.<object>} props.values the edge records
 */
const RelatedVariantsTable = ({ recordId }) => {
  const grid = useGrid();

  const { data: variants, isFetching } = useQuery(
    [
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
    ],
    async ({ queryKey: [route, body] }) => api.post(route, body),
  );

  useEffect(() => {
    const gridApi = grid.ref?.current?.api;

    if (gridApi && !isFetching) {
      gridApi.setRowData(variants);
      gridApi.sizeColumnsToFit();
    }
  }, [grid.ref, isFetching, variants]);

  const renderCellRenderer = ({ value }) => (<><RecordIdLink {...value} /></>); // eslint-disable-line react/prop-types

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
          getRowNodeId={(data) => data['@rid']} // eslint-disable-line react/prop-types
          pagination
          paginationAutoPageSize
          suppressHorizontalScroll
        />
      </div>
    </div>
  );
};

RelatedVariantsTable.propTypes = {
  recordId: PropTypes.string.isRequired,
};

export default RelatedVariantsTable;
