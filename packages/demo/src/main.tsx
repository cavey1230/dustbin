import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <App
    cache={{
      onCacheDataChange: (toLocalStorageObject) => {
        console.log(toLocalStorageObject, 'toLocalStorageObject22222');
        localStorage.setItem('testCache', JSON.stringify(toLocalStorageObject));
      },
      setCacheDataWithLocalStorage: () => {
        try {
          const cache = localStorage.getItem('testCache');
          return cache && JSON.parse(cache);
        } catch {
          throw new Error('parse testCache fail');
        }
      },
    }}
    config={{
      freshTime: 30 * 1000,
      use: [
        (params) => {
          console.log(
            params.type,
            'a111',
            'father',
            params.params,
            params.result,
            params.stage
          );
          return { ...params, stop: false };
        },
        (params) => {
          console.log(
            params.type,
            'b222',
            'father',
            params.params,
            params.result,
            params.stage
          );
          return { ...params, stop: false };
        },
      ],
    }}
  />
);
