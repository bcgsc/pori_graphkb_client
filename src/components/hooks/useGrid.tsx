import { AgGridReact } from 'ag-grid-react';
import {
  useMemo, useRef, useState,
} from 'react';

/**
 * hook for setting up and using ag-grids apis
 */
const useGrid = () => {
  const gridRef = useRef<AgGridReact>(null);
  const [delayedRef, setDelayedRef] = useState<typeof gridRef | null>(null);

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
