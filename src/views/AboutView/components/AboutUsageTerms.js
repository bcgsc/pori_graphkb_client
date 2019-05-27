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
    { label: 'Copyright', id: 'copyright', content: "Canada's Michael Smith Genome Sciences Centre retains ownership of all intellectual property rights of any kind related to the Platform and Service, including applicable copyrights, patents, trademarks, and other proprietary rights. Other trademarks, service marks, graphics and logos used in connection with the GraphKB platform and its services may be the trademarks of users and third parties. Canada's Michael Smith Genome Sciences Centre does not transfer to users any intellectual property. All rights, titles and interests in and to such property will remain solely with the original owner. Canada's Michael Smith Genome Sciences Centre reserve all rights that are not expressly granted under this Term of Use." },
    { label: 'Use of GraphKB', id: 'useof', content: "Your access to GraphKB content on this platform is provided under, and subject to, a <some sort of open source license>. Except as specifically permitted, no portion of this web site may be distributed or reproduced by any means, or in any form, without the explicit written permission of Canada's Michael Smith Genome Sciences Centre. In particular, you agree not to reproduce, retransmit, distribute, disseminate, sell, publish, broadcast, or circulate the information owned by Canada's Michael Smith Genome Sciences Centre, or received from any other party or individual through the GraphKB platform to anyone, including but not limited to others in your organization. To obtain a license for use of GraphKB other than as expressly granted in these terms of use, including for commercial purposes, please contact <contact information>" },
    { label: 'Third-Party Platforms, Products, and Services', id: 'thirdparty', content: "Canada's Michael Smith Genome Sciences Centre and its affiliates do not assert any proprietary rights, or make any recommendations or endorsements about third-party products and services. References to third-party services and products are provided by GraphKB \"AS IS\", without warranty of any kind, either express or implied. Some GraphKB data may be subject to the copyright of third parties; you should consult these entities for any additional terms of use. \n\nSome GraphKB content may provide links to other Internet sites for the convenience of users. Canada's Michael Smith Genome Sciences Centre and its affiliates are not responsible for the availability or content of these external sites, nor does it endorse, warrant, or guarantee the products, services, or information described or offered at these other Internet sites. Users cannot assume that the external sites will abide by the same Privacy Policy to which Canada's Michael Smith Genome Sciences Centre and its affiliates adhere. It is the responsibility of the user to examine the copyright and licensing restrictions of linked pages and to secure all necessary permissions." },
    { label: 'Disclaimers', id: 'disclaimers', content: "You acknowledge that your use of the GraphKB platform is at your sole risk and that you assume full responsibility for all risk associated therewith. GraphKB and the GraphKB content are intended to be used only as general education and scientific reference tools. By using GraphKB, you expressly acknowledge and agree that use of GraphKB and the GraphKB content are at your sole risk. The BC Cancer Genome Sciences Centre and its affiliates do not warrant the accuracy of the GraphKB content. You acknowledge that Canada's Michael Smith Genome Sciences Centre and its affiliates are not providing medical, diagnostic or any other advice through GraphKB or by providing access to GraphKB content on the platform. The GraphKB content is not intended as a substitute for professional medical advice, diagnosis or treatment." },
    { label: 'Limitation of Liability', id: 'limits', content: "In no event shall Canada's Michael Smith Genome Sciences Centre be liable for any damages or other liability to you or any other users of the GraphKB platform. To the maximum extent permitted by law, in no event shall Canada's Michael Smith Genome Sciences Centre or any of its affiliates be liable for any special, punitive, indirect, incidental or consequential damages, including but not limited to personal injury, wrongful death, loss of goodwill, loss of use, loss of profits, interruption of service or loss of data, whether in any action in warranty, contract, tort or any other theory of liability (including, but not limited to negligence or fundamental breach), or otherwise arising out of or in any way connected with the use of, reliance on, or the inability to use, the GraphKB platform or any service offered through the GraphKB platform or any material or information contained in, accessed through, or information, products or services obtained through this platform, even if an authorized representative of GraphKB or Canada's Michael Smith Genome Sciences Centre is advised of the likelihood or possibility of the same. To the extent any of the above limitations of liability are restricted by applicable federal, state or local law, such limitations shall not apply to the extent of such restrictions." },
    { label: 'Modifications of Terms of Use', id: 'terms', content: "Canada's Michael Smith Genome Sciences Centre reserves the right, at its sole discretion, to amend these Terms of Use at any time and will update these Terms of Use in the event of any such amendments. Users are expected to periodically check the Terms of Use for any amendments, but Canada's Michael Smith Genome Sciences Centre will take reasonable steps to notify users of significant material changes. Users continued use of the platform and/or the services following such changes shall constitute their affirmative acknowledgment of the Terms of Use, the modification, and agreement to abide and be bound by the Terms of Use, as amended." },
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
      <div>
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
