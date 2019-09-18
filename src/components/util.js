const cleanLinkedRecords = (content) => {
  const newContent = {};

  Object.keys(content).forEach((key) => {
    if (content[key] !== undefined) {
      if (Array.isArray(content[key])) {
        if (content[key].length > 1) {
          throw new Error(`${key} only takes 1 value`);
        } else {
          try {
            const ridArr = content[key].map(rec => (rec['@rid']));
            newContent[key] = ridArr.join();
          } catch (err) {
            console.error(err);
          }
        }
      } else {
        try {
          if (content[key]['@rid']) {
            newContent[key] = content[key]['@rid'];
          } else {
            newContent[key] = content[key];
          }
        } catch (err) {
          newContent[key] = content[key];
        }
      }
    }
  });
  return newContent;
};


const cleanUndefined = (content) => {
  const newContent = {};

  if (typeof content !== 'object' || content === null) {
    return content;
  }

  Object.keys(content).forEach((key) => {
    if (content[key] !== undefined) {
      newContent[key] = cleanUndefined(content[key]);
    }
  });
  return newContent;
};

export { cleanLinkedRecords, cleanUndefined };
