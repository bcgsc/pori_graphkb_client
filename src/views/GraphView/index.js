import './index.scss';

import {
  CircularProgress,
} from '@material-ui/core';
import React, {
  useCallback, useMemo, useState,
} from 'react';
import { queryCache, useQuery } from 'react-query';
import { useLocation } from 'react-router-dom';

import DetailDrawer from '@/components/DetailDrawer';
import { HistoryPropType } from '@/components/types';
import { getNodeRIDsFromURL, navigateToGraph } from '@/components/util';
import api from '@/services/api';
import schema from '@/services/schema';
import util from '@/services/util';
import config from '@/static/config';

import GraphComponent from './components/GraphComponent';


const { DEFAULT_NEIGHBORS } = config;

/**
 * Shows the search result filters and an edit button
 */
const GraphView = ({ history }) => {
  const { search, pathname } = useLocation();
  const [detailPanelRow, setDetailPanelRow] = useState(null);
  const recordIds = useMemo(() => getNodeRIDsFromURL(`${pathname}?${search}`), [search, pathname]);

  const handleError = useCallback((err) => {
    util.handleErrorSaveLocation(err, history, { pathname: '/data/table', search });
  }, [history, search]);

  const { data: fullRecords } = useQuery(
    ['/query', { target: recordIds, neighbors: DEFAULT_NEIGHBORS }],
    async (url, body) => api.post(url, body),
    { enabled: Boolean(recordIds.length) },
  );

  const graphData = useMemo(() => {
    const recordHash = util.hashRecordsByRID(fullRecords);
    Object.keys(recordHash).forEach((recordId) => {
      queryCache.setQueryData(
        [{ target: [recordId], neighbors: DEFAULT_NEIGHBORS }],
        [recordHash[recordId]],
      );
    });
    return recordHash;
  }, [fullRecords]);

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
          ['/query', { target: [detailData['@rid']], neighbors: DEFAULT_NEIGHBORS }],
          async (url, body) => api.post(url, body),
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
      ['/query', { target: [recordId], neighbors: DEFAULT_NEIGHBORS }],
      async (url, body) => api.post(url, body),
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
};


export default GraphView;
