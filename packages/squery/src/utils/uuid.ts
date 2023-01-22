const uuid = (randomLength: number) => {
  return Number(
    Math.random().toString().slice(2, randomLength) + Date.now()
  ).toString(36);
};

export default uuid;
