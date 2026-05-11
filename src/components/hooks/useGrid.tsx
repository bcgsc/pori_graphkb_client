import { AgGridReact } from 'ag-grid-react';
import {
  useMemo, useRef, useState,
} from 'react';

const TESTING = process.env.NODE_ENV === 'test' || process.env.STORYBOOK === 'true';

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
    ensureDomOrder: TESTING,
    suppressColumnVirtualisation: TESTING,
  } satisfies React.ComponentProps<typeof AgGridReact> & { ref: unknown }), []);

  return {
    ref: delayedRef,
    props,
  };
};

export default useGrid;
