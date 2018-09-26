import React, { Component } from 'react';
import PropTypes from 'prop-types';
import './PackingVisualization.css';
// import * as d3 from 'd3';

class PackingVisualization extends Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  componentDidMount() {
    const { schema } = this.props;
    console.log(schema);
    const parsedData = Object.values(schema).map(cls => ({
      set: cls.inherits,
      r: 8,
      name: cls.name,
    }));
    const validata = [];
    for (let i = 0; i < parsedData.length; i += 1) {
      const children = parsedData.filter(d => d.set.includes(parsedData[i].name));
      if (children.length > 0) {
        children.forEach((c) => {
          parsedData[i].set.forEach((s) => {
            if (!c.set.includes(s)) {
              c.set.push(s);
            }
          });
        });
      } else {
        validata.push(parsedData[i]);
      }
    }
    console.log(validata);
    window.addEventListener('resize', null);
  }

  componentWillUnmount() {
    window.removeEventListener('resize', null);
  }

  render() {
    return (
      <div className="pie-chart-root">
        <svg
          className="pie-chart-wrapper"
          ref={(node) => { this.pieChart = node; }}
        />
      </div>
    );
  }
}

PackingVisualization.propTypes = {
  schema: PropTypes.object,
};

PackingVisualization.defaultProps = {
  schema: {},
};

export default PackingVisualization;
