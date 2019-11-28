import notation from '@bcgsc/knowledgebase-parser/doc/notation.md';
import marked from 'marked';
import React from 'react';

import { LocationPropType } from '@/components/types';


class AboutNotation extends React.Component {
  static propTypes = {
    location: LocationPropType.isRequired,
  };

  constructor(props) {
    super(props);
    this.state = {
      content: '',
    };

    this.controllers = [];
  }

  async componentDidMount() {
    await this.getContent();
  }

  componentWillUnmount() {
    this.controllers.forEach(c => c.abort());
  }

  /**
   * Fetch the content from the file and convert it to html.
   * The links in the parsed markdown are all relative to the base url
   * and must be adjusted for the route location associated with this component
   */
  async getContent() {
    const { location: { pathname } } = this.props;

    const controller = new AbortController();
    this.controllers.push(controller);

    const file = await fetch(notation, { signal: controller.signal });
    const text = await file.text();
    const htmlContent = marked(text);
    this.setState({ content: htmlContent.replace(/href="(#[^"]+)"/g, `href="${pathname}$1"`) });
  }

  render() {
    const { content } = this.state;

    return (
      <div
        className="about-page__content"
        dangerouslySetInnerHTML={{ __html: content }}
        id="about-notation"
      />
    );
  }
}


export default AboutNotation;
