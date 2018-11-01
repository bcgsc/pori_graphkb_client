/* eslint-disable */
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
import AddIcon from '@material-ui/icons/Add';
import CloseIcon from '@material-ui/icons/Close';
import RefreshIcon from '@material-ui/icons/Refresh';
import TrendingFlatIcon from '@material-ui/icons/TrendingFlat';
import KeyboardArrowDownIcon from '@material-ui/icons/KeyboardArrowDown';
import FormTemplater from '../FormTemplater/FormTemplater';
import ResourceSelectComponent from '../ResourceSelectComponent/ResourceSelectComponent';
import AutoSearchComponent from '../AutoSearchComponent/AutoSearchComponent';
import util from '../../services/util';

const DEFAULT_RELATIONSHIPS_PROPSLENGTH = 13;

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
    };
    this.testId = 0;
    this.handleAdd = this.handleAdd.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.handleClassChange = this.handleClassChange.bind(this);
    this.handleDirection = this.handleDirection.bind(this);
    this.handleExpand = this.handleExpand.bind(this);
  }

  componentDidMount() {
    const { schema, nodeRid } = this.props;
    const edges = schema.getEdges();
    const model = schema.initModel({}, edges[0]);
    model['in.@rid'] = nodeRid;
    model['@rid'] = this.applyTestId();
    console.log(model);
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

    if (!formIsInvalid && (model.out || model.in)) {
      if (model && !relationships.find(r => r['@rid'] === model['@rid'])) {
        relationships.push(model);
        onChange && onChange({ target: { name, value: relationships } });
        const newModel = schema.initModel({}, edges[0]);
        model[`${to ? 'out' : 'in'}.@rid`] = nodeRid;
        newModel['@rid'] = this.applyTestId();
        this.setState({ model: newModel });
      }
    }
  }

  /**
   * Deletes subset from state relationship list.
   * @param {string} rid - relationship id to be deleted.
   */
  handleDelete(rid) {
    const {
      originalRelationships,
    } = this.state;
    const { relationships } = this.props;
    const targetRelationship = relationships.find(r => r['@rid'] === rid);
    if (targetRelationship) {
      if (originalRelationships && originalRelationships.find(r => r['@rid'] === rid)) {
        targetRelationship.deleted = true;
      } else {
        relationships.splice(relationships.indexOf(targetRelationship), 1);
        onChange({ target: { name, value: relationships } });
      }
    }
    this.setState({ relationships });
  }

  /**
   * Reverts a subset that is staged for deletion.
   * @param {string} rid - deleted subset to be reverted.
   */
  handleUndo(rid) {
    const { relationships } = this.props;
    relationships.find(r => r['@rid'] === rid).deleted = false;
    this.setState({ relationships });
  }

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

  handleClassChange(e) {
    const { model } = this.state;
    const { schema } = this.props;
    const { value } = e.target;

    const newModel = schema.initModel(model, value);
    this.setState({ model: newModel });
  }

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

  handleExpand(rid) {
    const { expanded } = this.state;
    this.setState({ expanded: expanded === rid ? null : rid });
  }

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
    } = this.state;
    const {
      schema,
      relationships,
    } = this.props;

    if (!model) return null;
    const editableProps = (schema.getClass(model['@class'])).properties;

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
              {(resource) => (
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
          <Button
            color="secondary"
            variant="fab"
            onClick={this.handleAdd}
            id="relationships-form-submit"
          >
            <AddIcon />
          </Button>
        </fieldset>
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
              <TableCell padding="checkbox" />
            </TableRow>
          </TableHead>
          <TableBody>
            {relationships.map((r, i) => {
              const buttonFn = r.deleted
                ? () => this.handleUndo(r['@rid'])
                : () => this.handleDelete(r['@rid']);

              const ButtonIcon = r.deleted
                ? RefreshIcon
                : CloseIcon;
              const iconProps = r.deleted
                ? { color: 'primary' }
                : { color: 'error' };
              return (
                <React.Fragment key={r['@rid']}>
                  <TableRow>
                    <TableCell padding="checkbox">
                      <IconButton
                        onClick={buttonFn}
                        style={{ position: 'unset' }}
                        disableRipple
                      >
                        <ButtonIcon {...iconProps} />
                      </IconButton>
                    </TableCell>
                    <TableCell padding="dense">
                      {r['@class']}
                    </TableCell>
                    <TableCell padding="dense">
                      {r.out || r['out.sourceId'] || r.in || r['in.sourceId']}
                    </TableCell>
                    <TableCell padding="dense">
                      {r.source}
                    </TableCell>
                    <TableCell>
                      {Object.keys(r).length > DEFAULT_RELATIONSHIPS_PROPSLENGTH
                        && (
                          <KeyboardArrowDownIcon
                            onClick={() => this.handleExpand(r['@rid'])}
                          />)}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell colSpan={5}>
                      <Collapse in={expanded === r['@rid']}>
                        <div className="relationships-expansion">
                          {Object.keys(r).filter(k => (
                            !k.includes('.')
                            && !r[k].startsWith('#TEST')
                          )).map(k => (
                            <ListItem key={k}>
                              <ListItemText primary={r[k]} secondary={util.antiCamelCase(k)} />
                            </ListItem>
                          ))}
                        </div>
                      </Collapse>
                    </TableCell>
                  </TableRow>
                </React.Fragment>
              );
            })}
          </TableBody>
        </Table>
      </div>
    );
  }
}

RelationshipsForm.propTypes = {
  onChange: PropTypes.func,
  list: PropTypes.array,
  label: PropTypes.string,
  name: PropTypes.string,
  nodeRid: PropTypes.string,
};

RelationshipsForm.defaultProps = {
  onChange: () => { },
  list: [],
  label: '',
  name: '',
  nodeRid: '#node_rid',
};

export default RelationshipsForm;
