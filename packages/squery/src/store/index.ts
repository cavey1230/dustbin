type CacheParamsType = Record<any, any> & {
  SIMPLE_QUERY_KEY: string;
  CREATE_TIME: Date;
};

export type RequestParamsCacheType = {
  pre: CacheParamsType;
  last: CacheParamsType;
};

interface Options {
  handleLocalStorage?: (data: any) => void;
}

export type RetryQueueItem = {
  request: (params: any) => Promise<any>;
  params: any;
};

export class SimpleQueryStore {
  private readonly responseData: WeakMap<object, any>;
  private requestParams: Record<string, RequestParamsCacheType>;
  private waitRetryQueue: Record<string, Array<RetryQueueItem>>;
  private readonly options: Options;

  constructor(options?: Options) {
    this.responseData = new WeakMap();
    this.waitRetryQueue = {};
    this.requestParams = {};
    this.options = options || {};
  }

  throwTips(tips: string) {
    console.error(tips);
    return new TypeError(tips);
  }

  getWaitRetry(key: string) {
    if (!key) return;
    return this.waitRetryQueue?.[key] || [];
  }

  pushWaitRetry(key: string, request: RetryQueueItem) {
    if (!key) return;
    this.waitRetryQueue = {
      ...this.waitRetryQueue,
      [key]: [...(this.waitRetryQueue?.[key] || []), request],
    };
  }

  clearWaitRetry(key: string) {
    if (!key) return;
    this.waitRetryQueue = {
      ...this.waitRetryQueue,
      [key]: [],
    };
  }

  removeWaitRetry(key: string, requests: RetryQueueItem[]) {
    if (!key) return;
    const copyQueue = this.waitRetryQueue?.[key] || [];
    if (copyQueue.length > 0) {
      requests.forEach((item) => {
        copyQueue?.splice(copyQueue.indexOf(item), 1);
      });
      this.waitRetryQueue = {
        ...this.waitRetryQueue,
        [key]: copyQueue,
      };
    }
  }

  getLastParamsWithKey(key: string) {
    const findRequestParams = this.requestParams?.[key];
    if (findRequestParams && findRequestParams?.last) {
      return {
        originData: Object.keys(findRequestParams?.last)?.reduce(
          (store, item) => {
            if (!['SIMPLE_QUERY_KEY', 'CREATE_TIME'].includes(item)) {
              store[item] = findRequestParams?.last?.[item];
            }
            return store;
          },
          {} as CacheParamsType
        ),
        dataWithWrapper: findRequestParams?.last,
      };
    }
    return {};
  }

  getDataByParams(key: string, type: 'pre' | 'last') {
    if (!key) return;
    if (!Object.keys(this.requestParams)?.some((i) => i === key)) return;
    const keyOfObject = this.requestParams?.[key];
    if (
      keyOfObject &&
      Object.keys(keyOfObject).length > 0 &&
      keyOfObject?.[type] &&
      this.responseData.has(keyOfObject?.[type])
    ) {
      return this.responseData.get(keyOfObject?.[type]);
    }
  }

  setResponseData(key: string, params: Record<string, any>, data: any) {
    if (!key) return;
    if (
      (typeof data === 'object' && !(Object.keys(params)?.length > 0)) ||
      (typeof data === 'object' && !(Object.keys(data)?.length > 0)) ||
      data === null ||
      params === null
    ) {
      throw this.throwTips('params or data not allow empty object');
    }

    const { handleLocalStorage } = this.options;

    const findParamsWithKey = this.requestParams?.[key]
      ? { ...this.requestParams?.[key] }
      : ({} as RequestParamsCacheType);

    const judgeFindParamsWithKey =
      findParamsWithKey && Object.keys(findParamsWithKey)?.length > 0;

    const requestParams = judgeFindParamsWithKey && findParamsWithKey;

    if (requestParams && requestParams?.pre) {
      this.responseData.delete(requestParams.pre);
    }

    const packageParams = {
      SIMPLE_QUERY_KEY: key,
      CREATE_TIME: new Date(),
      ...params,
    };

    this.requestParams = {
      ...this.requestParams,
      [key]: {
        pre: requestParams ? requestParams.last : undefined,
        last: packageParams,
      },
    };

    this.responseData.set(packageParams, data);

    handleLocalStorage?.(packageParams);
  }
}
