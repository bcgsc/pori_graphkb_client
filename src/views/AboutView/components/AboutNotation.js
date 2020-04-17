import notation from '@bcgsc/knowledgebase-parser/doc/notation.md';
import marked from 'marked';
import React, { useEffect, useState } from 'react';

import { LocationPropType } from '@/components/types';


const AboutNotation = ({ location: { pathname } }) => {
  const [content, setContent] = useState('');

  /**
   * Fetch the content from the file and convert it to html.
   * The links in the parsed markdown are all relative to the base url
   * and must be adjusted for the route location associated with this component
   */
  useEffect(() => {
    let controller;

    const getContent = async () => {
      controller = new AbortController();
      const file = await fetch(notation, { signal: controller.signal });
      const text = await file.text();
      const htmlContent = marked(text);
      setContent(htmlContent.replace(/href="(#[^"]+)"/g, `href="${pathname}$1"`));
    };

    getContent();
    return () => controller && controller.abort();
  }, [pathname]);

  return (
    <div
      className="about-page__content"
      dangerouslySetInnerHTML={{ __html: content }}
      id="about-notation"
    />
  );
};

AboutNotation.propTypes = {
  location: LocationPropType.isRequired,
};


export default AboutNotation;
