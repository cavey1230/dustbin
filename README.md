# dustbin-react
（star超过50加快更新英文文档🎉）

（star超过200将解锁官方文档（网站）🎉）
## 介绍
```
dustbin-react是一个简单，快速的react网络请求库。
```
数据及垃圾，特别是我这种写后端写的烂的，所以这个项目就叫dustbin-react吧。<br/>

本来想把这个项目叫做dustbin(垃圾桶)的，可惜npm名字被dust-bin占用了😮‍💨。<br/>

使用Typescript开发，类型支持友好，能自动映射入参和请求结果类型。<br/>

86% 测试覆盖率。核心逻辑 100% 测试覆盖率。<br/>

简单的代码就能提供如数据缓存，手动回滚，快速重试等功能。<br/>

指定缓存字段后，使用同一个缓存字段的请求可以共享最新的返回数据（目前缓存字段只支持String类型）<br/>

## 0.前置条件

react 版本 大于等于 16.8

## 1.安装方法

```shell
pnpm add dustbin-react

yarn add dustbin-react

npm install dustbin-react
```

## 2.使用方法

### 2.1 基本使用

```tsx
import useSimpleQuery from 'dustbin-react';

const result = useSimpleQuery((params:T) => Promise<D>, options);
```
#### 参数说明

##### 入参一
```tsx
(params:T) => Promise<D>
```
params: 请求入参 T为入参类型 <br/>
请指明入参类型 确保后续result对象返回的 request requestAsync方法在调用时提示友好

Promise: 返回的Promise对象 <br/>
请指明Promise对象类型 确保后续result对象返回的 data 数据在使用时提示友好

##### 入参二

```tsx
options
```

options: 单次请求设置 <br/>

类型展示
```ts
type optiosn = {
   loop ? : boolean;
   loopInterval ? : number;
   cacheKey ? : string;
   freshTime ? : number;
   retry ? : boolean;
   retryCount ? : number;
   retryInterval ? : number;
   params ? : T;
   initializeData ? : CD;
   auto: boolean;
   use ? : Array<UseItem<T, D>>;
   handle ? : {
      onSuccess? : (params: T, data: D) => void;
      onFail? : (params: T, data: D) => void;
      onRetryComplete? : (cacheKey: string, time: number) => void;
      onRetry? : (
              cacheKey: string,
              params: any,
              time: number,
              counter: number
      ) => void;
   };
}
```
##### 说明

1. auto（必填）: 是否在hook挂载时自动请求数据,false的情况下请求将永远不会自动发出（可手动请求）。
2. use: 单次请求中间件（可全局设置，后面介绍）。
3. cacheKey: 缓存键值（注意: 设置了这个值后自动重试，状态共享等功能才能生效）。
4. loop: 启用轮询（启用后将丢弃之前的重试请求）不可同时使用retry和loop。
5. loopInterval: 轮询间隔（预估的大体时间，轮询总会在上一次轮询请求完成后才继续。<br/>
   与数据返回间隔时间一致，将获得最好体验）。
6. retry: 是否开启重试（开启后默认请求 1 次）。
7. retryInterval: 重试间隔（不会等待上一次请求是否完成）。
8. retryCount: 重试次数，到达次数后，停止相同cacheKey下的所有重试请求。
9. freshTime: 数据新鲜值，默认30秒，auto 为true的情况下开启。
   相同参数的请求，将会使用之前请求成功返回的数据。
10. params: 请求需要使用的参数。改变时，将会重新发起请求。
11. initializeData: 默认的返回值。
12. handle: 事件回调
```ts
type handle ={
  //请求成功返回数据时
  onSuccess ? : (params: T, data: D) => void;
  //请求失败返回数据时
  onFail ? : (params: T, data: D) => void;
  //重试完成时
  onRetryComplete ? : (cacheKey: string, time: number) => void;
  //每次调用
  onRetry ? : (
    cacheKey: string,
    params: any,
    time: number,
    counter: number
  ) => void;
}
```

#### 返回值说明

```ts
result
```

返回值result是一个包含下面7个字段的对象。<br/>

| 字段名  | 类型  | 介绍  |
| ------------- | ------------- | ------------- |
|  data | D  |  请求获取到的成功结果，promise.resolve。 |
| error  |  E |   请求获取到的失败结果，promise.reject <br/>（失败并不会覆盖data的内容，并且总是在请求成功后清空） |
| hasRequest  | Boolean  |  是否进行了第一次请求（无视请求结果） |
| loading  | Boolean  | 是否正在请求中  |
|  rollback | () => void  | 手动进行数据回滚<br/>（回滚至上一次请求成功的数据，未设置cacheKey时不会返回）  |
|  request | (p?:T) => D   |  手动同步请求数据，同步更改[data]数据 <br/>（传入空值总是会使用 options设置的params对象） |
|  requestAsync | (p?:T) => D   |  异步请求数据，[data]数据。<br/>(传入空值不会使用options params对象) <br/> |

