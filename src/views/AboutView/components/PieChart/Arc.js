import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { arc } from 'd3-shape';

/**
 * This represents a 'wedge' or section of the pie chart and its label
 */
class Arc extends Component {
  static propTypes = {
    data: PropTypes.object.isRequired,
    color: PropTypes.string.isRequired,
    innerRadius: PropTypes.number.isRequired,
    outerRadius: PropTypes.number.isRequired,
    label: PropTypes.string,
    value: PropTypes.number,
  };

  static defaultProps = {
    label: null,
    value: null,
  };

  constructor() {
    super();
    this.arc = arc();
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
    const {
      data, color, label, value,
    } = this.props;
    const [labelX, labelY] = this.arc.centroid(data);
    const labelTranslate = `translate(${labelX || 0}, ${labelY || 0})`;

    return (
      <g>
        <path
          d={this.arc(data)}
          style={{ fill: color }}
        />
        {label && (
        <g
          transform={labelTranslate}
        >
          <text textAnchor="middle">
            {label}
          </text>
          {value && (
            <text textAnchor="middle" transform="translate(0,20)">
              {`(${value})`}
            </text>
          )}
        </g>
        )}
      </g>
    );
  }
}


export default Arc;
