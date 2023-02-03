import { HashRouter } from 'react-router-dom';
import Router from './config/router';
import { SimpleQueryConfigProvider } from 'dustbin-react';
import {
  ContextCache,
  ContextConfig,
} from 'dustbin-react/build/utils/configContext';

export default (params: { cache?: ContextCache; config?: ContextConfig }) => {
  return (
    <SimpleQueryConfigProvider {...(params || {})}>
      <HashRouter>
        <Router />
      </HashRouter>
    </SimpleQueryConfigProvider>
  );
};
