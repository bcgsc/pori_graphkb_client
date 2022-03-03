import SVGIcon from '@material-ui/core/SvgIcon';
import React from 'react';

function FilterIcon(props) {
  return (
    <SVGIcon {...props}>
      <g>
        <path
          d="M 14,12L 14,19.8832C 14.0361,20.1782 13.941,20.4862 13.7146,20.7127C 13.324,21.1032 12.6909,21.1032 12.3004,20.7127L 10.2851,18.6974C 10.058,18.4703 9.96296,18.1611 10,17.8653L 10,12L 9.97408,12L 4.21004,4.62237C 3.87002,4.18716 3.94719,3.55871 4.38239,3.21869C 4.56593,3.07529 4.78385,3.0061 5,3.00666L 5,3L 19,3L 19,3.00666C 19.2161,3.0061 19.4341,3.07529 19.6176,3.21869C 20.0528,3.55871 20.13,4.18716 19.79,4.62237L 14.0259,12L 14,12 Z "
          strokeWidth="0.2"
        />
      </g>
    </SVGIcon>
  );
}

export default FilterIcon;