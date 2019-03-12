import React from 'react';
import {
  Typography,
  ListItem,
  List,
  ListItemText,

} from '@material-ui/core';

// static content
import listFields from '../../../static/tutorial/list-fields.png';
import linkFields from '../../../static/tutorial/link-fields.png';
import selectFields from '../../../static/tutorial/select-fields.png';


const AboutForms = () => (
  <div>
    <Typography variant="h5" component="h2" paragraph id="about-forms">
        GraphKB Forms
    </Typography>
    <List>
      <ListItem>
        <Typography paragraph>
            When filling out forms, certain fields will behave differently from
            others based on the type of input. The following are several of the
            core field types that you will encounter when interacting with
            GraphKB through this GUI:
        </Typography>
      </ListItem>
      <ListItem>
        <figure className="two-column-grid">
          <img src={listFields} alt="List Fields" />
          <figcaption>
            <ListItemText
              primary="List Fields"
              secondary={`
                        List fields are used for properties that are lists of
                        strings. To use these, simply type the item you wish to add
                        to the list, and press enter or click the add button to add
                        it to the list. Items can be deleted by backspacing against
                        them or clicking the "x" shown in the example image.
                      `}
            />
          </figcaption>
        </figure>

      </ListItem>
      <ListItem>
        <figure className="two-column-grid">
          <img src={linkFields} alt="Link Fields" />
          <figcaption>
            <ListItemText
              primary="Link Fields"
              secondary={`
                        Some records in GraphKB are dependent on or reference others.
                        To express these links in forms, a small query bar is
                        included to allow you to find the linked record you need.
                        Start typing and wait for the dropdown list of items to
                        appear for you to pick from. The default query logic is to
                        match the record "name" property. If you require more control
                        over finding this linked record, some link fields have an
                        expand button that creates a mini-form to fill out, similar
                        to the Advanced Query form. You can clear the existing linked
                        record by clicking the "x" as shown in the example image.
                    `}
            />
          </figcaption>
        </figure>
      </ListItem>
      <ListItem>
        <figure className="two-column-grid">
          <img src={selectFields} alt="Select Fields" />
          <figcaption>
            <ListItemText
              primary="Select Fields"
              secondary="Select fields are used to select an item from a set of
                        options. Most selects are able to be set to a null/empty
                        value, but for mandatory selects an option must be chosen
                        before submitting the form."
            />
          </figcaption>
        </figure>
      </ListItem>
    </List>
  </div>
);

export default AboutForms;
