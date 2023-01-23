import { useCallback, useEffect, useRef, useState } from 'react';
import deepComparison from '../utils/deepComparison';
import { SimpleQueryStore } from '../store';

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

    haveBeenUsedRef,
  };
};
