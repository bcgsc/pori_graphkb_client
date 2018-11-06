import React, { Component } from 'react';
import {
  ListItem,
  ListItemIcon,
  ListItemText,
  List,
  TextField,
  InputAdornment,
  IconButton,
  Collapse,
  Select,
  Paper,
  Popover,
  Button,
  CircularProgress,
  MenuItem,
} from '@material-ui/core';
import SearchIcon from '@material-ui/icons/Search';
import ArrowDropDownIcon from '@material-ui/icons/ArrowDropDown';
import OpenInNewIcon from '@material-ui/icons/OpenInNew';
import util from '../../services/util';
import icons from '../../static/icons/icons';


/**
 * Feedback page
 */
class IconsView extends Component {
  constructor(props) {
    super(props);
    this.state = {
      toggled: false,
      popper: false,
      loading: false,
      query: false,
      route: '',
    };
    this.handleChange = this.handleChange.bind(this);
    this.handleQuery = this.handleQuery.bind(this);
    this.toggle = this.toggle.bind(this);
  }

  handleChange(e) {
    this.setState({ [e.target.name]: e.target.value });
  }

  handleQuery() {
    this.setState({ query: true, loading: true }, () => {
      setTimeout(() => this.setState({ loading: false }), 3000);
    });
  }

  toggle(key) {
    return () => {
      const { [key]: toggled } = this.state;
      this.setState({ [key]: !toggled }, () => this.setState({ query: false, loading: false }));
    };
  }

  render() {
    const {
      toggled,
      route,
      popper,
      query,
      loading,
    } = this.state;

    const fields = ['name', 'sourceId', 'source'];
    const results = ['cancer', 'angiosarcoma', 'disease ontology', 'melanoma'];

    return (
      <div>
        <List style={{ columnCount: 3 }}>
          {icons.getAllIcons().map(pair => (
            <ListItem key={pair[0]} style={{ display: 'inline-flex' }}>
              <ListItemIcon>
                <div>
                  {pair[1]}
                </div>
              </ListItemIcon>
              <ListItemText primary={util.antiCamelCase(pair[0])} />
            </ListItem>
          ))}
        </List>
        <div style={{ padding: 16, width: 400 }}>
          <TextField
            label="Target Node"
            fullWidth
            InputProps={{
              endAdornment: (
                <InputAdornment
                  position="end"
                >
                  <IconButton onClick={this.toggle('toggled')}>
                    <ArrowDropDownIcon
                      style={{
                        transform: toggled ? 'rotate(180deg)' : '',
                        transition: 'transform 100ms',
                      }}
                    />
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          <Collapse in={toggled}>
            <div style={{ padding: 16 }}>
              <Select fullWidth onChange={this.handleChange} name="route" value={route} label="Route">
                <option value="ontologies">Ontologies</option>
                <option value="variants">Variants</option>
                <option value="statements">Statements</option>
              </Select>
            </div>
          </Collapse>
        </div>
        <div style={{ padding: 16, width: 400, position: 'relative' }}>
          <TextField
            label="Target Node"
            fullWidth
            InputProps={{
              endAdornment: (
                <InputAdornment
                  position="end"
                >

                  <IconButton onClick={this.toggle('popper')} style={{ position: 'relative' }}>
                    <div
                      ref={(node) => { this.popperNode = node; }}
                      style={{ position: 'absolute', top: 16, right: 0 }}
                    />
                    <OpenInNewIcon />
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          <Popover
            anchorEl={this.popperNode}
            open={popper}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            placement="left-start"
            onClose={this.toggle('popper')}
          >
            <Paper style={{ width: 400 }}>
              {!query && (
                <List disablePadding>
                  <ListItem>
                    <Select fullWidth value={0}>
                      <MenuItem value={0}>Ontology</MenuItem>
                      <MenuItem value={1}>Variant</MenuItem>
                      <MenuItem value={2}>Statement</MenuItem>
                    </Select>
                  </ListItem>
                  {fields.map(f => (
                    <ListItem>
                      <TextField
                        fullWidth
                        label={f}
                        InputProps={{
                          endAdornment: (
                            <InputAdornment
                              position="end"
                            >
                              <IconButton>
                                <SearchIcon />
                              </IconButton>
                            </InputAdornment>
                          ),
                        }}
                      />
                    </ListItem>
                  ))}
                  <ListItem>
                    <Button onClick={this.handleQuery} style={{ marginLeft: 'auto' }} variant="contained" color="primary">Query</Button>
                  </ListItem>
                </List>)}
              {query && !loading && (
                <List disablePadding>
                  {results.map(r => <ListItem><ListItemText primary={r} /></ListItem>)}
                </List>
              )}
              {query && loading && (
                <div style={{ display: 'flex' }}>
                  <CircularProgress style={{ margin: '8px auto' }} />
                </div>
              )}
            </Paper>
          </Popover>
        </div>
      </div>
    );
  }
}

export default IconsView;
