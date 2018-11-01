import React, { Component } from 'react';
import PropTypes from 'prop-types';
import './RelationshipsForm.css';
import {
  Collapse,
  IconButton,
  MenuItem,
  ListItem,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
  Button,
  ListItemText,
} from '@material-ui/core';
import CloseIcon from '@material-ui/icons/Close';
import RefreshIcon from '@material-ui/icons/Refresh';
import TrendingFlatIcon from '@material-ui/icons/TrendingFlat';
import KeyboardArrowDownIcon from '@material-ui/icons/KeyboardArrowDown';
import FormTemplater from '../FormTemplater/FormTemplater';
import ResourceSelectComponent from '../ResourceSelectComponent/ResourceSelectComponent';
import AutoSearchComponent from '../AutoSearchComponent/AutoSearchComponent';
import util from '../../services/util';

const DEFAULT_RELATIONSHIPS_PROPSLENGTH = 13;

/**
 * Displays all of a relationships key/value pairs to be displayed in table
 * expanding row.
 * @param {Object} r - relationship object to be displayed.
 * @param {boolean} isIn - flag for whether current editing node is on the 'in'
 * side of the relationship.
 */
const getRelationshipDetails = (r, isIn) => {
  const targetNode = isIn
    ? 'out'
    : 'in';
  return (
    <div className="relationships-expansion">
      {Object.keys(r).filter(k => (
        !k.includes('.')
        && k !== 'deleted'
        && k !== '@rid'
        && k !== (isIn ? 'in' : 'out')
      )).map(k => (
        <ListItem key={k}>
          <ListItemText
            primary={(k === 'in' || k === 'out')
              ? r[targetNode] || r[`${targetNode}.sourceId`]
              : r[k].toString()}
            secondary={util.antiCamelCase(k)}
          />
        </ListItem>
      ))}
    </div>
  );
};

class RelationshipsForm extends Component {
  constructor(props) {
    super(props);
    const { relationships } = props;
    this.state = {
      model: null,
      to: false,
      edges: [],
      originalRelationships: relationships && relationships.slice(),
      expanded: null,
      minimized: false,
    };
    this.testId = 0;
    this.handleAdd = this.handleAdd.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.handleClassChange = this.handleClassChange.bind(this);
    this.handleDirection = this.handleDirection.bind(this);
    this.handleExpand = this.handleExpand.bind(this);
  }

  /**
   * Initializes temp relationship model and edge classes.
   */
  componentDidMount() {
    const { schema, nodeRid } = this.props;
    const edges = schema.getEdges();
    const model = schema.initModel({}, edges[0]);
    model['in.@rid'] = nodeRid;
    model['@rid'] = this.applyTestId();
    this.setState({ model, edges });
  }

  /**
 * Adds new subset to state list. Clears subset field.
 * @param {Event} e - User request subset add event.
 */
  handleAdd(e) {
    e.preventDefault();
    const {
      relationships,
      name,
      onChange,
      schema,
      nodeRid,
    } = this.props;

    const {
      model,
      edges,
      to,
    } = this.state;

    if (model && !relationships.find(r => r['@rid'] === model['@rid'])) {
      relationships.push(model);
      onChange({ target: { name, value: relationships } });
      const newModel = schema.initModel({}, edges[0]);
      newModel[`${to ? 'out' : 'in'}.@rid`] = nodeRid;
      newModel['@rid'] = this.applyTestId();
      this.setState({ model: newModel });
    }
  }

  /**
   * Deletes subset from state relationship list.
   * @param {Event} e - User delete button event click.
   * @param {string} rid - relationship id to be deleted.
   */
  handleDelete(e, rid) {
    e.stopPropagation();
    const {
      originalRelationships,
    } = this.state;
    const {
      relationships,
      onChange,
      name,
    } = this.props;
    const targetRelationship = relationships.find(r => r['@rid'] === rid);
    if (targetRelationship) {
      if (originalRelationships && originalRelationships.find(r => r['@rid'] === rid)) {
        targetRelationship.deleted = true;
      } else {
        relationships.splice(relationships.indexOf(targetRelationship), 1);
      }
      onChange({ target: { name, value: relationships } });
    }
  }

