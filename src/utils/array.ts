import { BigInt } from '@graphprotocol/graph-ts';

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

export const removeFirst = (array: BigInt[], value: BigInt) => {
  array.find((item, i) => {
    if (item === value) {
      array.splice(i, 1);
      return true;
    }
    return false;
  });

  return array;
};

export function add(array: BigInt[], value) {
  const idx = findIndex(array, value);
  array.splice(idx, value);

  return array;
}

function findIndex(array: BigInt[], value: BigInt) {
  let i = 0;

  while (i < array.length) {
    if (array[i] < value) return i;
    i++;
  }

  return array.length;
}
