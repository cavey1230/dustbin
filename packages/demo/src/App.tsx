import { HashRouter } from 'react-router-dom';
import Router from './config/router';
import { SimpleQueryConfigProvider } from 'squery';

export default () => {
  return (
    <SimpleQueryConfigProvider
      cache={{
        onCacheDataChange: (toLocalStorageObject) => {
          localStorage.setItem(
            'testCache',
            JSON.stringify(toLocalStorageObject)
          );
        },
        setCacheDataWithLocalStorage: () => {
          try {
            const cache = localStorage.getItem('testCache');
            console.log(cache && JSON.parse(cache));
            return cache && JSON.parse(cache);
          } catch {
            throw new Error('parse testCache fail');
          }
        },
      }}
      config={{
        freshTime: 5 * 60 * 1000,
        use: [
          (params) => {
            console.log(params.type, 'a111', 'father', params.result);
            return { ...params, stop: false };
          },
          (params) => {
            console.log(params.type, 'b222', 'father', params.result);
            return { ...params, stop: false };
          },
        ],
      }}>
      <HashRouter>
        <Router />
      </HashRouter>
    </SimpleQueryConfigProvider>
  );
};
