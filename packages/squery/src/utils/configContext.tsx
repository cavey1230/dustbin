import React, {
  createContext,
  PropsWithChildren,
  useContext,
  useState,
} from 'react';
import { QueryOptions } from '../index';
import { ChildrenPartial } from '../core';
import { RequestParamsCacheType } from '../store';

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
};

const ConfigState = createContext<ContextConfig>({});

const ConfigDispatch =
  createContext<React.Dispatch<React.SetStateAction<ContextConfig>>>(undefined);

const ConfigCache = createContext<ContextCache>({});

const SimpleQueryConfigProvider = ({
  children,
  config: configParams,
  cache,
}: PropsWithChildren<{
  config: ContextConfig;
  cache: ContextCache;
}>) => {
  if (
    cache &&
    (!cache.onCacheDataChange || !cache.setCacheDataWithLocalStorage)
  ) {
    throw new ReferenceError(
      '[onCacheDataChange] [setCacheDataWithLocalStorage] must be used together'
    );
  }
  const [config, setConfig] = useState<ContextConfig>(configParams);
  return (
    <ConfigCache.Provider value={cache}>
      <ConfigState.Provider value={config}>
        <ConfigDispatch.Provider value={setConfig}>
          {children}
        </ConfigDispatch.Provider>
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

const useConfigDispatch = () => {
  return useContext(ConfigDispatch);
};

export {
  SimpleQueryConfigProvider,
  useConfigState,
  useConfigDispatch,
  useConfigCache,
};
