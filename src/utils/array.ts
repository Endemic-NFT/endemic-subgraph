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

export const removeFirst = (array: BigInt[], value: BigInt): BigInt[] => {
  let index = -1;
  for (let i = 0; i < array.length; i++) {
    if (array[i] == value) {
      index = i;
      break;
    }
  }
  if (index >= 0) {
    array.splice(index, 1);
  }

  return array;
};

export function add(array: BigInt[], value: BigInt): BigInt[] {
  const idx = findIndex(array, value);

  return insert(array, idx, value);
}

function findIndex(array: BigInt[], value: BigInt): number {
  let i = 0;

  while (i < array.length) {
    if (array[i] < value) return i;
    i++;
  }

  return array.length;
}

const insert = (array: BigInt[], index: number, newItem: BigInt): BigInt[] => {
  return array
    .slice(0, index as i32)
    .concat([newItem])
    .concat(array.slice(index as i32));
};
