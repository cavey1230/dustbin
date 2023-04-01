import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import deepComparison from './utils/deepComparison';
import {
  ChildrenPartial,
  useInitializeStore,
  usePackageOptions,
  usePromiseConsumer,
  UserItemOptions,
  useWatchState,
} from './core';
import validateOptions from './utils/validateOptions';
import { startBroadcast, useSubscribeBroadcast } from './utils/broadcast';
import {
  SimpleQueryConfigProvider,
  useConfigState,
} from './utils/configContext';
import { SimpleQueryStore } from './store';

type UseItem<T, D> = (options: UserItemOptions<T, D>) => typeof options;

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
  use?: Array<UseItem<T, D>>;
  handle?: {
    onSuccess?: (params: T, data: D) => void;
    onFail?: (params: T, data: D) => void;
    onRetryComplete?: (cacheKey: string, time: number) => void;
    onRetry?: (
      cacheKey: string,
      params: any,
      time: number,
      counter: number
    ) => void;
  };
};

const useSimpleQuery = <T, D, E>(
  promiseFuncByParams: (params?: T) => Promise<D>,
  optionsByParams?: QueryOptions<T, ChildrenPartial<D>, D>
) => {
  const queryStore = useRef(useInitializeStore());

  const options = usePackageOptions(optionsByParams);

  const [promiseFunc] = useState(() => promiseFuncByParams);

  const intervalId = useRef<number>();

  useEffect(() => {
    const validate = validateOptions(options);
    if (validate) {
      throw validate;
    }
  }, [options]);

  const [consumer, hasRequest, mode, setMode] = usePromiseConsumer<T, D>(
    options.cacheKey
  );

  const {
    data,
    loading,
    error,
    setState,
    setStateWithStoreValue,
    haveBeenUsedRef,
  } = useWatchState<T, D, E extends undefined ? any : E>(
    useMemo(
      () => ({
        initializeOptions: {
          data: false,
          loading: false,
          error: false,
        },
        keys: options.cacheKey,
        initializeData: options.initializeData,
        queryStore: queryStore.current,
      }),
      [options.cacheKey, options.initializeData]
    )
  );

  useSubscribeBroadcast(
    options?.cacheKey,
    useCallback(
      (type: 'pre' | 'last') => {
        setStateWithStoreValue(type);
      },
      [setStateWithStoreValue]
    )
  );

  const innerRequest = useCallback(
    (
      target: 'MANUAL' | 'NORMAL',
      outOptions: typeof options,
      params: T,
      finishCallback?: () => void
    ): Promise<undefined | D> => {
      const {
        cacheKey,
        params: optionsParams,
        freshTime,
        use,
        handle,
      } = outOptions;
      const requestTime = new Date().getTime();
      const lastRequestParams =
        queryStore.current.getLastParamsWithKey(cacheKey)?.originData;
      const innerParams = params
        ? params
        : cacheKey
        ? lastRequestParams
          ? lastRequestParams
          : optionsParams
        : optionsParams;

      if (cacheKey && target === 'NORMAL') {
        const { dataWithWrapper, originData } =
          queryStore.current.getLastParamsWithKey(cacheKey);

        if (
          freshTime &&
          requestTime - dataWithWrapper?.CREATE_TIME <
            (freshTime || 30 * 1000) &&
          deepComparison(innerParams, originData)
        ) {
          console.warn(
            'Hit caches. If you need to get the latest response data,' +
              ' please manually run the exported [request] function'
          );
          return Promise.resolve(undefined);
        }
      }
      return consumer(
        promiseFunc,
        {
          params: innerParams,
          cacheKey,
          requestTime,
          stage: 'normal',
          use,
          handle: {
            onSuccess: handle?.onSuccess,
            onFail: handle?.onFail,
          },
        },
        finishCallback,
        setState
      );
    },
    [setState, consumer, promiseFunc]
  );

  useEffect(() => {
    const { auto, params, loop } = options;
    if (auto && !loop) {
      queryStore.current.clearWaitRetry(options.cacheKey);
      innerRequest('NORMAL', options, params);
    }
  }, [innerRequest, options]);

  useEffect(() => {
    const { auto, loop, loopInterval, params } = options;
    if (!(auto && loop)) return;
    let canRequest = false;
    const request = () => {
      innerRequest('MANUAL', options, params, () => {
        canRequest = true;
      });
    };
    clearInterval(intervalId.current);
    request();
    intervalId.current = setInterval(() => {
      if (!canRequest) return;
      canRequest = false;
      request();
    }, loopInterval || 1000);

    return () => {
      clearInterval(intervalId.current);
    };
  }, [innerRequest, options]);

  useEffect(() => {
    const { retry, retryCount, retryInterval, cacheKey, handle } = options;
    if (!(mode === 'RETRY' && retry && cacheKey)) return;
    let canRequest = true;
    let counter = 0;
    clearInterval(intervalId.current);
    const queue = queryStore.current.getWaitRetry(cacheKey);
    const lastWaitRetry = queue?.slice(-1);
    const params = lastWaitRetry?.[0]?.params;
    queryStore.current.removeWaitRetry(cacheKey, lastWaitRetry);
    intervalId.current = setInterval(() => {
      if (!canRequest) return;
      if (counter >= (retryCount || 1)) {
        clearInterval(intervalId.current);
        setMode('NORMAL');
        queryStore.current.clearWaitRetry(options.cacheKey);
        handle.onRetryComplete(cacheKey, new Date().getTime());
        return;
      }
      counter += 1;
      handle.onRetry(cacheKey, params, new Date().getTime(), counter);
      canRequest = false;
      innerRequest('MANUAL', options, params, () => {
        canRequest = true;
      });
    }, retryInterval || 1000);
    return () => {
      clearInterval(intervalId.current);
    };
  }, [innerRequest, mode, options, setMode]);

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
    hasRequest,
    rollback: () => {
      if (options.loop) return;
      queryStore.current.clearWaitRetry(options.cacheKey);
      startBroadcast(options.cacheKey, 'pre');
      queryStore.current.reverseParams(options.cacheKey);
    },
    request: (params?: T) => {
      queryStore.current.clearWaitRetry(options.cacheKey);
      return innerRequest('MANUAL', options, params || options.params);
    },
    requestAsync: promiseFuncByParams,
  };
};

export {
  deepComparison,
  SimpleQueryConfigProvider,
  useConfigState,
  SimpleQueryStore,
};

export default useSimpleQuery;
