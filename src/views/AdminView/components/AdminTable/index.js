import './index.scss';

import {
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@material-ui/core';
import AddIcon from '@material-ui/icons/Add';
import EditIcon from '@material-ui/icons/Edit';
import PropTypes from 'prop-types';
import React, {
  useCallback,
  useState,
} from 'react';

import { FORM_VARIANT } from '@/components/RecordForm/util';
import RecordFormDialog from '@/components/RecordFormDialog';


/**
 * Component for managing AdminView User form state.
 *
 * @property {object} props
 * @property {string} props.variant the table variant (user or usergroup)
 * @property {Array} props.records List of records.
 * @property {function} props.onChange handler to be triggered when data changes
 */
const AdminTable = ({ onChange, records, variant }) => {
  const [recordOpen, setRecordOpen] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleOpenEditDialog = (record) => {
    setRecordOpen(record);
    setDialogOpen(true);
  };

  const handleOpenNewDialog = () => {
    setDialogOpen(true);
    setRecordOpen(null);
  };

  const handleDialogCancel = () => {
    setDialogOpen(false);
    setRecordOpen(null);
  };

  const handleDialogError = () => {
    setDialogOpen(false);
    setRecordOpen(null);
  };

  const handleDialogSubmit = useCallback(() => {
    setDialogOpen(false);
    setRecordOpen(null);
    onChange();
  }, [onChange]);

  const Row = (record) => {
    const {
      '@rid': rid, name, createdAt, groups,
    } = record;
    return (
      <TableRow key={rid}>
        <TableCell padding="dense">{rid}</TableCell>
        <TableCell>{name}</TableCell>
        <TableCell padding="dense">
          {new Date(createdAt).toLocaleString()}
        </TableCell>
        {variant === 'User' && (
        <TableCell>{groups.map(group => group.name).join(', ')}</TableCell>
        )}
        <TableCell padding="checkbox">
          <IconButton onClick={() => handleOpenEditDialog(record)}>
            <EditIcon />
          </IconButton>
        </TableCell>
      </TableRow>
    );
  };

  const sortByName = (rec1, rec2) => rec1.name.localeCompare(rec2.name);

  return (
    <div className="admin-table">
      <RecordFormDialog
        isOpen={dialogOpen}
        modelName={variant}
        onClose={handleDialogCancel}
        onError={handleDialogError}
        onSubmit={handleDialogSubmit}
        value={recordOpen}
        variant={!recordOpen
          ? FORM_VARIANT.NEW
          : FORM_VARIANT.EDIT}
      />
      <div className="admin-table__header">
        <Typography variant="h2">
            Current {variant}s ({records.length})
        </Typography>
        <div>
          <IconButton onClick={handleOpenNewDialog}>
            <AddIcon />
          </IconButton>
        </div>
      </div>
      <div className="admin-table__content">
        <Table>
          <TableHead>
            <TableRow className="admin-table__content-header">
              <TableCell padding="dense">Record ID</TableCell>
              <TableCell>Name</TableCell>
              <TableCell padding="dense">Created At</TableCell>
              {variant === 'User' && (<TableCell>Groups</TableCell>)}
              <TableCell padding="checkbox" />
            </TableRow>
          </TableHead>
          <TableBody>
            {records.sort(sortByName).map(record => Row(record))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};


AdminTable.propTypes = {
  onChange: PropTypes.func.isRequired,
  records: PropTypes.arrayOf(PropTypes.object),
  variant: PropTypes.oneOf(['User', 'UserGroup']),
};

AdminTable.defaultProps = {
  records: [],
  variant: 'User',
};

export default AdminTable;
