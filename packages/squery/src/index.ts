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
    onRetryComplete?: () => void;
    onRetry?: (counter: number) => void;
  };
};

const useSimpleQuery = <T, D, E>(
  promiseFuncParams: (params?: T) => Promise<D>,
  optionsParams?: QueryOptions<T, ChildrenPartial<D>, D>
) => {
  const queryStore = useRef(useInitializeStore());

  const options = usePackageOptions(optionsParams);

  const [promiseFunc] = useState(() => promiseFuncParams);

  useEffect(() => {
    const validate = validateOptions(options);
    if (validate) {
      throw validate;
    }
  }, [options]);

  const [consumer, hasRequest] = usePromiseConsumer<T, D>();

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
      [options]
    )
  );

  useSubscribeBroadcast(options?.cacheKey, (type) => {
    setStateWithStoreValue(type);
  });

  const innerRequest = useCallback(
    (target: 'manual' | 'normal', params?: T) => {
      const { cacheKey, params: optionsParams, freshTime } = options || {};
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

      if (cacheKey && target === 'normal') {
        const { dataWithWrapper, originData } =
          queryStore.current.getLastParamsWithKey(cacheKey);

        if (
          freshTime &&
          requestTime - dataWithWrapper?.CREATE_TIME < freshTime &&
          deepComparison(innerParams, originData)
        ) {
          console.warn(
            'Hit caches. If you need to get the latest response data,' +
              ' please manually run the exported [request] function'
          );
          return;
        }
      }
      setState({ data: true }, 'loading');
      consumer(
        promiseFunc,
        {
          params: innerParams,
          cacheKey,
          requestTime,
          stage: 'normal',
          use: options.use,
          handle: {
            onSuccess: options?.handle?.onSuccess,
            onFail: options?.handle?.onFail,
          },
        },
        setState
      );
    },
    [options, setState, consumer, promiseFunc]
  );

  useEffect(() => {
    const { auto, params, cacheKey, loop } = options;
    if (auto && !loop) {
      const beCombinedParams = cacheKey
        ? queryStore.current.getLastParamsWithKey(cacheKey)?.originData
        : options?.params
        ? options?.params
        : undefined;
      if (
        params &&
        beCombinedParams &&
        deepComparison(params, beCombinedParams)
      ) {
        return;
      }
      innerRequest('normal', params);
    }
  }, [innerRequest, options]);

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
    rollback: () => {
      startBroadcast(options.cacheKey, 'pre');
      setStateWithStoreValue('pre');
    },
    request: (params?: T) => {
      innerRequest('manual', params);
    },
  };
};

export {
  deepComparison,
  SimpleQueryConfigProvider,
  useConfigState,
  SimpleQueryStore,
};

export default useSimpleQuery;
