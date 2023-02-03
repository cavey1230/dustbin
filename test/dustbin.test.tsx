import { afterEach, describe, expect, test } from 'vitest';

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import App from '../packages/demo/src/AppForTest';
import { SimpleQueryStore } from 'dustbin';

export const sleep = (time?: number) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(true);
    }, time || 1000);
  });
};

const checkRenderSuccess = async (noCacheKey?: boolean) => {
  expect(screen.getByText('main page init success')).toBeTruthy();

  await sleep(200);

  expect(
    screen.getByTestId(!noCacheKey ? 'loading' : 'loadingNoCacheKey').innerHTML
  ).toContain('true');

  await sleep(1800);

  expect(
    screen.getByTestId(!noCacheKey ? 'data' : 'dataNoCacheKey').innerHTML
  ).toContain(
    '"success initialize success{\\"pageNum\\":2,\\"type\\":\\"success\\"}"'
  );
};

const validateRequestData = async (noCacheKey?: boolean) => {
  expect(
    screen.getByTestId(!noCacheKey ? 'data' : 'dataNoCacheKey').innerHTML
  ).toContain(
    '"success manual request test{\\"pageNum\\":3,\\"content\\":\\"manual request test\\",\\"type\\":\\"success\\"}"'
  );

  !noCacheKey &&
    expect(screen.getByTestId('childrenData').innerHTML).toContain(
      'i am children data"success manual request test{\\"pageNum\\":3,\\"content\\":\\"manual request test\\",\\"type\\":\\"success\\"}"'
    );
};

afterEach(cleanup);

describe('initialize', () => {
  test('without configContext', async () => {
    render(<App />);

    await checkRenderSuccess();
  });

  test('have configContext', async () => {
    let cache = [];

    const { getByTestId } = render(
      <App
        cache={{
          store: new SimpleQueryStore({
            onCacheDataChange: (value) => {
              console.log(value);
              cache = value;
            },
            setCacheDataWithLocalStorage: () => {
              return cache;
            },
          }),
        }}
        config={{
          retry: true,
        }}
      />
    );

    await checkRenderSuccess();

    expect(cache.length > 0).toBeTruthy();

    expect(getByTestId('hasRequest').innerHTML).toContain('true');
  });
});

