export * from './node-display/node-display.component';
export * from './link-display/link-display.component';

import { NodeDisplayComponent } from './node-display/node-display.component';
import { LinkDisplayComponent } from './link-display/link-display.component';

export const SHARED_COMPONENTS = [
    NodeDisplayComponent,
    LinkDisplayComponent
];