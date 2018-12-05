import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { arc } from 'd3-shape';

class Arc extends Component {
  constructor() {
    super();
    this.arc = arc();
  }

  static get propTypes() {
    return {
      data: PropTypes.object.isRequired,
      color: PropTypes.string.isRequired,
    };
  }

  componentWillMount() {
    this.updateD3(this.props);
  }

  componentWillReceiveProps(newProps) {
    this.updateD3(newProps);
  }

  updateD3({ innerRadius, outerRadius }) {
    this.arc.innerRadius(innerRadius);
    this.arc.outerRadius(outerRadius);
  }

  render() {
    const { data, color } = this.props;
    return (
      <path
        d={this.arc(data)}
        style={{ fill: color }}
      />
    );
  }
}

class LabeledArc extends Arc {
  render() {
    const { data } = this.props.data;
    const [labelX, labelY] = this.arc.centroid(this.props.data);


    const labelTranslate = `translate(${labelX || 0}, ${labelY || 0})`;

    return (
      <g>
        {super.render()}
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


export { LabeledArc, Arc };
