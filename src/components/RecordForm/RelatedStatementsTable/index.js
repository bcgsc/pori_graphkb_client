/**
 * @module /components/RelationshipsForm
 */
import 'ag-grid-community/dist/styles/ag-grid.css';
import 'ag-grid-community/dist/styles/ag-theme-material.css';
import './index.scss';

import { CircularProgress, Typography } from '@material-ui/core';
import { AgGridReact } from 'ag-grid-react';
import PropTypes from 'prop-types';
import React, { useEffect, useState } from 'react';

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
const RelatedStatementsTable = ({ recordId }) => {
  const {
    onGridReady, gridApi, gridReady,
  } = useGrid();

  const [statements, setStatements] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let controller;

    const getRecords = async () => {
      controller = api.post('/query', {
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
      });

      const result = await controller.request();
      setStatements(result);
    };

    if (recordId) {
      setIsLoading(true);
      getRecords();
    }
    setIsLoading(false);
    return () => controller && controller.abort();
  }, [recordId]);


  useEffect(() => {
    if (gridReady && statements && statements.length > 0) {
      gridApi.setRowData(statements);
      gridApi.sizeColumnsToFit();
    }
  }, [gridApi, gridReady, statements]);

  if (isLoading) {
    return (<CircularProgress />);
  }

  const renderCellRenderer = ({ value }) => (<><RecordIdLink {...value} /></>); // eslint-disable-line react/prop-types

  if (!statements || statements.length === 0) {
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
              valueGetter: ({ data }) => data.conditions.map(c => c.displayName).join('; '),
            },
            {
              headerName: 'evidence',
              valueGetter: ({ data }) => data.evidence.map(c => c.displayName).join('; '),
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
          frameworkComponents={{ renderCellRenderer }}
          getRowNodeId={data => data['@rid']} // eslint-disable-line react/prop-types
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

RelatedStatementsTable.propTypes = {
  recordId: PropTypes.object.isRequired,
};


export default RelatedStatementsTable;
