import './index.scss';

import {
  CircularProgress,
} from '@mui/material';
import React, {
  useCallback, useEffect, useMemo, useState,
} from 'react';
import { useIsFetching, useQuery, useQueryClient } from 'react-query';
import { useLocation, useNavigate } from 'react-router-dom';

import DetailDrawer from '@/components/DetailDrawer';
import { GeneralRecordType } from '@/components/types';
import { getNodeRIDsFromURL, navigateToGraph, tuple } from '@/components/util';
import api from '@/services/api';
import schema from '@/services/schema';
import util from '@/services/util';
import config from '@/static/config';

import GraphComponent from './components/GraphComponent';
import { GraphObj } from './components/GraphComponent/kbgraph';

const { DEFAULT_NEIGHBORS } = config;

/**
 * Shows the search result filters and an edit button
 */
const GraphView = () => {
  const { search } = useLocation();
  const navigate = useNavigate();
  const isLoading = useIsFetching();
  const [detailPanelRow, setDetailPanelRow] = useState<GeneralRecordType | null>(null);
  // the existing behaviour of the graph relies on this not changing even when the url *is* updated
  const recordIds = useMemo(() => getNodeRIDsFromURL(window.location.href), []);
  const queryClient = useQueryClient();

  const handleError = useCallback((err) => {
    util.handleErrorSaveLocation(err, { navigate, pathname: '/data/table', search });
  }, [navigate, search]);

  const { data: graphData } = useQuery({
    queryKey: tuple('/query', { target: recordIds, neighbors: DEFAULT_NEIGHBORS }),
    queryFn: async ({ queryKey: [, body] }) => api.query(body),
    enabled: Boolean(recordIds.length),
    select: (response) => util.hashRecordsByRID(response),
  });

  useEffect(() => {
    if (graphData) {
      Object.keys(graphData).forEach((recordId) => {
        queryClient.setQueryData(
          [{ target: [recordId], neighbors: DEFAULT_NEIGHBORS }],
          [graphData[recordId]],
        );
      });
    }
  }, [graphData, queryClient]);

  /**
   * Opens the right-hand panel that shows details of a given record
   */
  const handleToggleDetailPanel = useCallback(async (opt?: GraphObj | null) => {
    const { data: detailData } = opt ?? { data: undefined };

    // no data or clicked link is a link property without a class model
    if (!detailData || detailData.isLinkProp) {
      setDetailPanelRow(null);
    } else {
      try {
        const [fullRecord] = await queryClient.fetchQuery({
          queryKey: tuple('/query', { target: [detailData['@rid']], neighbors: DEFAULT_NEIGHBORS }),
          queryFn: async ({ queryKey: [, body] }) => api.query(body),
        });

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
    navigateToGraph(nodeRIDs, navigate, handleError);
  }, [handleError, navigate]);

  const edges = schema.getEdges();
  const expandedEdgeTypes = util.expandEdges(edges);

  const detailPanelIsOpen = Boolean(detailPanelRow);

  const handleExpandRecord = async (recordId: string) => {
    const key = tuple('/query', { target: [recordId], neighbors: DEFAULT_NEIGHBORS });
    let fullRecord = queryClient.getQueryData(key);

    if (!fullRecord) {
      [fullRecord] = await queryClient.fetchQuery({
        queryKey: key,
        queryFn: async ({ queryKey: [, body] }) => api.query(body),
      });
    }
    return fullRecord as GeneralRecordType<'@rid'>;
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
