const hashRecordsByRID = (data) => {
  const newData = {};
  data.forEach((obj) => {
    newData[obj['@rid']] = obj;
  });
  return newData;
};

export {
  hashRecordsByRID,
};
