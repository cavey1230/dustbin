import React from 'react';
import { Navigate, useRoutes } from 'react-router-dom';
import PageNotFound from '../pages/pageNotFound';
import MainForTest from '../pages/mainForTest';
import Empty from '../pages/empty';

export default () => {
  return useRoutes([
    {
      path: '/',
      element: <Navigate to={'mainForTest'} />,
    },
    {
      path: '/mainForTest',
      element: <MainForTest />,
    },
    {
      path: '/empty',
      element: <Empty />,
    },
    {
      path: '*',
      element: <PageNotFound />,
    },
  ]);
};
