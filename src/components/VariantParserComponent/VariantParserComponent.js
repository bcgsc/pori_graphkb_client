
/**
 * @module /components/VariantParserComponent
 */

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import './VariantParserComponent.css';
import {
  TextField,
  Button,
  FormControl,
  FormHelperText,
  Paper,
  Drawer,
  LinearProgress,
  CircularProgress,
} from '@material-ui/core';
import CheckIcon from '@material-ui/icons/Check';
import * as jc from 'json-cycle';
import kbp from 'knowledgebase-parser';
import FormTemplater from '../FormTemplater/FormTemplater';
import api from '../../services/api';
import util from '../../services/util';

const NOTIFICATION_SPINNER_SIZE = 16;
const DEFAULT_ORDER = [
  'type',
  'reference1',
  'reference2',
  'break1Start',
  'break1End',
  'break2Start',
  'break2End',
];

class VariantParserComponent extends Component {
  constructor(props) {
    super(props);
    this.state = {
      shorthand: '',
      invalidFlag: '',
      variant: null,
      positionalVariantSchema: [],
      errorFields: [],
    };
    this.parseString = this.parseString.bind(this);
    this.handleVariantChange = this.handleVariantChange.bind(this);
    this.handleClassChange = this.handleClassChange.bind(this);
    this.submitVariant = this.submitVariant.bind(this);
    this.updateErrorFields = this.updateErrorFields.bind(this);
    this.extractLinkProps = this.extractLinkProps.bind(this);
    this.updateShorthand = this.updateShorthand.bind(this);
  }

  async componentDidMount() {
    const schema = await api.getSchema();
    const positionalVariantSchema = (util.getClass('PositionalVariant', schema)).properties;
    const variant = util.initModel({}, positionalVariantSchema);
    console.log(util.initModel({}, positionalVariantSchema));
    this.setState({
      positionalVariantSchema,
      variant,
      schema,
    });
  }

  /**
   * Parses shorthand string and updates form fields with response.
   * @param {Event} e - user input event.
   */
  async parseString(e) {
    const { variant, positionalVariantSchema, schema } = this.state;
    const { value } = e.target;
    this.setState({ shorthand: value });
    if (!value) {
      this.setState({ variant: util.initModel({}, positionalVariantSchema) });
    } else {
      try {
        const response = kbp.variant.parse(value.trim());
        // Split response into link data and non-link data
        const linkProps = await this.extractLinkProps(response);
        const embeddedProps = util.getPropOfType(positionalVariantSchema, 'embedded');

        embeddedProps.forEach((prop) => {
          const { name } = prop;
          if (response[name] && response[name].name) {
            (util.getClass(response[name].name, schema)).properties
              .forEach((classProp) => {
                variant[name][classProp.name] = response[name][classProp.name] === undefined
                  || response[name][classProp.name] === null
                  ? '' : response[name][classProp.name];
              });
            response[name]['@class'] = response[name].name;
          } else {
            response[name] = { '@class': '' };
          }
        });

        console.log(Object.assign(util.initModel({}, positionalVariantSchema),
          { ...response, ...linkProps }));
        this.setState({
          variant: Object.assign(util.initModel({}, positionalVariantSchema),
            { ...response, ...linkProps }),
          invalidFlag: '',
          errorFields: [],
        });
      } catch (error) {
        if (error.content && error.content.parsed) {
          Object.keys(error.content.parsed).forEach((key) => {
            if (variant[key] !== undefined && variant[key] !== null) {
              variant[key] = error.content.parsed[key];
            }
          });
          this.setState({
            variant: Object.assign(variant, await this.extractLinkProps(error.content.parsed)),
          });
        }

        this.updateErrorFields(error);
        this.setState({
          invalidFlag: error.message,
        });
      }
    }
  }

  /**
   * Validates link properties by checking the database for exact matches.
   * Returns a sub-object of PositionalVariant containing the fields in need of
   * update, with their validated properties.
   * @param {Object} parsed - Parsed variant from kbp.
   */
  async extractLinkProps(parsed) {
    const { positionalVariantSchema } = this.state;
    const linkProps = util.getPropOfType(positionalVariantSchema, 'link');
    const newValues = {};
    await Promise.all(linkProps.map(async (prop) => {
      const { name, linkedClass } = prop;
      if (parsed[name] && linkedClass && linkedClass.route) {
        const data = await api.get(`${linkedClass.route}?name=${parsed[name]}`);
        const cycled = jc.retrocycle(data).result;
        if (cycled.length === 1) {
          newValues[name] = cycled[0].name;
          newValues[`${name}.@rid`] = cycled[0]['@rid'];
        } else if (cycled.length > 1) {
          // add multiple modals?
        } else if (cycled.length === 0) {
          this.setState({
            invalidFlag: `Referenced ${name} term '${parsed[name]}' not found`,
          });
        }
      }
    }));

    return newValues;
  }

