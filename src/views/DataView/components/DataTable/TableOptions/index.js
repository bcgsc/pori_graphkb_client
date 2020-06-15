import './index.scss';

import {
  Checkbox, FormControlLabel, Popover,
} from '@material-ui/core';
import PropTypes from 'prop-types';
import React, { useCallback } from 'react';

import OptionsMenu from '@/components/OptionsMenu';

const MAX_FULL_EXPORTS_ROWS = 1000;


const TableOptions = ({
  activeColumns,
  activeGroups,
  allColumns,
  allGroups,
  getColumnLabel,
  onExportToTsv,
  onToggleColumn,
  onToggleGroup,
  anchorEl,
  onClose,
  selectionTracker,
  totalRowsSelected,
}) => {
  const ignorePreviewColumns = colId => !colId.endsWith('.preview');

  const selectionCount = selectionTracker.getTotalNumOfSelectedRows();
  const ColumnCheckBox = (colId, groupId = null) => (
    <FormControlLabel
      key={colId}
      control={(
        <Checkbox
          checked={activeColumns.has(colId)}
          onChange={() => onToggleColumn(colId, groupId)}
        />
      )}
      label={getColumnLabel(colId)}
    />
  );

  const columnControl = allColumns.sort().map((colId) => {
    if (allGroups[colId]) {
      return (
        <fieldset key={colId}>
          <legend>
            <FormControlLabel
              control={(
                <Checkbox
                  checked={activeGroups.has(colId)}
                  onChange={() => onToggleGroup(colId)}
                />
              )}
              label={colId}
            />
          </legend>
          {allGroups[colId].filter(ignorePreviewColumns).map(subColId => ColumnCheckBox(subColId, colId))}
        </fieldset>
      );
    }
    return ColumnCheckBox(colId);
  });

  const menuContents = [
    {
      label: 'Configure Visible Columns',
      content: columnControl,
    },
  ];

  const handleExportAllToTsv = useCallback(() => {
    onExportToTsv(false);
  }, [onExportToTsv]);

  const handleExportSelectionToTsv = useCallback(() => {
    onExportToTsv(true);
  }, [onExportToTsv]);

  if (totalRowsSelected < MAX_FULL_EXPORTS_ROWS) {
    menuContents.push({
      label: 'Export All to TSV',
      handler: handleExportAllToTsv,
    });
  }

  if (selectionCount) {
    menuContents.push({
      label: `Export Selected Rows (${selectionCount}) to TSV`,
      handler: handleExportSelectionToTsv,
    });
  }

  const result = (
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
  );
  return result;
};

TableOptions.propTypes = {
  activeColumns: PropTypes.arrayOf(PropTypes.string).isRequired,
  activeGroups: PropTypes.arrayOf(PropTypes.string).isRequired,
  allColumns: PropTypes.arrayOf(PropTypes.string).isRequired,
  allGroups: PropTypes.objectOf(PropTypes.arrayOf(PropTypes.string)).isRequired,
  totalRowsSelected: PropTypes.number.isRequired,
  anchorEl: PropTypes.element,
  getColumnLabel: PropTypes.func,
  onClose: PropTypes.func,
  onExportToTsv: PropTypes.func,
  onToggleColumn: PropTypes.func,
  onToggleGroup: PropTypes.func,
};

TableOptions.defaultProps = {
  onExportToTsv: () => { },
  onToggleColumn: () => { },
  onToggleGroup: () => { },
  getColumnLabel: colId => colId,
  anchorEl: null,
  onClose: () => {},
};


export default TableOptions;
