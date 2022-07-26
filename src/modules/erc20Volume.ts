import { BigInt, Bytes } from '@graphprotocol/graph-ts';
import { Erc20Volume } from '../../generated/schema';
import { NULL_ADDRESS, ZERO_BI } from '../utils/constants';

export function createErc20VolumeId(
  paymentErc20TokenAddress: string,
  entityId: string
): string {
  return paymentErc20TokenAddress.concat('-').concat(entityId);
}

export function getOrCreateErc20VolumeForUserHistoricData(
  paymentErc20TokenAddress: string,
  entityId: string
): Erc20Volume {
  const erc20VolumeId = createErc20VolumeId(paymentErc20TokenAddress, entityId);

  let erc20Volume = Erc20Volume.load(erc20VolumeId);

  if (!erc20Volume) {
    erc20Volume = new Erc20Volume(erc20VolumeId);

    erc20Volume.volumeTraded = ZERO_BI;
    erc20Volume.makerVolume = ZERO_BI;
    erc20Volume.takerVolume = ZERO_BI;
    erc20Volume.userHistoricData = entityId;
    erc20Volume.collectionHistoricData = null;
    erc20Volume.paymentErc20TokenAddress = paymentErc20TokenAddress;

    erc20Volume.save();
  }

  return erc20Volume;
}

export function getOrCreateErc20VolumeForCollectionHistoricData(
  paymentErc20TokenAddress: string,
  entityId: string
): Erc20Volume {
  const erc20VolumeId = createErc20VolumeId(paymentErc20TokenAddress, entityId);

  let erc20Volume = Erc20Volume.load(erc20VolumeId);

  if (!erc20Volume) {
    erc20Volume = new Erc20Volume(erc20VolumeId);

    erc20Volume.volumeTraded = ZERO_BI;
    erc20Volume.makerVolume = ZERO_BI;
    erc20Volume.takerVolume = ZERO_BI;
    erc20Volume.userHistoricData = null;
    erc20Volume.collectionHistoricData = entityId;
    erc20Volume.paymentErc20TokenAddress = paymentErc20TokenAddress;

    erc20Volume.save();
  }

  return erc20Volume;
}

export function updateErc20VolumeForCollectionHistoricData(
  paymentErc20TokenAddress: string,
  entityId: string,
  volumeTraded: BigInt
): void {
  const erc20Volume = getOrCreateErc20VolumeForCollectionHistoricData(
    paymentErc20TokenAddress,
    entityId
  );

  erc20Volume.volumeTraded = erc20Volume.volumeTraded.plus(volumeTraded);

  erc20Volume.save();
}

export function updateErc20VolumeForSellerHistoricData(
  paymentErc20TokenAddress: string,
  entityId: string,
  makerVolume: BigInt
): void {
  const erc20Volume = getOrCreateErc20VolumeForUserHistoricData(
    paymentErc20TokenAddress,
    entityId
  );

  erc20Volume.makerVolume = erc20Volume.makerVolume.plus(makerVolume);

  erc20Volume.save();
}

export function updateErc20VolumeForBuyerHistoricData(
  paymentErc20TokenAddress: string,
  entityId: string,
  takerVolume: BigInt
): void {
  const erc20Volume = getOrCreateErc20VolumeForUserHistoricData(
    paymentErc20TokenAddress,
    entityId
  );

  erc20Volume.takerVolume = erc20Volume.takerVolume.plus(takerVolume);

  erc20Volume.save();
}

export function isPaymentInEther(paymentErc20TokenAddress: Bytes): boolean {
  return paymentErc20TokenAddress.toHexString() == NULL_ADDRESS.toHexString();
}
