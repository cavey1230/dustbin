import { SimpleQueryConfigProvider } from 'dustbin';
import { ContextCache, ContextConfig } from 'dustbin/build/utils/configContext';
import MainForTest from './pages/mainForTest';

export default (params: { cache?: ContextCache; config?: ContextConfig }) => {
  return (
    <SimpleQueryConfigProvider {...(params || {})}>
      <MainForTest />
    </SimpleQueryConfigProvider>
  );
};
