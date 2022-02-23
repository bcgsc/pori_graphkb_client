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

import treeDiagram from '@/static/images/tree.png';

/**
 * Component for displaying the help information on subqueries
 * @param {object} props
 * @param {boolean} props.isOpen - Dialog open flag
 * @param {function} props.onClose - Handler for closing of dialog.
 */
function HelpDialog(props) {
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
        <Typography variant="h3">Subquerying</Typography>
      </DialogTitle>
      <DialogContent>
        <section className="subquery-help__section">
          <div className="subquery-help__section-header">
            <TreeIcon />
            <Typography variant="h4">Subclass Tree Subquery</Typography>
          </div>
          <Typography variant="body2">
            The tree subquery is used to get all subclasses (and their subclasses, etc.) of a term.
            This is useful, for example, when filtering for all therapeutic terms.
            Instead of having to add each term individually, you can pick the base/root term of the
            subclass tree instead. The subquery will automatically resolve the aliases, deprecated forms,
            and cross reference relationships to grab all the equivalent representations
          </Typography>
          <figure className="subquery-help__tree-diagram">
            <img alt="tree diagram" src={treeDiagram} />
            <figcaption>Example of a tree query on the term &quot;therapeutic efficacy&quot;</figcaption>
          </figure>
        </section>
        <section className="subquery-help__section">
          <div className="subquery-help__section-header">
            <ShareIcon />
            <Typography variant="h4">Keyword Subquery</Typography>
          </div>
          <Typography variant="body2">
            The keyword subquery can be used to find terms that match a substring or a string
            exactly. The subquery will automatically resolve the aliases, deprecated forms,
            and cross reference relationships to grab all the equivalent representations
          </Typography>
        </section>

      </DialogContent>
    </Dialog>
  );
}

HelpDialog.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};

HelpDialog.defaultProps = {
};

export default HelpDialog;
