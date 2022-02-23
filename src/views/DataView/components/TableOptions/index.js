import './index.scss';

import {
  Popover,
} from '@material-ui/core';
import PropTypes from 'prop-types';
import React, { useCallback, useState } from 'react';

import OptionsMenu from '@/components/OptionsMenu';
import config from '@/static/config';

import ColumnConfiguration from './ColumnConfiguration';

const { MAX_EXPORT_SIZE } = config;

const TableOptions = ({
  onExportToTsv,
  anchorEl,
  onClose,
  gridRef,
}) => {
  const [columnControlIsOpen, setColumnControlIsOpen] = useState(false);

  const handleExportAllToTsv = useCallback(() => {
    onExportToTsv(false);
  }, [onExportToTsv]);

  const menuContents = [
    {
      label: 'Configure Visible Columns',
      handler: () => setColumnControlIsOpen(true),
    },

  ];

  if (onExportToTsv) {
    menuContents.push({
      label: `Export to TSV (max ${MAX_EXPORT_SIZE} rows)`,
      handler: handleExportAllToTsv,
    });
  }

  const handleCloseColumnControl = useCallback(() => {
    setColumnControlIsOpen(false);
    onClose();
  }, [onClose]);

  const result = (
    <>
      <Popover
        anchorEl={anchorEl}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        onClose={onClose}
        open={anchorEl !== null}
      >
        <OptionsMenu
          className="data-view__options-menu"
          options={menuContents}
        />
      </Popover>
      <ColumnConfiguration
        gridRef={gridRef}
        isOpen={columnControlIsOpen}
        onClose={handleCloseColumnControl}
      />
    </>
  );
  return result;
};

TableOptions.propTypes = {
  anchorEl: PropTypes.element,
  gridRef: PropTypes.any,
  onClose: PropTypes.func,
  onExportToTsv: PropTypes.func,
};

TableOptions.defaultProps = {
  onExportToTsv: () => { },
  anchorEl: null,
  onClose: () => {},
};


export default TableOptions;
