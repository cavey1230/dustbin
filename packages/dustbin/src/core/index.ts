import {
  MutableRefObject,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import deepComparison from '../utils/deepComparison';
import { RetryQueueItem, SimpleQueryStore } from '../store';
import { QueryOptions } from '../index';
import { useConfigCache, useConfigState } from '../utils/configContext';
import { startBroadcast } from '../utils/broadcast';

export let globalStore: SimpleQueryStore;

type UseWatchStateInitializeOptions = {
  data: boolean;
  loading: boolean;
  error: boolean;
};

export type ChildrenPartial<D> = {
  [K in keyof D]?: Partial<D[K]> extends Record<string, any>
    ? ChildrenPartial<D[K]>
    : Partial<D[K]>;
};

export type UserItemOptions<T, D> = {
  type: 'before' | 'after';
  stop: boolean;
  cacheKey: string;
  params: T;
  stage: 'normal' | 'retry';
  requestTime: number;
  result?: D;
};

export type ConsumerOptions<T, D> = {
  params: T;
  cacheKey: string;
  requestTime: number;
  stage: 'normal' | 'retry';
  handle: Pick<
    QueryOptions<T, ChildrenPartial<D>, D>['handle'],
    'onSuccess' | 'onFail'
  >;
  use: QueryOptions<T, ChildrenPartial<D>, D>['use'];
};

export const useInitializeStore = () => {
  const { onCacheDataChange, setCacheDataWithLocalStorage, store } =
    useConfigCache();

  if (!globalStore && !store) {
    globalStore = new SimpleQueryStore({
      onCacheDataChange,
      setCacheDataWithLocalStorage,
    });
  }

  if (store) {
    return store;
  }

  return globalStore;
};

export const usePackageOptions = <T, D>(
  optionsParams: QueryOptions<T, ChildrenPartial<D>, D>
) => {
  const configStateContext = useConfigState();

  const packageOptions = useCallback(
    (options: typeof optionsParams) =>
      configStateContext
        ? {
            ...configStateContext,
            ...options,
            handle: {
              onSuccess: (params: T, data: D) => {
                configStateContext?.handle?.onSuccess?.(params, data);
                options?.handle?.onSuccess?.(params, data);
              },
              onFail: (params: T, data: D) => {
                configStateContext?.handle?.onFail?.(params, data);
                options?.handle?.onFail?.(params, data);
              },
              onRetryComplete: (cacheKey: string, time: number) => {
                configStateContext?.handle?.onRetryComplete?.(cacheKey, time);
                options?.handle?.onRetryComplete?.(cacheKey, time);
              },
              onRetry: (
                cacheKey: string,
                params: any,
                time: number,
                counter: number
              ) => {
                options?.handle?.onRetry?.(cacheKey, params, time, counter);
              },
            },
          }
        : options,
    [configStateContext]
  );

  const [options, setOptions] = useState<typeof optionsParams>(
    packageOptions(optionsParams)
  );

  useEffect(() => {
    setOptions((prevState) =>
      deepComparison(prevState, packageOptions(optionsParams))
        ? prevState
        : packageOptions(optionsParams)
    );
  }, [optionsParams, packageOptions]);

  return options;
};

export const useIsUnmount = () => {
  const isUnmount = useRef<boolean>(false);

  useEffect(
    () => () => {
      isUnmount.current = true;
    },
    []
  );

  return isUnmount;
};

export const usePromiseConsumer = <T, D>(cacheKey: string) => {
  const queryStore = useRef(useInitializeStore());

  const [hasRequest, setHasRequest] = useState<boolean>(false);

  const [mode, setMode] = useState<'RETRY' | 'NORMAL'>('NORMAL');

  const isUnmount: MutableRefObject<boolean> = useIsUnmount();

  const waitRetryList = useRef<RetryQueueItem[]>([]);

  useEffect(() => {
    const innerWaitRetryList = waitRetryList;
    const innerQueryStore = queryStore;
    return () => {
      innerQueryStore.current.removeWaitRetry(
        cacheKey,
        innerWaitRetryList.current
      );
    };
  }, [cacheKey]);

  const middlewareFactory = useCallback(
    (type: 'after' | 'before', options: ConsumerOptions<T, D>, result?: D) => {
      const { use, cacheKey, params, stage, requestTime } = options;
      let originData: UserItemOptions<T, D> = {
        type,
        stop: false,
        cacheKey,
        params,
        stage,
        requestTime,
        result: result,
      };
      if (use && use.length > 0) {
        use?.forEach((item) => {
          originData = originData.stop ? originData : item(originData);
        });
      }
      return originData;
    },
    []
  );

  const consumer = useCallback(
    (
      promise: (params?: T) => Promise<D>,
      options: ConsumerOptions<T, D>,
      finishCallback: () => void,
      setState: (
        combined: {
          data: D | boolean;
          params?: T;
          REQUEST_TIME?: number;
        },
        type: keyof UseWatchStateInitializeOptions
      ) => void
    ): Promise<undefined | D> => {
      const { params, cacheKey, requestTime, handle: optionsHandle } = options;

      const originData = middlewareFactory('before', options);
      if (originData.stop) return Promise.reject('stop by middleware');

      setState({ data: true }, 'loading');
      return promise(params)
        .then((result) => {
          if (cacheKey) {
            const { dataWithWrapper } =
              queryStore.current.getLastParamsWithKey(cacheKey);
            if (dataWithWrapper && requestTime < dataWithWrapper.REQUEST_TIME) {
              return undefined;
            }
          }
          if (!isUnmount.current) {
            setMode('NORMAL');
            const originData = middlewareFactory('after', options, result);
            if (originData.stop) return undefined;
            setState(
              { data: originData.result, params, REQUEST_TIME: requestTime },
              'data'
            );
            optionsHandle?.onSuccess?.(params, result);
            startBroadcast(cacheKey, 'last');
          }
          return result;
        })
        .catch((reason) => {
          if (!isUnmount.current) {
            const waitRetryItem = {
              request: promise,
              params: params,
            };
            waitRetryList.current = [...waitRetryList.current, waitRetryItem];
            queryStore.current.pushWaitRetry(cacheKey, waitRetryItem);
            setMode('RETRY');
            setState({ data: reason }, 'error');
            optionsHandle?.onFail?.(params, reason);
          }
          return undefined;
        })
        .finally(() => {
          if (!isUnmount.current) {
            finishCallback?.();
            setHasRequest(true);
            setState({ data: false }, 'loading');
          }
        });
    },
    [isUnmount, middlewareFactory]
  );

  return [consumer, hasRequest, mode, setMode] as const;
};

export const useWatchState = <T, D, E>(options: {
  initializeOptions?: UseWatchStateInitializeOptions;
  keys?: string;
  params?: T;
  initializeData?: ChildrenPartial<D>;
  queryStore?: SimpleQueryStore;
}) => {
  const [data, setData] = useState<D>(
    options.queryStore.getDataByParams(options?.keys, 'last') ||
      options?.initializeData
  );
  const [error, setError] = useState<E>();
  const [loading, setLoading] = useState<boolean>(false);

  const haveBeenUsedRef = useRef(
    options?.initializeOptions ||
      ({
        data: false,
        loading: false,
        error: false,
      } as UseWatchStateInitializeOptions)
  );

  const setStateWithStoreValue = useCallback(
    (type: 'pre' | 'last') => {
      setData(options.queryStore.getDataByParams(options.keys, type));
    },
    [options]
  );

  const setState = useCallback(
    (
      combined: {
        data: D | E | boolean;
        params?: T;
        REQUEST_TIME?: number;
      },
      type: keyof UseWatchStateInitializeOptions
    ) => {
      if (haveBeenUsedRef.current.data && type === 'data') {
        setData((prevState) =>
          deepComparison(prevState, combined.data)
            ? prevState
            : (combined.data as D)
        );
        setError(undefined);
        options?.keys &&
          options.queryStore.setResponseData(
            options?.keys,
            combined.params
              ? { ...combined.params, REQUEST_TIME: combined.REQUEST_TIME }
              : { EMPTY_PARAMS: true },
            combined.data as D
          );
      }
      if (haveBeenUsedRef.current.loading && type === 'loading') {
        setLoading(combined.data as boolean);
      }
      if (haveBeenUsedRef.current.error && type === 'error') {
        setError(combined.data as E);
      }
    },
    [options]
  );

  return {
    data,
    error,
    loading,

    setState,

    setStateWithStoreValue,

    haveBeenUsedRef,
  };
};
