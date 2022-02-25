import { AgGridReact } from 'ag-grid-react';
import {
  LegacyRef, useMemo, useRef, useState,
} from 'react';

/**
 * hook for setting up and using ag-grids apis
 */
const useGrid = () => {
  const gridRef = useRef<AgGridReact>();
  const [delayedRef, setDelayedRef] = useState<typeof gridRef | null>(null);

  const props = useMemo(() => ({
    ref: gridRef as LegacyRef<AgGridReact> | undefined,
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
