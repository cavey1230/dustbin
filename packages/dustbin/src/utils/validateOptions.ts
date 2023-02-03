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
    return new ReferenceError('[loop] [retry] cannot be used together');
  }

  if (loop && typeof loop !== 'boolean') {
    return new TypeError('[loop] must use boolean type');
  }

  if (retry && typeof retry !== 'boolean') {
    return new TypeError('[retry] must use boolean type');
  }

  if (cacheKey && typeof cacheKey !== 'string') {
    return new TypeError('[cacheKey] must use string type');
  }

  if (typeof auto !== 'boolean') {
    return new TypeError('[auto] must use boolean type');
  }

  if (freshTime && typeof freshTime !== 'number') {
    return new TypeError('[freshTime] must use number type');
  }

  if (retryInterval && typeof retryInterval !== 'number') {
    return new TypeError('[retryInterval] must use number type');
  }

  if (loopInterval && typeof loopInterval !== 'number') {
    return new TypeError('[retryInterval] must use number type');
  }

  if (retryCount && typeof retryCount !== 'number') {
    return new TypeError('[retryCount] must use number type');
  }
};

export default validateOptions;
