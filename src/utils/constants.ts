import { BigInt, Address, BigDecimal } from '@graphprotocol/graph-ts';

export const NULL_ADDRESS = Address.fromString(
  '0x0000000000000000000000000000000000000000'
);

export const MATIC_ADDRESS = Address.fromString(
  '0x0000000000000000000000000000000000001010'
);

export let ZERO_BI = BigInt.fromI32(0);
export let ONE_BI = BigInt.fromI32(1);
export let ZERO_DECIMAL = new BigDecimal(ZERO_BI);
