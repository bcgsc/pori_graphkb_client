function prepareEntry(jsonTerm) {
    let children, parents, aliases;

    if (jsonTerm['out_SubClassOf']) {
        parents = [];
        jsonTerm['out_SubClassOf'].forEach(edge => {
            edge['in']['@rid'] ? parents.push(edge['in']['@rid']) : parents.push(edge['in'])
        });
    }
    if (jsonTerm['in_SubClassOf']) {
        children = [];
        jsonTerm['in_SubClassOf'].forEach(edge => {
            edge['out']['@rid'] ? children.push(edge['out']['@rid']) : children.push(edge['out'])
        });
    }
    if (jsonTerm['out_AliasOf']) {
        aliases = [];
        jsonTerm['out_AliasOf'].forEach(edge => {
            edge['in']['@rid'] ? aliases.push(edge['in']['@rid']) : aliases.push(edge['in'])
        });
    }
    if (jsonTerm['in_AliasOf']) {
        aliases = aliases || [];
        jsonTerm['in_AliasOf'].forEach(edge => {
            edge['out']['@rid'] ? aliases.push(edge['out']['@rid']) : aliases.push(edge['out'])
        });
    }

    let entry = {
        class: jsonTerm['@class'],
        sourceId: jsonTerm['sourceId'],
        createdBy: jsonTerm['createdBy']['name'],
        name: jsonTerm['name'],
        description: jsonTerm['description'],
        source: jsonTerm['source'].name,
        rid: jsonTerm['@rid'],
        longName: jsonTerm['longName'],
        version: jsonTerm['@version'],
        subsets: jsonTerm['subsets'],
        parents: parents,
        children: children,
        aliases: aliases,
    }

    return entry;
}

export default prepareEntry;