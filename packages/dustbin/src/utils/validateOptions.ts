import { QueryOptions } from '../index';

export const validateOptions = <T, CD, D>(options: QueryOptions<T, CD, D>) => {
  const {
    loop,
    cacheKey,
    freshTime,
    retry,
    retryInterval,
    loopInterval,
    auto,
    retryCount,
  } = options;

  if (loop && retry) {
    return new Error('[loop] [retry] cannot be used together');
  }

  if (loop && typeof loop !== 'boolean') {
    return new Error('[loop] must use boolean type');
  }

  if (retry && typeof retry !== 'boolean') {
    return new Error('[retry] must use boolean type');
  }

  if (cacheKey && typeof cacheKey !== 'string') {
    return new Error('[cacheKey] must use string type');
  }

  if (typeof auto !== 'boolean') {
    return new Error('[auto] must use boolean type');
  }

  if (freshTime && typeof freshTime !== 'number') {
    return new Error('[freshTime] must use number type');
  }

  if (retryInterval && typeof retryInterval !== 'number') {
    return new Error('[retryInterval] must use number type');
  }

  if (loopInterval && typeof loopInterval !== 'number') {
    return new Error('[retryInterval] must use number type');
  }

  if (retryCount && typeof retryCount !== 'number') {
    return new Error('[retryCount] must use number type');
  }
};

export default validateOptions;
