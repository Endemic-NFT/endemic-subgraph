import { Address, BigInt, Bytes } from '@graphprotocol/graph-ts';
import { UserHistoricData, UserHourData } from '../../generated/schema';
import { ZERO_BI } from '../utils/constants';
import { isBurnEvent, isTransferEvent } from './nft';

export function getOrCreateUserHistoricData(
  userAddress: string
): UserHistoricData {
  let stats = UserHistoricData.load(userAddress);

  if (!stats) {
    stats = new UserHistoricData(userAddress);
    stats.createdCount = ZERO_BI;
    stats.onSaleCount = ZERO_BI;
    stats.ownedCount = ZERO_BI;
    stats.makerVolume = ZERO_BI;
    stats.takerVolume = ZERO_BI;
  }

  return stats;
}

export function updateHistoricDataForTransfer(
  from: Address,
  to: Address,
  tokenAmount: BigInt
): void {
  let fromUserStats = getOrCreateUserHistoricData(from.toHexString());
  let toUserStats = getOrCreateUserHistoricData(to.toHexString());

  if (isBurnEvent(to) || isTransferEvent(from, to)) {
    fromUserStats.ownedCount = fromUserStats.ownedCount.minus(tokenAmount);
    fromUserStats.save();
  }

  toUserStats.ownedCount = toUserStats.ownedCount.plus(tokenAmount);
  toUserStats.save();
}

export function updateHistoricDataForBurn(
  userAddress: string,
  tokenAmount: BigInt
): void {
  let userStats = getOrCreateUserHistoricData(userAddress);
  userStats.createdCount = userStats.createdCount.minus(tokenAmount);
  userStats.save();
}

export function updateHistoricDataForCreate(
  userAddress: Address,
  tokenAmount: BigInt
): void {
  let userStats = getOrCreateUserHistoricData(userAddress.toHexString());
  userStats.createdCount = userStats.createdCount.plus(tokenAmount);
  userStats.save();
}

export function updateHistoricDataForAuctionCreate(
  userAddress: string,
  tokenAmount: BigInt
): void {
  let userStats = getOrCreateUserHistoricData(userAddress);
  userStats.onSaleCount = userStats.onSaleCount.plus(tokenAmount);
  userStats.save();
}

export function updateHistoricDataForAuctionCancel(
  userAddress: string,
  tokenAmount: BigInt
): void {
  let userStats = getOrCreateUserHistoricData(userAddress);
  userStats.onSaleCount = userStats.onSaleCount.minus(tokenAmount);
  userStats.save();
}

export function updateHistoricDataForAuctionCompleted(
  buyerAddress: string,
  sellerAddress: string,
  volumeTraded: BigInt,
  tokenAmount: BigInt
): void {
  let buyerStats = getOrCreateUserHistoricData(buyerAddress);
  buyerStats.takerVolume = buyerStats.takerVolume.plus(volumeTraded);
  buyerStats.save();

  let sellerStats = getOrCreateUserHistoricData(sellerAddress);
  sellerStats.onSaleCount = sellerStats.onSaleCount.minus(tokenAmount);
  sellerStats.makerVolume = sellerStats.makerVolume.plus(volumeTraded);
  sellerStats.save();
}

export function updateHistoricDataForOfferAccepted(
  buyerAddress: string,
  sellerAddress: string,
  volumeTraded: BigInt
): void {
  let buyerStats = getOrCreateUserHistoricData(buyerAddress);
  buyerStats.takerVolume = buyerStats.takerVolume.plus(volumeTraded);
  buyerStats.save();

  let sellerStats = getOrCreateUserHistoricData(sellerAddress);
  sellerStats.makerVolume = sellerStats.makerVolume.plus(volumeTraded);
  sellerStats.save();
}

export function updateHourDataForSaleCompleted(
  timestamp: BigInt,
  volume: BigInt,
  buyerAddress: string,
  sellerAddress: string,
  paymentErc20TokenAddress: Bytes | null = null
): void {
  updateHourData(
    timestamp,
    buyerAddress,
    BigInt.fromU32(0),
    volume,
    paymentErc20TokenAddress
  );
  updateHourData(
    timestamp,
    sellerAddress,
    volume,
    BigInt.fromU32(0),
    paymentErc20TokenAddress
  );
}

export function updateHourData(
  blockTimestamp: BigInt,
  userAddress: string,
  makerVolume: BigInt,
  takerVolume: BigInt,
  paymentErc20TokenAddress: Bytes | null = null
): void {
  const timestamp = blockTimestamp.toI32();

  const hour = timestamp / 3600;

  const epoch = hour * 3600;

  const hourDataId = userAddress
    .concat('-')
    .concat(BigInt.fromI32(hour).toString());

  let userHourVolumeData = UserHourData.load(hourDataId);

  if (userHourVolumeData == null) {
    userHourVolumeData = new UserHourData(hourDataId);

    userHourVolumeData.epoch = epoch;
    userHourVolumeData.accountId = userAddress;
    userHourVolumeData.makerVolume = ZERO_BI;
    userHourVolumeData.takerVolume = ZERO_BI;
    userHourVolumeData.paymentErc20TokenAddress = paymentErc20TokenAddress;
  }

  userHourVolumeData.makerVolume =
    userHourVolumeData.makerVolume.plus(makerVolume);
  userHourVolumeData.takerVolume =
    userHourVolumeData.takerVolume.plus(takerVolume);

  userHourVolumeData.save();
}
