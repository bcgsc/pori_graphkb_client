import 'ag-grid-community/dist/styles/ag-grid.css';
import 'ag-grid-community/dist/styles/ag-theme-material.css';
import './index.scss';

import {
  Button,
  IconButton,
  Typography,
} from '@material-ui/core';
import AddIcon from '@material-ui/icons/Add';
import EditIcon from '@material-ui/icons/Edit';
import { AgGridReact } from 'ag-grid-react';
import PropTypes from 'prop-types';
import React, {
  useCallback,
  useState,
} from 'react';

import RecordFormDialog from '@/components/RecordFormDialog';
import { FORM_VARIANT } from '@/components/util';

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

  const colDefs = [
    {
      headerName: 'record ID',
      field: '@rid',

    },
    {
      headerName: 'name',
      field: 'name',
      filter: 'agTextColumnFilter',
    },
  ];

  if (variant === 'User') {
    colDefs.push(...[
      {
        headerName: 'email',
        field: 'email',
        cellRenderer: 'EmailLink',
        filter: 'agTextColumnFilter',
        width: 200,
      },
      {
        headerName: 'License Signed At',
        field: 'signedLicenseAt',
        width: 200,
        valueFormatter: ({ value }) => value && new Date(value).toLocaleString(),
      }, {
        headerName: 'groups',
        field: 'groups',
        flex: true,
        valueGetter: ({ data: { groups } }) => groups?.map(group => group.name).join(', ') ?? '',
      },
    ]);
  }
  colDefs.push(...[
    {
      headerName: 'Created At',
      field: 'createdAt',
      width: 200,
      valueFormatter: ({ value }) => new Date(value).toLocaleString(),
    },
    {
      headerName: 'Actions',
      cellRenderer: 'Actions',
      pinned: 'right',
      sortable: false,
      width: 100,
    },
  ]);

  const Actions = ({ data: record }) => (
    <IconButton onClick={() => handleOpenEditDialog(record)}>
      <EditIcon />
    </IconButton>
  );
  Actions.propTypes = {
    data: PropTypes.object.isRequired,
  };

  const EmailLink = ({ value: email }) => (
    <a href={`mailto:${email}?subject=GraphKB&cc=graphkb@bcgsc.ca`}>{email}</a>
  );

  EmailLink.propTypes = {
    value: PropTypes.string.isRequired,
  };

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
          <Button color="primary" onClick={handleOpenNewDialog} variant="outlined">
            <AddIcon /> Add new {variant}
          </Button>
        </div>
      </div>
      <div
        className="admin-table__content ag-theme-material"
        role="presentation"
        style={{
          width: '100%',
          height: '352px',
        }}
      >
        <AgGridReact
          columnDefs={colDefs}
          defaultColDef={{
            sortable: true,
            resizable: true,
            width: 150,
          }}
          frameworkComponents={{ EmailLink, Actions }}
          pagination
          paginationAutoPageSize
          rowData={records}
          suppressHorizontalScroll={false}
        />
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
  records: null,
  variant: 'User',
};

export default AdminTable;
