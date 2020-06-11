import './index.scss';

import {
  CircularProgress,
} from '@material-ui/core';
import React, {
  useCallback, useEffect, useState,
} from 'react';
import { queryCache } from 'react-query';

import DetailDrawer from '@/components/DetailDrawer';
import { HistoryPropType, LocationPropType } from '@/components/types';
import { getNodeRIDsFromURL, navigateToGraph } from '@/components/util';
import api from '@/services/api';
import schema from '@/services/schema';
import util from '@/services/util';
import config from '@/static/config';

import GraphComponent from './components/GraphComponent';
import {
  hashRecordsByRID,
} from './util';


const { DEFAULT_NEIGHBORS } = config;
const STALE_TIME = 10000;

/**
 * Shows the search result filters and an edit button
 */
const GraphView = ({
  location: { search }, history,
}) => {
  const [detailPanelRow, setDetailPanelRow] = useState(null);
  const [recordIds, setRecordIds] = useState([]);
  const [graphData, setGraphData] = useState(null);

  const handleError = useCallback((err) => {
    util.handleErrorSaveLocation(err, history, { pathname: '/data/table', search });
  }, [history, search]);


  useEffect(() => {
    const decodedNodes = getNodeRIDsFromURL(window.location.href);
    setRecordIds(decodedNodes);
  }, [handleError]);

  useEffect(() => {
    const fetchRecords = async () => {
      const fullRecords = await queryCache.prefetchQuery(
        [{ target: recordIds, neighbors: DEFAULT_NEIGHBORS }],
        async () => {
          const controller = api.post('/query', {
            target: recordIds,
            neighbors: DEFAULT_NEIGHBORS,
          });
          const promise = controller.request();
          promise.cancel = () => controller.abort();
          return promise;
        },
        { staleTime: STALE_TIME, throwOnError: true },
      );

      const recordHash = hashRecordsByRID(fullRecords);
      Object.keys(recordHash).forEach((recordId) => {
        queryCache.setQueryData(
          [{ target: [recordId], neighbors: DEFAULT_NEIGHBORS }],
          [recordHash[recordId]],
        );
      });
      setGraphData(recordHash);
    };

    if (recordIds.length) {
      fetchRecords();
    }
  }, [recordIds, recordIds.length]);

  /**
   * Opens the right-hand panel that shows details of a given record
   */
  const handleToggleDetailPanel = useCallback(async (opt = {}) => {
    const { data: detailData } = opt;

    // no data or clicked link is a link property without a class model
    if (!detailData || detailData.isLinkProp) {
      setDetailPanelRow(null);
    } else {
      try {
        const [fullRecord] = await queryCache.prefetchQuery(
          [{ target: [detailData['@rid']], neighbors: DEFAULT_NEIGHBORS }],
          async () => {
            const controller = api.post('/query', { target: [detailData['@rid']], neighbors: DEFAULT_NEIGHBORS });
            const promise = controller.request();
            promise.cancel = () => controller.abort();
            return promise;
          },
          { staleTime: STALE_TIME, throwOnError: true },
        );

        if (!fullRecord) {
          setDetailPanelRow(null);
        } else {
          setDetailPanelRow(fullRecord);
        }
      } catch (err) {
        console.error(err);
        handleError(err);
      }
    }
  }, [handleError]);


  const handleGraphStateSaveIntoURL = useCallback((nodeRIDs) => {
    navigateToGraph(nodeRIDs, history, handleError);
  }, [handleError, history]);


  const edges = schema.getEdges();
  const expandedEdgeTypes = util.expandEdges(edges);


  const detailPanelIsOpen = Boolean(detailPanelRow);

  const handleExpandRecord = async (recordId) => {
    const [fullRecord] = await queryCache.prefetchQuery(
      [{ target: [recordId], neighbors: DEFAULT_NEIGHBORS }],
      async () => api.post('/query', { target: [recordId], neighbors: DEFAULT_NEIGHBORS }).request(),
      { staleTime: STALE_TIME, throwOnError: true },
    );
    return fullRecord;
  };

  return (
    <div className={
      `data-view ${detailPanelIsOpen
        ? 'data-view--squished'
        : ''}`}
    >
      <div className="data-view__content--graph-view">
        {graphData && (
          <>
            <GraphComponent
              data={graphData}
              detail={detailPanelRow}
              edgeTypes={expandedEdgeTypes}
              getRecord={handleExpandRecord}
              handleDetailDrawerClose={handleToggleDetailPanel}
              handleDetailDrawerOpen={handleToggleDetailPanel}
              handleError={handleError}
              handleGraphStateSave={handleGraphStateSaveIntoURL}
              onRecordClicked={handleToggleDetailPanel}
            />
            {detailPanelRow && (
            <DetailDrawer
              node={detailPanelRow}
              onClose={handleToggleDetailPanel}
            />
            )}
          </>
        )}
      </div>
      <div className="data-view__footer">
        {queryCache.isFetching === 'loading' && (
          <div className="footer__loader">
            <CircularProgress />
          </div>
        )}
      </div>

    </div>
  );
};

GraphView.propTypes = {
  history: HistoryPropType.isRequired,
  location: LocationPropType.isRequired,
};


export default GraphView;
