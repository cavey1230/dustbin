export default (config: {
  type: 'success' | 'fail';
  params: any;
  content: string;
}) => {
  const { type, content, params } = config;
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      return type === 'success'
        ? resolve('success ' + content + JSON.stringify(params))
        : reject('fail ' + content + JSON.stringify(params));
    }, 1000);
  });
};
