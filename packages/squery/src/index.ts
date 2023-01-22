import deepComparison from './utils/deepComparison';

const useSimpleQuery = (type: string) => {
  console.log(1111);
  console.log(type);
  console.log(deepComparison(111, 111));

  return type;
};

export { deepComparison };

export default useSimpleQuery;
