import { dataSource, log } from '@graphprotocol/graph-ts';

export function getEndemicExchangeAddress(): string {
  let network = dataSource.network();
  if (network == 'aurora') {
    return '0x2f6A8241d4F34EA22B9c122bE9DDdFDaaf3121E7';
  }

  if (network == 'aurora-testnet') {
    return '0xDd29A2E65c01B75d74A53a469bF90371697846BF';
  }

  if (network == 'rinkeby') {
    return '0x8Bbd06bc00F21B5d4232dB28191272dD6aA1eee6';
  }

  if (network == 'goerli') {
    return '0x0F7C35b5ebE2A3EF7a88fdA2f7B7Adf81Dc05a4F';
  }

  log.debug('Could not find EndemicExchange address for network {}', [network]);

  return '';
}
