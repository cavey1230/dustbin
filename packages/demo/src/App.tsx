import { HashRouter } from 'react-router-dom';
import Router from './config/router';

export default () => {
  return (
    <HashRouter>
      <Router />
    </HashRouter>
  );
};