  /**
   * Handles changes in an embedded property's class.
   * @param {Event} e - new class selection event.
   * @param {string} nested - nested property key.
   */
  handleClassChange(e, nested) {
    const { schema, variant, positionalVariantSchema } = this.state;
    const { value } = e.target;
    const newClass = util.getClass(value, schema).properties;
    if (newClass) {
      const abstractClass = positionalVariantSchema
        .find(p => p.name === nested).linkedClass.name;
      const varKeys = positionalVariantSchema
        .filter(p => p.linkedClass && p.linkedClass.name === abstractClass)
        .map(p => p.name);
      varKeys.forEach((key) => {
        if ((variant[key]['@class'] && variant[key]['@class'] !== value) || key === nested) {
          variant[key] = util.initModel({ '@class': value }, newClass);
        }
      });
    } else {
      variant[nested] = { '@class': '' };
    }

    this.setState({ variant, errorFields: [] }, this.updateShorthand);
  }

  /**
   * Fired whenever the variant form fields (excluding the shorthand input) are
   * modified.
   * @param {Event} e - user input event
   * @param {string} nested - nested property key
   */
  handleVariantChange(e, nested) {
    const { variant } = this.state;
    const { name, value } = e.target;
    if (nested) {
      variant[nested][name] = value;
    } else {
      variant[name] = value;
    }

    Object.keys(e.target)
      .filter(k => k !== 'name' && k !== 'value' && !k.startsWith('_'))
      .forEach((key) => {
        if (nested) {
          variant[nested][`${name}.${key}`] = e.target[key];
        }
        variant[`${name}.${key}`] = e.target[key];
      });
    this.setState({ variant, errorFields: [] }, this.updateShorthand);
  }

  /**
   * Pipes changes of the variant form fields to the shorthand string form.
   */
  updateShorthand() {
    const { variant } = this.state;
    let { shorthand } = this.state;
    try {
      const filteredVariant = {};
      Object.keys(variant).forEach((k) => {
        if (typeof variant[k] === 'object') {
          if (variant[k]['@class']) {
            filteredVariant[k] = variant[k];
            filteredVariant.prefix = kbp.position.CLASS_PREFIX[variant[k]['@class']];
          }
        } else if (k !== 'prefix' && variant[k]) {
          filteredVariant[k] = variant[k];
        }
      });
      shorthand = new kbp.variant.VariantNotation(filteredVariant);
      shorthand = kbp.variant.parse(shorthand.toString());
      this.setState({ invalidFlag: '' });
    } catch (error) {
      this.updateErrorFields(error);
      this.setState({ invalidFlag: error.message });
    } finally {
      this.setState({ shorthand: shorthand.toString() });
    }
  }

  /**
   * Assigns blame to violatedAttr input fields in the form.
   * @param {kbp.error.ErrorMixin} error - Error object from kbp.
   */
  updateErrorFields(error) {
    const { variant } = this.state;
    const errorFields = [];
    if (error && error.content) {
      const { violatedAttr } = error.content;
      if (violatedAttr) {
        if (violatedAttr === 'break1' || violatedAttr === 'break2') {
          if (variant[`${violatedAttr}Start`]) {
            errorFields.push(`${violatedAttr}Start`);
          }
          if (variant[`${violatedAttr}End`]) {
            errorFields.push(`${violatedAttr}End`);
          }
        } else if (variant[violatedAttr] !== undefined) {
          errorFields.push(violatedAttr);
        }
      }
    }
    this.setState({ errorFields });
  }

