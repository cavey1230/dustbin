import {
  Dispatch,
  SetStateAction,
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

export const useInitializeStore = () => {
  const { onCacheDataChange, setCacheDataWithLocalStorage } = useConfigCache();
  if (!globalStore) {
    globalStore = new SimpleQueryStore({
      onCacheDataChange,
      setCacheDataWithLocalStorage,
    });
  }
  return useRef(globalStore);
};

export const usePackageOptions = <T, D>(
  options: QueryOptions<T, ChildrenPartial<D>, D>
) => {
  const configStateContext = useConfigState();

  if (configStateContext) {
    return {
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
        onRetryComplete: () => {
          configStateContext?.handle?.onRetryComplete?.();
          options?.handle?.onRetryComplete?.();
        },
      },
    };
  }

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

export const usePromiseConsumer = <T, D>(
  setStage: Dispatch<SetStateAction<'normal' | 'retry'>>,
  cacheKey: string
) => {
  const queryStore = useInitializeStore().current;

  const [hasRequest, setHasRequest] = useState<boolean>(false);

  const isUnmount = useIsUnmount();

  const waitRetryQueueRef = useRef<RetryQueueItem[]>([]);

  useEffect(() => {
    const waitRetryQueue = waitRetryQueueRef.current;
    return () => {
      queryStore.removeWaitRetry(cacheKey, waitRetryQueue);
    };
  }, [cacheKey, queryStore]);

  return [
    (
      promise: (params?: T) => Promise<D>,
      options: {
        params: T;
        cacheKey: string;
        requestTime: number;
        stage: 'normal' | 'retry';
        handle: QueryOptions<T, ChildrenPartial<D>, D>['handle'];
        use: QueryOptions<T, ChildrenPartial<D>, D>['use'];
      },
      setState: (
        combined: {
          data: D | boolean;
          params?: T;
        },
        type: keyof UseWatchStateInitializeOptions
      ) => void
    ) => {
      const { params, cacheKey, requestTime, handle, use, stage } = options;
      const middlewareNeedParams = {
        cacheKey,
        params,
        stage,
        requestTime,
      };
      let before: UserItemOptions<T, D> = {
        type: 'before',
        stop: false,
        ...middlewareNeedParams,
      };
      if (use && use.length > 0) {
        for (let i = use.length; i-- > 0; ) {
          before = before.stop ? before : use[i](before);
        }
      }
      if (before.stop) {
        return;
      }
      promise(params)
        ?.then((result) => {
          if (cacheKey) {
            const { dataWithWrapper } =
              queryStore.getLastParamsWithKey(cacheKey);
            if (dataWithWrapper && requestTime < dataWithWrapper.CREATE_TIME) {
              return;
            }
          }
          if (!isUnmount.current) {
            setStage('normal');
            let after: UserItemOptions<T, D> = {
              type: 'after',
              stop: false,
              ...middlewareNeedParams,
              result: result,
            };
            if (use && use?.length > 0) {
              for (let i = 0; i < use.length; i++) {
                after = after.stop ? after : use[i](after);
              }
            }
            if (after.stop) return;
            setState({ data: result, params }, 'data');
            handle?.onSuccess?.(params, result);
            startBroadcast(cacheKey, 'last');
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
    hasRequest,
  ] as const;
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

  const setStateWithStoreValue = (type: 'pre' | 'last') => {
    setData(options.queryStore.getDataByParams(options.keys, type));
  };

  const setState = useCallback(
    (
      combined: {
        data: D | E | boolean;
        params?: T;
      },
      type: keyof UseWatchStateInitializeOptions
    ) => {
      if (haveBeenUsedRef.current.data && type === 'data') {
        const judge = deepComparison(data, combined.data);
        if (!judge) {
          setData(combined.data as D);
          options?.keys &&
            options.queryStore.setResponseData(
              options?.keys,
              combined.params || {},
              combined.data as D
            );
        }
      }
      if (haveBeenUsedRef.current.loading && type === 'loading') {
        setLoading(combined.data as boolean);
      }
      if (haveBeenUsedRef.current.error && type === 'error') {
        setError(combined.data as E);
      }
    },
    [data, options]
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
