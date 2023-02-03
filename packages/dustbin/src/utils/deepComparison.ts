const deepComparison = (compared: any, beCompared: any): boolean => {
  const typeofCompared = typeof compared;
  const typeofBeCompared = typeof beCompared;
  if (typeofCompared !== typeofBeCompared) {
    return false;
  }
  if (typeofCompared === typeofBeCompared) {
    if (
      typeofCompared === 'string' ||
      typeofCompared === 'number' ||
      typeofCompared === 'boolean' ||
      typeofCompared === 'bigint' ||
      typeofCompared === 'symbol' ||
      typeofCompared === 'undefined'
    ) {
      return compared === beCompared;
    }

    if (typeofCompared === 'function') {
      return compared.toString() === beCompared.toString();
    }

    if (typeofCompared === 'object') {
      if (compared == null || beCompared == null) {
        return compared === beCompared;
      } else {
        const comparedKeys = Object.keys(compared);
        const beComparedKeys = Object.keys(beCompared);
        if (comparedKeys.length !== beComparedKeys.length) {
          return false;
        }
        if (comparedKeys.length === beComparedKeys.length) {
          return comparedKeys.every((item) => {
            return deepComparison(compared[item], beCompared[item]);
          });
        }
      }
    }
  }
};

export default deepComparison;
