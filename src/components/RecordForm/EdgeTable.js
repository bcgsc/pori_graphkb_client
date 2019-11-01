/**
 * @module /components/RelationshipsForm
 */
import React, { useState, useContext, useCallback } from 'react';
import PropTypes from 'prop-types';
import { AgGridReact } from 'ag-grid-react';
import useDeepCompareEffect from 'use-deep-compare-effect';

import 'ag-grid-community/dist/styles/ag-grid.css';
import 'ag-grid-community/dist/styles/ag-theme-material.css';

import { KBContext } from '../KBContext';
import useGrid from '../useGrid';


const isReversed = (nodeId, { out: src, in: tgt }) => {
  if (src && tgt) {
    const srcId = src['@rid'] || src;
    return srcId !== nodeId;
  } if (!tgt) {
    return true;
  }
  return false;
};

/**
 * Given some source node, summarizes the related nodes by their relationship class
 * and the node they are related to
 *
 * @param {object} props
 * @param {function} props.itemToKey the function to create a uique key for each edge record
 * @param {string} props.sourceNodeId the ID of the node we are summarizing relationships for
 * @param {Array.<object>} props.values the edge records
 * @param {Schema} props.schema the schema object (from context)
 */
const EdgeTable = ({ value }) => {
  const { schema } = useContext(KBContext);

  const {
    onGridReady, gridApi, gridReady,
  } = useGrid();

  const [currNodeId, setCurrNodeId] = useState('');
  const [edges, setEdges] = useState([]);

  useDeepCompareEffect(() => {
    const newEdges = [];

    Object.keys(value).forEach((propName) => {
      if (propName.startsWith('out_') || propName.startsWith('in_')) {
        newEdges.push(...value[propName]);
      }
    });

    setCurrNodeId(value['@rid']);
    setEdges(newEdges);
  }, [value]);

  const getRelationshipType = useCallback(
    ({ data }) => {
      const model = schema.get(data);
      return isReversed(currNodeId, data)
        ? model.reverseName
        : model.name;
    },
    [currNodeId, schema],
  );

  useDeepCompareEffect(() => {
    if (gridReady && currNodeId) {
      const getTarget = ({ data }) => {
        const target = isReversed(currNodeId, data)
          ? data.out
          : data.in;
        return target;
      };
      gridApi.setRowData(edges);
      gridApi.setColumnDefs([
        {
          headerName: 'Relationship',
          valueGetter: getRelationshipType,
          sortable: true,
        },
        {
          headerName: 'Class',
          valueGetter: row => getTarget(row)['@class'],
          sortable: true,
        },
        {
          headerName: 'SourceId',
          valueGetter: row => getTarget(row).sourceId,
          sortable: true,
        },
        {
          headerName: 'Name',
          valueGetter: row => getTarget(row).displayName,
          sortable: true,
        },
      ]);
      gridApi.sizeColumnsToFit();
    }
  }, [edges, gridReady, currNodeId]);

  return (
    <div
      className="ag-theme-material"
      role="presentation"
      style={{
        width: '100%',
        height: '352px',
      }}
    >
      <AgGridReact
        reactNext
        onGridReady={onGridReady}
        suppressHorizontalScroll
        deltaRowDataMode
        getRowNodeId={data => data['@rid']}
        pagination
        paginationAutoPageSize
      />
    </div>
  );
};

EdgeTable.propTypes = {
  value: PropTypes.object.isRequired,
};


export default EdgeTable;
