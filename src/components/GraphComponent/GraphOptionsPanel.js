import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import {
  Checkbox,
  FormControlLabel,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  Typography,
  Select,
  MenuItem,
  InputLabel,
  Input,
  FormControl,
  Divider,
} from '@material-ui/core';
import CloseIcon from '@material-ui/icons/Close';
import HelpIcon from '@material-ui/icons/Help';
import util from '../../services/util';
import config from '../../config.json';

const { GRAPH_ADVANCED, GRAPH_MAIN } = config.DESCRIPTIONS;

export default class GraphOptionsPanel extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      mainHelp: false,
      advancedHelp: false,
    };
    this.handleHelpOpen = this.handleHelpOpen.bind(this);
    this.handleHelpClose = this.handleHelpClose.bind(this);
  }

  handleHelpOpen(key) {
    this.setState({ [key]: true });
  }

  handleHelpClose() {
    this.setState({ mainHelp: false, advancedHelp: false });
  }

  render() {
    const {
      graphOptionsOpen,
      graphOptions,
      propsMap,
      linkLegendDisabled,
      handleDialogClose,
      handleGraphOptionsChange,
    } = this.props;

    const {
      mainHelp,
      advancedHelp,
    } = this.state;

    const helpOpen = advancedHelp || mainHelp;
    const helpPanel = (
      <Dialog
        open={helpOpen}
        onClose={this.handleHelpClose}
      >
        <DialogTitle disableTypography className="help-title">
          <Typography variant="headline">
            {helpOpen && (advancedHelp ? 'Advanced Graph Options Help' : 'Graph Options Help')}
          </Typography>
          <IconButton onClick={this.handleHelpClose}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {helpOpen && (advancedHelp ? GRAPH_ADVANCED : GRAPH_MAIN).map(help => (
            <React.Fragment key={help.title}>
              <Typography variant="title" gutterBottom>
                {help.title}
              </Typography>
              <Typography variant="body1" paragraph>
                {help.description}
              </Typography>
            </React.Fragment>
          ))}
        </DialogContent>
      </Dialog>
    );

    return (
      <React.Fragment>
        {helpPanel}
        <Dialog
          open={graphOptionsOpen}
          onClose={handleDialogClose('graphOptionsOpen')}
          classes={{
            paper: 'options-panel-wrapper',
          }}
          scroll="body"
        >
          <IconButton
            onClick={handleDialogClose('graphOptionsOpen')}
            id="options-close-btn"
          >
            <CloseIcon />
          </IconButton>
          <DialogTitle className="options-title" disableTypography>
            <Typography variant="title">Graph Options</Typography>
            <IconButton
              color="primary"
              onClick={() => this.handleHelpOpen('mainHelp')}
              id="main-help-btn"
            >
              <HelpIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent>
            <div className="main-options-wrapper">
              <FormControl className="graph-option">
                <InputLabel htmlFor="nodeLabelProp">Label nodes by</InputLabel>
                <Select
                  name="nodeLabelProp"
                  input={<Input name="nodeLabelProp" id="nodeLabelProp" />}
                  onChange={handleGraphOptionsChange}
                  value={graphOptions.nodeLabelProp}
                >
                  <MenuItem value="">None</MenuItem>
                  {Object.keys(propsMap.nodeProps || {}).map((prop) => {
                    if (propsMap.nodeProps[prop]
                      && !(propsMap.nodeProps[prop].length === 1 && propsMap.nodeProps[prop].includes('null'))
                    ) {
                      return (
                        <MenuItem value={prop} key={prop}>
                          {util.antiCamelCase(prop)}
                        </MenuItem>
                      );
                    }
                    return null;
                  })}
                </Select>
              </FormControl>
              <FormControl className="graph-option">
                <InputLabel htmlFor="nodesColor">Color nodes by</InputLabel>
                <Select
                  name="nodesColor"
                  input={<Input name="nodesColor" id="nodesColor" />}
                  onChange={handleGraphOptionsChange}
                  value={graphOptions.nodesColor}
                >
                  <MenuItem value="">None</MenuItem>
                  {Object.keys(propsMap.nodeProps || {}).map((prop) => {
                    if (
                      propsMap.nodeProps[prop]
                      && propsMap.nodeProps[prop].length <= 20
                      && !(propsMap.nodeProps[prop].length === 1 && propsMap.nodeProps[prop].includes('null'))
                    ) {
                      return (
                        <MenuItem value={prop} key={prop}>
                          {util.antiCamelCase(prop)}
                        </MenuItem>
                      );
                    }
                    return null;
                  })}
                </Select>
              </FormControl>
              <FormControl className="graph-option">
                <FormControlLabel
                  control={(
                    <Checkbox
                      color="secondary"
                      onChange={e => handleGraphOptionsChange({
                        target: {
                          value: e.target.checked,
                          name: e.target.name,
                        },
                      })
                      }
                      name="nodesLegend"
                      checked={!!(graphOptions.nodesLegend && graphOptions.nodesColor)}
                      disabled={!graphOptions.nodesColor}
                    />
                  )}
                  label="Show Nodes Coloring Legend"
                />
              </FormControl>
            </div>
            <div className="main-options-wrapper">
              <FormControl className="graph-option">
                <InputLabel htmlFor="linkLabelProp">Label edges by</InputLabel>
                <Select
                  input={<Input name="linkLabelProp" id="linkLabelProp" />}
                  onChange={handleGraphOptionsChange}
                  value={graphOptions.linkLabelProp}
                  disabled={linkLegendDisabled}
                >
                  <MenuItem value="">None</MenuItem>
                  <MenuItem value="@class">Class</MenuItem>
                  <MenuItem value="source.name">Source Name</MenuItem>
                </Select>
              </FormControl>
              <FormControl className="graph-option">
                <InputLabel htmlFor="linksColor">Color edges by</InputLabel>
                <Select
                  name="linksColor"
                  input={<Input name="linksColor" id="linksColor" />}
                  onChange={handleGraphOptionsChange}
                  value={graphOptions.linksColor}
                  disabled={linkLegendDisabled}
                >
                  <MenuItem value="">None</MenuItem>
                  <MenuItem value="@class">Class</MenuItem>
                  <MenuItem value="source.name">Source Name</MenuItem>
                </Select>
              </FormControl>
              <FormControl>
                <FormControlLabel
                  control={(
                    <Checkbox
                      color="secondary"
                      onChange={e => handleGraphOptionsChange({
                        target: {
                          value: e.target.checked,
                          name: e.target.name,
                        },
                      })
                      }
                      name="linksLegend"
                      checked={
                        graphOptions.linksLegend
                        && graphOptions.linksColor
                        && !linkLegendDisabled}
                      disabled={linkLegendDisabled || !graphOptions.linksColor}
                    />
                  )}
                  label="Show Links Coloring Legend"
                />
              </FormControl>
            </div>
          </DialogContent>
          <Divider />
          <div className="options-title">
            <Typography variant="title">Advanced Graph Options</Typography>
            <IconButton
              onClick={() => this.handleHelpOpen('advancedHelp')}
              color="primary"
              id="advanced-help-btn"
            >
              <HelpIcon />
            </IconButton>
          </div>
          <DialogContent className="advanced-options-wrapper">
            <div className="advanced-options-grid">
              <div className="graph-input-wrapper">
                <InputLabel htmlFor="linkStrength" style={{ fontSize: '0.75rem' }}>
                  Link Strength
                </InputLabel>
                <Input
                  name="linkStrength"
                  type="number"
                  id="linkStrength"
                  value={graphOptions.linkStrength}
                  onChange={e => handleGraphOptionsChange(e, true)}
                  inputProps={{
                    max: 1,
                    step: 0.001,
                  }}
                />
              </div>
              <div className="graph-input-wrapper">
                <InputLabel htmlFor="chargeStrength" style={{ fontSize: '0.75rem' }}>
                  Charge Strength
                </InputLabel>
                <Input
                  label="Charge Strength"
                  name="chargeStrength"
                  type="number"
                  id="chargeStrength"
                  value={graphOptions.chargeStrength}
                  onChange={e => handleGraphOptionsChange(e, true)}
                  inputProps={{
                    max: 1000,
                    step: 1,
                  }}
                />
              </div>
              <div className="graph-input-wrapper">
                <InputLabel htmlFor="collisionRadius" style={{ fontSize: '0.75rem' }}>
                  Collision Radius
                </InputLabel>
                <Input
                  name="collisionRadius"
                  id="collisionRadius"
                  type="number"
                  value={graphOptions.collisionRadius}
                  onChange={e => handleGraphOptionsChange(e, true)}
                  inputProps={{
                    max: 100,
                    step: 1,
                  }}
                />
              </div>
              <div>
                <FormControlLabel
                  control={(
                    <Checkbox
                      color="secondary"
                      onChange={e => handleGraphOptionsChange({
                        target: {
                          value: e.target.checked,
                          name: e.target.name,
                        },
                      }, true)}
                      name="autoCollisionRadius"
                      checked={graphOptions.autoCollisionRadius}
                    />
                  )}
                  label="Auto Space Nodes"
                />
              </div>
              <div className="graph-input-wrapper">
                <InputLabel htmlFor="collisionRadius" style={{ fontSize: '0.75rem' }}>
                  Max Charge Distance
                </InputLabel>
                <Input
                  name="chargeMax"
                  id="chargeMax"
                  type="number"
                  value={graphOptions.chargeMax}
                  onChange={e => handleGraphOptionsChange(e, true)}
                  inputProps={{
                    step: 1,
                  }}
                />
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </React.Fragment>
    );
  }
}

/**
 * @namespace
 * @property {Object} graphOptions - Graph options object.
 * @property {PropsMap} propsMap - Graph coloringpropsmap.
 * @property {boolean} graphOptionsOpen - dialog open flag.
 * @property {boolean} linkLegendDisabled - link legend disabled flag.
 * @property {function} handleDialogClose - function for closing dialog.
 * @property {function} handleGraphOptionsChange - function for field changing.
 */
GraphOptionsPanel.propTypes = {
  graphOptions: PropTypes.object,
  propsMap: PropTypes.object,
  graphOptionsOpen: PropTypes.bool,
  linkLegendDisabled: PropTypes.bool,
  handleDialogClose: PropTypes.func.isRequired,
  handleGraphOptionsChange: PropTypes.func.isRequired,
};

GraphOptionsPanel.defaultProps = {
  graphOptions: {},
  propsMap: { nodeProps: [], linkProps: [] },
  graphOptionsOpen: false,
  linkLegendDisabled: true,
};
