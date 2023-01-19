import { useState } from 'react';

interface IProps {
  name: string;
}

const useTest = (type: IProps) => {
  console.log('111111333311', type);

  const status = {
    data: false,
  };

  const [data, setData] = useState();
  const type2: string[] = ['111'];
  console.log(type2);

  console.log(data);

  return {
    get data() {
      status.data = true;
      console.log(status.data);
      return data;
    },
    setData,
  };
};

export default useTest;
