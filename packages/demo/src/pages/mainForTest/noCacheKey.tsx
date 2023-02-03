import useSimpleQuery from 'dustbin';
import requestMock from '../../mock/requestMock';
import React, { useState } from 'react';

export default () => {
  const [loop, setLoop] = useState<boolean>(false);

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

  const { data, error, loading, request, hasRequest } = useSimpleQuery(
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
      params: stateParams,
    }
  );

  return (
    <div>
      <div data-testid={'dataNoCacheKey'}>{JSON.stringify(data)}</div>
      <div data-testid={'loadingNoCacheKey'}>{loading.toString()}</div>
      <div data-testid={'errorNoCacheKey'}>{JSON.stringify(error)}</div>
      <div data-testid={'hasRequestNoCacheKey'}>{hasRequest.toString()}</div>

      <button
        data-testid={'useLoopNoCacheKey'}
        onClick={() => {
          setLoop((prevState) => !prevState);
        }}>
        loop switch {loop.toString()}
      </button>

      <div className={'innerTips'}>
        If not set cacheKey,the handle always request options params
      </div>
      <button
        data-testid={'requestPrevNoCacheKey'}
        onClick={() => {
          request();
        }}>
        manual request prev
      </button>

      <button
        data-testid={'manualRequestPageNum3SuccessNoCacheKey'}
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
        data-testid={'manualRequestPageNum4FailNoCacheKey'}
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
        data-testid={'manualRequestPageNum4SuccessNoCacheKey'}
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
        data-testid={'autoRequestPageNum4SuccessNoCacheKey'}
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
        data-testid={'autoRequestPageNum5SuccessNoCacheKey'}
        onClick={() => {
          setStateParams({
            pageNum: 5,
            type: 'success',
            content: 'auto request test',
          });
        }}>
        auto request page5 success
      </button>
    </div>
  );
};
