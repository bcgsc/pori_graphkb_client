import React, { Component } from 'react';
import { Redirect } from 'react-router-dom';
import './AddNodeView.css';
import NodeFormComponent from '../../components/NodeFormComponent/NodeFormComponent';

/**
 * Component for editing or adding database nodes.
 */
class AddNodeView extends Component {
  constructor(props) {
    super(props);
    this.state = {
      completedFlag: false,
    };

    this.handleFinishAdd = this.handleFinishAdd.bind(this);
  }

  handleFinishAdd() {
    this.setState({ completedFlag: true });
  }

  render() {
    const {
      completedFlag,
    } = this.state;

    if (completedFlag) return <Redirect push to="/query" />;

    return (
      <NodeFormComponent
        variant="add"
        handleNodeFinishEdit={this.handleFinishAdd}
      />
    );
  }
}

export default AddNodeView;
