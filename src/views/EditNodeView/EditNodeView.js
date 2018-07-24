import React, { Component } from 'react';
import PropTypes from 'prop-types';
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
    };

    this.handleNodeDelete = this.handleNodeDelete.bind(this);
    this.handleNodeFinishEdit = this.handleNodeFinishEdit.bind(this);
  }

  /**
   * Initializes editing node and query on return.
   */
  componentDidMount() {
    const { history } = this.props;
    const { location } = history;
    if (location.state.node) {
      const { node } = location.state;
      this.setState({ node });
    } else history.push('/query');
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
  history: PropTypes.object.isRequired,
};

export default EditNodeView;
