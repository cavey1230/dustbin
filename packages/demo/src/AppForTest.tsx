import { SimpleQueryConfigProvider } from 'dustbin-react';
import {
  ContextCache,
  ContextConfig,
} from 'dustbin-react/build/utils/configContext';
import MainForTest from './pages/mainForTest';

export default (params: { cache?: ContextCache; config?: ContextConfig }) => {
  return (
    <SimpleQueryConfigProvider {...(params || {})}>
      <MainForTest />
    </SimpleQueryConfigProvider>
  );
};
