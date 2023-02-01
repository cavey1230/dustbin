import React, { useState } from 'react';
import ChildrenCom from './childrenCom';
import useSimpleQuery from 'squery';

import requestMock from '../../mock/requestMock';
import { Link } from 'react-router-dom';
import axios from 'axios';

export default () => {
  const [loop, setLoop] = useState<boolean>(false);

  const [retryCounter, setRetryCounter] = useState<number>(0);

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
        content?: string;
        type?: 'success' | 'fail';
      }) =>
        requestMock({
          type: params?.type || 'success',
          content: params?.content || 'initialize success',
          params,
        }),
      // axios
      //   .post<{
      //     data: string;
      //   }>('https://api.gclivekit.site/api/v1/common/gameRole/list', {
      //     ...params,
      //   })
      //   .then(() => {
      //     return Promise.reject('eeeee');
      //   }),
      {
        auto: true,
        loop: loop,
        retry: !loop,
        // retry: true,
        cacheKey: 'list',
        params: stateParams,
        handle: {
          onSuccess: (_, data) => {
            console.log('onSuccess ' + data);
          },
          onFail: (_, data) => {
            console.log('onFail' + data);
          },
          onRetryComplete: () => {
            console.log('onRetryComplete');
            setRetryCounter(0);
          },
          onRetry: (counter) => {
            setRetryCounter(counter);
            console.log(counter);
          },
        },
      }
    );

  const [unmount, setUnmount] = useState<boolean>(false);

  return (
    <div>
      <div>main page init success</div>
      <div data-testid={'data'}>{JSON.stringify(data)}</div>
      <div data-testid={'loading'}>{loading.toString()}</div>
      <div data-testid={'error'}>{JSON.stringify(error)}</div>
      <div data-testid={'hasRequest'}>{hasRequest.toString()}</div>
      <div data-testid={'retryCounter'}>
        retryCounter {retryCounter.toString()}
      </div>

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

      <Link to={'/empty'}>go empty</Link>

      <button
        onClick={() => {
          setLoop((prevState) => !prevState);
        }}>
        loop switch {loop.toString()}
      </button>
      <button
        data-testid={'requestPrev'}
        onClick={() => {
          request();
        }}>
        manual request prev
      </button>
      <button
        data-testid={'manualRequestPageNum3Success'}
        onClick={() => {
          request({
            pageNum: 3,
            content: 'manual request test',
            type: 'success',
          });
        }}>
        manual request page3 success
      </button>
      <button
        data-testid={'manualRequestPageNum4Fail'}
        onClick={() => {
          request({
            pageNum: 4,
            content: 'manual request test',
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
        manual request page4 success
      </button>
      <button
        onClick={() => {
          setStateParams({
            pageNum: 5,
            type: 'success',
          });
        }}>
        auto request page5 success
      </button>
      <button
        data-testid={'rollback'}
        onClick={() => {
          rollback();
        }}>
        rollback
      </button>
    </div>
  );
};
