import { useCallback, useEffect, useRef, useState } from 'react';
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
  useConfigDispatch,
  useConfigState,
} from './utils/configContext';

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
  };
};

const useSimpleQuery = <T, D, E>(
  promiseFunc: (params?: T) => Promise<D>,
  optionsParams?: QueryOptions<T, ChildrenPartial<D>, D>
) => {
  const queryStore = useRef(useInitializeStore());

  const options = usePackageOptions<T, D>(optionsParams);

  const preOptions = useRef<QueryOptions<T, ChildrenPartial<D>, D>>();

  const [stage, setStage] = useState<'NORMAL' | 'RETRY'>('NORMAL');

  useEffect(() => {
    const validate = validateOptions(options);
    if (validate) {
      throw validate;
    }
  }, [options]);

  const [consumer, hasRequest] = usePromiseConsumer<T, D>(
    setStage,
    options.cacheKey
  );

  const {
    data,
    loading,
    error,
    setState,
    setStateWithStoreValue,
    haveBeenUsedRef,
  } = useWatchState<T, D, E extends undefined ? any : E>({
    initializeOptions: {
      data: false,
      loading: false,
      error: false,
    },
    keys: options.cacheKey,
    initializeData: options.initializeData,
    queryStore: queryStore.current,
  });

  useSubscribeBroadcast(options?.cacheKey, (type) => {
    setStateWithStoreValue(type);
  });

  const retryRequest = useCallback(() => {
    const { cacheKey } = options;
    const queue = queryStore.current.getWaitRetry(cacheKey);

    const lastRequestParams =
      queryStore.current.getLastParamsWithKey(cacheKey)?.originData;

    const innerParams = cacheKey
      ? lastRequestParams
        ? lastRequestParams
        : options.params
      : options.params;

    const lastRequest = queue?.slice(-1) || [
      {
        request: promiseFunc,
        params: innerParams,
      },
    ];
    queryStore.current.removeWaitRetry(cacheKey, lastRequest);
    const requestTime = new Date().getTime();
    lastRequest?.[0] &&
      consumer(
        lastRequest?.[0]?.request,
        {
          params: lastRequest?.[0]?.params,
          cacheKey: cacheKey,
          requestTime,
          stage: 'retry',
          use: options.use,
          handle: {
            onSuccess: options?.handle?.onSuccess,
            onFail: options?.handle?.onFail,
          },
        },
        setState
      );
  }, [options, promiseFunc, consumer, setState]);

  useEffect(() => {
    let intervalId: number;
    let counter = 0;
    if (stage === 'RETRY' && options?.retry) {
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
  }, [options, retryRequest, stage]);

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
    let intervalId: number;
    if (auto && !loop && !deepComparison(preOptions.current, options)) {
      const beCombinedParams = cacheKey
        ? queryStore.current.getLastParamsWithKey(cacheKey)?.originData
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
      queryStore.current.clearWaitRetry(cacheKey);
      innerRequest('normal', params);
    }
    if (auto && loop) {
      queryStore.current.clearWaitRetry(cacheKey);
      intervalId = setInterval(() => {
        innerRequest('manual', params);
      }, options.loopInterval || 1000);
      return () => {
        clearInterval(intervalId);
      };
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
      queryStore.current.clearWaitRetry(options.cacheKey);
      innerRequest('manual', params);
    },
  };
};

export {
  deepComparison,
  SimpleQueryConfigProvider,
  useConfigDispatch,
  useConfigState,
};

export default useSimpleQuery;
