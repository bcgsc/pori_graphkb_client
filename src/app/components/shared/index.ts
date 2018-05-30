export * from './node-display/node-display.component';
export * from './link-display/link-display.component';
export * from './search-bar/search-bar.component';

import { NodeDisplayComponent } from './node-display/node-display.component';
import { LinkDisplayComponent } from './link-display/link-display.component';
import { SearchBarComponent } from './search-bar/search-bar.component';


export const SHARED_COMPONENTS = [
    NodeDisplayComponent,
    LinkDisplayComponent,
    SearchBarComponent,
];