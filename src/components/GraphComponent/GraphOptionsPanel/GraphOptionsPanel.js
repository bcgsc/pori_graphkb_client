import React, { Component } from 'react';
import PropTypes from 'prop-types';
import './GraphOptionsPanel.scss';
import {
  Checkbox,
  FormControlLabel,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  Typography,
  FormControl,
  Divider,
  TextField,
} from '@material-ui/core';
import CloseIcon from '@material-ui/icons/Close';
import HelpIcon from '@material-ui/icons/Help';
import ResourceSelectComponent from '../../ResourceSelectComponent/ResourceSelectComponent';
import config from '../../../static/config';
import util from '../../../services/util';

const { GRAPH_ADVANCED, GRAPH_MAIN } = config.DESCRIPTIONS;

/**
 * Displays graph options in a dialog view.
 */
export default class GraphOptionsPanel extends Component {
  constructor(props) {
    super(props);
    this.state = {
      mainHelp: false,
      advancedHelp: false,
    };
    this.handleHelpOpen = this.handleHelpOpen.bind(this);
    this.handleHelpClose = this.handleHelpClose.bind(this);
  }

  /**
   * Opens help drawer.
   * @param {string} key - help type state key.
   */
  handleHelpOpen(key) {
    this.setState({ [key]: true });
  }

  /**
   * Closes both help drawers.
   */
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
          <Typography variant="h5">
            {helpOpen && (advancedHelp ? 'Advanced Graph Options Help' : 'Graph Options Help')}
          </Typography>
          <IconButton onClick={this.handleHelpClose}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {helpOpen && (advancedHelp ? GRAPH_ADVANCED : GRAPH_MAIN).map(help => (
            <React.Fragment key={help.title}>
              <Typography variant="h6" gutterBottom>
                {help.title}
              </Typography>
              <Typography paragraph>
                {help.description}
              </Typography>
            </React.Fragment>
          ))}
        </DialogContent>
      </Dialog>
    );

    const nodeLabelBy = Object.keys(propsMap.nodeProps || {})
      .filter(prop => propsMap.nodeProps[prop]
        && !(propsMap.nodeProps[prop].length === 1 && propsMap.nodeProps[prop].includes('null')));
    const nodeColorBy = Object.keys(propsMap.nodeProps || {})
      .filter(prop => propsMap.nodeProps[prop]
        && propsMap.nodeProps[prop].length <= 20
        && !(propsMap.nodeProps[prop].length === 1 && propsMap.nodeProps[prop].includes('null')));

    const advancedOptions = [
      { name: 'collisionRadius', max: 100, step: 1 },
      { name: 'linkStrength', max: 1, step: 0.001 },
      { name: 'chargeStrength', max: 1000, step: 1 },
      { name: 'chargeMax', step: 1, label: 'Max Charge Distance' },
    ];

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
            <Typography variant="h6">Graph Options</Typography>
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
              <ResourceSelectComponent
                className="graph-option"
                label="Label nodes by"
                name="nodeLabelProp"
                onChange={handleGraphOptionsChange}
                value={graphOptions.nodeLabelProp}
                resources={['', ...nodeLabelBy]}
                disabled={graphOptions.nodePreview}
              />
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
                      name="nodePreview"
                      checked={!!(graphOptions.nodePreview)}
                    />
                  )}
                  label="Label nodes by preview"
                />
              </FormControl>
              <ResourceSelectComponent
                className="graph-option"
                label="Color nodes by"
                name="nodesColor"
                onChange={handleGraphOptionsChange}
                value={graphOptions.nodesColor}
                resources={['', ...nodeColorBy]}
              />
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
              <ResourceSelectComponent
                className="graph-option"
                label="Label edges by"
                name="linkLabelProp"
                onChange={handleGraphOptionsChange}
                value={graphOptions.linkLabelProp}
                disabled={linkLegendDisabled}
                resources={['', '@class', 'source.name']}
              />
              <ResourceSelectComponent
                className="graph-option"
                label="Color edges by"
                name="linksColor"
                onChange={handleGraphOptionsChange}
                value={graphOptions.linksColor}
                disabled={linkLegendDisabled}
                resources={['', '@class', 'source.name']}
              />
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
            <Typography variant="h6">Advanced Graph Options</Typography>
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
              {advancedOptions.map(option => (
                <div key={option.name} className="graph-input-wrapper">
                  <TextField
                    label={option.label || util.antiCamelCase(option.name)}
                    name={option.name}
                    type="number"
                    id={option.name}
                    value={graphOptions[option.name]}
                    onChange={e => handleGraphOptionsChange(e, true)}
                    inputProps={{
                      max: option.max,
                      step: option.step,
                    }}
                  />
                </div>
              ))}
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
            </div>
          </DialogContent>
        </Dialog>
      </React.Fragment>
    );
  }
}

/**
 * @namespace
 * @property {GraphOptions} graphOptions - Graph options object.
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
