import React, { Component } from "react";
import "./AdvancedQueryComponent.css";
import TextField from "@material-ui/core/TextField";
import Button from "@material-ui/core/Button";
import Checkbox from "@material-ui/core/Checkbox";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import { Link } from "react-router-dom";
import queryString from "query-string";
import AutoSearchComponent from "../AutoSearchComponent/AutoSearchComponent";

class AdvancedQueryComponent extends Component {
  constructor(props) {
    super(props);

    this.state = {
      mainParams: {
        name: props.location.state.name || "",
        source: "",
        sourceId: "",
        longName: "",
        sourceIdVersion: "",
        limit: 1000,
        ancestors: "",
        descendants: "",
        fuzzyMatch: undefined,
        neighbors: 0
      },
      sourceName: "",
      returnProperties: {
        name: true,
        description: true,
        subsets: true,
        history: true,
        createdBy: true,
        createdAt: true,
        deletedBy: true,
        deletedAt: true,
        source: true,
        sourceId: true,
        sourceIdVersion: true,
        uuid: true,
        longName: true
      },

      relatedTerms: {
        parents: false,
        children: false,
        aliases: false
      }
    };

    this.handleNeighbors = this.handleNeighbors.bind(this);
    this.handleReturnProperties = this.handleReturnProperties.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.handleSourceChange = this.handleSourceChange.bind(this);
    this.bundle = this.bundle.bind(this);
  }

  handleChange(e) {
    let mainParams = this.state.mainParams;
    mainParams[e.target.name] = e.target.value;
    this.setState({ mainParams });
  }

  handleSourceChange(e) {
    let mainParams = this.state.mainParams;
    mainParams.source = e.target.rid ? e.target.rid.slice(1) : e.target.rid;
    this.setState({
      sourceName: e.target.value,
      mainParams
    });
  }

  handleNeighbors(e) {
    this.setState({ neighbors: e.target.value });
  }

  handleReturnProperties(e, key) {
    let returnProperties = { ...this.state.returnProperties };
    returnProperties[key] = e;
    this.setState({ returnProperties: returnProperties });
  }

  handleRelatedTerms(e, key) {
    let relatedTerms = { ...this.state.relatedTerms };
    relatedTerms[key] = e;
    this.setState({ relatedTerms });
  }

  bundle() {
    let params = {};
    let returnProperties = "";
    let returnDefault = true;
    Object.keys(this.state.returnProperties).forEach(key => {
      this.state.returnProperties[key]
        ? (returnProperties += key + ",")
        : (returnDefault = false);
    });

    if (!returnDefault) {
      params.returnProperties = returnProperties.slice(
        0,
        returnProperties.length - 1
      );
    }
    if (this.state.relatedTerms.children) params.ancestors = "subclassof";
    if (this.state.relatedTerms.parents) params.descendants = "subclassof";
    if (this.state.relatedTerms.aliases) {
      if (!params.ancestors) params.ancestors = "";
      if (!params.descendants) params.descendants = "";

      params.ancestors += "aliasof";
      params.descendants += "aliasof";
    }

    Object.keys(this.state.mainParams).forEach(key => {
      if (this.state.mainParams[key]) {
        params[key] = this.state.mainParams[key];
      }
    });

    return queryString.stringify(params);
  }

  antiCamelCase(value) {
    value = value.charAt(0).toUpperCase() + value.slice(1);
    return value.replace(/[A-Z]/g, match => {
      return " " + match;
    });
  }

  render() {
    let returnProperties = Object.keys(this.state.returnProperties).map(key => {
      return (
        <div key={key} className="checkbox">
          <FormControlLabel
            control={
              <Checkbox
                id={key + "check"}
                name={key + "check"}
                onChange={(e, checked) => {
                  this.handleReturnProperties(checked, key);
                }}
                defaultChecked={true}
              />
            }
            label={this.antiCamelCase(key)}
          />
        </div>
      );
    });

    return (
      <div className="adv-wrapper">
        <div className="parameter-selection">
          <h3 className="mat-h3">Name:</h3>
          <TextField
            id="name-adv"
            placeholder="eg. angiosarcoma"
            label="Name"
            value={this.state.mainParams.name}
            onChange={this.handleChange}
            name="name"
            className="text-input"
          />
        </div>
        <div className="parameter-selection">
          <h3 className="mat-h3">Source:</h3>
          <AutoSearchComponent
            value={this.state.sourceName}
            onChange={this.handleSourceChange}
            endpoint="sources"
            id="source-adv"
            placeholder="eg. NCIT, Disease Ontology"
            label="Source"
          />
        </div>
        <div className="parameter-selection">
          <h3 className="mat-h3">Source ID:</h3>
          <TextField
            id="source-id-adv"
            placeholder="eg. DOID:4"
            label="Source ID"
            value={this.state.mainParams.sourceId}
            onChange={this.handleChange}
            name="sourceId"
            className="text-input"
          />
        </div>
        <div className="parameter-selection">
          <h3 className="mat-h3">Long Name:</h3>
          <TextField
            id="long-name-adv"
            label="Long Name"
            value={this.state.mainParams.longName}
            onChange={this.handleChange}
            className="text-input"
            name="longName"
          />
        </div>
        <div className="parameter-selection">
          <h3 className="mat-h3">Source ID Version:</h3>
          <TextField
            id="source-id-version-adv"
            label="Source ID Version"
            value={this.state.mainParams.sourceIdVersion}
            onChange={this.handleChange}
            className="text-input"
            name="sourceIdVersion"
          />
        </div>
        <div className="parameter-selection">
          <h3 className="mat-h3">Limit:</h3>
          <TextField
            id="limit-adv"
            placeholder="Default = 1000"
            label="Limit"
            value={this.state.mainParams.limit}
            onChange={this.handleChange}
            className="text-input"
            type="number"
            name="limit"
          />
        </div>
        <div className="parameter-selection">
          <h3 className="mat-h3">Return Properties: </h3>
          <div className="checkboxes">{returnProperties}</div>
        </div>
        <div className="parameter-selection">
          <h3 className="mat-h3">Related Terms:</h3>
          <div className="related-checkboxes">
            <div className="checkbox">
              <FormControlLabel
                control={
                  <Checkbox
                    name="parents"
                    id="parents"
                    onChange={(e, checked) =>
                      this.handleRelatedTerms(checked, "parents")
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
                      this.handleRelatedTerms(checked, "children")
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
                      this.handleRelatedTerms(checked, "aliases")
                    }
                  />
                }
                label="Aliases"
              />
            </div>
          </div>
        </div>
        <div className="parameter-selection">
          <h3 className="mat-h3">Fuzzy Match:</h3>
          <TextField
            id="fuzzy-match-adv"
            placeholder=""
            label="Fuzzy Match"
            value={this.state.mainParams.fuzzyMatch}
            onChange={this.handleChange}
            className="text-input"
            name="fuzzyMatch"
            type="number"
          />
        </div>
        <div className="parameter-selection">
          <h3 className="mat-h3">Neighbors:</h3>
          <TextField
            id="neighbors-adv"
            label="Neighbors"
            value={this.state.mainParams.neighbors}
            onChange={this.handleChange}
            className="text-input"
            name="neighbors"
            type="number"
          />
        </div>
        <Link className="link" to={{ state: this.state, pathname: "/query" }}>
          <Button variant="outlined">Back</Button>
        </Link>
        <Link
          className="link"
          to={{ search: this.bundle(), pathname: "/results" }}
        >
          <Button variant="contained" color="primary" onClick={this.submit}>
            Search
          </Button>
        </Link>
      </div>
    );
  }
}

export default AdvancedQueryComponent;
