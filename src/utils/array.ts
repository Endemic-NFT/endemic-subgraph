export const filter = (array: string[], value: string): string[] => {
  let index = -1;
  for (let i = 0; i < array.length; i++) {
    if (array[i] == value) {
      index = i;
      break;
    }
  }
  if (index >= 0) {
    array.splice(index, 1);
    return array;
  }

  return array;
};
