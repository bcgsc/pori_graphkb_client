import './index.scss';

import {
  CircularProgress,
} from '@material-ui/core';
import React, {
  useCallback, useMemo, useState,
} from 'react';
import { useIsFetching, useQuery, useQueryClient } from 'react-query';
import { RouteComponentProps, useLocation } from 'react-router-dom';

import DetailDrawer from '@/components/DetailDrawer';
import { getNodeRIDsFromURL, navigateToGraph, tuple } from '@/components/util';
import api from '@/services/api';
import schema from '@/services/schema';
import util from '@/services/util';
import config from '@/static/config';

import GraphComponent from './components/GraphComponent';

const { DEFAULT_NEIGHBORS } = config;

/**
 * Shows the search result filters and an edit button
 */
const GraphView = ({ history }: RouteComponentProps) => {
  const { search } = useLocation();
  const isLoading = useIsFetching();
  const [detailPanelRow, setDetailPanelRow] = useState(null);
  // the existing behaviour of the graph relies on this not changing even when the url *is* updated
  const recordIds = useMemo(() => getNodeRIDsFromURL(window.location.href), []);
  const queryClient = useQueryClient();

  const handleError = useCallback((err) => {
    util.handleErrorSaveLocation(err, history, { pathname: '/data/table', search });
  }, [history, search]);

  const { data: graphData } = useQuery(
    tuple('/query', { target: recordIds, neighbors: DEFAULT_NEIGHBORS }),
    async ({ queryKey: [, body] }) => api.query(body),
    {
      enabled: Boolean(recordIds.length),
      onSuccess: (recordHash) => {
        Object.keys(recordHash).forEach((recordId) => {
          queryClient.setQueryData(
            [{ target: [recordId], neighbors: DEFAULT_NEIGHBORS }],
            [recordHash[recordId]],
          );
        });
      },
      select: (response) => util.hashRecordsByRID(response),
    },
  );

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
        const [fullRecord] = await queryClient.fetchQuery(
          tuple('/query', { target: [detailData['@rid']], neighbors: DEFAULT_NEIGHBORS }),
          async ({ queryKey: [, body] }) => api.query(body),
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
  }, [handleError, queryClient]);

  const handleGraphStateSaveIntoURL = useCallback((nodeRIDs) => {
    navigateToGraph(nodeRIDs, history, handleError);
  }, [handleError, history]);

  const edges = schema.getEdges();
  const expandedEdgeTypes = util.expandEdges(edges);

  const detailPanelIsOpen = Boolean(detailPanelRow);

  const handleExpandRecord = async (recordId) => {
    const key = tuple('/query', { target: [recordId], neighbors: DEFAULT_NEIGHBORS });
    let fullRecord = queryClient.getQueryData(key);

    if (!fullRecord) {
      [fullRecord] = await queryClient.fetchQuery(
        key,
        async ({ queryKey: [, body] }) => api.query(body),
      );
    }
    return fullRecord;
  };

  return (
    <div
      className={`data-view ${detailPanelIsOpen ? 'data-view--squished' : ''}`}
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
        {Boolean(isLoading) && (
          <div className="footer__loader">
            <CircularProgress />
          </div>
        )}
      </div>
    </div>
  );
};

export default GraphView;
