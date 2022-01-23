import { Address, BigInt, Bytes } from '@graphprotocol/graph-ts';
import { UserHistoricData, UserDayData } from '../../generated/schema';
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
  userAddress: Bytes,
  tokenAmount: BigInt
): void {
  let userStats = getOrCreateUserHistoricData(userAddress.toHexString());
  userStats.onSaleCount = userStats.onSaleCount.plus(tokenAmount);
  userStats.save();
}

export function updateHistoricDataForAuctionCancel(
  userAddress: Bytes,
  tokenAmount: BigInt
): void {
  let userStats = getOrCreateUserHistoricData(userAddress.toHexString());
  userStats.onSaleCount = userStats.onSaleCount.minus(tokenAmount);
  userStats.save();
}

export function updateHistoricDataForAuctionCompleted(
  buyerAddress: Bytes,
  sellerAddress: Bytes,
  volumeTraded: BigInt,
  tokenAmount: BigInt
): void {
  let buyerStats = getOrCreateUserHistoricData(buyerAddress.toHexString());
  buyerStats.takerVolume = buyerStats.takerVolume.plus(volumeTraded);
  buyerStats.save();

  let sellerStats = getOrCreateUserHistoricData(sellerAddress.toHexString());
  sellerStats.onSaleCount = sellerStats.onSaleCount.minus(tokenAmount);
  sellerStats.makerVolume = sellerStats.makerVolume.plus(volumeTraded);
  sellerStats.save();
}

export function updateHistoricDataForBidAccepted(
  buyerAddress: Bytes,
  sellerAddress: Bytes,
  volumeTraded: BigInt
): void {
  let buyerStats = getOrCreateUserHistoricData(buyerAddress.toHexString());
  buyerStats.takerVolume = buyerStats.takerVolume.plus(volumeTraded);
  buyerStats.save();

  let sellerStats = getOrCreateUserHistoricData(sellerAddress.toHexString());
  sellerStats.makerVolume = sellerStats.makerVolume.plus(volumeTraded);
  sellerStats.save();
}

export function updateDayDataForSaleCompleted(
  blockTimestamp: BigInt,
  volume: BigInt,
  buyerAddress: Bytes,
  sellerAddress: Bytes
): void {
  updateDayData(blockTimestamp, buyerAddress, BigInt.fromU32(0), volume);
  updateDayData(blockTimestamp, sellerAddress, volume, BigInt.fromU32(0));
}

export function updateDayData(
  blockTimestamp: BigInt,
  userAddress: Bytes,
  makerVolume: BigInt,
  takerVolume: BigInt
): void {
  const timestamp = blockTimestamp.toI32();
  const dayID = timestamp / 86400;
  const dayStartTimestamp = dayID * 86400;
  const dayDataId = userAddress.toHexString() + '-' + dayID.toString();

  let userDayData = UserDayData.load(dayDataId);
  if (userDayData == null) {
    userDayData = new UserDayData(dayDataId);
    userDayData.date = dayStartTimestamp;
    userDayData.accountId = userAddress;
    userDayData.makerVolume = ZERO_BI;
    userDayData.takerVolume = ZERO_BI;
  }

  userDayData.makerVolume = userDayData.makerVolume.plus(makerVolume);
  userDayData.takerVolume = userDayData.takerVolume.plus(takerVolume);

  userDayData.save();
}
