import React from 'react';
import { Navigate, useRoutes } from 'react-router-dom';
import PageNotFound from 'pages/pageNotFound';
import Main from 'pages/main';

export default () => {
  return useRoutes([
    {
      path: '/',
      element: <Navigate to={'login'} />,
    },
    {
      path: '/login',
      element: <Main />,
    },
    {
      path: '/main',
      element: <Main />,
    },
    {
      path: '*',
      element: <PageNotFound />,
    },
  ]);
};
