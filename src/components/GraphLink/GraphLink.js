import React, { Component } from 'react';
import PropTypes from 'prop-types';
import './GraphLink.css';

/**
 * Display component for graph link objects.
 * @param {Object} props.link - Graph link object to be displayed.
 */
class GraphLink extends Component {
  constructor(props) {
    super(props);
    this.state = {
      displayType: false,
    };
    this.handleDisplayTypeExit = this.handleDisplayTypeExit.bind(this);
    this.handleDisplayTypeEnter = this.handleDisplayTypeEnter.bind(this);
  }

  /**
   * Highlights link arrows and displays label along link path.
   */
  handleDisplayTypeEnter() {
    this.setState({ displayType: true });
  }

  /**
   * Stops highlight effect and label.
   */
  handleDisplayTypeExit() {
    this.setState({ displayType: false });
  }

  render() {
    const {
      link,
      linkHighlighting,
      detail,
      labelKey,
      color,
    } = this.props;

    const { displayType } = this.state;
    const left = link.source.x < link.target.x;

    let marker = '';
    if (displayType && linkHighlighting) {
      marker = 'url(#highLightedArrow)';
    } else if (link.source !== link.target) {
      marker = 'url(#endArrow)';
    }

    let label = '';
    if (labelKey && labelKey.includes('.')) {
      const keys = labelKey.split('.');
      label = link.data[keys[0]][keys[1]];
    } else if (labelKey) {
      label = link.data[labelKey];
    }

    return (
      <g
        onMouseEnter={this.handleDisplayTypeEnter}
        onMouseLeave={this.handleDisplayTypeExit}
      >
        <path
          className="link-widen"
          d={`M${(link.source.x || 0)} ${(link.source.y || 0)}L${(link.target.x || 0)} ${(link.target.y || 0)}`}
        />
        <path
          className="link"
          id={`link${link.data['@rid']}`}
          d={`M${(link.source.x || 0)} ${(link.source.y || 0)}L${(link.target.x || 0)} ${(link.target.y || 0)}`}
          markerEnd={marker}
          style={{ opacity: detail ? 0.6 : 1 }}
          fill={color}
          stroke={color}
        />
        {displayType ? (
          <text className="link-label">
            <textPath
              href={`#link${link.data['@rid']}`}
              startOffset="20%"
              side={left ? 'left' : 'right'}
            >
              {label}
            </textPath>
          </text>
        ) : null}
      </g>
    );
  }
}

/**
 * @param {Object} link - Graph link object.
 * @param {bool} linkHighlighting - flag for enabling link highlight on hover.
 */
GraphLink.propTypes = {
  link: PropTypes.object.isRequired,
  linkHighlighting: PropTypes.bool,
  detail: PropTypes.string,
  labelKey: PropTypes.string,
  color: PropTypes.string,
};

GraphLink.defaultProps = {
  linkHighlighting: true,
  detail: null,
  labelKey: null,
  color: '#999',
};

export default GraphLink;
