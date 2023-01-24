import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import ChildrenCom from 'pages/main/childrenCom';
import useSimpleQuery from 'squery';

export default () => {
  const [loop, setLoop] = useState<boolean>(false);

  const { data, loading, error, hasRequest, request, rollback } =
    useSimpleQuery(
      (params?: { pageNum: number; sort?: string; pageSize?: number }) =>
        // axios
        //   .post<{
        //     data: string;
        //   }>('https://api.gclivekit.site/api/v1/common/gameRole/list', {
        //     ...params,
        //   })
        //   .then(() => {
        //     return Promise.reject('eeeee');
        //   }),

        axios.post<{
          data: string;
        }>('https://api.gclivekit.site/api/v1/common/gameRole/list', {
          ...params,
        }),
      {
        auto: true,
        loop: loop,
        retry: !loop,
        cacheKey: 'list',
        params: {
          pageNum: 2,
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

  const [unmount, setUnmount] = useState<boolean>(false);

  return (
    <div>
      <div>{JSON.stringify(data)}</div>
      <div>{loading.toString()}</div>
      <div>{JSON.stringify(error)}</div>
      <div>{hasRequest.toString()}</div>

      <div style={{ border: '1px solid black' }}>
        {!unmount && <ChildrenCom />}

        <div
          style={{ marginTop: '30px', backgroundColor: '#eee' }}
          onClick={() => {
            setUnmount((prevState) => !prevState);
          }}>
          unmount children com
        </div>
      </div>

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
            pageNum: 3,
          });
        }}>
        manual request page3
      </div>
      <div
        onClick={() => {
          request({
            pageNum: 4,
          });
        }}>
        manual request page4
      </div>
      <div
        onClick={() => {
          request({
            pageNum: 4,
            sort: 'DESC',
            pageSize: 1,
          });
        }}>
        manual request success
      </div>
      <div
        onClick={() => {
          rollback();
        }}>
        rollback
      </div>
    </div>
  );
};
