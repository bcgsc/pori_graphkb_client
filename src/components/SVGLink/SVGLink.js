import React, { Component } from 'react';
import './SVGLink.css';

class SVGLink extends Component {
    constructor(props) {
        super(props);
        this.state = {
            endMarker: 'url(#arrow)',
            startMarker:(props.link.type==='alias') ? 'url(#darrow': '',
        }
    }

    render() {
        return (
            <g>
                <path
                    className="link"
                    d={"M" + (this.props.link.source.x || 0) + " " + (this.props.link.source.y || 0) 
                        + "L" + (this.props.link.target.x || 0) + " " + (this.props.link.target.y || 0)
                    }
                    markerEnd={this.state.endMarker}
                    markerStart={this.state.startMarker}
                />
            </g>
        )
    }

} export default SVGLink