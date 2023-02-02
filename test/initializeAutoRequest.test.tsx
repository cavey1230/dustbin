import { afterEach, describe, expect, test } from 'vitest';

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import App from '../packages/demo/src/App';
import { SimpleQueryStore } from 'squery';

export const sleep = (time?: number) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(true);
    }, time || 1000);
  });
};

const checkRenderSuccess = async () => {
  expect(screen.getByText('main page init success')).toBeTruthy();

  await sleep(200);

  expect(screen.getByTestId('loading').innerHTML).toContain('true');

  await sleep(1800);

  expect(screen.getByTestId('data').innerHTML).toContain(
    '"success initialize success{\\"pageNum\\":2,\\"type\\":\\"success\\"}"'
  );
};

const validateRequestData = async () => {
  expect(screen.getByTestId('data').innerHTML).toContain(
    '"success manual request test{\\"pageNum\\":3,\\"content\\":\\"manual request test\\",\\"type\\":\\"success\\"}"'
  );

  expect(screen.getByTestId('childrenData').innerHTML).toContain(
    'i am children data"success manual request test{\\"pageNum\\":3,\\"content\\":\\"manual request test\\",\\"type\\":\\"success\\"}"'
  );
};

afterEach(cleanup);

describe('initialize stage', () => {
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

describe(
  'manual request stage',
  () => {
    test('success params {pageNum:3,content:manual request test}', async () => {
      const { getByTestId } = render(<App />);

      await checkRenderSuccess();

      fireEvent.click(getByTestId('manualRequestPageNum3Success'));

      await sleep(1200);

      await validateRequestData();

      expect(getByTestId('hasRequest').innerHTML).toContain('true');

      fireEvent.click(getByTestId('requestPrev'));

      await sleep(1200);

      await validateRequestData();

      fireEvent.click(getByTestId('rollback'));

      await validateRequestData();
    });

    test('fail params {pageNum:4,content:manual request test}', async () => {
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
    });
  },
  { timeout: 30000 }
);
