import { useNavigate } from 'react-router-dom';

export default () => {
  const router = useNavigate();
  return (
    <button
      onClick={() => {
        router(-1);
      }}>
      后退
    </button>
  );
};
