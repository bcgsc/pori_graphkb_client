import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Link, Redirect } from 'react-router-dom';
import './AdvancedQueryView.css';
import {
  TextField,
  Button,
  Typography,
  MenuItem,
} from '@material-ui/core/';
import queryString from 'query-string';
import ResourceSelectComponent from '../../components/ResourceSelectComponent/ResourceSelectComponent';
import api from '../../services/api';

/**
 * Advanced query page, allows user to specify more parameters in their queries.
 */
class AdvancedQueryView extends Component {
  constructor(props) {
    super(props);

    this.state = {
      mainParams: {
        name: props.location.state.name,
        source: '',
        sourceId: '',
        longName: '',
        sourceIdVersion: '',
        limit: 1000,
        ancestors: '',
        descendants: '',
        fuzzyMatch: 0,
        class: '',
      },
      sources: [],
      ontologies: [],
      loginRedirect: false,
      error: null,
    };

    this.handleChange = this.handleChange.bind(this);
    this.bundle = this.bundle.bind(this);
  }

  /**
   * Initializes valid sources.
   */
  async componentDidMount() {
    const sources = await api.getSources()
      .catch((error) => {
        if (error.status === 401) {
          this.setState({ loginRedirect: true });
        } else {
          this.setState({ error });
        }
      });
    const ontologies = await api.getOntologyVertices()
      .catch((error) => {
        if (error.status === 401) {
          this.setState({ loginRedirect: true });
        } else {
          this.setState({ error });
        }
      });
    this.setState({ sources, ontologies });
  }

  /**
   * Updates main parameters after user input.
   * @param {Event} e - User input event.
   */
  handleChange(e) {
    const { mainParams } = this.state;
    mainParams[e.target.name] = e.target.value;
    this.setState({ mainParams });
  }

  /**
   * Formats query string to be passed into url.
   */
  bundle() {
    const { mainParams } = this.state;
    const params = {};

    Object.keys(mainParams).forEach((key) => {
      if (mainParams[key]) {
        params[key] = mainParams[key];
      }
    });

    return queryString.stringify(params);
  }

  render() {
    const {
      mainParams,
      sources,
      ontologies,
      error,
      loginRedirect,
    } = this.state;

    if (loginRedirect) return <Redirect push to="/login" />;
    if (error) return <Redirect push to={{ pathname: '/error', state: error }} />;

    return (
      <div className="adv-wrapper">
        <Typography color="textSecondary" variant="headline" id="adv-title">
          Advanced Query
        </Typography>
        <div className="endpoint-selection">
          <ResourceSelectComponent
            value={mainParams.class}
            onChange={this.handleChange}
            name="class"
            label="Class"
            id="class-adv"
            resources={ontologies}
          >
            {resource => (
              <MenuItem key={resource.name} value={resource.name}>
                {resource.name}
              </MenuItem>
            )}
          </ResourceSelectComponent>
        </div>
        <div className="parameter-selection">
          <TextField
            id="name-adv"
            placeholder="eg. angiosarcoma"
            label="Name"
            value={mainParams.name}
            onChange={this.handleChange}
            name="name"
            className="text-input"
          />
        </div>
        <div className="parameter-selection">
          <ResourceSelectComponent
            value={mainParams.source}
            onChange={this.handleChange}
            name="source"
            label="Source"
            id="source-adv"
            resources={sources}
          />
        </div>
        <div className="parameter-selection">
          <TextField
            id="source-id-adv"
            placeholder="eg. DOID:4"
            label="Source ID"
            value={mainParams.sourceId}
            onChange={this.handleChange}
            name="sourceId"
            className="text-input"
          />
        </div>
        <div className="parameter-selection">
          <TextField
            id="long-name-adv"
            label="Long Name"
            value={mainParams.longName}
            onChange={this.handleChange}
            className="text-input"
            name="longName"
          />
        </div>
        <div className="parameter-selection">
          <TextField
            id="source-id-version-adv"
            label="Source ID Version"
            value={mainParams.sourceIdVersion}
            onChange={this.handleChange}
            className="text-input"
            name="sourceIdVersion"
          />
        </div>
        <div className="parameter-selection">
          <TextField
            id="limit-adv"
            placeholder="Default = 1000"
            label="Limit"
            value={mainParams.limit}
            onChange={this.handleChange}
            className="text-input"
            type="number"
            name="limit"
          />
        </div>
        <div id="adv-nav-buttons">
          <Link to={{ state: this.state, pathname: '/query' }}>
            <Button variant="outlined" color="secondary">
              Back
            </Button>
          </Link>
          <Link to={{ search: this.bundle(), pathname: '/data/table' }}>
            <Button color="primary" variant="raised" id="search-button">
              Search
            </Button>
          </Link>
        </div>
      </div>
    );
  }
}

AdvancedQueryView.defaultProps = {
  location: { state: { name: '' } },
};

/**
 * @param {Object} location - location property for the route and passed state.
 */
AdvancedQueryView.propTypes = {
  location: PropTypes.object,
};

export default AdvancedQueryView;
