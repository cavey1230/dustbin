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

    const findListenerIndex = (
      simpleQueryBroadcastListeners[cacheKey] || []
    ).indexOf(listener);

    if (findListenerIndex >= 0) return;
    if (!simpleQueryBroadcastListeners[cacheKey]) {
      simpleQueryBroadcastListeners[cacheKey] = [];
    }

    simpleQueryBroadcastListeners[cacheKey].push(listener);

    return () => {
      simpleQueryBroadcastListeners[cacheKey]?.splice(
        simpleQueryBroadcastListeners[cacheKey].indexOf(listener),
        1
      );
    };
  }, [cacheKey, listener]);
};
