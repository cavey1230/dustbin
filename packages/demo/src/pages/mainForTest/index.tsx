import React, { useState } from 'react';
import ChildrenCom from './childrenCom';
import useSimpleQuery from 'dustbin';

import './sytle.css';

import requestMock from '../../mock/requestMock';
import NoCacheKey from './noCacheKey';

export default () => {
  const [loop, setLoop] = useState<boolean>(false);

  const [retryCounter, setRetryCounter] = useState<number>(0);

  const [stateParams, setStateParams] = useState<{
    pageNum: number;
    sort?: string;
    pageSize?: number;
    content?: string;
    type?: 'success' | 'fail';
  }>({
    pageNum: 2,
    type: 'success',
  });

  const { data, loading, error, hasRequest, request, rollback, requestAsync } =
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
          onRetryComplete: (cacheKey, time) => {
            console.log('onRetryComplete', cacheKey, time);
            setRetryCounter(0);
          },
          onRetry: (cacheKey, params, time, counter) => {
            setRetryCounter(counter);
            console.log(cacheKey, params, time, counter);
          },
        },
      }
    );

  const [unmount, setUnmount] = useState<boolean>(false);

  return (
    <div className={'outWrapper'}>
      <div>main page init success</div>
      <div className={'tips'}>main components</div>
      <div className={'wrapper'}>
        <div data-testid={'data'}>{JSON.stringify(data)}</div>
        <div data-testid={'loading'}>{loading.toString()}</div>
        <div data-testid={'error'}>{JSON.stringify(error)}</div>
        <div data-testid={'hasRequest'}>{hasRequest.toString()}</div>
        <div data-testid={'retryCounter'}>retryCounter {retryCounter}</div>

        <button
          data-testid={'useLoop'}
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
          data-testid={'manualRequestPageNum4Success'}
          onClick={() => {
            request({
              pageNum: 4,
              type: 'success',
              content: 'manual request test',
            });
          }}>
          manual request page4 success
        </button>

        <button
          data-testid={'autoRequestPageNum4Success'}
          onClick={() => {
            setStateParams({
              pageNum: 4,
              type: 'success',
              content: 'auto request test',
            });
          }}>
          auto request page4 success
        </button>

        <button
          data-testid={'autoRequestPageNum5Success'}
          onClick={() => {
            setStateParams({
              pageNum: 5,
              type: 'success',
              content: 'auto request test',
            });
          }}>
          auto request page5 success
        </button>

        <button
          data-testid={'requestAsync'}
          onClick={() => {
            requestAsync({ pageNum: 999 }).then((res) => {
              console.log(res);
            });
          }}>
          requestAsync
        </button>

        <button
          data-testid={'rollback'}
          onClick={() => {
            rollback();
          }}>
          rollback
        </button>
      </div>

      <div className={'tips'}>nest with the same cacheKey</div>
      <div className={'wrapper'}>
        {!unmount && <ChildrenCom />}

        <button
          onClick={() => {
            setUnmount((prevState) => !prevState);
          }}>
          {!unmount ? 'unmount children com' : 'show children com'}
        </button>
      </div>

      <div className={'tips'}>no cacheKey</div>
      <div className={'wrapper'}>
        <NoCacheKey />
      </div>
    </div>
  );
};
