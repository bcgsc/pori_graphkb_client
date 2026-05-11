import './index.scss';

import {
  CircularProgress,
} from '@mui/material';
import { useSnackbar } from 'notistack';
import React, {
  useCallback, useEffect, useMemo, useState,
} from 'react';
import { useIsFetching, useQuery, useQueryClient } from 'react-query';
import { useLocation, useNavigate } from 'react-router';

import DetailDrawer from '@/components/DetailDrawer';
import { GeneralRecordType } from '@/components/types';
import { getNodeRIDsFromURL, navigateToGraph, tuple } from '@/components/util';
import api from '@/services/api';
import { ErrorMessage } from '@/services/errors';
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
  const [detailPanelRid, setDetailPanelRid] = useState<string | null>(null);
  // the existing behaviour of the graph relies on this not changing even when the url *is* updated (TODO fix logic so this can update)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const recordIds = useMemo(() => getNodeRIDsFromURL(`${window.location.origin}${search}`), []);
  const queryClient = useQueryClient();
  const snackbar = useSnackbar();

  const graphQuery = useQuery({
    queryKey: tuple('/query', { target: recordIds, neighbors: DEFAULT_NEIGHBORS }),
    queryFn: async ({ queryKey: [, body] }) => api.query(body),
    enabled: Boolean(recordIds.length),
    select: (response) => util.hashRecordsByRID(response),
    throwOnError: true,
  });

  const detailsQuery = useQuery({
    queryKey: tuple('/query', { target: [detailPanelRid!], neighbors: DEFAULT_NEIGHBORS }),
    queryFn: async ({ queryKey: [, body] }) => api.query(body),
    enabled: Boolean(detailPanelRid),
    select: (response) => response[0],
  });

  useEffect(() => {
    if (graphQuery.data) {
      Object.keys(graphQuery.data).forEach((recordId) => {
        queryClient.setQueryData(
          [{ target: [recordId], neighbors: DEFAULT_NEIGHBORS }],
          [graphQuery.data[recordId]],
        );
      });
    }
  }, [graphQuery.data, queryClient]);

  /**
   * Opens the right-hand panel that shows details of a given record
   */
  const handleToggleDetailPanel = useCallback(async (opt?: GraphObj | null) => {
    const { data: detailData } = opt ?? { data: undefined };

    // no data or clicked link is a link property without a class model
    if (!detailData || detailData.isLinkProp) {
      setDetailPanelRid(null);
    } else {
      setDetailPanelRid(detailData['@rid']);
    }
  }, []);

  const handleGraphStateSaveIntoURL = useCallback((nodeRIDs) => {
    navigateToGraph(nodeRIDs, navigate, snackbar);
  }, [snackbar, navigate]);

  const edges = schema.getEdges();
  const expandedEdgeTypes = util.expandEdges(edges);
  const detailPanelRow = detailsQuery.isEnabled ? detailsQuery.data : null;
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
        {graphQuery.data && (
          <>
            <GraphComponent
              data={graphQuery.data}
              detail={detailPanelRow}
              edgeTypes={expandedEdgeTypes}
              getRecord={handleExpandRecord}
              handleDetailDrawerClose={handleToggleDetailPanel}
              handleDetailDrawerOpen={handleToggleDetailPanel}
              handleGraphStateSave={handleGraphStateSaveIntoURL}
            />
            {detailPanelRow && (
              <DetailDrawer
                error={<ErrorMessage error={detailsQuery.error}>An error occurred loading details.</ErrorMessage>}
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
