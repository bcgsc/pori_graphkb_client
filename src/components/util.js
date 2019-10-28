const cleanLinkedRecords = (content) => {
  const newContent = {};

  Object.keys(content).forEach((key) => {
    if (content[key] !== undefined) {
      if (Array.isArray(content[key])) {
        try {
          const ridArr = content[key].map(rec => (rec['@rid']));

          if (content[key].length === 1) {
            newContent[key] = ridArr.join();
          } else {
            newContent[key] = ridArr;
          }
        } catch (err) {
          console.error(err);
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
