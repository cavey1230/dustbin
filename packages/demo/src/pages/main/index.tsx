import React from 'react';
import useSimpleQuery, { deepComparison } from 'squery';
import axios from 'axios';

export default () => {
  console.log(useSimpleQuery('111'));
  console.log(deepComparison('1111', '1111'), 'deepComparison');

  return <div>11112312312312</div>;
};
