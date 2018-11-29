import React from 'react';
import PropTypes from 'prop-types';
import {
  FormControlLabel,
  Typography,
  RadioGroup,
  Radio,
  Checkbox,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Divider,
} from '@material-ui/core';
import util from '../../../services/util';

function TableColumnDialog(props) {
  const {
    open,
    handleChange,
    handleColumnCheck,
    handleSortByChange,
    tableColumns,
  } = props;

  return (
    <Dialog
      open={open}
      onClose={() => handleChange({ target: { name: 'columnSelect', value: false } })}
      classes={{ paper: 'column-dialog' }}
    >
      <DialogTitle id="column-dialog-title">
        Select Columns:
      </DialogTitle>
      <DialogContent>
        {tableColumns.map((column, i) => (
          <div key={column.id} id={column.id}>
            <FormControlLabel
              control={(
                <Checkbox
                  checked={column.checked}
                  onChange={() => handleColumnCheck(i)}
                  color="primary"
                />
              )}
              label={column.label}
            />
            {column.sortBy && (
              <div style={{ marginLeft: '32px' }}>
                <Typography variant="caption">
                  Sort By:
                </Typography>
                <RadioGroup
                  onChange={e => handleSortByChange(e.target.value, i)}
                  value={column.sortBy}
                  style={{ flexDirection: 'row' }}
                >
                  {column.sortable.map(sort => (
                    <FormControlLabel
                      disabled={!column.checked}
                      key={sort}
                      value={sort}
                      control={<Radio />}
                      label={util.antiCamelCase(sort)}
                    />
                  ))}
                </RadioGroup>
              </div>
            )}
            <Divider />
          </div>
        ))}
      </DialogContent>
      <DialogActions id="column-dialog-actions">
        <Button onClick={() => handleChange({ target: { name: 'columnSelect', value: false } })} color="primary">
          Done
        </Button>
      </DialogActions>
    </Dialog>
  );
}

/**
 * @namespace
 * @property {function} handleChange - Handler for closing the dialog.
 * @property {function} handleColumnCheck - Handler for column selection events.
 * @property {function} handleSortByChange - Handler for column sortBy
 * selection events.
 * @property {boolean} open - Whether or not dialog is open.
 * @property {Array<Object>} tableColumns - List of available table columns.
 */
TableColumnDialog.propTypes = {
  handleChange: PropTypes.func.isRequired,
  handleColumnCheck: PropTypes.func.isRequired,
  handleSortByChange: PropTypes.func.isRequired,
  open: PropTypes.bool,
  tableColumns: PropTypes.array,
};

TableColumnDialog.defaultProps = {
  open: false,
  tableColumns: [],
};

export default TableColumnDialog;
