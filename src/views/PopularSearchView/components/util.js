const resistanceSubquery = {
  queryType: 'ancestors',
  target: 'Vocabulary',
  filters: { name: 'no response' },
};

const sensitivitySubquery = {
  queryType: 'ancestors',
  target: 'Vocabulary',
  filters: { name: 'targetable' },
};

const CONTAINSANY = 'CONTAINSANY';

const highEvidenceLevelSubquery = {
  target: 'EvidenceLevel',
  filters: {
    OR: [
      {
        AND: [
          {
            name: ['1', 'r1'],
          },
          {
            source: {
              target: 'Source',
              filters: { name: 'oncokb' },
            },
          },
        ],
      },
      {
        AND: [
          {
            name: ['a4', 'a5'], operator: 'IN',
          },
          {
            source: {
              target: 'Source',
              filters: { name: 'civic' },
            },
          },
        ],
      },
      {
        AND: [
          {
            name: ['fda guidelines', 'nccn guidelines', 'nccn/cap guidelines'], operator: 'IN',
          },
          {
            source: {
              target: 'Source',
              filters: { name: 'cancer genome interpreter' },
            },
          },
        ],
      },
    ],
  },
};

const diagnosticSubquery = {
  queryType: 'ancestors',
  target: 'Vocabulary',
  filters: { name: 'diagnostic indicator' },
};


/**
 * returns a keyword search object with rid set for return properties
 */
const keywordSearchGenerator = (modelName, keyword) => ({
  queryType: 'keyword',
  keyword,
  target: modelName,
});


