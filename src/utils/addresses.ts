import { dataSource, log } from '@graphprotocol/graph-ts';

export function getEndemicExchangeAddress(): string {
  let network = dataSource.network();
  if (network == 'aurora') {
    return '0x2f6A8241d4F34EA22B9c122bE9DDdFDaaf3121E7';
  }

  if (network == 'goerli') {
    return '0x0F7C35b5ebE2A3EF7a88fdA2f7B7Adf81Dc05a4F';
  }

  log.debug('Could not find EndemicExchange address for network {}', [network]);

  return '';
}
