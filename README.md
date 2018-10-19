# Knowledge Base GUI

## What you need to know

This is the front end for the Knowledge Base database. Users can query the database, view results in a table or graph view, edit record properties, and add or delete records.

### Querying
The query page allows users to search records by name, with action buttons to view the results in either table or graph form. This simple query will also return records with names that contain the input string.

The advanced querying page allows users to specify additional search parameters. The disease schema can be found [here](http://kbapi01:8061/api/v0.6.1/spec/#/Disease/get_diseases):

### Data View

The query results can be viewed in either table or graph form. In table form, data can be sorted by source, source ID, or name, as well as whether or not the record has been staged to be viewed in graph form. Each row can be expanded to see record details.

In graph form, nodes can be expanded by clicking them if they are the currently selected node. Related nodes are highlighted with configurable colors. When switching to graph view from table view, the application will display all records that have their checkboxes checked. If none are checked, it will default to the currently selected node. Graph properties can also be configured in the toolbar.

### Forms

Records can be edited via the table view by clicking on the clipboard icon in the top right of the details dropdown. Records can be added via the add node form, which can be accessed by the add icon in the application header.

For more info on the database api, look [here](http://kbapi01:8061/api/v0.6.1/spec):


## Testing
Unit tests are made using Jest and Enzyme, end to end tests are made using Cypress.

#### To run tests:
In terminal before running any test commands:

```
$ export USER='myusername'
$ export PASSWORD='mysupersecretpassword'
```

##### Jest Unit tests
* `npm run test:unit`

##### Cypress Integration tests
Running all end to end tests:
* `npm run cypress:run` or `npm run test:e2e`

Opening cypress dashboard, run individual tests in mock browser.
* `npm run cypress:open`

##### Run everything (takes a long time)
* `npm run test`

##### Continuous Integration testing
* `npm run test:ci`
