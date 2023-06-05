import { dataSource, log } from '@graphprotocol/graph-ts';

export function getLatestEndemicExchangeAddress(): string {
  let network = dataSource.network();
  if (network == 'aurora') {
    return '0x0c45c5971f751d93f2e4ae0e7ceb149967b846d2';
  }

  if (network == 'goerli') {
    return '0x53431AB725Edf32deF31992c4fd8ba2719c16661';
  }

  if (network == 'mumbai') {
    return '0xf36274A1A1DEE9eB58052241e269c3D6bbc5F0dC';
  }

  if (network == 'arbitrum-goerli') {
    return '0xF85Ab30873673dDe16E1d70518cB21814eE8fF9A';
  }

  log.debug('Could not find EndemicExchange address for network {}', [network]);

  return '';
}

export function getLegacyEndemicExchangeAddress(): string {
  let network = dataSource.network();
  if (network == 'aurora') {
    return '0x2f6A8241d4F34EA22B9c122bE9DDdFDaaf3121E7';
  }

  if (network == 'goerli') {
    return '0x0c96f87fEfcD2257c7125ADAD85A32478733bBfd';
  }

  log.debug('Could not find Legacy EndemicExchange address for network {}', [
    network,
  ]);

  return '';
}

export function isExchangeAddress(address: String): boolean {
  return (
    address.toLowerCase() == getLatestEndemicExchangeAddress().toLowerCase() ||
    address.toLowerCase() == getLegacyEndemicExchangeAddress().toLowerCase()
  );
}
