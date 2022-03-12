import {
  List,
  ListItem,
  Typography,
} from '@material-ui/core';
import React from 'react';

// static content
import listFields from '@/static/images/list-fields.png';
import selectFields from '@/static/images/select-fields.png';
import singleAutocomplete1 from '@/static/images/single-autocomplete-1.png';
import singleAutocomplete2 from '@/static/images/single-autocomplete-2.png';
import singleAutocomplete3 from '@/static/images/single-autocomplete-3.png';


const AboutForms = () => (
  <>
    <Typography id="about-forms" variant="h2">
      GraphKB Forms
    </Typography>
    <Typography paragraph>
      When filling out forms, certain fields will behave differently from
      others based on the type of input. The following are several of the
      core field types that you will encounter when interacting with
      GraphKB through this GUI:
    </Typography>
    <Typography variant="h3">List Fields</Typography>
    <Typography paragraph>
      List fields are used for properties that are lists of
      strings. To use these, simply type the item you wish to add
      to the list, and press enter or click the add button to add
      it to the list. Items can be deleted by backspacing against
      them or clicking the <q>x</q> shown in the example image.

    </Typography>
    <img alt="List Fields" src={listFields} />
    <Typography variant="h3">Link Fields</Typography>
    <Typography paragraph>
      Some records in GraphKB are dependent on or reference others.
      To express these links in forms, a small query bar is
      included to allow you to find the linked record you need.
      Start typing and wait for the dropdown list of items to
      appear for you to pick from. The default query logic is to
      match the record <q>name</q> property. If you require more control
      over finding this linked record, some link fields have an
      expand button that creates a mini-form to fill out, similar
      to the Advanced Query form. You can clear the existing linked
      record by clicking the <q>x</q> as shown in the example image.
    </Typography>
    <List>
      <ListItem className="about-page__image-list">
        <Typography variant="h4">Before Input</Typography>
        <img alt="blank link field" src={singleAutocomplete1} />
      </ListItem>
      <ListItem className="about-page__image-list">
        <Typography variant="h4">Auto-completion on Type</Typography>
        <img alt="searching link field" src={singleAutocomplete2} />
      </ListItem>
      <ListItem className="about-page__image-list">
        <Typography variant="h4">Selected Input</Typography>
        <img alt="selected link field" src={singleAutocomplete3} />
      </ListItem>
    </List>
    <Typography variant="h3">Select Fields</Typography>
    <Typography paragraph>
      Select fields are used to select an item from a set of
      options. Most selects are able to be set to a null/empty
      value, but for mandatory selects an option must be chosen
      before submitting the form.
    </Typography>

    <img alt="Select Fields" src={selectFields} />
  </>
);

export default AboutForms;
