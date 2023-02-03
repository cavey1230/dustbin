import { SimpleQueryConfigProvider } from 'squery';
import { ContextCache, ContextConfig } from 'squery/build/utils/configContext';
import MainForTest from './pages/mainForTest';

export default (params: { cache?: ContextCache; config?: ContextConfig }) => {
  return (
    <SimpleQueryConfigProvider {...(params || {})}>
      <MainForTest />
    </SimpleQueryConfigProvider>
  );
};
