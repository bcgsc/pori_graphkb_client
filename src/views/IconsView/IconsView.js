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
  Chip,
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
      temp: '',
      chip: false,
    };
    this.handleChange = this.handleChange.bind(this);
    this.handleChip = this.handleChip.bind(this);
    this.handleQuery = this.handleQuery.bind(this);
    this.toggle = this.toggle.bind(this);
  }

  handleChange(e) {
    const { name, value } = e.target;
    const update = { [name]: value };
    if (e.keyCode !== 13) {
      if (name === 'temp') {
        const { temp, chip } = this.state;
        update[name] = chip ? `${temp}${value}` : value;
        update.chip = false;
      }
      this.setState(update);
    } else {
      this.handleChip();
    }
  }

  handleChip() {
    const { temp } = this.state;
    if (temp) {
      this.setState({ chip: true });
    }
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
      temp,
      chip,
    } = this.state;

    let fields = [];
    if (route === 'ontologies') {
      fields = ['name', 'sourceId', 'source'];
    }
    if (route === 'variants') {
      fields = ['shorthand', 'zygosity', 'germline'];
    }
    if (route === 'statements') {
      fields = ['relevance', 'appliesTo'];
    }
    const results = ['cancer', 'angiosarcoma', 'disease ontology', 'melanoma'];
    const routes = ['ontologies', 'variants', 'statements'];
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
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr 1fr',
            gridGap: '1rem',
          }}
        >
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
              helperText="bar with dropdown panel"
            />
            <Collapse in={toggled}>
              <div style={{ padding: 16 }}>
                <Select fullWidth onChange={this.handleChange} name="route" value={route} label="Route">
                  {routes.map(r => <MenuItem key={r} value={r}>{r}</MenuItem>)}
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
              helperText="bar with popover"
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
                      <Select fullWidth value={route} name="route" onChange={this.handleChange}>
                        {routes.map(r => <MenuItem key={r} value={r}>{r}</MenuItem>)}
                      </Select>
                    </ListItem>
                    {fields.map(f => (
                      <ListItem key={f}>
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
                      <Button
                        onClick={this.handleQuery}
                        style={{ marginLeft: 'auto' }}
                        variant="contained"
                        color="primary"
                      >
                        Query
                      </Button>
                    </ListItem>
                  </List>)}
                {query && !loading && (
                  <List disablePadding>
                    {results.map(r => (
                      <ListItem key={r} button>
                        <ListItemText primary={r} />
                      </ListItem>
                    ))}
                  </List>
                )}
                {query && loading && (
                  <div style={{ display: 'flex', overflow: 'hidden' }}>
                    <CircularProgress size={34} style={{ margin: '8px auto' }} />
                  </div>
                )}
              </Paper>
            </Popover>
          </div>
          <div style={{ padding: 16, width: 400 }}>
            <TextField
              label="Target Node"
              fullWidth
              value={chip ? '' : temp}
              name="temp"
              onChange={this.handleChange}
              onKeyUp={(e) => {
                if (e.keyCode === 8) {
                  this.handleChange(e);
                } else if (e.keyCode === 13) {
                  this.handleChip();
                }
              }}
              InputProps={{
                endAdornment: (
                  <InputAdornment
                    position="end"
                  >
                    <IconButton onClick={this.handleChip}>
                      <SearchIcon />
                    </IconButton>
                  </InputAdornment>
                ),
                startAdornment: chip ? <Chip clickable label={temp} /> : <div />,
              }}
              helperText="bar with chip"
            />
          </div>
        </div>
      </div>
    );
  }
}

export default IconsView;
