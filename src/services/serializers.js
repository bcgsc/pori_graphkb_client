function prepareEntry(jsonTerm) {
  let entry = {
    "@class": jsonTerm["@class"],
    sourceId: jsonTerm.sourceId,
    createdBy: jsonTerm.createdBy.name,
    name: jsonTerm.name,
    description: jsonTerm.description,
    source: jsonTerm.source.name,
    sourceRid: jsonTerm.source["@rid"],
    "@rid": jsonTerm["@rid"],
    longName: jsonTerm.longName,
    "@version": jsonTerm["@version"],
    subsets: jsonTerm.subsets,
    out_SubClassOf: jsonTerm["out_SubClassOf"],
    in_SubClassOf: jsonTerm["in_SubClassOf"],
    out_AliasOf: jsonTerm["out_AliasOf"],
    in_AliasOf: jsonTerm["in_AliasOf"]
  };

  return entry;
}

export default prepareEntry;
