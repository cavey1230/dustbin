import { useEffect } from 'react';

const simpleQueryBroadcastListeners: Record<string, Array<() => void>> = {};

export const startBroadcast = (cacheKey: string) => {
  cacheKey &&
    simpleQueryBroadcastListeners?.[cacheKey]?.forEach((listener) =>
      listener()
    );
};

export const useSubscribeBroadcast = (
  cacheKey: string,
  listener: () => void
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
