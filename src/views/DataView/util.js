
const hashRecordsByRID = (data) => {
  const newData = {};
  data.forEach((obj) => {
    if (obj) {
      newData[obj['@rid']] = obj;
    }
  });
  return newData;
};

export {
  hashRecordsByRID,
};
