import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Redirect } from 'react-router-dom';
import './EditNodeView.css';
import NodeFormComponent from '../../components/NodeFormComponent/NodeFormComponent';

/**
 * Component for editing ontologies.
 */
class EditNodeView extends Component {
  constructor(props) {
    super(props);
    this.state = {
      node: null,
      returnFlag: false,
    };

    this.handleNodeDelete = this.handleNodeDelete.bind(this);
    this.handleNodeFinishEdit = this.handleNodeFinishEdit.bind(this);
  }

  /**
   * Initializes editing node and query on return.
   */
  componentDidMount() {
    const { location } = this.props;
    if (location.state.node && location.state.query) {
      const { node } = location.state;
      this.setState({ node });
    } else this.setState({ returnFlag: true });
  }

  /**
   * Sets return flag to navigate to query page.
   */
  handleNodeDelete() {
    this.setState({ returnFlag: true });
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
      returnFlag,
    } = this.state;

    if (returnFlag) return <Redirect push to="/query" />;

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
  location: PropTypes.object.isRequired,
  history: PropTypes.object.isRequired,
};

export default EditNodeView;
