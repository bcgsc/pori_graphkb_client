import React, { Component } from 'react';
import {
  Typography, Table, TableHead, TableRow, TableCell, TableBody,
} from '@material-ui/core';

import api from '../../../services/api';
import { KBContext } from '../../../components/KBContext';
import DetailChip from '../../../components/DetailChip';
import {
  PieChart,
} from '.';


class AboutMain extends Component {
  static contextType = KBContext;

  constructor(props) {
    super(props);
    this.state = {
      stats: [{ label: '', value: 0 }], // so that the page doesn't wait to load
      apiVersion: '',
      dbVersion: '',
      guiVersion: process.env.npm_package_version || process.env.REACT_APP_VERSION || '',
      examples: {},
    };
    this.controllers = [];
  }

  async componentDidMount() {
    this.getClassStats();
    this.getVersionInfo();
    this.getClassExamples();
  }

  componentWillUnmount() {
    this.controllers.forEach(c => c.abort());
  }

  async getClassStats() {
    const call = api.get('/stats');
    this.controllers.push(call);

    const stats = await call.request();

    this.setState({
      stats: Array.from(
        Object.keys(stats),
        label => ({ label, value: stats[label] }),
      ),
    });
  }

  async getVersionInfo() {
    const call = api.get('/version');
    this.controllers.push(call);
    const versions = await call.request();
    this.setState({
      apiVersion: versions.api,
      dbVersion: versions.db,
    });
  }

  async getClassExample(model) {
    const call = api.get(`${model.routeName}?limit=1`);
    this.controllers.push(call);
    const result = await call.request();
    if (result.length) {
      this.setState({ [`${model.name}-example`]: result[0] });
    }
  }

  getClassExamples() {
    const { schema } = this.context;

    Object.values(schema.schema)
      .filter(model => !model.isAbstract && !model.embedded)
      .map(model => this.getClassExample(model));
  }


  render() {
    const {
      stats, apiVersion, guiVersion, dbVersion,
    } = this.state;
    const { schema } = this.context;

    const models = Object.values(schema.schema)
      .filter(m => !m.embedded && !m.isAbstract)
      .sort((m1, m2) => m1.name.localeCompare(m2.name));
    const countsByName = {};
    stats.forEach(({ label, value }) => {
      countsByName[label] = value;
    });

    return (
      <>
        <div>
          <div className="two-column-grid">
            <PieChart
              height={500}
              width={500}
              innerRadius={50}
              data={stats}
              colorThreshold={0.05}
            />
            <div className="pie-partner">
              <Typography paragraph>
                Knowlegebase is a curated database of variants in cancer and their therapeutic,
                biological, diagnostic, and prognostic implications according to literature. The
                main use of Knowlegebase is to act as the link between the known and published
                variant information and the expermientally collected data.
              </Typography>
              <Typography variant="h6" component="h4">
                Current Version
              </Typography>
              <Typography paragraph>
                DB ({dbVersion}); API (v{apiVersion}); GUI (v{guiVersion})
              </Typography>

            </div>
          </div>
        </div>
        <div>
          <Typography variant="h5" component="h3">
            Record Classes
          </Typography>
          <Typography paragraph>
            There are a number of record class types that exist in GraphKB. Descriptions of select classes can be found below
          </Typography>
          <Table className="record-classes-table">
            <TableHead>
              <TableRow className="record-classes-table__content-header">
                <TableCell>Name</TableCell>
                <TableCell align="right">Count</TableCell>
                <TableCell>Inherits From</TableCell>
                <TableCell>Example</TableCell>
                <TableCell>Description</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {models.map(model => (
                <TableRow key={model.name}>
                  <TableCell>{model.name}</TableCell>
                  <TableCell align="right">{countsByName[model.name]}</TableCell>
                  <TableCell>{model._inherits.map(i => i.name).join(', ')}</TableCell>
                  <TableCell>
                    {this.state[`${model.name}-example`] && (
                      <DetailChip
                        className="record-autocomplete__chip record-autocomplete__chip--single"
                        label={schema.getLabel(this.state[`${model.name}-example`])}
                        details={this.state[`${model.name}-example`]}
                      />
                    )}
                  </TableCell>
                  <TableCell>{model.description}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </>
    );
  }
}

export default AboutMain;
