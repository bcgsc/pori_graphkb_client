const positionalVariantPrefixes_all = [
    "c", "e", "g", "i", "n", "p", "r", "y",
];
const positionalVariantTypes_all = {
    // supported, with record instances
    "copy gain": ["y"],
    "copy loss": ["y"],
    "deletion": ["c", "e", "g", "p", "r"],
    "duplication": ["c", "g", "p", "r"],
    "frameshift": ["e", "p"],
    "fusion": ["c", "e", "g", "i", "r", "y"],
    "indel": ["c", "e", "g", "p", "r"],
    "insertion": ["c", "e", "g", "p", "r"],
    "inversion": ["c", "g"],
    "missense mutation": ["e", "p"],
    "mutation": ["c", "e", "i", "p"],
    "nonsense mutation": ["p"],
    "phosphorylation": ["p"],
    "splice-site": ["e", "p"],
    "substitution": ["c", "g", "p", "r"],
    "translocation": ["e", "g"],
    "truncating frameshift mutation": ["p"],
    // supported, no instances
    "acetylation": [""],
    "extension": [""],
    "inverted translocation": [""],
    "methylation": [""],
    "ubiquitination": [""],
    // malformed, deprecated, etc.
    "frameshift mutation": ["p"],
    "in-frame deletion": ["p"],
    "in-frame fusion": ["g", "p"],
    "increased toxicity": ["c"],
    "itd": ["e"],
    "likely loss of function": ["p"],
    "likely oncogenic": ["p"],
    "loss of function": ["g", "p"],
    "missense": ["e", "p"],
    "mutation hotspot": ["p"],
    "nonsense": ["e", "p"],
    "pathogenic": ["c", "p"],
    "pharmacogenomic": ["c"],
    "splice acceptor mutation": ["g"],
    "splice site": ["e"],
    "switch of function": ["p"],
    "truncating": ["e", "p"],
};

const positionalVariantPrefixes_proposedSelection = [
    "c", "e", "g", "p",
];
const positionalVariantTypes_proposedSelection = {
    "frameshift": ["p"],
    "fusion": ["c", "e", "g"], // +p?
    "inversion": ["c", "g"], // keep?
    // indels:
    "deletion": ["c", "e", "g", "p"],
    "duplication": ["c", "g", "p"],
    "insertion": ["c", "g", "p"],
    "indel": ["c", "g", "p"],
    // substitutions:
    "missense mutation": ["p"],
    "nonsense mutation": ["p"],
    "substitution": ["c", "g", "p"],
    // Post-translational modifications:
    "acetylation": ["p"], // +g?
    "methylation": ["p"], // +g?
    "phosphorylation": ["p"],
    "ubiquitination": ["p"],
};
