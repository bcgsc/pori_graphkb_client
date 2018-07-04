import React, { Component } from 'react';
import PropTypes from 'prop-types';
import './SVGLink.css';

class SVGLink extends Component {
  constructor(props) {
    super(props);

    this.state = {
      endMarker: 'url(#arrow)',
      startMarker: (props.link.type === 'alias') ? 'url(#darrow' : '',
    };
  }

  render() {
    const { link } = this.props;
    const { endMarker, startMarker } = this.state;
    return (
      <g>
        <path
          className="link"
          d={`M${(link.source.x || 0)} ${(link.source.y || 0)}L${(link.target.x || 0)} ${(link.target.y || 0)}`}
          markerEnd={endMarker}
          markerStart={startMarker}
        />
      </g>
    );
  }
}

SVGLink.propTypes = {
  link: PropTypes.object.isRequired,
};

export default SVGLink;
