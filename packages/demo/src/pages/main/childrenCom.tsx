import useSimpleQuery from 'squery';

export default () => {
  const { data, request } = useSimpleQuery(
    () => Promise.resolve({ name: 'eeeee' }),
    {
      auto: false,
      cacheKey: 'list',
      use: [
        (params) => {
          console.log(params.type, 'a', 'father');
          return { ...params, stop: true };
        },
        (params) => {
          console.log(params.type, 'b', 'father');
          return { ...params, stop: true };
        },
      ],
    }
  );

  return (
    <div>
      <div>i am children data{JSON.stringify(data)}</div>
      <div
        onClick={() => {
          request();
        }}>
        childrenRequest
      </div>
    </div>
  );
};
