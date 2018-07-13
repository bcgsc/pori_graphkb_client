# Knowledge Base GUI

## What you need to know

This is the front end for the Knowledge Base database. Users can query the database, view results in a table or graph view, edit record properties, and add or delete records.

### Querying
The query page allows users to search records by name, with action buttons to view the results in either table or graph form. This simple query will also return records with names that contain the input string.

The advanced querying page allows users to specify additional search parameters. The disease schema can be found here: http://kbapi01:8008/api/v0.0.8/spec/#/Disease/get_diseases

### Data View

The query results can be viewed in either table or graph form. In table form, data can be sorted by source, source ID, or name, as well as whether or not the record has been staged to be viewed in graph form. Each row can be expanded to see record details.

In graph form, nodes can be expanded by clicking them if they are the currently selected node. Related nodes are highlighted with configurable colors. When switching to graph view from table view, the application will display all records that have their checkboxes checked. If none are checked, it will default to the currently selected node. Graph properties can also be configured in the toolbar.

### Forms

Records can be edited via the table view by clicking on the clipboard icon in the top right of the details dropdown. Records can be added via the add node form, which can be accessed by the add icon in the application header.

For more info on the database api, look here: http://kbapi01:8008/api/v0.0.8/spec


## Testing

End to end tests are made using cypress.io.

To run tests:
* `npm run cypress:open`

This will open the cypress dashboard, which will list the available tests for the application. Clicking on an will open a new browser tab and run the suite.

#### Important: to run the authentication tests, you must set your password via the USER and PASSWORD environment variables in the same terminal you run cypress:open in:

```
$ export CYPRESS_USER='myusername'
$ export CYPRESS_PASSWORD='mysupersecretpassword'
$ npm run cypress:open
```
