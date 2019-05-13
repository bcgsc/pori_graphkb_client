import { boundMethod } from 'autobind-decorator';
import React from 'react';
import PropTypes from 'prop-types';
import {
  Typography,
  IconButton,
  Table,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@material-ui/core';
import EditIcon from '@material-ui/icons/Edit';
import AddIcon from '@material-ui/icons/Add';
import { SnackbarContext } from '@bcgsc/react-snackbar-provider';

import './index.scss';
import RecordFormDialog from '../../../../components/RecordFormDialog';

/**
 * Component for managing AdminView User form state.
 *
 * @property {object} props
 * @property {Array} props.users - List of user records.
 * @property {Array} props.userGroups - List of usergroup records.
 * @property {function} props.deleteUsers - delete users handler.
 * @property {function} props.addUser - add user handler.
 * @property {function} props.editUser - edit user handler.
 */
class AdminTable extends React.PureComponent {
  static contextType = SnackbarContext;

  static propTypes = {
    records: PropTypes.arrayOf(PropTypes.object),
    onChange: PropTypes.func.isRequired,
    variant: PropTypes.oneOf(['User', 'UserGroup']),
  };

  static defaultProps = {
    records: [],
    variant: 'User',
  };

  constructor(props) {
    super(props);
    this.state = {
      ridOpen: null,
      dialogOpen: false,
    };
  }

  @boundMethod
  handleOpenEditDialog(rid) {
    this.setState({ dialogOpen: true, ridOpen: rid });
  }

  @boundMethod
  handleOpenNewDialog() {
    this.setState({ dialogOpen: true, ridOpen: null });
  }

  @boundMethod
  handleDialogCancel() {
    this.setState({ dialogOpen: false, ridOpen: null });
  }

  @boundMethod
  handleDialogError() {
    this.setState({ dialogOpen: false, ridOpen: null });
  }

  @boundMethod
  handleDialogSubmit() {
    const { onChange } = this.props;
    this.setState({ dialogOpen: false, ridOpen: null });
    onChange();
  }

  render() {
    const {
      records,
      variant,
    } = this.props;

    const {
      dialogOpen,
      ridOpen,
    } = this.state;

    const Row = ({
      name,
      createdAt,
      groups = null,
      '@rid': rid,
    }) => (
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
          <IconButton onClick={() => this.handleOpenEditDialog(rid)}>
            <EditIcon />
          </IconButton>
        </TableCell>
      </TableRow>
    );

    const sortByName = (rec1, rec2) => rec1.name.localeCompare(rec2.name);

    return (
      <div className="admin-table">
        <RecordFormDialog
          isOpen={dialogOpen}
          modelName={variant}
          onClose={this.handleDialogCancel}
          onError={this.handleDialogError}
          onSubmit={this.handleDialogSubmit}
          rid={ridOpen}
        />
        <div className="admin-table__header">
          <Typography component="h2" variant="h6">
            Current {variant}s ({records.length})
          </Typography>
          <div>
            <IconButton onClick={this.handleOpenNewDialog}>
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
  }
}

export default AdminTable;
