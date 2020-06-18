import React from 'react';


/**
 * @typedef GridContext
 * Passes ag-grid values to wrapped consumers.
 *
 * @property {Object} colApi the ag-grid column api
 * @property {Object} gridApi the ag-grid api
 * @property {bool} gridReady true when the grid is ready to be interacted with
 */
const GridContext = React.createContext({
  colApi: {},
  gridApi: {},
  gridReady: false,
});


export default GridContext;
