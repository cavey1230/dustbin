import { HashRouter } from 'react-router-dom';
import Router from './config/router';
import { SimpleQueryConfigProvider } from 'dustbin';
import { ContextCache, ContextConfig } from 'dustbin/build/utils/configContext';

export default (params: { cache?: ContextCache; config?: ContextConfig }) => {
  return (
    <SimpleQueryConfigProvider {...(params || {})}>
      <HashRouter>
        <Router />
      </HashRouter>
    </SimpleQueryConfigProvider>
  );
};
