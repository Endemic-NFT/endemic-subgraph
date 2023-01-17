import { ERC20 } from '../../generated/EndemicExchange/ERC20';
import { NULL_ADDRESS } from '../utils/constants';
import {
  Address,
  BigDecimal,
  BigInt,
  Bytes,
  log,
} from '@graphprotocol/graph-ts';

export function toHighDenom(
  value: BigInt,
  paymentErc20TokenAddress: Bytes
): BigDecimal {
  let decimals = 18;

  if (paymentErc20TokenAddress != NULL_ADDRESS) {
    decimals = queryErc20Decimals(paymentErc20TokenAddress);
  }

  let dividend = new BigDecimal(value);
  let divisor = new BigDecimal(BigInt.fromI32(10).pow(decimals as u8));

  return dividend.div(divisor);
}

function queryErc20Decimals(paymentErc20TokenAddress: Bytes): i32 {
  let erc20 = ERC20.bind(
    Address.fromString(paymentErc20TokenAddress.toHexString())
  );

  let result = erc20.try_decimals();

  if (result.reverted) {
    log.warning('Invalid ERC20 {} - decimals error', [
      paymentErc20TokenAddress.toHex(),
    ]);
    return 18;
  }

  return result.value;
}
