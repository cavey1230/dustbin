import React, { createContext, PropsWithChildren, useContext } from 'react';
import { QueryOptions } from '../index';
import { ChildrenPartial } from '../core';
import { RequestParamsCacheType, SimpleQueryStore } from '../store';

export type ContextConfig = {
  freshTime?: number;
  retry?: boolean;
  retryCount?: number;
  retryInterval?: number;
  loopInterval?: number;
  use?: QueryOptions<any, ChildrenPartial<any>, any>['use'];
  handle?: {
    onSuccess?: (params: any, data: any) => void;
    onFail?: (params: any, data: any) => void;
    onRetryComplete?: () => void;
  };
};

export type ContextCache = {
  onCacheDataChange?: (
    toLocalStorageObject: [string, RequestParamsCacheType][]
  ) => void;
  setCacheDataWithLocalStorage?: () => [
    string,
    Record<'pre' | 'last', Record<string, any>>
  ][];
  store?: SimpleQueryStore;
};

const ConfigState = createContext<ContextConfig>({});

const ConfigCache = createContext<ContextCache>({});

const SimpleQueryConfigProvider = ({
  children,
  config,
  cache,
}: PropsWithChildren<{
  config?: ContextConfig;
  cache?: ContextCache;
}>) => {
  if (
    cache &&
    !cache.store &&
    (!cache.onCacheDataChange || !cache.setCacheDataWithLocalStorage)
  ) {
    throw new ReferenceError(
      '[onCacheDataChange] [setCacheDataWithLocalStorage] must be used together'
    );
  }
  return (
    <ConfigCache.Provider value={cache}>
      <ConfigState.Provider value={config}>{children}</ConfigState.Provider>
    </ConfigCache.Provider>
  );
};

const useConfigCache = () => {
  const context = useContext(ConfigCache);
  return context ? context : {};
};

const useConfigState = () => {
  return useContext(ConfigState);
};

export { SimpleQueryConfigProvider, useConfigState, useConfigCache };
