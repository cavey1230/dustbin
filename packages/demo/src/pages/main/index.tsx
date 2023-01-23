import React, { useState } from 'react';
import useSimpleQuery from 'squery';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default () => {
  const [loop, setLoop] = useState<boolean>(false);

  const { data, loading, error, hasRequest, request } = useSimpleQuery(
    (params?: { page: number }) =>
      axios
        .post<{
          data: string;
        }>('https://api.gclivekit.site/api/v1/common/gameRole/list', {
          ...params,
        })
        .then(() => {
          return Promise.reject('eeeee');
        }),
    {
      auto: true,
      // loop: loop,
      retry: true,
      params: {
        page: 2,
      },
      handle: {
        onSuccess: () => {
          console.log(111);
        },
        onFail: () => {
          console.log(222);
        },
        onRetryComplete: () => {
          console.log(333);
        },
      },
    }
  );

  const router = useNavigate();

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
          setLoop((prevState) => !prevState);
        }}>
        loop switch {loop.toString()}
      </div>
      <div
        onClick={() => {
          request();
        }}>
        manual request prev
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