### 2.2 全局配置

除了上文提到的为每个hook单独设置options参数外 <br/>

还额外支持全局的请求设置  <br/>

使用 ``` SimpleQueryConfigProvider```在 <br/>
App.tsx 或其他入口（只能包裹在最外层，全局只能使用一次，在其他组件包裹会产生异常）
```tsx
import { SimpleQueryConfigProvider } from 'dustbin-react';

export default (params: { cache?: ContextCache; config?: ContextConfig }) => {
  return (
    <SimpleQueryConfigProvider {...(params || {})}>
      <HashRouter>
        <Router />
      </HashRouter>
    </SimpleQueryConfigProvider>
  );
};
```

类型展示

```
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
```

说明

**SimpleQueryConfigProvider 属性 config**

| 字段名  | 类型  | 介绍  |
| ------------ | ------------- | ------------ |
|  freshTime | Number  |  同单次请求设置，会被单次请求设置覆盖 |
| retry  |  Boolean |  同单次请求设置，会被单次请求设置覆盖 |
| retryCount  | Boolean  |  同单次请求设置，会被单次请求设置覆盖 |
| retryInterval  | Number  | 同单次请求设置，会被单次请求设置覆盖  |
|  loopInterval | Number | 同单次请求设置，会被单次请求设置覆盖  |
|  use | ((params) => params)[] | 下文介绍  |
|  handle |  {onSuccess,onFail,onRetryComplete} |  不会被单次设置覆盖， <br/>总是会和单次设置的回调一起执行 |

**SimpleQueryConfigProvider 属性 cache**

| 字段名  | 类型  | 介绍  |
| ------------ | ------------- | ------------ |
|  onCacheDataChange | (cache) => void  |  回调，会在每次请求并返回成功数据时执行 |
| setCacheDataWithLocalStorage  |  () => cache   | 初始挂载时执行， <br/>请确保数据结构与<br/>onCacheDataChange <br/>返回的结构一致 |
| store  | SimpleQueryStore  |  方便测试使用，自定义缓存对象，项目慎用 |

### 2.3 use 半中间件设置

为什么会叫半中间件呢，是因为和普通中间件的执行顺序不同，更符合平日开发的习惯。

你可以简单的认为是一种流程控制的手段。

假如SimpleQueryConfigProvider 的 config 长这样，单次请求设置的options同理。

（注意：单次请求的use字段总是会覆盖全局的use设置）

```
    config={{
      freshTime: 30 * 1000,
      retryCount: 3,
      use: [
        (params) => {
          return { ...params, stop: false };
        },
        (params) => {
          return { ...params, stop: true };
        },
      ],
    }}
```

程序会依次按use数据内的方法依次按顺序执行。

**（上一次的执行结果会当作params传入下一个方法）**

```
// 假如中间件有两个方法
use: [func1，func2]

//那么 在请求前会按顺序执行 func2（func1（params）），请求结果会带入下一个方法充当params，阶段为：before

//请求到成功的数据后， 请求结果依旧会按顺序执行 func2（func1（params）），请求结果会带入下一个方法充当params，阶段为after

//使用时请务必注意阶段是什么 并按阶段进行逻辑拆分
```

中间件方法会在请求过程中执行两次。

数据请求前，数据请求成功后（注意，请求失败并不会执行）。

你可以通过，返回的stop字段控制是否进行请求，和是否设置最新的data值。

下面是params参数的类型，你可以通过这些参数，或者外置的参数进行流程控制。

| 字段名  | 类型  | 介绍  |
| ------------ | ------------- | ------------ |
|  type |  'before' or  'after'  | 控制的阶段 before代表数据请求前 |
| stop  |  Boolean  | 是否停止执行下面的流程，true为停止 |
| cacheKey  | String  |  本次请求使用的缓存字段 |
| params  | T  |  本次请求使用的请求参数 |
| stage  |  'normal' or 'retry'  |  请求类型，是重试中的请求，还是普通请求 |
| requestTime  | Number  |  请求发起的时间 |
| result  | D  |  请求成功的结果（before阶段始终为undefined） |

## 3 内置优化手段

下面介绍下内置的优化手段。

1. 请求总是按顺序执行的，先请求的数据但是返回的滞后数据会被丢弃，只会保留最后一次请求的数据。
2. 相同的参数，在设置auto为true的情况下。会默认有30s的缓存击中。30s内不会发起同样的请求，你可以设置 freshTime 进行覆盖。
3. result未使用的字段不会被更新（data，loading，error）减少更新次数
4. 全局的状态更新，同一个cacheKey 数据会保持一致，如果需要不一致，你可以更换另一个cacheKey，或者不设置cacheKey。


