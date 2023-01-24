import useSimpleQuery from 'squery';

export default () => {
  const { data, loading, error, hasRequest, request } = useSimpleQuery(
    (params?: { page: number }) => Promise.resolve({ name: 'eeeee' }),
    {
      auto: false,
      cacheKey: 'list',
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
