import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Redirect } from 'react-router-dom';
import './EditNodeView.css';
import NodeFormComponent from '../../components/NodeFormComponent/NodeFormComponent';

/**
 * Component for editing or adding database nodes.
 */
class EditNodeView extends Component {
  constructor(props) {
    super(props);
    this.state = {
      node: null,
      completedFlag: false,
      returnFlag: false,
      query: '',
    };

    this.handleNodeDelete = this.handleNodeDelete.bind(this);
    this.handleNodeFinishEdit = this.handleNodeFinishEdit.bind(this);
  }

  componentDidMount() {
    const { location } = this.props;
    if (location.state.node && location.state.query) {
      const { node, query } = location.state;
      this.setState({ node, query });
    }
  }

  handleNodeDelete() {
    this.setState({ returnFlag: true });
  }

  handleNodeFinishEdit() {
    this.setState({ completedFlag: true });
  }

  render() {
    const {
      node,
      completedFlag,
      returnFlag,
      query,
    } = this.state;

    if (returnFlag) return <Redirect push to="/query" />;
    if (completedFlag) return <Redirect push to={{ pathname: 'data/table', search: query }} />;

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
};

export default EditNodeView;
