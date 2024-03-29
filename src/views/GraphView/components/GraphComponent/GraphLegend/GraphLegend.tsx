import './GraphLegend.scss';

import {
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper,
  Typography,
} from '@material-ui/core';
import CloseIcon from '@material-ui/icons/Close';
import React from 'react';

import util from '@/services/util';

import { GraphOptions, PropsMap } from '../kbgraph';

interface GraphLegendProps {
  /** Graph Options instance. */
  graphOptions: GraphOptions;
  /** handler for graph options change. */
  onChange: (arg: { target: { name: 'nodesLegend' | 'linksLegend'; value: false } }) => void;
  /** Graph PropsMap instance */
  propsMap: PropsMap;
  /** flag for link legend being disabled. */
  linkDisabled?: boolean;
}

/**
 * Legend panels for nodes and links in graph.
 */
function GraphLegend(props: GraphLegendProps) {
  const {
    graphOptions,
    onChange,
    linkDisabled,
    propsMap,
  } = props;

  if (!(
    (graphOptions.nodesLegend && graphOptions.nodesColor)
    || (
      !linkDisabled
      && graphOptions.linksLegend
      && graphOptions.linksColor)
  )) return null;
  return (
    <div className="legend-wrapper">
      {graphOptions.nodesLegend && graphOptions.nodesColor && (
        <Paper elevation={2}>
          <div className="legend-content">
            <div className="legend-header">
              <div className="legend-header-text">
                <Typography variant="subtitle1">Nodes</Typography>
                <Typography variant="caption">
                  {graphOptions.nodesColor ? `(${util.antiCamelCase(graphOptions.nodesColor)})` : ''}
                </Typography>
              </div>
              <IconButton
                aria-label="nodes legend"
                name="nodesLegend"
                onClick={() => onChange({
                  target: {
                    value: false,
                    name: 'nodesLegend',
                  },
                })}
              >
                <CloseIcon />
              </IconButton>
            </div>
            <List className="node-colors" dense>
              {Object.keys(graphOptions.nodesColors).map((key) => (
                <ListItem key={key}>
                  <ListItemIcon>
                    <div
                      className="color-chip"
                      style={{ backgroundColor: graphOptions.nodesColors[key] }}
                    />
                  </ListItemIcon>
                  <ListItemText primary={typeof key === 'object'
                    ? key.displayName || util.antiCamelCase(key.name)
                    : key}
                  />
                </ListItem>
              ))}
              {(propsMap.nodeProps[graphOptions.nodesColor] || []).includes('null') && (
                <ListItem key="null">
                  <ListItemIcon>
                    <div
                      className="color-chip"
                      style={{ backgroundColor: graphOptions.defaultColor }}
                    />
                  </ListItemIcon>
                  <ListItemText primary="Null" />
                </ListItem>
              )}
            </List>
          </div>
        </Paper>
      )}
      {!linkDisabled
        && graphOptions.linksLegend
        && graphOptions.linksColor
        && (
          <Paper elevation={2}>
            <div className="legend-content">
              <div className="legend-header">
                <div className="legend-header-text">
                  <Typography variant="subtitle1">Edges</Typography>
                  <Typography variant="caption">
                    {graphOptions.linksColor && `(${util.antiCamelCase(graphOptions.linksColor)})`}
                  </Typography>
                </div>
                <IconButton
                  aria-label="links legend"
                  name="linksLegend"
                  onClick={() => onChange({
                    target: {
                      value: false,
                      name: 'linksLegend',
                    },
                  })}
                >
                  <CloseIcon />
                </IconButton>
              </div>
              <List className="node-colors" dense>
                {Object.keys(graphOptions.linksColors).map((key) => (
                  <ListItem key={key}>
                    <ListItemIcon>
                      <div
                        className="color-chip"
                        style={{ backgroundColor: graphOptions.linksColors[key] }}
                      />
                    </ListItemIcon>
                    <ListItemText primary={util.antiCamelCase(key)} />
                  </ListItem>
                ))}
                {(propsMap.linkProps[graphOptions.linksColor] || []).includes('null') && (
                  <ListItem key="null">
                    <ListItemIcon>
                      <div
                        className="color-chip"
                        style={{ backgroundColor: graphOptions.defaultColor }}
                      />
                    </ListItemIcon>
                    <ListItemText primary="Null" />
                  </ListItem>
                )}
              </List>
            </div>
          </Paper>
        )}
    </div>
  );
}

GraphLegend.defaultProps = {
  linkDisabled: true,
};

export default GraphLegend;
