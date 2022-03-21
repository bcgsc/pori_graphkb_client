import './index.scss';

import {
  CircularProgress,
  IconButton,
  Typography,
} from '@material-ui/core';
import Tooltip from '@material-ui/core/Tooltip';
import TimelineIcon from '@material-ui/icons/Timeline';
import PropTypes from 'prop-types';
import React, {
  useCallback,
} from 'react';

import { HistoryPropType } from '@/components/types';
import { navigateToGraph } from '@/components/util';

const DataViewFooter = ({
  selectedRecords, onError, history, statusMessage, totalRows,
}) => {
  const handleSwapToGraph = useCallback(() => {
    const nodeRIDs = selectedRecords.map((node) => node['@rid']);
    navigateToGraph(nodeRIDs, history, onError);
  }, [history, onError, selectedRecords]);

  return (

    <div className="data-view__footer">
      <div className="footer__selected-records">
        <Typography variant="body2">
          {selectedRecords.length} Record{selectedRecords.length !== 1 ? 's' : ''} Selected
        </Typography>
        <Tooltip title="click here for graph view">
          <span>
            <IconButton
              disabled={selectedRecords.length === 0}
              onClick={handleSwapToGraph}
            >
              <TimelineIcon
                color={selectedRecords.length === 0 ? 'disabled' : 'secondary'}
              />
            </IconButton>
          </span>
        </Tooltip>
      </div>
      {statusMessage && (
        <div className="footer__loader">
          <CircularProgress />
          <Typography variant="body2">
            {statusMessage}
          </Typography>
        </div>
      )}
      <Typography className="footer__total-rows" variant="body2">
        Total Rows: {totalRows === null ? 'Unknown' : totalRows}
      </Typography>

    </div>
  );
};

DataViewFooter.propTypes = {
  history: HistoryPropType.isRequired,
  onError: PropTypes.func,
  selectedRecords: PropTypes.array,
  statusMessage: PropTypes.string,
  totalRows: PropTypes.number,
};

DataViewFooter.defaultProps = {
  onError: () => {},
  selectedRecords: [],
  statusMessage: '',
  totalRows: null,
};

export default DataViewFooter;
