import useSimpleQuery from 'squery';

export default () => {
  const { data, request } = useSimpleQuery(
    () => Promise.resolve({ name: 'eeeee' }),
    {
      auto: false,
      cacheKey: 'list',
      use: [
        (params) => {
          console.log(
            params.type,
            'a',
            'children',
            params.result,
            params.stage
          );
          return {
            ...params,
            stop: false,
            result: {
              name: 'change by middleware',
            },
          };
        },
        (params) => {
          console.log(
            params.type,
            'b',
            'children',
            params.result,
            params.stage
          );
          return {
            ...params,
            stop: false,
          };
        },
      ],
    }
  );

  return (
    <div>
      <div data-testid={'childrenData'}>
        i am children data{JSON.stringify(data)}
      </div>
      <button
        onClick={() => {
          request();
        }}>
        childrenRequest
      </button>
    </div>
  );
};
