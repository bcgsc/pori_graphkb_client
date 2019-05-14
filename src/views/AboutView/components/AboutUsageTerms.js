import React, { Component } from 'react';
import {
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
} from '@material-ui/core';

class AboutUsageTerms extends Component {
    state = {
      sections: ['CopyRight', 'Use of GraphKB', 'Third-Party Platforms, Products, and Services',
        'Disclaimers', 'Limitation of Liability'],
      sectionAnchorIds: ['copyright', 'useof', 'thirdparty', 'disclaimers', 'limits'],
    };

    render() {
      const { sections, sectionAnchorIds } = this.state;
      const tableOfContents = sections.map((section, index) => {
        const anchorId = sectionAnchorIds[index];
        return (
          <ListItem>
            <ListItemIcon className="letter-icon">
              {section.slice(0, 1)}
            </ListItemIcon>
            <ListItemText>
              <a href={`about/usageterms#${anchorId}`}> {section}</a>
            </ListItemText>
          </ListItem>
        );
      });
      return (
        <div className="about-page__content">
          <Typography variant="h5" component="h2">
            GraphKB Terms of Use
          </Typography>
          <List>
            {tableOfContents}
          </List>
          <Typography variant="h6" component="h3" id={sectionAnchorIds[0]}>
            CopyRight
          </Typography>
          <Typography paragraph>
            Et voluptate eiusmod officia excepteur amet. Voluptate eiusmod amet excepteur cillum commodo quis aute labore Lorem veniam cupidatat fugiat mollit. Fugiat occaecat consectetur aute laboris irure eiusmod sit. Mollit tempor incididunt laboris ex occaecat est sit sint irure eu aliqua. Reprehenderit exercitation voluptate tempor sit deserunt est laboris sit elit do proident nulla non. Eu mollit enim veniam nulla dolor ipsum ullamco consequat.

Sint velit minim tempor id adipisicing esse irure est dolor. <br /><br />Cillum mollit pariatur irure adipisicing eiusmod sit nisi sint dolore. Quis ut reprehenderit sit elit labore amet aliquip officia esse laboris labore ad nisi nulla. Tempor nisi nisi non aliqua in sint cillum in consequat deserunt dolore incididunt. Commodo non adipisicing magna nulla. Est voluptate nulla mollit qui aliquip Lorem.

In Lorem labore officia ullamco ut et incididunt eiusmod sunt dolore eiusmod aliqua cupidatat. Duis elit excepteur esse Lorem commodo consectetur sunt officia quis enim. Dolor laboris incididunt aliqua labore sit sunt aute fugiat duis. Ea adipisicing elit quis cillum voluptate do Lorem. Cupidatat eu cillum laborum cillum voluptate consectetur incididunt ullamco minim. Reprehenderit incididunt cupidatat consequat ea qui.

Veniam amet esse aliqua dolore cupidatat laboris ex commodo esse ut fugiat elit eu. Pariatur in Lorem officia adipisicing eiusmod ea. Ad sit quis occaecat magna officia ullamco id non. Incididunt culpa ullamco nulla consequat ipsum ad ullamco. Nostrud deserunt magna do duis ipsum sint consequat ea occaecat. Veniam ipsum veniam pariatur cillum dolor esse veniam Lorem nostrud laboris. Ea duis aute dolor esse.
          </Typography>
          <Typography variant="h6" component="h3" id={sectionAnchorIds[1]}>
            Use of GraphKB
          </Typography>
          <Typography paragraph>
            Laborum ullamco aliqua occaecat minim sint. Pariatur Lorem reprehenderit Lorem elit deserunt eiusmod commodo voluptate anim nisi. Officia amet non laboris reprehenderit consectetur nisi eu dolore esse velit veniam eu. Eu occaecat nulla quis minim id esse sunt non enim duis sit exercitation sint nulla.

Proident sint tempor mollit nisi dolore elit Lorem deserunt eiusmod magna non magna ut. Officia laboris dolore ex mollit non esse ea incididunt aliqua duis consequat. Mollit enim ut do sit nisi est non adipisicing dolore proident cupidatat aliquip adipisicing adipisicing. Cupidatat dolor adipisicing occaecat enim.

Non sunt fugiat irure officia ullamco ullamco ex ipsum deserunt. Lorem anim eiusmod ut ipsum aliquip dolore laboris veniam eu ad cupidatat ad laborum. Excepteur et et non voluptate consequat est velit do exercitation duis eu mollit. Do sunt et ut veniam veniam elit duis ipsum. In aliqua anim eu in consequat nisi quis.

Occaecat sint pariatur nisi ad laboris. Consequat commodo anim ad elit excepteur aliqua anim velit deserunt aliquip consectetur et. Ea exercitation Lorem sit ex laborum id do quis cillum dolore. Nostrud cillum dolore ea mollit. Et nisi culpa amet dolore nostrud id fugiat. Consectetur mollit consectetur labore mollit aliqua dolore ullamco anim ad. Irure nulla ut est sunt ad proident deserunt ad nisi ut quis voluptate.
          </Typography>
          <Typography variant="h6" component="h3" id={sectionAnchorIds[2]}>
            Third-Party Platforms, Products, and Services
          </Typography>
          <Typography paragraph>
            Nostrud tempor exercitation eu ut minim ipsum mollit nulla irure incididunt proident adipisicing aliquip. Ipsum ea occaecat duis sit non nisi. In quis nulla eu velit magna eiusmod deserunt eu nisi sint nostrud nisi ut.

Aute occaecat consequat dolor aute laborum anim ex laborum et. Minim sint voluptate esse anim et est in ex aliqua. Qui excepteur commodo amet sit proident ullamco commodo et duis nostrud officia adipisicing magna. Ex reprehenderit fugiat id aliquip.

Voluptate id duis ipsum aliquip est aliqua ipsum minim amet mollit. Anim ex ea consectetur velit et.<br /><br /> Veniam magna exercitation anim dolor sint. Adipisicing culpa mollit tempor proident enim dolore pariatur nulla pariatur veniam Lorem laboris exercitation magna. Id proident non ut ex irure occaecat sint cillum in et duis. Culpa ipsum sit ullamco dolor deserunt proident amet id adipisicing sit non dolore consectetur. Laborum excepteur eu nostrud quis anim ipsum reprehenderit incididunt consectetur consectetur eiusmod dolore velit labore.

Do fugiat nulla exercitation velit nostrud nostrud voluptate duis sit. Adipisicing sint dolore dolor in cillum anim. Nostrud adipisicing ad commodo quis veniam ex commodo deserunt labore pariatur.
          </Typography>
          <Typography variant="h6" component="h3" id={sectionAnchorIds[3]}>
            Disclaimers
          </Typography>
          <Typography paragraph>
            Nisi sit pariatur qui et eu consequat quis. Duis ex elit in minim tempor elit eu reprehenderit fugiat ipsum in velit. Consectetur consequat nisi eiusmod excepteur.

Adipisicing eiusmod nulla enim ipsum ea qui dolore eiusmod eu. Qui deserunt magna velit consequat officia magna laborum deserunt sit consequat officia ullamco exercitation id. Est incididunt proident anim ut occaecat.

Non sint occaecat mollit incididunt fugiat quis anim aute nostrud. <br /><br />Magna aliqua amet proident exercitation nulla fugiat id anim velit esse et Lorem ea mollit. Do in consequat laborum culpa ullamco ea non. Adipisicing tempor sint commodo elit non est laboris. Eu id aliquip ullamco qui veniam adipisicing est ea laboris nisi ex laborum Lorem pariatur. Tempor velit non in voluptate tempor minim quis do eu deserunt laboris ea. Cillum nostrud minim qui duis ex culpa commodo nisi Lorem et amet ut occaecat magna.

Ut laborum duis culpa esse ipsum occaecat. Id Lorem officia laborum magna in. Sint eiusmod exercitation occaecat eu. Dolor sint do labore qui aliqua amet ea cillum non consequat eu non ullamco aliquip. Nulla occaecat officia consectetur esse culpa ad consequat mollit id proident nostrud officia in irure. Veniam deserunt nisi deserunt ullamco cupidatat excepteur sunt.
          </Typography>
          <Typography variant="h6" component="h3" id={sectionAnchorIds[4]}>
            Limitation of Liability
          </Typography>
          <Typography paragraph>
            Consequat eu ipsum consectetur reprehenderit culpa cupidatat ut reprehenderit ea labore laborum aliqua officia. Minim esse id ex exercitation amet mollit irure excepteur ea nisi culpa ad deserunt excepteur. In id consectetur excepteur consequat aute culpa. Proident eu officia enim eu pariatur sint. Reprehenderit id laborum non aliquip velit officia. Deserunt quis magna nostrud voluptate. Duis dolore ut ex cupidatat nostrud ad voluptate qui.

Incididunt mollit culpa exercitation deserunt nisi non veniam excepteur. <br /><br />Excepteur ipsum excepteur id sit commodo pariatur. Sint non adipisicing minim irure labore ex sit cupidatat. Do ex cupidatat velit in eiusmod ut reprehenderit sit.

Eiusmod ut veniam cillum excepteur ex ea quis mollit proident veniam magna veniam mollit. Nulla anim officia tempor ad aliquip sunt aliqua sit. Laborum eu sit esse anim sit ad.

Proident laboris tempor in pariatur exercitation consequat laboris reprehenderit ut nisi nulla. Quis esse voluptate anim ad laborum incididunt officia mollit exercitation culpa excepteur. Minim cupidatat et dolor pariatur sit culpa nulla incididunt officia eiusmod consequat laboris veniam exercitation. Laborum reprehenderit mollit duis irure cillum ex mollit aliqua proident do. Anim sint non anim sunt anim. Aute laboris ullamco proident aute magna. Ea mollit Lorem velit est aliquip tempor eiusmod id.
          </Typography>
        </div>
      );
    }
}

export default AboutUsageTerms;