describe('manual request with cacheKey', () => {
  test('success params {pageNum:3,content:manual request test}', async () => {
    const { getByTestId } = render(<App />);

    await checkRenderSuccess();

    fireEvent.click(getByTestId('manualRequestPageNum3Success'));

    await sleep(1200);

    await validateRequestData();

    expect(getByTestId('hasRequest').innerHTML).toContain('true');

    fireEvent.click(getByTestId('requestPrev'));

    await sleep(1200);

    expect(screen.getByTestId('data').innerHTML).toContain(
      '"success initialize success{\\"pageNum\\":2,\\"type\\":\\"success\\"}"'
    );

    expect(screen.getByTestId('childrenData').innerHTML).toContain(
      'i am children data"success initialize success{\\"pageNum\\":2,\\"type\\":\\"success\\"}"'
    );

    fireEvent.click(getByTestId('rollback'));

    await validateRequestData();
  });

  test(
    'fail params {pageNum:4,content:manual request test}',
    async () => {
      const { getByTestId } = render(<App config={{ retryCount: 3 }} />);

      await checkRenderSuccess();

      fireEvent.click(getByTestId('manualRequestPageNum4Fail'));

      await sleep(1200);

      expect(getByTestId('error').innerHTML).toContain(
        '"fail manual request test{\\"pageNum\\":4,\\"content\\":\\"manual request test\\",\\"type\\":\\"fail\\"}"'
      );

      expect(getByTestId('data').innerHTML).toContain(
        '"success initialize success{\\"pageNum\\":2,\\"type\\":\\"success\\"}"'
      );

      await sleep(1200);

      expect(getByTestId('retryCounter').innerHTML).toContain('retryCounter 1');

      await sleep(1200);

      expect(getByTestId('retryCounter').innerHTML).toContain('retryCounter 2');

      await sleep(1200);

      expect(getByTestId('retryCounter').innerHTML).toContain('retryCounter 3');

      await sleep(1200);

      expect(getByTestId('retryCounter').innerHTML).toContain('retryCounter 0');

      fireEvent.click(getByTestId('manualRequestPageNum3Success'));

      await sleep(1200);

      await validateRequestData();

      expect(getByTestId('error').innerHTML).not.toBeTruthy();

      fireEvent.click(getByTestId('rollback'));

      expect(getByTestId('data').innerHTML).toContain(
        '"success initialize success{\\"pageNum\\":2,\\"type\\":\\"success\\"}"'
      );

      fireEvent.click(getByTestId('rollback'));

      await validateRequestData();
    },
    { timeout: 10000 }
  );

  test(
    'success with loop params {pageNum:4,content:manual request test}',
    async () => {
      const { getByTestId } = render(<App />);

      fireEvent.click(getByTestId('manualRequestPageNum4Success'));

      await sleep(1200);

      expect(getByTestId('data').innerHTML).toContain(
        '"success manual request test{\\"pageNum\\":4,\\"type\\":\\"success\\",\\"content\\":\\"manual request test\\"}"'
      );

      fireEvent.click(getByTestId('manualRequestPageNum3Success'));
      await sleep(1200);

      await validateRequestData();

      fireEvent.click(getByTestId('useLoop'));

      await sleep(500);

      expect(screen.getByTestId('loading').innerHTML).toContain('true');

      await sleep(600);

      fireEvent.click(getByTestId('useLoop'));

      await sleep(1200);

      expect(screen.getByTestId('loading').innerHTML).toContain('false');
    },
    { timeout: 10000 }
  );

  test(
    'manual request previous params',
    async () => {
      const { getByTestId } = render(<App />);

      await checkRenderSuccess();

      fireEvent.click(getByTestId('requestPrev'));

      expect(screen.getByTestId('data').innerHTML).toContain(
        '"success initialize success{\\"pageNum\\":2,\\"type\\":\\"success\\"}"'
      );

      fireEvent.click(getByTestId('manualRequestPageNum4Fail'));

      await sleep(1200);

      expect(getByTestId('error').innerHTML).toContain(
        '"fail manual request test{\\"pageNum\\":4,\\"content\\":\\"manual request test\\",\\"type\\":\\"fail\\"}"'
      );

      expect(getByTestId('data').innerHTML).toContain(
        '"success initialize success{\\"pageNum\\":2,\\"type\\":\\"success\\"}"'
      );

      await sleep(1200);

      expect(getByTestId('retryCounter').innerHTML).toContain('retryCounter 1');

      await sleep(1200);

      expect(getByTestId('retryCounter').innerHTML).toContain('retryCounter 0');

      fireEvent.click(getByTestId('requestPrev'));

      await sleep(1200);

      expect(screen.getByTestId('data').innerHTML).toContain(
        '"success initialize success{\\"pageNum\\":2,\\"type\\":\\"success\\"}"'
      );

      expect(getByTestId('error').innerHTML).not.toBeTruthy();

      fireEvent.click(getByTestId('manualRequestPageNum3Success'));

      await sleep(1200);

      await validateRequestData();

      fireEvent.click(getByTestId('requestPrev'));

      await sleep(1200);

      expect(screen.getByTestId('data').innerHTML).toContain(
        '"success initialize success{\\"pageNum\\":2,\\"type\\":\\"success\\"}"'
      );

      fireEvent.click(getByTestId('autoRequestPageNum5Success'));

      await sleep(1200);

      expect(screen.getByTestId('data').innerHTML).toContain(
        '"success auto request test{\\"pageNum\\":5,\\"type\\":\\"success\\",\\"content\\":\\"auto request test\\"}"'
      );

      fireEvent.click(getByTestId('requestPrev'));

      await sleep(1200);

      expect(screen.getByTestId('data').innerHTML).toContain(
        '"success auto request test{\\"pageNum\\":5,\\"type\\":\\"success\\",\\"content\\":\\"auto request test\\"}"'
      );
    },
    { timeout: 15000 }
  );
});

