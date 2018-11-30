import { expect } from 'chai';
import { schema as SCHEMA_DEFN } from '@bcgsc/knowledgebase-schema';
import Schema from '../schema';


describe('Schema wrapper class tests', () => {
  describe('Retrieving classmodels and properties', () => {
    const testSchema = new Schema(SCHEMA_DEFN);
    it('gets classes properly', () => {
      Object.keys(SCHEMA_DEFN).forEach((key) => {
        expect(testSchema.get(key)).to.not.eq(undefined);
      });
    });
    it('returns proper metadata fields', () => {
      const metadata = testSchema.getMetadata();
      const V = testSchema.get('V');

      metadata.forEach((prop) => {
        expect(V.properties[prop.name]).to.not.eq(undefined);
      });
    });
    it('returns the right properties list', () => {
      const ontology = testSchema.get('Ontology');
      const testProps = testSchema.getProperties('Ontology');

      testProps.forEach((prop) => {
        expect(ontology.properties[prop.name]).to.not.eq(undefined);
      });
    });
    it('returns proper subclasses of common abstract classes', () => {
      const ontologies = Object.values(testSchema.schema)
        .filter(model => model.inherits && model.inherits.includes('Ontology'));
      const variants = Object.values(testSchema.schema)
        .filter(model => model.inherits && model.inherits.includes('Variant'));

      expect(testSchema.getOntologies(true)).to.eql(ontologies);
      expect(testSchema.getOntologies()).to.not.eql(ontologies);

      expect(testSchema.getVariants(true)).to.eql(variants);
      expect(testSchema.getVariants()).to.not.eql(variants);
    });
    it('Returns edges', () => {
      const edges = Object.values(testSchema.schema)
        .filter(model => model.inherits && model.inherits.includes('E'))
        .map(model => model.name);
      expect(testSchema.getEdges()).to.eql(edges);

      const testNode = {
        in_AliasOf: [
          'inalias',
        ],
        out_AliasOf: [
          'outalias',
        ],
        in_GeneralizationOf: [
          'ingeneralization',
        ],
      };
      expect(testSchema.getEdges(testNode)).to.eql(['inalias', 'outalias', 'ingeneralization']);
    });
  });

  describe('util functions', () => {
    const testSchema = new Schema({
      Embedded: {
        name: 'Embedded',
        properties: {
          embeddedName: {
            type: 'string',
            name: 'embeddedName',
          },
        },
      },
      V: {
        properties: {},
      },
      Test: {
        name: 'Test',
        properties: {
          name: {
            type: 'string',
            name: 'name',
          },
          embeddedset: {
            type: 'embeddedset',
            name: 'embeddedset',
          },
          num: {
            type: 'integer',
            name: 'num',
            min: 0,
          },
          linked: {
            type: 'link',
            name: 'linked',
          },
          bool: {
            type: 'boolean',
            name: 'bool',
          },
          embed: {
            type: 'embedded',
            name: 'embed',
            linkedClass: {
              name: 'Embedded',
              isAbstract: true,
              properties: {
                embeddedName: {
                  type: 'string',
                  name: 'embeddedName',
                },
              },
            },
          },
        },
      },
    });

    it('initModel()', () => {
      const expected = {
        '@class': 'Test',
        name: '',
        embeddedset: [],
        num: '',
        linked: '',
        bool: false,
        'linked.data': null,
        embed: {
          '@class': '',
          embeddedName: '',
        },
      };
      expect(testSchema.initModel({}, 'Test')).to.eql(expected);
    });

    it('collectOntologyProps()', () => {
      const testRecords = [
        {
          '@class': 'Test',
          name: 'testname',
        },
        {
          '@class': 'Test',
          name: 'blargh',
          embed: {
            '@class': 'Embedded',
            embeddedName: 'tsets',
          },
        },
      ];
      const allColumns = testSchema.collectOntologyProps(testRecords[0], []);
      expect(allColumns).to.eql(['name']);
      expect(testSchema.collectOntologyProps(testRecords[1], allColumns))
        .to.eql(['name', 'embed.embeddedName', 'embed.@class']);
    });
  });
});