const SEARCH_OPTS = {
  DRUG: [
    {
      label: 'Given a drug, find all variants associated with therapeutic sensitivity',
      requiredInput: {
        label: 'Drug', property: 'name', class: 'Therapy', example: ' Ex. oxaliplatin',
      },
      search: drug => ({
        target: 'Statement',
        filters: {
          AND: [
            {
              subject: keywordSearchGenerator('Therapy', drug), operator: 'IN',
            },
            {
              relevance: sensitivitySubquery, operator: 'IN',
            },
          ],
        },
      }),
    },
    {
      label: 'Given a drug, find all variants associated with resistance',
      requiredInput: {
        label: 'Drug', property: 'name', class: 'Therapy', example: ' Ex. oxaliplatin',
      },
      search: drug => ({
        target: 'Statement',
        filters: {
          AND: [
            {
              subject: keywordSearchGenerator('Therapy', drug), operator: 'IN',
            },
            {
              relevance: resistanceSubquery, operator: 'IN',
            },
          ],
        },
      }),
    },
    {
      label: 'Given a drug, find all variants with pharmacogenomic information',
      requiredInput: {
        label: 'Drug', property: 'name', class: 'Therapy', example: ' Ex. oxaliplatin',
      },
      search: drug => ({
        target: 'Statement',
        filters: {
          AND: [
            {
              subject: keywordSearchGenerator('Therapy', drug), operator: 'IN',
            },
            {
              relevance: {
                queryType: 'ancestors',
                target: 'Vocabulary',
                filters: { name: 'therapeutic indicator' },
              },
              operator: 'IN',
            },
          ],
        },
      }),
    },
    {
      label: 'Given a drug, find all high-level evidence statements',
      requiredInput: {
        label: 'Drug', property: 'name', class: 'Therapy', example: ' Ex. oxaliplatin',
      },
      search: drug => ({
        target: 'Statement',
        filters: {
          AND: [
            {
              subject: keywordSearchGenerator('Therapy', drug), operator: 'IN',
            },
            {
              evidenceLevel: highEvidenceLevelSubquery, operator: CONTAINSANY,
            },
          ],
        },
      }),
    },
  ],
  DISEASE: [
    {
      label: 'Given a disease, find all statements associated with therapeutic sensitivity',
      requiredInput: {
        label: 'Disease', property: 'name', class: 'Disease', example: 'Ex. Cancer',
      },
      search: disease => ({
        target: 'Statement',
        filters: {
          AND: [
            {
              conditions: keywordSearchGenerator('Disease', disease), operator: CONTAINSANY,
            },
            {
              relevance: sensitivitySubquery, operator: 'IN',
            },
          ],
        },
      }),
    },
    {
      label: 'Given a disease, find all statements associated with therapeutic resistance',
      requiredInput: {
        label: 'Disease', property: 'name', class: 'Disease', example: 'Ex. Cancer',
      },
      search: disease => ({
        target: 'Statement',
        filters: {
          AND: [
            {
              conditions: keywordSearchGenerator('Disease', disease), operator: CONTAINSANY,
            },
            {
              relevance: resistanceSubquery, operator: 'IN',
            },
          ],
        },
      }),
    },
    {
      label: 'Given a disease, find all statements associated with a relevance',
      requiredInput: {
        label: 'Disease', property: 'name', class: 'Disease', example: 'Ex. Cancer',
      },
      search: disease => ({
        target: 'Statement',
        filters: {
          AND: [
            {
              conditions: keywordSearchGenerator('Disease', disease),
              operator: CONTAINSANY,
            },
          ],
        },
      }),
    },
  ],
  VARIANT: [
    {
      label: 'Given a variant, find all statements associated with sensitivity for Disease(s)',
      requiredInput: {
        label: 'Variant', property: 'name', class: 'Variant', example: 'Ex. KRAS:p.G12D',
      },
      additionalInput: {
        label: 'Disease', property: 'name', class: 'Disease', example: 'Ex. Cancer',
      },
      search: (variant, disease) => {
        const filters = [

          { conditions: keywordSearchGenerator('Variant', variant), operator: CONTAINSANY },
          {
            relevance: {
              queryType: 'ancestors',
              target: 'Vocabulary',
              filters: { name: 'targetable' },
            },
            operator: 'IN',
          },
        ];

        if (disease) {
          filters.push({ conditions: keywordSearchGenerator('Disease', disease), operator: CONTAINSANY });
        }
        return {
          target: 'Statement',
          filters,
        };
      },
    },
    {
      label: 'Given a variant, find all statements associated with resistance for Disease(s)',
      requiredInput: {
        label: 'Variant', property: 'name', class: 'Variant', example: 'Ex. KRAS:p.G12A',
      },
      additionalInput: {
        label: 'Disease', property: 'name', class: 'Disease', example: 'Ex. Cancer',
      },
      search: (variant, disease) => {
        const filters = [
          {
            relevance: {
              queryType: 'ancestors',
              target: 'Vocabulary',
              filters: { name: 'no response' },
            },
            operator: 'IN',
          },
          { conditions: keywordSearchGenerator('Variant', variant), operator: CONTAINSANY },
        ];

        if (disease) {
          filters.push({ conditions: keywordSearchGenerator('Disease', disease), operator: CONTAINSANY });
        }
        return {
          target: 'Statement',
          filters,
        };
      },
    },
    {
      label: 'Given a variant, find all diseases that the variant is associated with',
      requiredInput: {
        label: 'Variant', property: 'name', class: 'Variant', example: 'Ex. KRAS:p.G12A',
      },
      search: variant => ({
        target: 'Statement',
        filters: [
          {
            conditions: keywordSearchGenerator('Variant', variant),
            operator: CONTAINSANY,

          },
          { relevance: diagnosticSubquery, operator: 'IN' },
        ],
      }),
    },
  ],
  GENE: [
    {
      label: 'Given a gene, find all variants reported for all diseases',
      requiredInput: {
        label: 'Gene', property: 'name', class: 'Feature', example: 'Ex. KRAS',
      },
      search: gene => ({
        target: 'Statement',
        filters: {
          conditions: keywordSearchGenerator('Variant', gene), operator: CONTAINSANY,
        },
      }),
    },
    {
      label: 'Given a gene, find a specific disease and the associated relevances',
      requiredInput: {
        label: 'Gene', property: 'name', class: 'Feature', example: 'Ex. KRAS',
      },
      additionalInput: {
        label: 'Disease', property: 'name', class: 'Disease', example: 'Ex. Melanoma', required: true,
      },
      search: (gene, disease) => ({
        target: 'Statement',
        filters: {
          AND: [
            {
              conditions: keywordSearchGenerator('Variant', gene), operator: CONTAINSANY,
            },
            {
              conditions: keywordSearchGenerator('Disease', disease), operator: CONTAINSANY,
            },
          ],
        },
      }),
    },
    {
      label: 'Given a gene, find all variants linked with drug sensitivity or resistance',
      requiredInput: {
        label: 'Gene', property: 'name', class: 'Feature', example: 'Ex. KRAS',
      },
      search: gene => ({
        target: 'Statement',
        filters: {
          AND: [
            {
              conditions: keywordSearchGenerator('Variant', gene), operator: CONTAINSANY,
            },
            {
              relevance: {
                queryType: 'ancestors',
                target: 'Vocabulary',
                filters: { name: 'therapeutic efficacy' },
              },
              operator: 'IN',
            },
          ],
        },
      }),
    },
  ],
};

export default SEARCH_OPTS;
