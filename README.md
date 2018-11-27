# Knowledge Base GUI

## What you need to know

This is the front end for the Knowledge Base database. Users can query the database, view results in a table or graph view, edit record properties, and add or delete records.

### Querying
The query page allows users to search records by name or shorthand. Submit the query by pressing `Enter` or by clicking on the search icon.

The advanced querying page allows users to specify additional search parameters, depending on the specified record class. The query builder page allows any precise query to be constructed using JSON format. Use of the knowledgebase specification is recommended for beginners, and can be found [here](http://kbapi01:8061/api/v0.6.1/spec/).

##### Example Query
```
{
  "@class": "Statement",
  "supportedby": {
    "v": {
      "name": "~angiosarcoma"
    }
  }
}
// "Return statements that are supported by records with the name property containing 'angiosarcoma'"
```


### Data Viewing

The query results can be viewed in either table or graph form. In table form, data can be sorted by any of its attributes, or their subproperties. Each row can be clicked to see record details in a side drawer.

In graph form, nodes can be expanded by clicking them if they are the currently selected node. Related nodes are highlighted with configurable colors. Graph properties such as coloring, labelling, and simulation behaviour can also be configured in the toolbar.

### Forms

Records can be edited by clicking the `Edit` button in the details drawer, and new records can be submitted by selecting the appropriate class under the `Add` subheader in the main navigation drawer.
