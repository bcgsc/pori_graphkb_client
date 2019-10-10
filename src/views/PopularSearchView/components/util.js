const SEARCH_OPTS = {
  DRUG: [
    {
      label: 'Given a drug, find all variants associated with therapeutic sensitivity',
      requiredInput: { label: 'Drug', property: 'name', class: 'Therapy' },
    },
    {
      label: 'Given a drug, find all varaints associated with resistance',
      requiredInput: { label: 'Drug', property: 'name', class: 'Therapy' },
    },
    {
      label: 'Given a drug, find all variants with pharmacogenomic information',
      requiredInput: { label: 'Drug', property: 'name', class: 'Therapy' },
    },
    {
      label: 'Given a drug, find all disease it is approved for use',
      requiredInput: { label: 'Drug', property: 'name', class: 'Therapy' },
    },
  ],
  DISEASE: [
    {
      label: 'Given a disease, find all genes associaed with therapeutic sensitivity',
      requiredInput: { label: 'Disease', property: 'name', class: 'Disease' },
    },
    {
      label: 'Given a disease, find all genes associated with therapeutic resistance',
      requiredInput: { label: 'Disease', property: 'name', class: 'Disease' },
    },
    {
      label: 'Given a disease, find all variants associated with a relevance',
      requiredInput: { label: 'Disease', property: 'name', class: 'Disease' },
    },
  ],
  VARIANT: [
    {
      label: 'Given a variant, find all therapies associaed with sensitivity for Disease(s)',
      requiredInput: { label: 'Variant', property: 'name', class: 'Variant' },
      optionalInput: { label: 'Disease', property: 'name', class: 'Disease' },
    },
    {
      label: 'Given a variant, find all therapies associated with resistance',
      requiredInput: { label: 'Variant', property: 'name', class: 'Variant' },
      optionalInput: { label: 'Disease', property: 'name', class: 'Disease' },
    },
    {
      label: 'Given a variant, find all disease that the variant is associated with',
      requiredInput: { label: 'Variant', property: 'name', class: 'Variant' },
      optionalInput: { label: 'Relevance', property: 'name', class: 'Vocabulary' },
    },
  ],
  GENE: [
    {
      label: 'Given a gene, find all variants reported for all diseases',
      requiredInput: { label: 'Gene', property: 'name', class: 'Feature' },
    },
    {
      label: 'Given a gene, find a specific disease and the associated relevances',
      requiredInput: { label: 'Gene', property: 'name', class: 'Feature' },
    },
    {
      label: 'Given a gene, find all variants linked with drug sensitivity or resistance',
      requiredInput: { label: 'Gene', property: 'name', class: 'Feature' },
    },
    {
      label: 'Given a gene, find all variants on the ',
      requiredInput: { label: 'Gene', property: 'name', class: 'Feature' },
    },
  ],
};

export {
  SEARCH_OPTS,
};
