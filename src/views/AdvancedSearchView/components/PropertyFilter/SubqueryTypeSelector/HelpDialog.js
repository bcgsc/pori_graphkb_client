import {
  Dialog,
  DialogContent,
  DialogTitle,
  Typography,
} from '@material-ui/core';
import TreeIcon from '@material-ui/icons/AccountTree';
import ShareIcon from '@material-ui/icons/Share';
import PropTypes from 'prop-types';
import React from 'react';

/**
   * Component for simple dialog that prompts the user before deleting a record.
   * @param {object} props
   * @param {boolean} props.isOpen - Drawer open flag
   * @param {function} props.onCancel - Handler for closing of dialog.
   * @param {function} props.onConfirm - Handler for confirming action
   * @param {string} props.message - Message to display in dialog title.
   */
const HelpDialog = (props) => {
  const {
    isOpen,
    onClose,
  } = props;

  return (
    <Dialog
      className="subquery-help"
      onClose={onClose}
      open={isOpen}
    >
      <DialogTitle>
        <Typography variant="h2">Subquerying</Typography>
      </DialogTitle>
      <DialogContent>
        <section className="subquery-help__section">
          <div className="subquery-help__section-header">
            <TreeIcon />
            <Typography variant="h3">Tree Subquery</Typography>
          </div>
          <Typography variant="paragraph">
            The tree subquery is used to get all subclasses (and their subclasses, etc.) of a term.
            This is useful, for example, when filtering for all therapeutic terms.
            Instead of having to add each term individually, you can pick the base/root term of the
            subclass tree instead. The subquery will automatically resolve the aliases, deprecated forms,
            and cross reference relationships to grab all the equivalent representations
          </Typography>
        </section>
        <section className="subquery-help__section">
          <div className="subquery-help__section-header">
            <ShareIcon />
            <Typography variant="h3">Keyword Subquery</Typography>
          </div>
          <Typography variant="paragraph">
            The keyword subquery can be used to find terms that match a substring or a string
            exactly. The subquery will automatically resolve the aliases, deprecated forms,
            and cross reference relationships to grab all the equivalent representations
          </Typography>
        </section>

      </DialogContent>
    </Dialog>
  );
};

HelpDialog.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};

HelpDialog.defaultProps = {
};

export default HelpDialog;
