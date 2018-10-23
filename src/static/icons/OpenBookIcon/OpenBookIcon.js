import React from 'react';
import SVGIcon from '@material-ui/core/SvgIcon';

function OpenBookIcon(props) {
  return (
    <SVGIcon {...props}>
      <g>
        <path
          strokeWidth="0.2"
          d="m 3,24 c -1.1151431,0 -1.9194001,-0.310887 -2.41277114,-0.932659 C 0.19574292,22.573971 0,21.884857 0,21 L 0.03124988,11.84534 0,3 H 18 l -6.12e-4,9 c -2.04e-4,3 0.0072,6.990707 1.503922,7 1.49669,0.005 1.49669,-3.995025 1.49669,-6.995025 V 6 h 3 l 0.108327,8.5608818 -0.108327,7.439118 -2,2 H 12 c -5.2790517,0.03427 -8.7311086,0 -9,0 z M 14,18 H 4 l 0,2 H 14 Z m 0,-4 H 4 l 0,2 H 14 Z m 0,-7 -10,-2e-7 V 11 H 14 Z"
        />
      </g>
    </SVGIcon>
  );
}

export default OpenBookIcon;