describe('auto request with cacheKey', () => {
  test(
    'success params {pageNum:5,content:auto request test}',
    async () => {
      const { getByTestId } = render(<App />);

      await checkRenderSuccess();

      fireEvent.click(getByTestId('autoRequestPageNum5Success'));

      await sleep(1200);

      expect(screen.getByTestId('data').innerHTML).toContain(
        '"success auto request test{\\"pageNum\\":5,\\"type\\":\\"success\\",\\"content\\":\\"auto request test\\"}"'
      );

      fireEvent.click(getByTestId('autoRequestPageNum4Success'));

      await sleep(1200);

      expect(screen.getByTestId('data').innerHTML).toContain(
        '"success auto request test{\\"pageNum\\":4,\\"type\\":\\"success\\",\\"content\\":\\"auto request test\\"}"'
      );
    },
    { timeout: 15000 }
  );

  test(
    'success with loop params {pageNum:5,content:auto request test}',
    async () => {
      const { getByTestId } = render(<App />);

      await checkRenderSuccess();

      fireEvent.click(getByTestId('useLoop'));

      await sleep(1200);

      fireEvent.click(getByTestId('autoRequestPageNum5Success'));

      await sleep(1200);

      expect(screen.getByTestId('data').innerHTML).toContain(
        '"success auto request test{\\"pageNum\\":5,\\"type\\":\\"success\\",\\"content\\":\\"auto request test\\"}"'
      );

      await sleep(500);

      expect(screen.getByTestId('loading').innerHTML).toContain('true');

      await sleep(500);

      expect(screen.getByTestId('data').innerHTML).toContain(
        '"success auto request test{\\"pageNum\\":5,\\"type\\":\\"success\\",\\"content\\":\\"auto request test\\"}"'
      );

      await sleep(500);

      expect(screen.getByTestId('loading').innerHTML).toContain('true');

      await sleep(500);

      expect(screen.getByTestId('data').innerHTML).toContain(
        '"success auto request test{\\"pageNum\\":5,\\"type\\":\\"success\\",\\"content\\":\\"auto request test\\"}"'
      );

      localStorage.removeItem('testCache');
    },
    { timeout: 15000 }
  );
});

describe('middleware', () => {
  test(
    'before stage',
    async () => {
      const { getByTestId, getByText } = render(
        <App
          config={{
            use: [
              (params) => {
                console.log(params);

                return { ...params, stop: true };
              },
              (params) => {
                console.log(params);

                return params;
              },
            ],
          }}
        />
      );

      expect(getByText('main page init success')).toBeTruthy();

      await sleep(200);

      expect(getByTestId('loading').innerHTML).toContain('false');

      await sleep(1800);

      expect(getByTestId('data').innerHTML).not.toContain(
        '"success initialize success{\\"pageNum\\":2,\\"type\\":\\"success\\"}"'
      );
    },
    { timeout: 15000 }
  );

  test(
    'after stage',
    async () => {
      const { getByTestId, getByText } = render(
        <App
          config={{
            use: [
              (params) => {
                console.log(params);

                return params.type === 'before'
                  ? params
                  : {
                      ...params,
                      stop: false,
                      result: { content: 'change by middleware' },
                    };
              },
              (params) => {
                console.log(params);

                return params.type === 'before'
                  ? params
                  : { ...params, stop: false };
              },
            ],
          }}
        />
      );

      expect(getByText('main page init success')).toBeTruthy();

      await sleep(200);

      expect(getByTestId('loading').innerHTML).toContain('true');

      await sleep(1800);

      expect(getByTestId('data').innerHTML).toContain(
        '{"content":"change by middleware"}'
      );
    },
    { timeout: 15000 }
  );
});

