
const isObject = (val) => {
  if (val === null) { return false; }
  return ((typeof val === 'function') || (typeof val === 'object'));
};

const hashRecordsByRID = (data) => {
  const newData = {};
  data.forEach((obj) => {
    newData[obj['@rid']] = obj;
  });
  return newData;
};

export {
  isObject,
  hashRecordsByRID,
};
