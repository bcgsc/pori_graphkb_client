import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import './NodeComponent.css';
import {
  List,
  ListItem,
  ListItemText,
  IconButton,
  Button,
  Paper
} from '@material-ui/core';
import TimelineIcon from '@material-ui/icons/Timeline';
import AssignmentIcon from '@material-ui/icons/Assignment';
import Drawer from '@material-ui/core/Drawer';
import ChevronRightIcon from '@material-ui/icons/ChevronRight';
import GraphComponent from '../GraphComponent/GraphComponent';
import { CompactPicker } from 'react-color';
import { Link } from 'react-router-dom';

class NodeComponent extends Component {
  constructor(props) {
    super(props);
    this.state = {
      editing: false,
      editNode: null,
      drawer: {
        graph: false,
        basic: false
      },
      graphOptions: {
        width: 0,
        height: 0,
        selectedColor: '#ff0000',
        aliasesColor: '#e6a249',
        parentsColor: '#C062FF',
        childrenColor: '#00bfa5'
      },
      colorKey: 'selectedColor'
    };
    this.handleResize = this.handleResize.bind(this);
    this.handleColorPick = this.handleColorPick.bind(this);
  }

  componentDidMount() {
    window.addEventListener('resize', this.handleResize);
    this.handleResize();
  }

  handleResize() {
    let w, h;
    let n = ReactDOM.findDOMNode(this.refs['node-wrapper']);
    if (n) {
      w = n.clientWidth;
      h = n.clientHeight - 51;
      let graphOptions = this.state.graphOptions;
      graphOptions.width = w;
      graphOptions.height = h;
      this.setState({ graphOptions });
    }
  }

  handleDrawer(key) {
    let drawer = this.state.drawer;
    drawer[key] = !drawer[key];
    this.setState({ drawer }, this.handleResize);
  }

  handleColorPick(color) {
    console.log(color);
    console.log(this.state.graphOptions);

    let graphOptions = this.state.graphOptions;
    graphOptions[this.state.colorKey] = color.hex;
    this.setState({ graphOptions });
  }
  handleColorKeyChange(key) {
    this.setState({ colorKey: key });
  }

  render() {
    const node = this.props.data[this.props.selectedId];

    const listItems = key => {
      if (node[key]) {
        return (
          <div className='list-subheader'>
            <ListItemText
              primary={
                key[0].toUpperCase() + key.substr(1, key.length - 1) + ':'
              }
            />
            {node[key].map(item => {
              return (
                <ListItem key={key + item}>
                  <ListItemText secondary={item} />
                </ListItem>
              );
            })}
          </div>
        );
      } else return null;
    };

    const basicProperties = (
      <div className='node-properties'>
        <List component='nav'>
          <ListItem>
            <ListItemText primary='Class:' secondary={node.class} />
          </ListItem>
          <ListItem>
            <ListItemText primary='Source:' secondary={node.source} />
          </ListItem>
          <ListItem>
            <ListItemText primary='SourceId:' secondary={node.sourceId} />
          </ListItem>
          <ListItem>
            <ListItemText
              primary='CreatedBy:'
              secondary={node.createdBy || 'Undefined'}
            />
          </ListItem>
          <ListItem>
            <ListItemText primary='Name:' secondary={node.name} />
          </ListItem>
          <ListItem>
            <ListItemText primary='Description:' secondary={node.description} />
          </ListItem>
          {listItems('subsets')}
          {listItems('aliases')}
          {listItems('parents')}
          {listItems('children')}
        </List>
        <Link to={{ state: this.state, pathname: '/edit' }}>
          <Button variant='flat' color='primary'>
            Edit Node
          </Button>
        </Link>
      </div>
    );

    let graph = () => {
      if (
        this.state.graphOptions.width &&
        this.state.graphOptions.height &&
        this.state.drawer.graph
      ) {
        return (
          <GraphComponent
            width={this.state.graphOptions.width}
            height={this.state.graphOptions.height}
            linkStrength={1 / 20}
            handleClick={this.props.handleClick}
            node={node}
            selectedColor={this.state.graphOptions.selectedColor}
            aliasesColor={this.state.graphOptions.aliasesColor}
            childrenColor={this.state.graphOptions.childrenColor}
            parentsColor={this.state.graphOptions.parentsColor}
          />
        );
      } else return null;
    };

    const selected = key => key === this.state.colorKey;
    const graphDrawer = (
      <Drawer
        variant='persistent'
        anchor='right'
        open={this.state.drawer.graph}
        classes={{
          paper: 'drawer-box'
        }}
        onClose={() => this.handleDrawer('graph')}
        SlideProps={{ unmountOnExit: true }}
      >
        <div className='color-picker'>
          <div className='compact-picker'>
            <CompactPicker
              color={this.state.graphOptions.selectedColor}
              onChangeComplete={this.handleColorPick}
            />
          </div>
          <div className='grid-wrapper'>
            <div className='button-grid'>
              <Button
                style={{ color: this.state.graphOptions.selectedColor }}
                onClick={e => this.handleColorKeyChange('selectedColor')}
                variant={selected('selectedColor') ? 'flat' : 'raised'}
              >
                Selected
              </Button>
              <Button
                style={{ color: this.state.graphOptions.parentsColor }}
                onClick={e => this.handleColorKeyChange('parentsColor')}
                variant={selected('parentsColor') ? 'flat' : 'raised'}
              >
                Parents
              </Button>
              <Button
                style={{ color: this.state.graphOptions.childrenColor }}
                onClick={e => this.handleColorKeyChange('childrenColor')}
                variant={selected('childrenColor') ? 'flat' : 'raised'}
              >
                Children
              </Button>
              <Button
                style={{ color: this.state.graphOptions.aliasesColor }}
                onClick={e => this.handleColorKeyChange('aliasesColor')}
                variant={selected('aliasesColor') ? 'flat' : 'raised'}
              >
                Aliases
              </Button>
            </div>
          </div>
        </div>
        <Paper elevation={5} className='graph-wrapper' ref='node-wrapper'>
          <IconButton onClick={() => this.handleDrawer('graph')}>
            <ChevronRightIcon />
          </IconButton>
          {graph()}
        </Paper>
      </Drawer>
    );

    const basicDrawer = (
      <Drawer
        variant='persistent'
        anchor='right'
        open={this.state.drawer.basic}
        classes={{
          paper: 'drawer-box'
        }}
        onClose={() => this.handleDrawer('basic')}
        SlideProps={{ unmountOnExit: true }}
      >
        <Paper elevation={5} className='graph-wrapper'>
          <IconButton onClick={() => this.handleDrawer('basic')}>
            <ChevronRightIcon />
          </IconButton>
          {basicProperties}
        </Paper>
      </Drawer>
    );

    return (
      <div className='node-wrapper'>
        {graphDrawer}
        {basicDrawer}
        <Paper className='graph-btn'>
          <IconButton
            color='secondary'
            onClick={() => this.handleDrawer('graph')}
          >
            <TimelineIcon />
          </IconButton>
          <div className='basic-btn'>
            <IconButton
              color='primary'
              onClick={() => this.handleDrawer('basic')}
            >
              <AssignmentIcon />
            </IconButton>
          </div>
        </Paper>
        {basicProperties}
      </div>
    );
  }
}
export default NodeComponent;
