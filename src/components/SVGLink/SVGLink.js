import React, { Component } from 'react';
import PropTypes from 'prop-types';
import './SVGLink.css';

/**
 * Display component for graph link objects.
 * @param {Object} props.link - Graph link object to be displayed.
 */
class SVGLink extends Component {
  constructor(props) {
    super(props);
    this.state = {
      displayType: false,
    };
    this.handleDisplayTypeExit = this.handleDisplayTypeExit.bind(this);
    this.handleDisplayTypeEnter = this.handleDisplayTypeEnter.bind(this);
  }

  handleDisplayTypeEnter() {
    this.setState({ displayType: true });
  }

  handleDisplayTypeExit() {
    this.setState({ displayType: false });
  }

  render() {
    const { link, linkHighlighting } = this.props;
    const { displayType } = this.state;
    const left = link.source.x < link.target.x;

    let marker = '';
    if (displayType && linkHighlighting) {
      marker = 'url(#highLightedArrow)';
    } else if (link.source !== link.target) {
      marker = 'url(#endArrow)';
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
        />
        {displayType && linkHighlighting ? (
          <text className="link-label">
            <textPath
              href={`#link${link.data['@rid']}`}
              startOffset="20%"
              side={left ? 'left' : 'right'}
            >
              {link.data['@class']}
            </textPath>
          </text>
        ) : null}
      </g>
    );
  }
}

SVGLink.propTypes = {
  link: PropTypes.object.isRequired,
  linkHighlighting: PropTypes.bool,
};

SVGLink.defaultProps = {
  linkHighlighting: true,
};

export default SVGLink;
