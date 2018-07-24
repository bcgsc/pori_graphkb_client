import React, { Component } from 'react';
import PropTypes from 'prop-types';
import * as jc from 'json-cycle';
import './EditNodeView.css';
import NodeFormComponent from '../../components/NodeFormComponent/NodeFormComponent';
import api from '../../services/api';
/**
 * Component for editing ontologies.
 */
class EditNodeView extends Component {
  constructor(props) {
    super(props);
    this.state = {
      node: null,
    };

    this.handleNodeDelete = this.handleNodeDelete.bind(this);
    this.handleNodeFinishEdit = this.handleNodeFinishEdit.bind(this);
  }

  /**
   * Initializes editing node and query on return.
   */
  componentDidMount() {
    const { match, history } = this.props;
    const { rid } = match.params;
    api.get(`/ontologies/${rid}?neighbors=3`).then((data) => {
      const node = jc.retrocycle(data.result);
      this.setState({ node });
    }).catch(() => {
      // TODO: 404 page
      history.push('/query');
    });
  }

  /**
   * Sets return flag to navigate to query page.
   */
  handleNodeDelete() {
    const { history } = this.props;
    history.push('/query');
  }

  /**
   * Sets completed flag to navigate back to previous query.
   */
  handleNodeFinishEdit() {
    const { history } = this.props;
    history.goBack();
  }

  render() {
    const {
      node,
    } = this.state;


    if (node) {
      return (
        <NodeFormComponent
          variant="edit"
          node={node}
          handleNodeDelete={this.handleNodeDelete}
          handleNodeFinishEdit={this.handleNodeFinishEdit}
        />
      );
    }
    return null;
  }
}

EditNodeView.propTypes = {
  match: PropTypes.object.isRequired,
  history: PropTypes.object.isRequired,
};

export default EditNodeView;
