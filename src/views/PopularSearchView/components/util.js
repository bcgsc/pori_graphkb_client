import api from '../../../services/api';

const vocabularyRIDGenerator = async (vocabName) => {
  const sensitivityRIDSearch = {
    target: 'Vocabulary',
    filters: { name: vocabName },
    returnProperties: ['@rid'],
  };
  const call = api.post('/query', sensitivityRIDSearch);
  const record = await call.request();
  const [vocab] = record;
  const { '@rid': rid } = vocab;
  return rid;
};

const keywordRIDGenerator = async (modelName, keyword) => {
  const search = {
    queryType: 'keyword',
    keyword,
    target: modelName,
    returnProperties: ['@rid'],
  };

  const call = api.post('/query', search);
  const records = await call.request();
  const ridArr = records.map(rec => rec['@rid']);
  return ridArr;
};


const SEARCH_OPTS = {
  DRUG: [
    {
      label: 'Given a drug, find all variants associated with therapeutic sensitivity',
      requiredInput: {
        label: 'Drug', property: 'name', class: 'Therapy', example: ' Ex. Adriamycin',
      },
      search: {
        target: 'Statement',
        filters: {
          AND: [
            {
              subject: ['drug therapy rids'], operator: 'IN',
            },
            {
              relevance: 'relevance rid', operator: '=',
            },
          ],
        },
      },
      set relevanceRID(rid) { this.search.filters.AND[1].relevance = rid; },
      set subjectRIDs(ridArr) { this.search.filters.AND[0].subject = ridArr; },
      async buildSearch(keyword) {
        // set vocab rid
        this.relevanceRID = await vocabularyRIDGenerator('sensitivity');
        this.subjectRIDs = await keywordRIDGenerator('Therapy', keyword);
      },
    },
    {
      label: 'Given a drug, find all variants associated with resistance',
      requiredInput: {
        label: 'Drug', property: 'name', class: 'Therapy', example: ' Ex. Adriamycin',
      },
      search: {
        target: 'Statement',
        filters: {
          AND: [
            {
              subject: ['drug therapy rids'], operator: 'IN',
            },
            {
              relevance: 'resistance RID', operator: '=',
            },
          ],
        },
      },
      set relevanceRID(rid) { this.search.filters.AND[1].relevance = rid; },
      set subjectRIDs(ridArr) { this.search.filters.AND[0].subject = ridArr; },
      async buildSearch(keyword) {
        // set vocab rid
        this.relevanceRID = await vocabularyRIDGenerator('resistance');
        this.subjectRIDs = await keywordRIDGenerator('Therapy', keyword);
      },
    },
    {
      label: 'Given a drug, find all variants with pharmacogenomic information',
      requiredInput: {
        label: 'Drug', property: 'name', class: 'Therapy', example: ' Ex. Adriamycin',
      },
      search: {
        target: 'Statement',
        filters: {
          AND: [
            {
              subject: ['RID Arr'], operator: 'IN',
            },
            {
              relevance: ['RID Arr'], operator: 'IN',
            },
          ],
        },
      },
      set relevanceRIDs(ridArr) { this.search.filters.AND[1].relevance = ridArr; },
      set therapyRIDs(ridArr) { this.search.filters.AND[0].subject = ridArr; },
      async buildSearch(keyword) {
        // fetch pharmacogenomic rids first
        const pharmaSearch = {
          queryType: 'similarTo',
          target: {
            target: 'Vocabulary',
            filters: { name: 'pharmacogenomic' },
          },
          returnProperties: ['@rid'],
        };

        const pharmaCall = api.post('/query', pharmaSearch);
        const records = await pharmaCall.request();
        const ridArr = records.map(rec => rec['@rid']);
        this.relevanceRIDs = ridArr;

        // fetch therapy rids
        this.therapyRIDs = await keywordRIDGenerator('Therapy', keyword);
      },
    },
    {
      label: 'Given a drug, find all diseases it is approved for use',
      requiredInput: {
        label: 'Drug', property: 'name', class: 'Therapy', example: ' Ex. Adriamycin',
      },
    },
  ],
  DISEASE: [
    {
      label: 'Given a disease, find all genes associated with therapeutic sensitivity',
      requiredInput: {
        label: 'Disease', property: 'name', class: 'Disease', example: 'Ex. Cancer',
      },
      search: {
        target: 'Statement',
        filters: {
          AND: [
            {
              conditions: ['loose match to gene RIDs'], operator: 'CONTAINSANY',
            },
            {
              relevance: 'sensitivityRID', operator: '=',
            },

          ],
        },
      },
      set relevanceRID(rid) { this.search.filters.AND[1].relevance = rid; },
      set conditionsRIDs(ridArr) { this.search.filters.AND[0].conditions = ridArr; },
      async buildSearch(keyword) {
        this.relevanceRID = await vocabularyRIDGenerator('sensitivity');
        this.conditionsRIDs = await keywordRIDGenerator('Disease', keyword);
      },
    },
    {
      label: 'Given a disease, find all genes associated with therapeutic resistance',
      requiredInput: {
        label: 'Disease', property: 'name', class: 'Disease', example: 'Ex. Cancer',
      },
      search: {
        target: 'Statement',
        filters: {
          AND: [
            {
              conditions: [], operator: 'CONTAINSANY',
            },
            {
              relevance: [], operator: 'IN',
            },
          ],
        },
      },
      set relevanceRID(rid) { this.search.filters.AND[1].relevance = rid; },
      set conditionsRIDs(ridArr) { this.search.filters.AND[0].conditions = ridArr; },
      async buildSearch(keyword) {
        this.relevanceRID = await vocabularyRIDGenerator('resistance');

        this.conditionsRIDs = await keywordRIDGenerator('Disease', keyword);
      },
    },
    {
      label: 'Given a disease, find all variants associated with a relevance',
      requiredInput: {
        label: 'Disease', property: 'name', class: 'Disease', example: 'Ex. Cancer',
      },
      search: {
        target: 'Statement',
        filters: {
          AND: [
            {
              conditions: {
                queryType: 'similarTo',
                target: {
                  queryType: 'keyword',
                  keyword: 'DISEASE OF INTEREST',
                  target: 'Disease',
                },
              },
            },
          ],
        },
      },
      set searchInput(keyword) { this.search.filters.AND[0].conditions.target.keyword = keyword; },
    },
  ],
  VARIANT: [
    {
      label: 'Given a variant, find all therapies associated with sensitivity for Disease(s)',
      requiredInput: {
        label: 'Variant', property: 'name', class: 'Variant', example: 'Ex. KRAS:p.G12A',
      },
      optionalInput: {
        label: 'Disease', property: 'name', class: 'Disease', example: 'Ex. Cancer',
      },
      search: {
        target: 'Statement',
        filters: {
          AND: [
            {
              AND: [{ conditions: [], operator: 'CONTAINSANY' }],
            },
            {
              relevance: [], operator: '=',
            },
          ],
        },
      },
      set relevanceRID(rid) { this.search.filters.AND[1].relevance = rid; },
      set conditionsRIDs(ridArr) { this.search.filters.AND[0].AND[0].conditions = ridArr; },
      set optionalDiseaseCondition(cond) { this.search.filters.AND[0].AND.push(cond); },
      async buildSearch(keyword, optionalInput) {
        this.relevanceRID = await vocabularyRIDGenerator('sensitivity');
        this.conditionsRIDs = await keywordRIDGenerator('Variant', keyword);

        if (optionalInput) {
          const diseaseSearch = {
            target: 'Disease',
            filters: { name: optionalInput, operator: 'CONTAINSTEXT' },
            returnProperties: ['@rid'],
          };

          const diseaseCall = api.post('/query', diseaseSearch);
          const dRecord = await diseaseCall.request();
          const [rec] = dRecord;

          const diseaseCondition = { conditions: rec['@rid'], operator: 'CONTAINS' };
          this.optionalDiseaseCondition = diseaseCondition;
        }
      },
    },
    {
      label: 'Given a variant, find all therapies associated with resistance for Disease(s)',
      requiredInput: {
        label: 'Variant', property: 'name', class: 'Variant', example: 'Ex. KRAS:p.G12A',
      },
      optionalInput: {
        label: 'Disease', property: 'name', class: 'Disease', example: 'Ex. Cancer',
      },
      search: {
        target: 'Statement',
        filters: {
          AND: [
            {
              AND: [{ conditions: [], operator: 'CONTAINSANY' }],
            },
            {
              relevance: 'resistance rid', operator: '=',
            },
          ],
        },
      },
      set relevanceRID(rid) { this.search.filters.AND[1].relevance = rid; },
      set conditionsRIDs(ridArr) { this.search.filters.AND[0].AND[0].conditions = ridArr; },
      set optionalDiseaseCondition(cond) { this.search.filters.AND[0].AND.push(cond); },
      async buildSearch(keyword, optionalInput) {
        this.relevanceRID = await vocabularyRIDGenerator('resistance');
        this.conditionsRIDs = await keywordRIDGenerator('Variant', keyword);

        if (optionalInput) {
          const diseaseSearch = {
            target: 'Disease',
            filters: { name: optionalInput, operator: 'CONTAINSTEXT' },
            returnProperties: ['@rid'],
          };

          const diseaseCall = api.post('/query', diseaseSearch);
          const dRecord = await diseaseCall.request();
          const [rec] = dRecord;

          const diseaseCondition = { conditions: rec['@rid'], operator: 'CONTAINS' };
          this.optionalDiseaseCondition = diseaseCondition;
        }
      },
    },
    {
      label: 'Given a variant, find all diseases that the variant is associated with',
      requiredInput: {
        label: 'Variant', property: 'name', class: 'Variant', example: 'Ex. KRAS:p.G12A',
      },
      search: {
        target: 'Statement',
        filters: {
          conditions: [], operator: 'CONTAINSANY',
        },
      },
      set conditionsRIDs(ridArr) { this.search.filters.conditions = ridArr; },
      async buildSearch(keyword) {
        this.relevanceRID = await vocabularyRIDGenerator('resistance');
        this.conditionsRIDs = await keywordRIDGenerator('Variant', keyword);
      },
    },
  ],
  GENE: [
    {
      label: 'Given a gene, find all variants reported for all diseases',
      requiredInput: {
        label: 'Gene', property: 'name', class: 'Feature', example: 'Ex. KRAS',
      },
      search: {
        target: 'Statement',
        filters: {
          conditions: ['list of genes'], operator: 'CONTAINSANY',
        },
      },
      set conditionsRIDs(ridArr) { this.search.filters.conditions = ridArr; },
      async buildSearch(keyword) {
        const geneSearch = {
          queryType: 'similarTo',
          target: {
            target: 'Feature',
            filters: {
              AND: [
                {
                  biotype: 'gene',
                },
                {
                  name: keyword,
                },
              ],
            },
          },
          returnProperties: ['@rid'],
        };

        const call = api.post('/query', geneSearch);
        const records = await call.request();
        const ridArr = records.map(rec => rec['@rid']);
        this.conditionsRIDs = ridArr;
      },
    },
    {
      label: 'Given a gene, find a specific disease and the associated relevances',
      requiredInput: {
        label: 'Gene', property: 'name', class: 'Feature', example: 'Ex. KRAS',
      },
      optionalInput: {
        label: 'Disease', property: 'name', class: 'Disease', example: 'Ex. Melanoma',
      },
      search: {
        target: 'Statement',
        filters: {
          AND: [
            {
              conditions: [], operator: 'CONTAINSANY',
            },
            {
              conditions: 'specific disease', operator: '=',
            },
          ],
        },
      },
      set geneRIDs(ridArr) { this.search.filters.AND[0].conditions = ridArr; },
      set diseaseRID(rid) { this.search.filters.AND[1].conditions = rid; },
      async buildSearch(keyword, disease) {
        const geneSearch = {
          queryType: 'similarTo',
          target: {
            target: 'Feature',
            filters: {
              AND: [
                {
                  biotype: 'gene',
                },
                {
                  name: keyword,
                },
              ],
            },
          },
          returnProperties: ['@rid'],
        };

        const call = api.post('/query', geneSearch);
        const records = await call.request();
        const ridArr = records.map(rec => rec['@rid']);
        this.geneRIDs = ridArr;

        const diseaseSearch = {
          target: 'Disease',
          filters: { name: disease, operator: 'CONTAINSTEXT' },
          returnProperties: ['@rid'],
        };

        const dcall = api.post('/query', diseaseSearch);
        const record = await dcall.request();
        const [rec] = record;
        this.diseaseRID = rec['@rid'];
      },
    },
    {
      label: 'Given a gene, find all variants linked with drug sensitivity or resistance',
      requiredInput: {
        label: 'Gene', property: 'name', class: 'Feature', example: 'Ex. KRAS',
      },
      search: {
        target: 'Statement',
        filters: {
          AND: [
            {
              conditions: [], operator: 'CONTAINSANY',
            },
            {
              relevance: ['relevance RIDs'], operator: 'IN',
            },
          ],
        },
      },
      set relevanceRIDs(ridArr) { this.search.filters.AND[1].relevance = ridArr; },
      set conditionsRIDs(ridArr) { this.search.filters.AND[0].conditions = ridArr; },
      async buildSearch(keyword) {
        const sensitivityRID = await vocabularyRIDGenerator('sensitivity');
        const resistanceRID = await vocabularyRIDGenerator('resistance');
        this.relevanceRIDs = [sensitivityRID, resistanceRID];

        const geneSearch = {
          target: 'Feature',
          filters: {
            AND: [{ biotype: 'gene' }, { name: keyword }],
          },
          returnProperties: ['@rid'],
        };
        const call = api.post('/query', geneSearch);
        const records = await call.request();
        const ridArr = records.map(rec => rec['@rid']);
        this.conditionsRIDs = ridArr;
      },
    },
    {
      label: 'Given a gene, find all variants on the gene',
      requiredInput: {
        label: 'Gene', property: 'name', class: 'Feature', example: 'Ex. KRAS',
      },
      search: {
        target: 'Variant',
        filters: {
          OR: [
            {
              reference1: {
                queryType: 'similarTo',
                target: {
                  target: 'Feature',
                  filters: {
                    AND: [{ biotype: 'gene' }, { OR: [{ name: '<GENE>' }, { sourceId: '<GENE>' }] }],
                  },

                },
              },
              operator: 'IN',
            },
            {
              reference2: {
                queryType: 'similarTo',
                target: {
                  target: 'Feature',
                  filters: {
                    AND: [{ biotype: 'gene' }, { OR: [{ name: '<GENE>' }, { sourceId: '<GENE>' }] }],
                  },

                },
              },
              operator: 'IN',
            },
          ],
        },
      },
      set searchInput(keyword) {
        this.search.filters.OR[0].reference1.target.filters.AND[1].OR[0].name = keyword;
        this.search.filters.OR[0].reference1.target.filters.AND[1].OR[1].sourceId = keyword;
        this.search.filters.OR[1].reference2.target.filters.AND[1].OR[0].name = keyword;
        this.search.filters.OR[1].reference2.target.filters.AND[1].OR[1].sourceId = keyword;
      },
    },
  ],
};

export {
  SEARCH_OPTS,
};
