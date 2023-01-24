import { useEffect } from 'react';

const simpleQueryBroadcastListeners: Record<
  string,
  Array<(type: 'pre' | 'last') => void>
> = {};

export const startBroadcast = (cacheKey: string, type: 'pre' | 'last') => {
  cacheKey &&
    simpleQueryBroadcastListeners?.[cacheKey]?.forEach((listener) =>
      listener(type)
    );
};

export const useSubscribeBroadcast = (
  cacheKey: string,
  listener: (type: 'pre' | 'last') => void
) => {
  useEffect(() => {
    if (!cacheKey) return;
    const cacheKeyListeners = simpleQueryBroadcastListeners?.[cacheKey] || [];
    simpleQueryBroadcastListeners[cacheKey] = [...cacheKeyListeners, listener];
    return () => {
      cacheKeyListeners?.splice(cacheKeyListeners.indexOf(listener), 1);
    };
  }, [cacheKey, listener]);
};
