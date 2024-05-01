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
import { ColDef } from 'ag-grid-community';
import { AgGridReact } from 'ag-grid-react';
import { Buffer } from 'buffer';
import React, {
  useCallback,
  useState,
} from 'react';

import RecordFormDialog from '@/components/RecordFormDialog';
import { GeneralRecordType } from '@/components/types';
import { FORM_VARIANT } from '@/components/util';

window.Buffer = window.Buffer || Buffer;

interface AdminTableProps {
  /** handler to be triggered when data changes */
  onChange: (...args: unknown[]) => unknown;
  /** List of records. */
  records?: Record<string, unknown>[];
  /** the table variant (user or usergroup) */
  variant?: 'User' | 'UserGroup';
}

/**
 * Component for managing AdminView User form state.
 */
const AdminTable = ({ onChange, records = [], variant = 'User' }: AdminTableProps) => {
  const [recordOpen, setRecordOpen] = useState<GeneralRecordType | null>();
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

  const colDefs: ColDef[] = [
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
        valueGetter: ({ data: { groups } }) => groups?.map((group) => group.name).join(', ') ?? '',
      },
    ] as ColDef[]);
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

  const Actions = ({ data: record }: { data: Record<string, unknown> }) => (
    <IconButton onClick={() => handleOpenEditDialog(record)}>
      <EditIcon />
    </IconButton>
  );

  const EmailLink = ({ value: email }: { value: string }) => (
    <a href={`mailto:${email}?subject=GraphKB&cc=graphkb@bcgsc.ca`}>{email}</a>
  );

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
          height: '353px', // 5 Rows
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

AdminTable.defaultProps = {
  records: null,
  variant: 'User',
};

export default AdminTable;
