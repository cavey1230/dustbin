import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import ChildrenCom from 'pages/main/childrenCom';
import useSimpleQuery from 'squery';

import requestMock from '../../mock/requestMock';

export default () => {
  const [loop, setLoop] = useState<boolean>(false);

  const [stateParams, setStateParams] = useState<{
    pageNum: number;
    sort?: string;
    pageSize?: number;
    type?: 'success' | 'fail';
  }>({
    pageNum: 2,
  });

  const { data, loading, error, hasRequest, request, rollback } =
    useSimpleQuery(
      (params?: {
        pageNum: number;
        sort?: string;
        pageSize?: number;
        type?: 'success' | 'fail';
      }) =>
        // axios
        //   .post<{
        //     data: string;
        //   }>('https://api.gclivekit.site/api/v1/common/gameRole/list', {
        //     ...params,
        //   })
        //   .then(() => {
        //     return Promise.reject('eeeee');
        //   }),

        // axios.post<{
        //   data: string;
        // }>('https://api.gclivekit.site/api/v1/common/gameRole/list', {
        //   ...params,
        // }),
        requestMock({
          type: params?.type || 'fail',
          content: 'test fail',
          params,
        }),
      {
        auto: true,
        loop: loop,
        retry: !loop,
        cacheKey: 'list',
        params: stateParams,
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

  const [unmount, setUnmount] = useState<boolean>(false);

  return (
    <div>
      <div>{JSON.stringify(data)}</div>
      <div>{loading.toString()}</div>
      <div>{JSON.stringify(error)}</div>
      <div>{hasRequest.toString()}</div>

      <div style={{ border: '1px solid black' }}>
        {!unmount && <ChildrenCom />}

        <button
          style={{ marginTop: '30px', backgroundColor: '#eee' }}
          onClick={() => {
            setUnmount((prevState) => !prevState);
          }}>
          unmount children com
        </button>
      </div>

      <button
        onClick={() => {
          router('/empty');
        }}>
        go empty
      </button>
      <button
        onClick={() => {
          setLoop((prevState) => !prevState);
        }}>
        loop switch {loop.toString()}
      </button>
      <button
        onClick={() => {
          request();
        }}>
        manual request prev
      </button>
      <button
        onClick={() => {
          request({
            pageNum: 3,
            type: 'success',
          });
        }}>
        manual request page3 success
      </button>
      <button
        onClick={() => {
          request({
            pageNum: 4,
            type: 'fail',
          });
        }}>
        manual request page4 fail
      </button>
      <button
        onClick={() => {
          request({
            pageNum: 4,
            type: 'success',
          });
        }}>
        manual request success
      </button>
      <button
        onClick={() => {
          setStateParams({
            pageNum: 4,
            type: 'success',
          });
        }}>
        auto request success
      </button>
      <button
        onClick={() => {
          rollback();
        }}>
        rollback
      </button>
    </div>
  );
};
