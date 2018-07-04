import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import './AdvancedQueryView.css';
import {
  TextField,
  Button,
  Typography,
  IconButton,
} from '@material-ui/core/';
import ViewListIcon from '@material-ui/icons/ViewList';
import TimelineIcon from '@material-ui/icons/Timeline';
import queryString from 'query-string';
import ResourceSelectComponent from '../../components/ResourceSelectComponent/ResourceSelectComponent';
import api from '../../services/api';

class AdvancedQueryView extends Component {
  static antiCamelCase(value) {
    const returnValue = value.charAt(0).toUpperCase() + value.slice(1);
    return returnValue.replace(/[A-Z]/g, match => ` ${match}`);
  }

  constructor(props) {
    super(props);

    this.state = {
      mainParams: {
        name: props.location.state.name || '',
        source: '',
        sourceId: '',
        longName: '',
        sourceIdVersion: '',
        limit: 1000,
        ancestors: '',
        descendants: '',
        fuzzyMatch: 0,
        neighbors: 0,
      },
      // returnProperties: {
      //   name: true,
      //   description: true,
      //   subsets: true,
      //   history: true,
      //   createdBy: true,
      //   createdAt: true,
      //   deletedBy: true,
      //   deletedAt: true,
      //   source: true,
      //   sourceId: true,
      //   sourceIdVersion: true,
      //   uuid: true,
      //   longName: true
      // },

      // relatedTerms: {
      //   parents: false,
      //   children: false,
      //   aliases: false
      // },
      sources: [],
    };

    // this.handleNeighbors = this.handleNeighbors.bind(this);
    // this.handleReturnProperties = this.handleReturnProperties.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.bundle = this.bundle.bind(this);
  }

  async componentDidMount() {
    const sources = await api.getSources();
    this.setState({ sources });
  }

  handleChange(e) {
    const { mainParams } = this.state;
    mainParams[e.target.name] = e.target.value;
    this.setState({ mainParams });
  }

  // handleReturnProperties(e, key) {
  //   let returnProperties = { ...this.state.returnProperties };
  //   returnProperties[key] = e;
  //   this.setState({ returnProperties: returnProperties });
  // }

  // handleRelatedTerms(e, key) {
  //   let relatedTerms = { ...this.state.relatedTerms };
  //   relatedTerms[key] = e;
  //   this.setState({ relatedTerms });
  // }

  bundle() {
    const { mainParams } = this.state;
    const params = {};
    // let returnProperties = '';
    // let returnDefault = true;
    // Object.keys(this.state.returnProperties).forEach(key => {
    //   this.state.returnProperties[key]
    //     ? (returnProperties += key + ',')
    //     : (returnDefault = false);
    // });

    // if (!returnDefault) {
    //   params.returnProperties = returnProperties.slice(
    //     0,
    //     returnProperties.length - 1
    //   );
    // }
    // if (this.state.relatedTerms.children) params.ancestors = 'subclassof';
    // if (this.state.relatedTerms.parents) params.descendants = 'subclassof';
    // if (this.state.relatedTerms.aliases) {
    //   if (!params.ancestors) params.ancestors = '';
    //   if (!params.descendants) params.descendants = '';

    //   params.ancestors += 'aliasof';
    //   params.descendants += 'aliasof';
    // }

    Object.keys(mainParams).forEach((key) => {
      if (mainParams[key]) {
        params[key] = mainParams[key];
      }
      if (key === 'neighbors') {
        params[key] = Math.max(3, mainParams[key]);
      }
    });

    return queryString.stringify(params);
  }

  render() {
    // let returnProperties = Object.keys(this.state.returnProperties).map(key => {
    //   return (
    //     <div key={key} className='checkbox'>
    //       <FormControlLabel
    //         control={
    //           <Checkbox
    //             id={key + 'check'}
    //             name={key + 'check'}
    //             onChange={(e, checked) => {
    //               this.handleReturnProperties(checked, key);
    //             }}
    //             defaultChecked={true}
    //           />
    //         }
    //         label={this.antiCamelCase(key)}
    //       />
    //     </div>
    //   );
    // });

    const { mainParams, sources } = this.state;

    return (
      <div className="adv-wrapper">
        <Typography color="textSecondary" variant="headline" id="adv-title">
          Advanced Query
        </Typography>
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
        {/* <div className="parameter-selection">
          <div className="checkboxes">{returnProperties}</div>
        </div> */}
        {/* <div className="parameter-selection">
          <Typography variant="subheading" className="parameter-name">
            Related Terms:
          </Typography>
          <div className="related-checkboxes">
            <div className="checkbox">
              <FormControlLabel
                control={
                  <Checkbox
                    name="parents"
                    id="parents"
                    onChange={(e, checked) =>
                      this.handleRelatedTerms(checked, 'parents')
                    }
                  />
                }
                label="Parents"
              />
            </div>
            <div className="checkbox">
              <FormControlLabel
                control={
                  <Checkbox
                    name="children"
                    id="children"
                    onChange={(e, checked) =>
                      this.handleRelatedTerms(checked, 'children')
                    }
                  />
                }
                label="Children"
              />
            </div>
            <div className="checkbox">
              <FormControlLabel
                control={
                  <Checkbox
                    name="aliases"
                    id="aliases"
                    onChange={(e, checked) =>
                      this.handleRelatedTerms(checked, 'aliases')
                    }
                  />
                }
                label="Aliases"
              />
            </div>
          </div>
        </div> */}
        <div className="parameter-selection">
          <TextField
            id="fuzzy-match-adv"
            label="Fuzzy Match"
            value={mainParams.fuzzyMatch}
            onChange={this.handleChange}
            className="text-input"
            name="fuzzyMatch"
            type="number"
          />
        </div>
        <div className="parameter-selection">
          <TextField
            id="neighbors-adv"
            label="Neighbors"
            value={mainParams.neighbors}
            onChange={this.handleChange}
            className="text-input"
            name="neighbors"
            type="number"
          />
        </div>
        <div id="adv-nav-buttons">
          <Link to={{ state: this.state, pathname: '/query' }}>
            {/* <Button id="text-button" variant="outlined"> */}
            <Button variant="outlined">
              Back
            </Button>
          </Link>
          <Link to={{ search: this.bundle(), pathname: '/data/table' }}>
            {/* <IconButton variant="raised" color="primary">
              <ViewListIcon />
            </IconButton> */}
            <Button variant="raised" color="primary">
              Search
            </Button>
          </Link>
          {/* <Link to={{ search: this.bundle(), pathname: '/data/graph' }}>
            <IconButton variant="raised" color="secondary">
              <TimelineIcon />
            </IconButton>
          </Link> */}
        </div>
      </div>
    );
  }
}

AdvancedQueryView.defaultProps = {
  location: '',
};

AdvancedQueryView.propTypes = {
  location: PropTypes.object,
};

export default AdvancedQueryView;
