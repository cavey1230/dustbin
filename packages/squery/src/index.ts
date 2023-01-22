import { useCallback, useEffect, useRef, useState } from 'react';
import deepComparison from './utils/deepComparison';
import { ChildrenPartial, useInitializeStore, useWatchState } from './core';

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

const useSimpleQuery = <T, D, E>(
  promiseFunc: (params?: T) => Promise<D>,
  options: QueryOptions<T, ChildrenPartial<D>>
) => {
  const queryStore = useInitializeStore().current;

  const preOptions = useRef<QueryOptions<T, ChildrenPartial<D>>>();

  const [hasRequest, setHasRequest] = useState<boolean>(false);

  const { data, loading, error, setState, haveBeenUsedRef } = useWatchState<
    T,
    D,
    E extends undefined ? any : E
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
    (params?: T) => {
      const innerOptions = { ...(options || {}) };
      const { cacheKey, params: optionsParams } = innerOptions;
      console.log(queryStore);
      if (cacheKey && params) {
        const { originData } = queryStore.getLastParamsWithKey(cacheKey);
        if (originData && deepComparison(params, originData)) {
          return;
        }
      }
      const innerParams = params ? params : optionsParams;
      setState({ data: true }, 'loading');
      const requestTime = new Date().getTime();
      promiseFunc(innerParams)
        .then((result) => {
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
          setState({ data: result, params: innerParams }, 'data');
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
    if (!manual && !deepComparison(preOptions.current, options)) {
      preOptions.current = options;
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

export { deepComparison };

export default useSimpleQuery;