describe('manual request with no cacheKey', () => {
  test('success params {pageNum:3,content:manual request test}', async () => {
    const { getByTestId } = render(<App />);

    await checkRenderSuccess(true);

    fireEvent.click(getByTestId('manualRequestPageNum3SuccessNoCacheKey'));

    await sleep(1200);

    await validateRequestData(true);

    expect(getByTestId('hasRequestNoCacheKey').innerHTML).toContain('true');

    fireEvent.click(getByTestId('requestPrevNoCacheKey'));

    await sleep(1200);

    expect(screen.getByTestId('dataNoCacheKey').innerHTML).toContain(
      '"success initialize success{\\"pageNum\\":2,\\"type\\":\\"success\\"}"'
    );
  });

  test(
    'fail params {pageNum:4,content:manual request test}',
    async () => {
      const { getByTestId } = render(<App />);

      await checkRenderSuccess(true);

      fireEvent.click(getByTestId('manualRequestPageNum4FailNoCacheKey'));

      await sleep(1200);

      expect(getByTestId('errorNoCacheKey').innerHTML).toContain(
        '"fail manual request test{\\"pageNum\\":4,\\"content\\":\\"manual request test\\",\\"type\\":\\"fail\\"}"'
      );

      expect(getByTestId('dataNoCacheKey').innerHTML).toContain(
        '"success initialize success{\\"pageNum\\":2,\\"type\\":\\"success\\"}"'
      );

      fireEvent.click(getByTestId('manualRequestPageNum3SuccessNoCacheKey'));

      await sleep(1200);

      await validateRequestData(true);

      expect(getByTestId('errorNoCacheKey').innerHTML).not.toBeTruthy();
    },
    { timeout: 10000 }
  );

  test(
    'success with loop params {pageNum:4,content:manual request test}',
    async () => {
      const { getByTestId } = render(<App />);

      fireEvent.click(getByTestId('manualRequestPageNum4SuccessNoCacheKey'));

      await sleep(1200);

      expect(getByTestId('dataNoCacheKey').innerHTML).toContain(
        '"success manual request test{\\"pageNum\\":4,\\"type\\":\\"success\\",\\"content\\":\\"manual request test\\"}"'
      );

      fireEvent.click(getByTestId('manualRequestPageNum3SuccessNoCacheKey'));
      await sleep(1200);

      await validateRequestData(true);

      fireEvent.click(getByTestId('useLoopNoCacheKey'));

      await sleep(500);

      expect(screen.getByTestId('loadingNoCacheKey').innerHTML).toContain(
        'true'
      );

      await sleep(600);

      fireEvent.click(getByTestId('useLoopNoCacheKey'));

      await sleep(1200);

      expect(screen.getByTestId('loadingNoCacheKey').innerHTML).toContain(
        'false'
      );
    },
    { timeout: 10000 }
  );

  test(
    'manual request previous params',
    async () => {
      const { getByTestId } = render(<App />);

      await checkRenderSuccess(true);

      fireEvent.click(getByTestId('requestPrevNoCacheKey'));

      expect(screen.getByTestId('dataNoCacheKey').innerHTML).toContain(
        '"success initialize success{\\"pageNum\\":2,\\"type\\":\\"success\\"}"'
      );

      fireEvent.click(getByTestId('manualRequestPageNum4FailNoCacheKey'));

      await sleep(1200);

      expect(getByTestId('errorNoCacheKey').innerHTML).toContain(
        '"fail manual request test{\\"pageNum\\":4,\\"content\\":\\"manual request test\\",\\"type\\":\\"fail\\"}"'
      );

      expect(getByTestId('dataNoCacheKey').innerHTML).toContain(
        '"success initialize success{\\"pageNum\\":2,\\"type\\":\\"success\\"}"'
      );

      fireEvent.click(getByTestId('requestPrevNoCacheKey'));

      await sleep(1200);

      expect(screen.getByTestId('dataNoCacheKey').innerHTML).toContain(
        '"success initialize success{\\"pageNum\\":2,\\"type\\":\\"success\\"}"'
      );

      expect(getByTestId('errorNoCacheKey').innerHTML).not.toBeTruthy();

      fireEvent.click(getByTestId('manualRequestPageNum3SuccessNoCacheKey'));

      await sleep(1200);

      await validateRequestData(true);

      fireEvent.click(getByTestId('requestPrevNoCacheKey'));

      await sleep(1200);

      expect(screen.getByTestId('dataNoCacheKey').innerHTML).toContain(
        '"success initialize success{\\"pageNum\\":2,\\"type\\":\\"success\\"}"'
      );

      fireEvent.click(getByTestId('autoRequestPageNum5SuccessNoCacheKey'));

      await sleep(1200);

      expect(screen.getByTestId('dataNoCacheKey').innerHTML).toContain(
        '"success auto request test{\\"pageNum\\":5,\\"type\\":\\"success\\",\\"content\\":\\"auto request test\\"}"'
      );

      fireEvent.click(getByTestId('requestPrevNoCacheKey'));

      await sleep(1200);

      expect(screen.getByTestId('dataNoCacheKey').innerHTML).toContain(
        '"success auto request test{\\"pageNum\\":5,\\"type\\":\\"success\\",\\"content\\":\\"auto request test\\"}"'
      );
    },
    { timeout: 15000 }
  );
});

