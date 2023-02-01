import { ContextCache } from '../utils/configContext';

type CacheParamsType = Record<any, any> & {
  SIMPLE_QUERY_KEY: string;
  CREATE_TIME: number;
  EMPTY_PARAMS?: true;
};

export type RequestParamsCacheType = {
  pre: CacheParamsType;
  last: CacheParamsType;
};

export class SimpleQueryStore {
  private responseData: WeakMap<object, any>;
  private requestParams: Record<string, RequestParamsCacheType>;
  public readonly options: ContextCache;

  constructor(options?: ContextCache) {
    this.options = options || {};
    this.setDataFromLocalStorage(options);
  }

  private setDataFromLocalStorage(options?: ContextCache) {
    const formatData = options?.setCacheDataWithLocalStorage?.()?.reduce(
      (store, item) => {
        const key = item?.[0];
        const preData = { ...item?.[1]?.pre };
        const lastData = { ...item?.[1]?.last };
        const originParams: {
          pre: any;
          last: any;
        } = {
          pre: undefined,
          last: undefined,
        };
        if (preData?.CREATE_TIME) {
          const cacheData = preData?.CACHE_DATA;
          delete preData?.CACHE_DATA;
          originParams.pre = preData;
          store[1] = [...(store?.[1] || []), [preData, cacheData]];
        }
        if (lastData?.CREATE_TIME) {
          const cacheData = lastData?.CACHE_DATA;
          delete lastData?.CACHE_DATA;
          originParams.last = lastData;
          store[1] = [...(store?.[1] || []), [lastData, cacheData]];
        }

        store[0] = [...(store[0] || []), [key, originParams]];

        return store;
      },
      [[], []]
    );
    this.responseData =
      (options?.setCacheDataWithLocalStorage &&
        formatData?.[1]?.length > 0 &&
        new WeakMap(formatData?.[1])) ||
      new WeakMap();
    this.requestParams =
      (options?.setCacheDataWithLocalStorage &&
        formatData?.[0].length > 0 &&
        Object.fromEntries(formatData?.[0])) ||
      {};
  }

  toLocalStorageObject(
    requestParams: Record<string, RequestParamsCacheType>,
    responseData: WeakMap<object, any>
  ): [string, RequestParamsCacheType][] {
    const toEntries = Object.entries(requestParams);
    return toEntries?.map(([key, { pre, last }]) => [
      key,
      {
        pre: {
          ...pre,
          CACHE_DATA: responseData.has(pre) && this.responseData.get(pre),
        },
        last: {
          ...last,
          CACHE_DATA: responseData.has(last) && this.responseData.get(last),
        },
      },
    ]);
  }

  throwTips(tips: string) {
    console.error(tips);
    return new TypeError(tips);
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
      throw this.throwTips(
        '[simple query error - setResponseData]:Not allow empty objects or other value types except objects'
      );
    }

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
      CREATE_TIME: new Date().getTime(),
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

    this.options?.onCacheDataChange?.(
      this.toLocalStorageObject(this.requestParams, this.responseData)
    );
  }
}
