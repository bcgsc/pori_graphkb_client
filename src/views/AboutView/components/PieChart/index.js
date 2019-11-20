import { pie } from 'd3-shape';
import { PropTypes } from 'prop-types';
import React, { Component } from 'react';

import util from '@/services/util';
import config from '@/static/config';

import Arc from './Arc';

const { DEFAULT_NODE_COLOR } = config.GRAPH_DEFAULTS;

class PieChart extends Component {
  static propTypes = {
    width: PropTypes.number,
    height: PropTypes.number,
    innerRadius: PropTypes.number,
    data: PropTypes.array.isRequired,
    colorThreshold: PropTypes.number,
  };

  static defaultProps = {
    height: 50, width: 400, innerRadius: 10, colorThreshold: 0.05,
  };

  constructor() {
    super();
    this.pie = pie().value(d => d.value);
  }

  arcGenerator(arcProps, index) {
    const {
      width, height, innerRadius, colorThreshold,
    } = this.props;

    const {
      data: {
        label, fraction, color, value,
      }, ...data
    } = arcProps;

    const outerRadius = Math.min(width, height) / 2;

    return (
      <Arc
        key={`arc-${index}`}
        data={data}
        innerRadius={innerRadius}
        outerRadius={outerRadius}
        color={color}
        label={fraction >= colorThreshold ? label : null}
        value={value}
      />
    );
  }

  render() {
    const {
      data, width, height, colorThreshold,
    } = this.props;

    const total = data.reduce((acc, curr) => acc + curr.value, 0);

    const x = width / 2;
    const y = height / 2;


    const colors = util.getPallette(data.filter(d => d.value / total >= colorThreshold).length);

    let colorIndex = 0;

    for (const datum of data) { // eslint-disable-line
      datum.fraction = datum.value / total;

      if (datum.fraction >= colorThreshold) {
        datum.color = colors[colorIndex];
        colorIndex += 1;
      } else {
        datum.color = DEFAULT_NODE_COLOR;
        datum.noLabel = true;
      }
    }

    const layout = this.pie(data);
    const translate = `translate(${x}, ${y})`;
    const viewBox = `0 0 ${width} ${height}`;

    return (
      <svg
        width={width}
        height={height}
        viewBox={viewBox}
        className="pie-chart"
      >
        <g transform={translate}>
          {layout.map((d, i) => this.arcGenerator(d, i))}
        </g>
      </svg>
    );
  }
}

export default PieChart;
