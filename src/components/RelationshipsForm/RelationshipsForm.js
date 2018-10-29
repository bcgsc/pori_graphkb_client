import React, { Component } from 'react';
import PropTypes from 'prop-types';
import {
  Paper,
  Typography,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  IconButton,

} from '@material-ui/core';
import CloseIcon from '@material-ui/icons/Close';
import AddIcon from '@material-ui/icons/Add';
import RefreshIcon from '@material-ui/icons/Refresh';
import TrendingFlatIcon from '@material-ui/icons/TrendingFlat';
import ResourceSelectComponent from '../ResourceSelectComponent/ResourceSelectComponent';
import AutoSearchComponent from '../AutoSearchComponent/AutoSearchComponent';

class RelationshipsForm extends Component {
  constructor(props) {
    super(props);
    const tempId = 'TEMP:001';
    this.state = {
      relationship: {
        '@class': '',
        '@rid': tempId,
        name: '',
        sourceId: '',
        in: '',
        out: tempId,
        source: '',
      },
      errorFlag: false,
      tempId,
    };
  }

  incrementTempId() {
    const { tempId } = this.state;
    const num = tempId.slice(5);
    let newNum = Number(num) + 1;
    if (newNum < 10) {
      newNum = `00${newNum}`;
    } else if (newNum < 100) {
      newNum = `0${newNum}`;
    }
    const newTempId = `TEMP:${newNum}`;
    this.setState({ tempId: newTempId });
  }

  /**
   * Updates staged relationship object from user input.
   * @param {Event} e - User input event.
   */
  handleRelationship(e) {
    const { relationship } = this.state;
    const { originalRid } = this.props;
    relationship[e.target.name] = e.target.value;
    if (e.target['@rid']) {
      if (relationship.in === originalRid['@rid']) {
        relationship.out = e.target['@rid'];
      } else {
        relationship.in = e.target['@rid'];
      }
    }
    if (e.target.sourceId) {
      relationship.sourceId = e.target.sourceId;
    }
    this.setState({ relationship, errorFlag: false });
  }

  /**
   * Validates and then adds a new relationship to state list.
   * Clears relationship fields.
   * @param {Event} e - User request relationship add event.
   */
  handleRelationshipAdd(e) {
    e.preventDefault();
    const {
      originalNode,
      relationship,
      relationships,
    } = this.state;
    if (
      relationship.in
      && relationship.out
      && relationship['@class']
      && relationship.source
    ) {
      if (
        !relationships.find(r => r.out === relationship.out
          && r.in === relationship.in
          && r['@class'] === relationship['@class']
          && r.source === relationship.source)
      ) {
        relationships.push(relationship);
        this.setState({
          errorFlag: false,
          relationship: {
            '@class': '',
            name: '',
            sourceId: '',
            in: '',
            out: originalNode['@rid'],
            source: '',
          },
        });
      }
    } else {
      this.setState({ errorFlag: true });
    }
  }

  /**
   * Deletes a relationship from state relationship list.
   * @param {number} i - Relationship index to be deleted
   */
  handleRelationshipDelete(i) {
    const {
      undoable,
      initRelationships,
      relationships,
    } = this.props;
    if (
      undoable
      && initRelationships.find(r => r['@rid'] === relationships[i]['@rid'])
    ) {
      relationships[i].deleted = true;
    } else {
      relationships.splice(i, 1);
    }
    this.setState({ relationships });
  }

  /**
   * Updates staged relationship direction by swapping in/out properties.
   */
  handleRelationshipDirection() {
    const { relationship, originalNode } = this.state;

    if (relationship.in === originalNode['@rid']) {
      relationship.in = relationship.out;
      relationship.out = originalNode['@rid'];
    } else {
      relationship.out = relationship.in;
      relationship.in = originalNode['@rid'];
    }
    this.setState({ relationship, errorFlag: false });
  }

  /**
   * Removes a relationship from being staged for deletion.
   * @param {Object} relationship - relationship to be rolled back.
   */
  handleRelationshipUndo(relationship) {
    const { relationships } = this.state;
    const rel = relationships.find(r => r['@rid'] === relationship['@rid']);
    delete rel.deleted;

    this.setState({ relationships });
  }

