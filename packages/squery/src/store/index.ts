type CacheParamsType = Record<any, any> & {
  SIMPLE_QUERY_KEY: string;
  CREATE_TIME: Date;
};

export type RequestParamsCacheType = {
  pre: CacheParamsType;
  last: CacheParamsType;
};

interface Options {
  freshTime?: number;
  handleLocalStorage?: (data: any) => void;
}

export class SimpleQueryStore {
  private requestQueue: Record<string, Promise<any>[]>;
  private readonly responseData: WeakMap<object, any>;
  private requestParams: Record<string, RequestParamsCacheType>;
  private readonly options: Options;

  constructor(options?: Options) {
    this.requestQueue = {};
    this.responseData = new WeakMap();
    this.requestParams = {};
    this.options = options || {
      freshTime: 15 * 60,
    };
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

  throwTips(tips: string) {
    console.error(tips);
    return new TypeError(tips);
  }

  pushNewRequestToQueue<D>(key: string, request: Promise<D>) {
    if (!(request instanceof Promise)) {
      throw this.throwTips(
        'PushNewRequestToQueue function "request" param must use ES6 promise and param instanceof Promise'
      );
    }
    this.requestQueue = {
      ...this.requestQueue,
      [key]: [...(this.requestQueue?.[key] || []), request],
    };
  }

  removeRequestOfQueue<D>(key: string, request: Promise<D>) {
    const findQueueByKey = this.requestQueue?.[key] || [];
    if (findQueueByKey.length > 0) {
      findQueueByKey?.splice(findQueueByKey.indexOf(request), 1);
      this.requestQueue = {
        ...this.requestQueue,
        [key]: findQueueByKey,
      };
    }
  }

  getDataByParams(key: string, type: 'pre' | 'last') {
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
    if (
      (typeof data === 'object' && !(Object.keys(params)?.length > 0)) ||
      (typeof data === 'object' && !(Object.keys(data)?.length > 0)) ||
      data === null ||
      params === null
    ) {
      throw this.throwTips('params or data not allow empty object');
    }

    const { freshTime, handleLocalStorage } = this.options;

    const findParamsWithKey = this.requestParams?.[key]
      ? { ...this.requestParams?.[key] }
      : ({} as RequestParamsCacheType);

    const judgeFindParamsWithKey =
      findParamsWithKey && Object.keys(findParamsWithKey)?.length > 0;

    const requestParams = judgeFindParamsWithKey && findParamsWithKey;

    if (
      requestParams &&
      requestParams?.pre &&
      new Date().getTime() - freshTime * 1000 >
        requestParams?.pre?.CREATE_TIME.getTime()
    ) {
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
