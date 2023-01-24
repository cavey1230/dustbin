import { useCallback, useEffect, useRef, useState } from 'react';
import deepComparison from './utils/deepComparison';
import { ChildrenPartial, useIsUnmount, useWatchState } from './core';
import { RetryQueueItem, SimpleQueryStore } from './store';
import validateOptions from './utils/validateOptions';
import { startBroadcast, useSubscribeBroadcast } from './utils/broadcast';

export type QueryOptions<T, CD, D> = {
  loop?: boolean;
  loopInterval?: number;
  cacheKey?: string;
  freshTime?: number;
  retry?: boolean;
  retryCount?: number;
  retryInterval?: number;
  params?: T;
  initializeData?: CD;
  auto: boolean;
  use?: [];
  handle?: {
    onSuccess?: (params: T, data: D) => void;
    onFail?: (params: T, data: D) => void;
    onRetryComplete?: () => void;
  };
};

export let globalStore: SimpleQueryStore;

export const useInitializeStore = () => {
  if (!globalStore) {
    globalStore = new SimpleQueryStore();
  }
  return useRef(globalStore);
};

const useSimpleQuery = <T, D, E>(
  promiseFunc: (params?: T) => Promise<D>,
  options: QueryOptions<T, ChildrenPartial<D>, D>
) => {
  const queryStore = useInitializeStore().current;

  const preOptions = useRef<QueryOptions<T, ChildrenPartial<D>, D>>();

  const [hasRequest, setHasRequest] = useState<boolean>(false);

  const isUnmount = useIsUnmount();

  const waitRetryQueueRef = useRef<RetryQueueItem[]>([]);

  const [stage, setStage] = useState<'normal' | 'retry'>('normal');

  useEffect(() => {
    const validate = validateOptions(options);
    if (validate) {
      throw validate;
    }
  }, [options]);

  const {
    data,
    loading,
    error,
    setState,
    setStateWithLatestStoreValue,
    haveBeenUsedRef,
  } = useWatchState<T, D, E extends undefined ? any : E>({
    initializeOptions: {
      data: false,
      loading: false,
      error: false,
    },
    keys: options.cacheKey,
    initializeData: options.initializeData,
    queryStore: queryStore,
  });

  useSubscribeBroadcast(options?.cacheKey, () => {
    setStateWithLatestStoreValue();
  });

  const promiseConsumer = useCallback(
    (
      promise: (params?: T) => Promise<D>,
      options: {
        params: T;
        cacheKey: string;
        requestTime: number;
        stage: 'normal' | 'retry';
        handle: QueryOptions<T, ChildrenPartial<D>, D>['handle'];
      }
    ) => {
      const { params, cacheKey, requestTime, handle } = options;
      promise(params)
        ?.then((result) => {
          if (cacheKey) {
            const { dataWithWrapper } =
              queryStore.getLastParamsWithKey(cacheKey);
            if (
              dataWithWrapper &&
              requestTime < dataWithWrapper.CREATE_TIME.getTime()
            ) {
              return;
            }
          }
          if (!isUnmount.current) {
            setState({ data: result, params }, 'data');
            setStage('normal');
            handle?.onSuccess?.(params, result);
            startBroadcast(cacheKey);
          }
        })
        .catch((reason) => {
          if (cacheKey) {
            const waitRetryItem = {
              request: promise,
              params,
            };
            waitRetryQueueRef.current.push(waitRetryItem);
            queryStore.pushWaitRetry(cacheKey, waitRetryItem);
          }
          if (!isUnmount.current) {
            setStage('retry');
            setState({ data: reason }, 'error');
            handle?.onFail?.(params, reason);
          }
        })
        .finally(() => {
          if (!isUnmount.current) {
            setHasRequest(true);
            setState({ data: false }, 'loading');
          }
        });
    },
    [isUnmount, queryStore, setState]
  );

  const retryRequest = useCallback(() => {
    const { cacheKey } = options;
    const queue = queryStore.getWaitRetry(options.cacheKey);
    const lastRequest = queue?.slice(-1) || [
      {
        request: promiseFunc,
        params: cacheKey
          ? queryStore.getLastParamsWithKey(cacheKey)?.originData
          : preOptions.current
          ? preOptions.current?.params
          : undefined,
      },
    ];
    queryStore.removeWaitRetry(options.cacheKey, lastRequest);
    const requestTime = new Date().getTime();
    lastRequest?.[0] &&
      promiseConsumer(lastRequest?.[0]?.request, {
        params: lastRequest?.[0]?.params,
        cacheKey: options.cacheKey,
        requestTime,
        stage: 'retry',
        handle: {
          onSuccess: options?.handle?.onSuccess,
          onFail: options?.handle?.onFail,
        },
      });
  }, [options, promiseConsumer, promiseFunc, queryStore]);

  useEffect(() => {
    let intervalId: number;
    let counter = 0;
    if (stage === 'retry' && options?.retry) {
      intervalId = setInterval(() => {
        if (counter >= (options?.retryCount || 1)) {
          options.handle?.onRetryComplete?.();
          clearInterval(intervalId);
          return;
        }
        console.log('Number of retries ' + (counter + 1));
        counter += 1;
        retryRequest();
      }, options?.retryInterval || 500);
    }
    return () => {
      clearInterval(intervalId);
    };
  }, [
    options?.handle,
    options?.retry,
    options?.retryCount,
    options?.retryInterval,
    retryRequest,
    stage,
  ]);

  const innerRequest = useCallback(
    (params?: T) => {
      const { cacheKey, params: optionsParams, freshTime } = options || {};
      const requestTime = new Date().getTime();
      const innerParams = params
        ? params
        : cacheKey
        ? queryStore.getLastParamsWithKey(cacheKey)?.originData
        : preOptions.current
        ? preOptions.current?.params
        : optionsParams || optionsParams;
      if (cacheKey) {
        const { dataWithWrapper } = queryStore.getLastParamsWithKey(cacheKey);
        if (
          freshTime &&
          requestTime - dataWithWrapper.CREATE_TIME.getTime() < freshTime
        ) {
          return;
        }
      }
      setState({ data: true }, 'loading');
      promiseConsumer(promiseFunc, {
        params: innerParams,
        cacheKey,
        requestTime,
        stage: 'normal',
        handle: {
          onSuccess: options?.handle?.onSuccess,
          onFail: options?.handle?.onFail,
        },
      });
    },
    [options, promiseConsumer, promiseFunc, queryStore, setState]
  );

  useEffect(() => {
    const waitRetryQueue = waitRetryQueueRef.current;
    return () => {
      queryStore.removeWaitRetry(options.cacheKey, waitRetryQueue);
    };
  }, [options.cacheKey, queryStore]);

  useEffect(() => {
    const { auto, params, cacheKey, loop } = options;
    let intervalId: number;
    if (auto && !loop && !deepComparison(preOptions.current, options)) {
      const beCombinedParams = cacheKey
        ? queryStore.getLastParamsWithKey(cacheKey)?.originData
        : preOptions.current?.params
        ? preOptions.current?.params
        : undefined;
      if (
        params &&
        beCombinedParams &&
        deepComparison(params, beCombinedParams)
      ) {
        return;
      }
      preOptions.current = options;
      queryStore.clearWaitRetry(cacheKey);
      innerRequest(params);
    }
    if (auto && loop) {
      queryStore.clearWaitRetry(cacheKey);
      intervalId = setInterval(() => {
        innerRequest(params);
      }, options.loopInterval || 1000);
      return () => {
        clearInterval(intervalId);
      };
    }
  }, [innerRequest, options, queryStore]);

  return {
    get data() {
      haveBeenUsedRef.current.data = true;
      return data;
    },
    get loading() {
      haveBeenUsedRef.current.loading = true;
      return loading;
    },
    get error() {
      haveBeenUsedRef.current.error = true;
      return error;
    },
    hasRequest: hasRequest,
    request: (params?: T) => {
      queryStore.clearWaitRetry(options.cacheKey);
      innerRequest(params);
    },
  };
};

export { deepComparison };

export default useSimpleQuery;
