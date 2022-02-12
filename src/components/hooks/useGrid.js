import { useMemo, useRef, useState } from 'react';

/**
 * hook for setting up and using ag-grids apis
 */
const useGrid = () => {
  const gridRef = useRef();
  const [delayedRef, setDelayedRef] = useState(null);

  const props = useMemo(() => ({
    ref: gridRef,
    onGridReady: () => {
      setDelayedRef(gridRef);
    },
  }), []);

  return {
    ref: delayedRef,
    props,
  };
};

export default useGrid;
