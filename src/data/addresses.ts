import { dataSource, log } from '@graphprotocol/graph-ts';

export const Null = '0x0000000000000000000000000000000000000000';

export function getEndemicMarketplaceAddress(): string {
  let network = dataSource.network();
  if (network == 'aurora') {
    return '0x915F1E2aDE42374BbdD9051BA84dc0EC401DBed2';
  }

  if (network == 'aurora-testnet') {
    return '0xDd29A2E65c01B75d74A53a469bF90371697846BF';
  }

  log.debug('Could not find Endemic Marketplace address for network {}', [
    network,
  ]);

  return '';
}
