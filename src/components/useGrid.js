import { useRef, useState } from 'react';

/**
 * hook for setting up and using ag-grids apis
 * credit: areisle
 */
const useGrid = () => {
  const gridApi = useRef(null);
  const colApi = useRef(null);
  const [gridReady, setGridReady] = useState(false);

  const onGridReady = ({ api, columnApi }) => {
    gridApi.current = api;
    colApi.current = columnApi;
    setGridReady(true);
  };

  return {
    colApi: colApi.current,
    gridApi: gridApi.current,
    gridReady,
    onGridReady,
  };
};

export default useGrid;