  /**
   * Reverts a subset that is staged for deletion.
   * @param {Event} e - User undo button click event.
   * @param {string} rid - deleted subset to be reverted.
   */
  handleUndo(e, rid) {
    e.stopPropagation();

    const { relationships, name, onChange } = this.props;
    relationships.find(r => r['@rid'] === rid).deleted = false;
    onChange({ target: { name, value: relationships } });
  }

  /**
   * Handles change in temp relationship model.
   * @param {Event} e - User change event.
   */
  handleChange(e) {
    const { model } = this.state;
    const { name, value, sourceId } = e.target;

    model[name] = value;

    if (e.target['@rid']) {
      model[`${name}.@rid`] = e.target['@rid'];
    } else if (model[`${name}.@rid`]) {
      model[`${name}.@rid`] = '';
    }
    if (sourceId) {
      model[`${name}.sourceId`] = sourceId;
    } else if (model[`${name}.sourceId`]) {
      model[`${name}.sourceId`] = '';
    }

    this.setState({ model });
  }

  /**
   * Handles changes in the temp relationship model's class, causing a
   * reinitialization of the model.
   * @param {Event} e - class change event.
   */
  handleClassChange(e) {
    const { model } = this.state;
    const { schema } = this.props;
    const { value } = e.target;

    const newModel = schema.initModel(model, value);
    this.setState({ model: newModel });
  }

  /**
   * Handles switch in direction of temp relationship.
   * @example
   * > rel1 = {
   * >   in: nodeA,
   * >   out: nodeB,
   * > };
   * > handleDirection();
   * > rel1 = {
   * >   in: nodeB,
   * >   out: nodeA,
   * > };
   */
  handleDirection() {
    const { to, model } = this.state;

    const temp = {};

    Object.keys(model).forEach((k) => {
      if (k.startsWith('out') || k.startsWith('in')) {
        temp[k] = model[k];
      }
    });
    Object.keys(temp).forEach((k) => {
      if (k.startsWith('in')) {
        model[`out${k !== 'in' ? `.${k.split('.')[1]}` : ''}`] = temp[k];
      }
      if (k.startsWith('out')) {
        model[`in${k !== 'out' ? `.${k.split('.')[1]}` : ''}`] = temp[k];
      }
    });
    this.setState({ to: !to, model });
  }

  /**
   * Expands a relationship table row to show more details. Only applicable to
   * relationships that have more properties than the standard in, out, source.
   * @param {string} rid - ID of the relationship to be expanded.
   */
  handleExpand(rid) {
    const { expanded } = this.state;
    this.setState({
      expanded: expanded === rid ? null : rid,
    });
  }

  /**
   * Increments the internal testId counter and returns the current formatted
   * id.
   */
  applyTestId() {
    const id = this.testId;
    this.testId += 1;
    return `#TEST:${id}`;
  }

