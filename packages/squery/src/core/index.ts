import { useCallback, useEffect, useRef, useState } from 'react';
import deepComparison from '../utils/deepComparison';
import { SimpleQueryStore } from '../store';

export let globalStore: SimpleQueryStore;

type UseWatchStateInitializeOptions = {
  data: boolean;
  loading: boolean;
  error: boolean;
};

type QueryOptions<T, CD> = {
  loop?: boolean;
  loopInterval?: number;
  cacheKey?: string;
  freshTime?: number;
  retry?: boolean;
  retryCount?: number;
  params?: T;
  initializeData?: CD;
  manual?: boolean;
  use?: [];
};

type ChildrenPartial<D> = {
  [K in keyof D]?: Partial<D[K]> extends Record<string, any>
    ? ChildrenPartial<D[K]>
    : Partial<D[K]>;
};

const useInitializeStore = () => {
  if (!globalStore) {
    globalStore = new SimpleQueryStore();
  }
  return useRef(globalStore);
};

const useWatchState = <T, D, E>(options: {
  initializeOptions?: UseWatchStateInitializeOptions;
  keys?: string;
  params?: T;
  initializeData?: ChildrenPartial<D>;
  queryStore?: SimpleQueryStore;
}) => {
  const [data, setData] = useState<D>(
    options.queryStore.getDataByParams(options?.keys, 'last') ||
      options.initializeData
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
        loading !== combined.data && setLoading(combined.data as boolean);
      }
      if (haveBeenUsedRef.current.error && type === 'error') {
        const judge = deepComparison(error, combined.data);
        !judge && setError(combined.data as E);
      }
    },
    [data, error, loading, options]
  );

  return {
    data,
    error,
    loading,

    setState,

    haveBeenUsedRef,
  };
};

const useSimpleQuery = <T, D, E>(
  promiseFunc: (params?: T) => Promise<D>,
  options: QueryOptions<T, ChildrenPartial<D>>
) => {
  const queryStore = useInitializeStore().current;

  const [hasRequest, setHasRequest] = useState<boolean>(false);

  const { data, loading, error, setState, haveBeenUsedRef } = useWatchState<
    T,
    D,
    E
  >({
    initializeOptions: {
      data: false,
      loading: false,
      error: false,
    },
    keys: options?.cacheKey,
    initializeData: options?.initializeData,
    queryStore: queryStore,
  });

  const innerRequest = useCallback(
    (params: T) => {
      const innerOptions = { ...(options || {}) };
      const { cacheKey } = innerOptions;
      if (cacheKey) {
        const { originData } = queryStore.getLastParamsWithKey(cacheKey);
        if (originData && deepComparison(params, originData)) {
          return;
        }
      }
      setState({ data: true }, 'loading');
      const requestTime = new Date().getTime();
      promiseFunc(params)
        .then((result) => {
          if (cacheKey) {
            const { dataWithWrapper } =
              queryStore.getLastParamsWithKey(cacheKey);
            if (requestTime < dataWithWrapper.CREATE_TIME.getTime()) {
              return;
            }
          }
          setState({ data: result, params: params }, 'data');
        })
        .catch((reason) => {
          setState({ data: reason }, 'error');
        })
        .finally(() => {
          setHasRequest(true);
          setState({ data: false }, 'loading');
        });
    },
    [options, promiseFunc, queryStore, setState]
  );

  useEffect(() => {
    const { manual, params } = options;
    if (!manual) {
      innerRequest(params);
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
    request: innerRequest,
  };
};

export default useSimpleQuery;
