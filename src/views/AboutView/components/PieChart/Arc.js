import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { arc } from 'd3-shape';

/**
 * This represents a 'wedge' or section of the pie chart and its label
 */
class Arc extends Component {
  constructor() {
    super();
    this.arc = arc();
  }

  static get propTypes() {
    return {
      data: PropTypes.object.isRequired,
      color: PropTypes.string.isRequired,
      innerRadius: PropTypes.number.isRequired,
      outerRadius: PropTypes.number.isRequired,
    };
  }

  componentWillMount() {
    const { outerRadius, innerRadius } = this.props;
    this.updateD3({ outerRadius, innerRadius });
  }

  componentWillReceiveProps(newProps) {
    const { outerRadius, innerRadius } = newProps;
    this.updateD3({ outerRadius, innerRadius });
  }

  updateD3({ innerRadius, outerRadius }) {
    this.arc.innerRadius(innerRadius);
    this.arc.outerRadius(outerRadius);
  }

  render() {
    const { data, color } = this.props;

    const [labelX, labelY] = this.arc.centroid(data);
    const labelTranslate = `translate(${labelX || 0}, ${labelY || 0})`;

    return (
      <g>
        <path
          d={this.arc(data)}
          style={{ fill: color }}
        />
        <g
          transform={labelTranslate}
        >
          <text textAnchor="middle">
            {data.noLabel ? '' : data.label}
          </text>
          <text textAnchor="middle" transform="translate(0,20)">
            {data.noLabel ? '' : `(${data.value})`}
          </text>
        </g>
      </g>
    );
  }
}


export default Arc;
