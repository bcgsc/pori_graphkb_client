import './GraphOptionsPanel.scss';

import {
  Checkbox,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  FormControlLabel,
  IconButton,
  Typography,
} from '@material-ui/core';
import CloseIcon from '@material-ui/icons/Close';
import HelpIcon from '@material-ui/icons/Help';
import PropTypes from 'prop-types';
import React, { useState } from 'react';

import DropDownSelect from '@/components/DropDownSelect';
import config from '@/static/config';

const { GRAPH_ADVANCED, GRAPH_MAIN } = config.DESCRIPTIONS;

/**
 * Displays graph options in a dialog view.
 *
 * @property {object} props
 * @property {GraphOptions} props.graphOptions - Graph options object.
 * @property {PropsMap} props.propsMap - Graph coloringpropsmap.
 * @property {boolean} props.graphOptionsOpen - dialog open flag.
 * @property {boolean} props.linkLegendDisabled - link legend disabled flag.
 * @property {function} props.handleDialogClose - function for closing dialog.
 * @property {function} props.handleGraphOptionsChange - function for field changing.
 */
function GraphOptionsPanel(props) {
  const {
    graphOptionsOpen,
    graphOptions,
    propsMap,
    linkLegendDisabled,
    handleDialogClose,
    handleGraphOptionsChange,
  } = props;

  const [mainHelp, setMainHelp] = useState(false);
  const [advancedHelp, setAdvancedHelp] = useState(false);

  /**
   * Opens help drawer.
   * @param {string} key - help type state key.
   */
  const handleHelpOpen = (key) => {
    if (key === 'mainHelp') {
      setMainHelp(true);
    } else {
      setAdvancedHelp(true);
    }
  };

  /**
   * Closes both help drawers.
   */
  const handleHelpClose = () => {
    setMainHelp(false);
    setAdvancedHelp(false);
  };

  const helpOpen = advancedHelp || mainHelp;
  const helpPanel = (
    <Dialog
      onClose={handleHelpClose}
      open={helpOpen}
    >
      <DialogTitle className="help-title" disableTypography>
        <Typography variant="h5">
          {helpOpen && (advancedHelp ? 'Advanced Graph Options Help' : 'Graph Options Help')}
        </Typography>
        <IconButton onClick={handleHelpClose}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        {helpOpen && (advancedHelp ? GRAPH_ADVANCED : GRAPH_MAIN).map((help) => (
          <React.Fragment key={help.title}>
            <Typography gutterBottom variant="h6">
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
    .filter((prop) => propsMap.nodeProps[prop]
        && !(propsMap.nodeProps[prop].length === 1 && propsMap.nodeProps[prop].includes('null')));
  const nodeColorBy = Object.keys(propsMap.nodeProps || {})
    .filter((prop) => propsMap.nodeProps[prop]
        && propsMap.nodeProps[prop].length <= 20
        && !(propsMap.nodeProps[prop].length === 1 && propsMap.nodeProps[prop].includes('null')));

  return (
    <>
      {helpPanel}
      <Dialog
        classes={{
          paper: 'options-panel-wrapper',
        }}
        onClose={handleDialogClose}
        open={graphOptionsOpen}
        scroll="body"
      >
        <IconButton
          data-testid="close-btn"
          id="options-close-btn"
          onClick={handleDialogClose}
        >
          <CloseIcon />
        </IconButton>
        <DialogTitle className="options-title" disableTypography>
          <Typography variant="h6">Graph Options</Typography>
          <IconButton
            color="primary"
            data-testid="main-help-btn"
            id="main-help-btn"
            onClick={() => handleHelpOpen('mainHelp')}
          >
            <HelpIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <div className="main-options-wrapper">
            <DropDownSelect
              className="graph-option"
              disabled={graphOptions.nodePreview}
              label="Label nodes by"
              name="nodeLabelProp"
              onChange={handleGraphOptionsChange}
              options={['', ...nodeLabelBy]}
              value={graphOptions.nodeLabelProp}
            />
            <FormControl className="graph-option">
              <FormControlLabel
                control={(
                  <Checkbox
                    checked={!!(graphOptions.nodePreview)}
                    color="secondary"
                    name="nodePreview"
                    onChange={(e) => handleGraphOptionsChange({
                      target: {
                        value: e.target.checked,
                        name: e.target.name,
                      },
                    })
                      }
                  />
                  )}
                label="Label nodes by preview"
              />
            </FormControl>
            <DropDownSelect
              className="graph-option"
              label="Color nodes by"
              name="nodesColor"
              onChange={handleGraphOptionsChange}
              options={['', ...nodeColorBy]}
              value={graphOptions.nodesColor}
            />
            <FormControl className="graph-option">
              <FormControlLabel
                control={(
                  <Checkbox
                    checked={!!(graphOptions.nodesLegend && graphOptions.nodesColor)}
                    color="secondary"
                    disabled={!graphOptions.nodesColor}
                    name="nodesLegend"
                    onChange={(e) => handleGraphOptionsChange({
                      target: {
                        value: e.target.checked,
                        name: e.target.name,
                      },
                    })
                      }
                  />
                  )}
                label="Show Nodes Coloring Legend"
              />
            </FormControl>
          </div>
          <div className="main-options-wrapper">
            <DropDownSelect
              className="graph-option"
              disabled={linkLegendDisabled}
              label="Label edges by"
              name="linkLabelProp"
              onChange={handleGraphOptionsChange}
              options={['', '@class', '@rid', 'source.name']}
              value={graphOptions.linkLabelProp}
            />
            <DropDownSelect
              className="graph-option"
              disabled={linkLegendDisabled}
              label="Color edges by"
              name="linksColor"
              onChange={handleGraphOptionsChange}
              options={['', '@class', '@rid', 'source.name']}
              value={graphOptions.linksColor}
            />
            <FormControl>
              <FormControlLabel
                control={(
                  <Checkbox
                    checked={
                        graphOptions.linksLegend
                        && graphOptions.linksColor
                        && !linkLegendDisabled}
                    color="secondary"
                    disabled={linkLegendDisabled || !graphOptions.linksColor}
                    name="linksLegend"
                    onChange={(e) => handleGraphOptionsChange({
                      target: {
                        value: e.target.checked,
                        name: e.target.name,
                      },
                    })
                      }
                  />
                  )}
                label="Show Links Coloring Legend"
              />
            </FormControl>
          </div>
          <div className="main-options-wrapper">
            <FormControl className="graph-option">
              <FormControlLabel
                control={(
                  <Checkbox
                    checked={!!(graphOptions.isTreeLayout)}
                    color="secondary"
                    name="isTreeLayout"
                    onChange={(e) => handleGraphOptionsChange({
                      target: {
                        value: e.target.checked,
                        name: e.target.name,
                      },
                    })
                      }
                  />
                  )}
                label="Use a Weak Tree layout"
              />
            </FormControl>
          </div>
        </DialogContent>
        <Divider />
      </Dialog>
    </>
  );
}

GraphOptionsPanel.propTypes = {
  handleDialogClose: PropTypes.func.isRequired,
  handleGraphOptionsChange: PropTypes.func.isRequired,
  graphOptions: PropTypes.object,
  graphOptionsOpen: PropTypes.bool,
  linkLegendDisabled: PropTypes.bool,
  propsMap: PropTypes.object,
};

GraphOptionsPanel.defaultProps = {
  graphOptions: {},
  propsMap: { nodeProps: [], linkProps: [] },
  graphOptionsOpen: false,
  linkLegendDisabled: true,
};

export default GraphOptionsPanel;
