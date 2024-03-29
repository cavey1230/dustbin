import React, {
  createContext,
  PropsWithChildren,
  useContext,
  useState,
} from 'react';
import { QueryOptions } from '../index';
import { ChildrenPartial } from '../core';
import { RequestParamsCacheType, SimpleQueryStore } from '../store';

export type ContextConfig = {
  freshTime?: number;
  retry?: boolean;
  retryCount?: number;
  retryInterval?: number;
  loopInterval?: number;
  hideHitCacheTips?: boolean;
  use?: QueryOptions<any, ChildrenPartial<any>, any>['use'];
  handle?: {
    onSuccess?: (params: any, data: any) => void;
    onFail?: (params: any, data: any) => void;
    onRetryComplete?: (cacheKey: string, time: number) => void;
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

  const [innerCache] = useState(cache);

  const [innerConfig] = useState(config);

  return (
    <ConfigCache.Provider value={innerCache}>
      <ConfigState.Provider value={innerConfig}>
        {children}
      </ConfigState.Provider>
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