  render() {
    const {
      relationship,
      errorFlag,
    } = this.state;
    const {
      originalRid,
    } = this.props;

    return (
      <Paper className="relationships-wrapper">
        <Typography variant="h6">
          Relationships
        </Typography>
        <div style={{ overflow: 'auto' }}>
          <Table className="form-table">
            <TableHead className="form-table-header">
              <TableRow>
                <TableCell padding="checkbox" />
                <TableCell padding="dense">
                  Class
                </TableCell>
                <TableCell padding="dense">
                  Related Record
                </TableCell>
                <TableCell padding="dense">
                  Source
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {relationships.map((r, i) => {
                const sourceName = sources.find(
                  s => s['@rid'] === r.source,
                ).name;
                const typeName = r.in === originalRid
                  ? util.getEdgeLabel(`in_${r['@class']}`)
                  : util.getEdgeLabel(`out_${r['@class']}`);
                return (
                  <TableRow
                    key={r['@rid'] || `${r['@class']}${r.in}${r.out}${r.source}`}
                    className={r.deleted && 'deleted'}
                  >
                    <TableCell padding="checkbox">
                      {!r.deleted ? (
                        <IconButton
                          onClick={() => this.handleRelationshipDelete(i)}
                          style={{ position: 'unset' }}
                          disableRipple
                          className="delete-btn"
                        >
                          <CloseIcon color="error" />
                        </IconButton>)
                        : (
                          <IconButton
                            onClick={() => this.handleRelationshipUndo(r)}
                            style={{ position: 'unset' }}
                            disableRipple
                            color="primary"
                          >
                            <RefreshIcon />
                          </IconButton>
                        )
                      }
                    </TableCell>
                    <TableCell padding="dense">
                      {typeName}
                    </TableCell>
                    <TableCell padding="dense">
                      {r.name || r.sourceId}
                    </TableCell>
                    <TableCell padding="dense">
                      {sourceName}
                    </TableCell>
                  </TableRow>
                );
              })}
              <TableRow id="relationship-add">
                <TableCell padding="checkbox" id="add-btn-cell">
                  <IconButton
                    color="primary"
                    onClick={this.handleRelationshipAdd}
                  >
                    <AddIcon />
                  </IconButton>
                </TableCell>
                <TableCell padding="dense">
                  <div className="relationship-dir-type">
                    <IconButton
                      name="direction"
                      onClick={this.handleRelationshipDirection}
                      color="primary"
                    >
                      <TrendingFlatIcon
                        className={
                          (relationship.in === originalRid)
                            ? 'relationship-in'
                            : null
                        }
                      />
                    </IconButton>
                    <ResourceSelectComponent
                      value={relationship['@class']}
                      onChange={this.handleRelationship}
                      name="@class"
                      label="Type"
                      resources={edgeTypes}
                      error={errorFlag}
                      id="relationship-type"
                      dense
                    >
                      {edgeTypesDisplay}
                    </ResourceSelectComponent>
                  </div>
                </TableCell>
                <TableCell padding="dense">
                  <div className="search-wrap">
                    <AutoSearchComponent
                      value={relationship.name}
                      onChange={this.handleRelationship}
                      placeholder="Target Name"
                      limit={10}
                      name="name"
                      error={errorFlag}
                      dense
                    />
                  </div>
                </TableCell>
                <TableCell padding="dense" style={{ transform: 'translate(0, 1px)' }}>
                  <ResourceSelectComponent
                    value={relationship.source}
                    onChange={this.handleRelationship}
                    name="source"
                    label="Source"
                    resources={sources}
                    error={errorFlag}
                    dense
                    id="relationship-source"
                  />
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </Paper>
    );
  }
}

RelationshipsForm.propTypes = {
  undoable: PropTypes.bool,
  originalRid: PropTypes.string,
  initRelationships: PropTypes.array,
};

RelationshipsForm.defaultProps = {
  undoable: false,
  originalRid: '',
  initRelationships: [],
};

export default RelationshipsForm;