describe('auto request with no cacheKey', () => {
  test(
    'success params {pageNum:5,content:auto request test}',
    async () => {
      const { getByTestId } = render(<App />);

      await checkRenderSuccess(true);

      fireEvent.click(getByTestId('autoRequestPageNum5SuccessNoCacheKey'));

      await sleep(1200);

      expect(screen.getByTestId('dataNoCacheKey').innerHTML).toContain(
        '"success auto request test{\\"pageNum\\":5,\\"type\\":\\"success\\",\\"content\\":\\"auto request test\\"}"'
      );

      fireEvent.click(getByTestId('autoRequestPageNum4SuccessNoCacheKey'));

      await sleep(1200);

      expect(screen.getByTestId('dataNoCacheKey').innerHTML).toContain(
        '"success auto request test{\\"pageNum\\":4,\\"type\\":\\"success\\",\\"content\\":\\"auto request test\\"}"'
      );
    },
    { timeout: 15000 }
  );

  test(
    'success with loop params {pageNum:5,content:auto request test}',
    async () => {
      const { getByTestId } = render(<App />);

      await checkRenderSuccess(true);

      fireEvent.click(getByTestId('useLoopNoCacheKey'));

      await sleep(1200);

      fireEvent.click(getByTestId('autoRequestPageNum5SuccessNoCacheKey'));

      await sleep(1200);

      expect(screen.getByTestId('dataNoCacheKey').innerHTML).toContain(
        '"success auto request test{\\"pageNum\\":5,\\"type\\":\\"success\\",\\"content\\":\\"auto request test\\"}"'
      );

      await sleep(500);

      expect(screen.getByTestId('loadingNoCacheKey').innerHTML).toContain(
        'true'
      );

      await sleep(500);

      expect(screen.getByTestId('dataNoCacheKey').innerHTML).toContain(
        '"success auto request test{\\"pageNum\\":5,\\"type\\":\\"success\\",\\"content\\":\\"auto request test\\"}"'
      );

      await sleep(500);

      expect(screen.getByTestId('loadingNoCacheKey').innerHTML).toContain(
        'true'
      );

      await sleep(500);

      expect(screen.getByTestId('dataNoCacheKey').innerHTML).toContain(
        '"success auto request test{\\"pageNum\\":5,\\"type\\":\\"success\\",\\"content\\":\\"auto request test\\"}"'
      );
    },
    { timeout: 15000 }
  );
});
