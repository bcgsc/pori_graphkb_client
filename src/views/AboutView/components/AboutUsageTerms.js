import React from 'react';
import {
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
} from '@material-ui/core';

const AboutUsageTerms = () => {
  const sectionData = [
    { label: 'Copyright', id: 'copyright', content: 'Aliquip culpa aute eiusmod aliquip enim irure in minim ut pariatur incididunt. Ad do aliquip quis sint sint sit aliquip sit esse ex. Incididunt id commodo exercitation sint magna officia aute. Labore ea proident do labore veniam dolore non ipsum. Tempor nostrud ut ullamco voluptate esse minim reprehenderit mollit aliquip id ut sint officia. Excepteur in commodo laborum sint incididunt laborum. Aliqua cillum excepteur exercitation consequat et aliquip.' },
    { label: 'Use of GraphKB', id: 'useof', content: 'Aliquip culpa aute eiusmod aliquip enim irure in minim ut pariatur incididunt. Ad do aliquip quis sint sint sit aliquip sit esse ex. Incididunt id commodo exercitation sint magna officia aute. Labore ea proident do labore veniam dolore non ipsum. Tempor nostrud ut ullamco voluptate esse minim reprehenderit mollit aliquip id ut sint officia. Excepteur in commodo laborum sint incididunt laborum. Aliqua cillum excepteur exercitation consequat et aliquip.' },
    { label: 'Third-Party Platforms, Products, and Services', id: 'thirdparty', content: 'Aliquip culpa aute eiusmod aliquip enim irure in minim ut pariatur incididunt. Ad do aliquip quis sint sint sit aliquip sit esse ex. Incididunt id commodo exercitation sint magna officia aute. Labore ea proident do labore veniam dolore non ipsum. Tempor nostrud ut ullamco voluptate esse minim reprehenderit mollit aliquip id ut sint officia. Excepteur in commodo laborum sint incididunt laborum. Aliqua cillum excepteur exercitation consequat et aliquip.' },
    { label: 'Disclaimers', id: 'disclaimers', content: 'Aliquip culpa aute eiusmod aliquip enim irure in minim ut pariatur incididunt. Ad do aliquip quis sint sint sit aliquip sit esse ex. Incididunt id commodo exercitation sint magna officia aute. Labore ea proident do labore veniam dolore non ipsum. Tempor nostrud ut ullamco voluptate esse minim reprehenderit mollit aliquip id ut sint officia. Excepteur in commodo laborum sint incididunt laborum. Aliqua cillum excepteur exercitation consequat et aliquip.' },
    { label: 'Limitation of Liability', id: 'limits', content: 'Aliquip culpa aute eiusmod aliquip enim irure in minim ut pariatur incididunt. Ad do aliquip quis sint sint sit aliquip sit esse ex. Incididunt id commodo exercitation sint magna officia aute. Labore ea proident do labore veniam dolore non ipsum. Tempor nostrud ut ullamco voluptate esse minim reprehenderit mollit aliquip id ut sint officia. Excepteur in commodo laborum sint incididunt laborum. Aliqua cillum excepteur exercitation consequat et aliquip.' },
  ];

  const tableOfContents = [];
  const sections = [];

  sectionData.forEach((sectionDatum) => {
    const anchorId = sectionDatum.id;
    const tocSection = (
      <ListItem>
        <ListItemIcon className="letter-icon">
          {sectionDatum.label.slice(0, 1)}
        </ListItemIcon>
        <ListItemText>
          <a href={`about/terms#${anchorId}`}> {sectionDatum.label}</a>
        </ListItemText>
      </ListItem>
    );
    tableOfContents.push(tocSection);

    const section = (
      <div className="terms-section">
        <Typography variant="h3" id={sectionDatum.id}>
          {sectionDatum.label}
        </Typography>
        <Typography paragraph>
          {sectionDatum.content}
        </Typography>
      </div>
    );
    sections.push(section);
  });

  return (
    <div className="about-page__content">
      <Typography variant="h2">
            GraphKB Terms of Use
      </Typography>
      <List>
        {tableOfContents}
      </List>
      {sections}
    </div>
  );
};

export default AboutUsageTerms;
