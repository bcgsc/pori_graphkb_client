import './index.scss';

import {
  CircularProgress,
} from '@material-ui/core';
import React, {
  useCallback, useEffect, useState,
} from 'react';

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

/**
 * Shows the search result filters and an edit button
 */
const GraphView = ({
  location: { search }, history,
}) => {
  const [detailPanelRow, setDetailPanelRow] = useState(null);
  const [graphData, setGraphData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const handleError = useCallback((err) => {
    util.handleErrorSaveLocation(err, history, { pathname: '/data/table', search });
  }, [history, search]);


  useEffect(() => {
    let controller;

    const loadSavedStateFromURL = async () => {
      try {
        const decodedNodes = getNodeRIDsFromURL(window.location.href);
        controller = api.post('/query', { target: decodedNodes, neighbors: DEFAULT_NEIGHBORS });
        const data = hashRecordsByRID(await controller.request());
        setGraphData(data);
      } catch (err) {
        console.error(err);
        handleError(err);
      }
      setIsLoading(false);
    };

    loadSavedStateFromURL();

    return () => controller && controller.abort();
  }, [handleError]);

  /**
   * Opens the right-hand panel that shows details of a given record
   */
  const handleToggleDetailPanel = useCallback(async (opt = {}) => {
    const { data } = opt;

    // no data or clicked link is a link property without a class model
    if (!data || data.isLinkProp) {
      setDetailPanelRow(null);
    } else {
      try {
        const controller = api.post('/query', {
          target: [data['@rid']],
          neighbors: DEFAULT_NEIGHBORS,
        });
        const [fullRecord] = await controller.request();

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
    const controller = api.post('/query', { target: [recordId], neighbors: DEFAULT_NEIGHBORS });
    const [fullRecord] = await controller.request();
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
              data={graphData || {}}
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
        {isLoading && (
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
