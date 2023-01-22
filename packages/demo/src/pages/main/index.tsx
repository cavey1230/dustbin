import React from 'react';
import useSimpleQuery from 'squery';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default () => {
  const { data, loading, error, hasRequest, request } = useSimpleQuery(
    (params?: { page: number }) =>
      axios.post('https://api.gclivekit.site/api/v1/common/gameRole/list', {
        ...params,
      }),
    {
      manual: false,
      cacheKey: 'list',
      params: {
        page: 2,
      },
    }
  );

  const router = useNavigate();

  console.log({ data, loading, error, hasRequest });

  return (
    <div>
      <div>{JSON.stringify(data)}</div>
      <div>{loading.toString()}</div>
      <div>{JSON.stringify(error)}</div>
      <div>{hasRequest.toString()}</div>
      <div
        onClick={() => {
          router('/empty');
        }}>
        go empty
      </div>
      <div
        onClick={() => {
          request({
            page: 3,
          });
        }}>
        manual request page3
      </div>
      <div
        onClick={() => {
          request({
            page: 4,
          });
        }}>
        manual request page4
      </div>
    </div>
  );
};
