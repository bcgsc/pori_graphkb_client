import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Redirect } from 'react-router-dom';
import * as jc from 'json-cycle';
import NodeDetailComponent from '../../components/NodeDetailComponent/NodeDetailComponent';
import api from '../../services/api';
/**
 * Component for editing or adding database nodes.
 */
class NodeDetailView extends Component {
  constructor(props) {
    super(props);
    this.state = {
      node: null,
      completedFlag: false,
      returnFlag: false,
      query: '',
      error: null,
      loginRedirect: false,
    };

    this.handleNodeDelete = this.handleNodeDelete.bind(this);
    this.handleNodeEdit = this.handleNodeEdit.bind(this);
  }

  /**
   * Initializes editing node and query on return.
   */
  componentDidMount() {
    const { match } = this.props;
    console.log(this.props);
    api.get(`/diseases/${match.params.rid}?neighbors=3`).then((response) => {
      const node = jc.retrocycle(response.result);
      this.setState({ node });
    }).catch((error) => {
      if (error.status === 401) {
        this.setState({ loginRedirect: true });
      } else {
        this.setState({ error });
      }
    });
  }

  /**
   * Sets return flag to navigate to query page.
   */
  handleNodeDelete() {
    this.setState({ returnFlag: true });
  }

  /**
  handleNodeEditag to navigate back to previous query.
   */
  handleNodeEdit() {
    const { history } = this.props;
    history.goBack();
  }

  render() {
    const {
      node,
      completedFlag,
      returnFlag,
      query,
      error,
      loginRedirect,
    } = this.state;

    if (error) {
      return <Redirect push to={{ pathname: '/error', state: error }} />;
    }
    if (loginRedirect) {
      return <Redirect push to="/login" />;
    }
    if (returnFlag) {
      return <Redirect push to="/query" />;
    }
    if (completedFlag) {
      return <Redirect push to={{ pathname: '/data/table', search: query }} />;
    }

    // TODO: add children buttons props.
    if (node) {
      return (
        <NodeDetailComponent
          node={node}
          handleNodeEditStart={this.handleNodeEdit}
        />
      );
    }
    return null;
  }
}

NodeDetailView.propTypes = {
  match: PropTypes.object.isRequired,
  history: PropTypes.object.isRequired,
};

export default NodeDetailView;