  render() {
    const {
      model,
      edges,
      to,
      expanded,
      minimized,
    } = this.state;
    const {
      schema,
      relationships,
      nodeRid,
    } = this.props;

    if (!model) return null;
    const editableProps = (schema.getClass(model['@class'])).properties;

    let formIsInvalid = false;
    editableProps.forEach((prop) => {
      if (prop.mandatory) {
        if (prop.type === 'link' && (!model[prop.name] || !model[`${prop.name}.@rid`])) {
          formIsInvalid = true;
        } else if (prop.type !== 'boolean' && !model[prop.name]) {
          formIsInvalid = true;
        }
      }
    });
    return (
      <div className="relationships-form-wrapper">
        <fieldset className="relationships-temp-fields">
          <legend>
            <Typography variant="h6">
              New Relationship
            </Typography>
          </legend>
          <ListItem disableGutters className="relationships-temp-btns">
            <IconButton
              onClick={this.handleDirection}
              color="primary"
              className="relationship-direction-btn"
            >
              <TrendingFlatIcon
                className={to ? 'relationship-in' : ''}
              />
            </IconButton>
            <ResourceSelectComponent
              resources={edges}
              value={model['@class']}
              onChange={this.handleClassChange}
              name="@class"
            >
              {resource => (
                <MenuItem key={resource} value={resource}>
                  {to ? schema.get(resource).name : schema.get(resource).reverseName}
                </MenuItem>
              )}
            </ResourceSelectComponent>
          </ListItem>
          <ListItem disableGutters>
            <AutoSearchComponent
              label="Target Record"
              value={to ? model.in : model.out}
              onChange={this.handleChange}
              name={to ? 'in' : 'out'}
              required
            />
          </ListItem>
          <FormTemplater
            model={model}
            propSchemas={editableProps}
            schema={schema}
            onChange={this.handleChange}
            excludedProps={['in', 'out']}
            disablePadding
          />
          <div className="relationship-submit-wrapper">
            <Button
              color="primary"
              variant="contained"
              onClick={this.handleAdd}
              id="relationships-form-submit"
              disabled={formIsInvalid || !(model['in.@rid'] && model['out.@rid'])}
            >
              Add Relationship
            </Button>
          </div>
        </fieldset>
        <Typography variant="h5">Relationships</Typography>
        <div className={`relationships-form-table-wrapper ${minimized ? 'relationships-table-minimized' : ''}`}>
          <Table className="relationships-form-table">
            <TableHead
              className="relationships-table-header"
            >
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
                <TableCell padding="checkbox">
                  <Button
                    className={`relationships-minimize-btn ${minimized ? '' : 'minimize-open'}`}
                    onClick={() => this.setState({ minimized: !minimized })}
                  >
                    <KeyboardArrowDownIcon />
                  </Button>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {relationships.length > 0
                ? relationships.map((r) => {
                  const buttonFn = r.deleted
                    ? e => this.handleUndo(e, r['@rid'])
                    : e => this.handleDelete(e, r['@rid']);
                  const ButtonIcon = r.deleted
                    ? <RefreshIcon color="primary" />
                    : <CloseIcon color="error" />;

                  const shouldExpand = Object.keys(r)
                    .filter(k => k !== 'deleted').length > DEFAULT_RELATIONSHIPS_PROPSLENGTH;
                  const isIn = r['in.@rid'] === nodeRid;
                  return (
                    <React.Fragment key={r['@rid']}>
                      <TableRow
                        className={r.deleted ? 'deleted' : ''}
                        onClick={shouldExpand
                          ? () => this.handleExpand(r['@rid'])
                          : null}
                      >
                        <TableCell padding="checkbox">
                          <IconButton
                            onClick={buttonFn}
                            style={{ position: 'unset' }}
                            disableRipple
                          >
                            {ButtonIcon}
                          </IconButton>
                        </TableCell>
                        <TableCell padding="dense">
                          {r['@class']}
                        </TableCell>
                        <TableCell padding="dense">
                          {isIn
                            ? (r.out || r['out.sourceId'])
                            : r.in || r['in.sourceId']}
                        </TableCell>
                        <TableCell padding="dense">
                          {r.source}
                        </TableCell>
                        <TableCell className={`relationship-expand-btn ${expanded === r['@rid'] ? '' : 'expand-btn-collapsed'}`}>
                          {shouldExpand && <KeyboardArrowDownIcon />}
                        </TableCell>
                      </TableRow>
                      <TableRow
                        style={{
                          display: expanded === r['@rid'] ? undefined : 'none',
                          height: 0,
                          background: '#fff',
                        }}
                      >
                        <TableCell colSpan={5}>
                          <Collapse
                            in={expanded === r['@rid']}
                          >
                            {getRelationshipDetails(r, isIn)}
                          </Collapse>
                        </TableCell>
                      </TableRow>
                    </React.Fragment>
                  );
                }) : (
                  <TableRow>
                    <TableCell colSpan={5} className="relationships-empty-placeholder">
                      <Typography variant="overline">No Relationships</Typography>
                    </TableCell>
                  </TableRow>
                )}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  }
}

/**
 * @namespace
 * @property {function} onChange - function to handle changes to the
 * relationships list.
 * @property {Object} schema - Knowledgebase db schema.
 * @property {Array} relationships - list of current relationships to be edited.
 * @property {string} name - property key name of relationships on parent
 * component.
 * @property {string} nodeRid - record ID of input node.
 */
RelationshipsForm.propTypes = {
  onChange: PropTypes.func.isRequired,
  schema: PropTypes.object.isRequired,
  relationships: PropTypes.array,
  name: PropTypes.string,
  nodeRid: PropTypes.string,
};

RelationshipsForm.defaultProps = {
  relationships: [],
  label: '',
  name: '',
  nodeRid: '#node_rid',
};

export default RelationshipsForm;