  /**
   * Submits a POST request to the server with current variant data.
   */
  async submitVariant(e) {
    e.preventDefault();
    const { variant, positionalVariantSchema, schema } = this.state;
    const copy = Object.assign({}, variant);
    Object.keys(copy).forEach((k) => {
      if (typeof copy[k] === 'object') { // more flexible
        if (!copy[k]['@class']) {
          delete copy[k];
        } else {
          const nestedProps = (util.getClass(copy[k]['@class'], schema)).properties;
          nestedProps.forEach((prop) => {
            if (!copy[k][prop.name]) {
              if (prop.type === 'integer' && prop.mandatory) {
                copy[k][prop.name] = Number(copy[k][prop.name]);
              } else {
                delete copy[k][prop.name];
              }
            }
          });
        }
      }
    });
    const payload = util.parsePayload(copy, positionalVariantSchema);
    this.setState({ loading: true, notificationDrawerOpen: true });
    await api.post('/positionalvariants', payload);
    this.setState({ loading: false });
  }

  render() {
    const {
      shorthand,
      invalidFlag,
      variant,
      positionalVariantSchema,
      schema,
      errorFields,
      notificationDrawerOpen,
      loading,
    } = this.state;
    const {
      required,
      error,
      disabled,
      handleFinish,
    } = this.props;

    let formIsInvalid = false;
    positionalVariantSchema.forEach((prop) => {
      if (prop.mandatory) {
        if (prop.type === 'link' && (!variant[prop.name] || !variant[`${prop.name}.@rid`])) {
          formIsInvalid = true;
        } else if (prop.type !== 'boolean' && !variant[prop.name]) {
          formIsInvalid = true;
        }
      }
    });

    const sortFields = (a, b) => {
      if (DEFAULT_ORDER.indexOf(b.name) === -1) {
        return -1;
      }
      if (DEFAULT_ORDER.indexOf(a.name) === -1) {
        return 1;
      }
      return DEFAULT_ORDER.indexOf(a.name) < DEFAULT_ORDER.indexOf(b.name)
        ? -1
        : 1;
    };

    const drawer = (
      <Drawer
        open={notificationDrawerOpen}
        onClose={handleFinish}
        anchor="bottom"
        classes={{ paper: 'paper' }}
      >
        <div className="notification-drawer">
          <div className="form-linear-progress">
            <LinearProgress
              color="secondary"
              variant={loading ? 'indeterminate' : 'determinate'}
              value={loading ? 0 : 100}
            />
          </div>
          <Button
            color="secondary"
            onClick={handleFinish}
            disabled={loading}
            variant="raised"
            size="large"
          >
            {loading
              ? <CircularProgress size={NOTIFICATION_SPINNER_SIZE} color="secondary" />
              : <CheckIcon />
            }
          </Button>
        </div>
      </Drawer>
    );

    const shorthandError = !!(error || invalidFlag);

    return (
      <div className="variant-parser-wrapper">
        {drawer}
        <Paper elevation={4} className="variant-parser-shorthand paper">
          <FormControl
            error={shorthandError}
            fullWidth
          >
            <TextField
              error={shorthandError}
              required={required}
              name="shorthand"
              onChange={this.parseString}
              label="HGVS nomenclature"
              disabled={disabled}
              value={shorthand}
            />
            {shorthandError
              && <FormHelperText>{invalidFlag}</FormHelperText>
            }
          </FormControl>
        </Paper>
        <Paper elevation={4} className="paper parser-form-grid">
          {schema
            && (
              <FormTemplater
                schema={schema}
                onChange={this.handleVariantChange}
                onClassChange={this.handleClassChange}
                model={variant}
                kbClass={positionalVariantSchema}
                excludedProps={['break1Repr', 'break2Repr']}
                errorFields={errorFields}
                sort={sortFields}
                pairs={{
                  break1: ['break1Start', 'break1End'],
                  break2: ['break2Start', 'break2End'],
                }}
              />
            )
          }
        </Paper>
        <Paper className="paper" elevation={4} id="variant-form-submit">
          <Button
            onClick={this.submitVariant}
            color="primary"
            variant="raised"
            disabled={!!(formIsInvalid || invalidFlag)}
          >
            Submit
          </Button>
        </Paper>
      </div>
    );
  }
}

VariantParserComponent.propTypes = {
  /**
   * @param {bool} required - required flag for text input indicator.
   */
  required: PropTypes.bool,
  /**
   * @param {bool} error - error flag for text input.
   */
  error: PropTypes.bool,
  /**
   * @param {bool} disabled - disabled flag for text input.
   */
  disabled: PropTypes.bool,
  /**
   * @param {function} handleFinish - function for handling form finishing.
   */
  handleFinish: PropTypes.func.isRequired,
};

VariantParserComponent.defaultProps = {
  required: false,
  error: false,
  disabled: false,
};

export default VariantParserComponent;
