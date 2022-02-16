import { BigInt } from '@graphprotocol/graph-ts';

const addTakerPercentage = (value: BigInt) => {
  let takerFee = BigInt.fromString('250');
  let percentage = takerFee.div(value).times(BigInt.fromString('10000'));
  return value.plus(percentage);
};

export { addTakerPercentage };
