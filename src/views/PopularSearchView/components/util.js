const SEARCH_OPTS = {
  DRUG: [
    {
      label: 'Given a drug, find all variants associated with therapeutic sensitivity',
      requiredInput: { class: 'Drug', property: 'name' },
    },
    {
      label: 'Given a drug, find all varaints associated with resistance',
      requiredInput: { class: 'Drug', property: 'name' },
    },
    {
      label: 'Given a drug, find all variants with pharmacogenomic information',
      requiredInput: { class: 'Drug', property: 'name' },
    },
    {
      label: 'Given a drug, find all disease it is approved for use',
      requiredInput: { class: 'Drug', property: 'name' },
    },
  ],
  DISEASE: [
    {
      label: 'Given a disease, find all genes associaed with therapeutic sensitivity',
      requiredInput: { class: 'Disease', property: 'name' },
    },
    {
      label: 'Given a disease, find all genes associated with therapeutic resistance',
      requiredInput: { class: 'Disease', property: 'name' },
    },
    {
      label: 'Given a disease, find all variants associated with a relevance',
      requiredInput: { class: 'Disease', property: 'name' },
    },
  ],
  VARIANT: [
    {
      label: 'Given a variant, find all therapies associaed with sensitivity for Disease(s)',
      requiredInput: { class: 'Variant', property: 'name' },
      optionalInput: { class: 'Disease', property: 'name' },
    },
    {
      label: 'Given a variant, find all therapies associated with resistance',
      requiredInput: { class: 'Variant', property: 'name' },
      optionalInput: { class: 'Disease', property: 'name' },
    },
    {
      label: 'Given a variant, find all disease that the variant is associated with',
      requiredInput: { class: 'Variant', property: 'name' },
      optionalInput: { class: 'Relevance', property: 'name' },
    },
  ],
  GENE: [
    {
      label: 'Given a gene, find all variants reported for all diseases',
      requiredInput: { class: 'Gene', property: 'name' },
    },
    {
      label: 'Given a gene, find a specific disease and the associated relevances',
      requiredInput: { class: 'Gene', property: 'name' },
    },
    {
      label: 'Given a gene, find all variants linked with drug sensitivity or resistance',
      requiredInput: { class: 'Gene', property: 'name' },
    },
    {
      label: 'Given a gene, find all variants on the ',
      requiredInput: { class: 'Gene', property: 'name' },
    },
  ],
};

export {
  SEARCH_OPTS,
};
