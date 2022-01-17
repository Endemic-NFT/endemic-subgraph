import { Address, BigInt, Bytes } from '@graphprotocol/graph-ts';
import { UserStatistic, UserDayData } from '../../generated/schema';
import { isBurnEvent, isTransferEvent } from './nft';

export function getOrCreateUserStats(userAddress: string): UserStatistic {
  let stats = UserStatistic.load(userAddress);

  if (!stats) {
    stats = new UserStatistic(userAddress);
    stats.createdCount = BigInt.fromI32(0);
    stats.onSaleCount = BigInt.fromI32(0);
    stats.ownedCount = BigInt.fromI32(0);
    stats.makerVolume = BigInt.fromI32(0);
    stats.takerVolume = BigInt.fromI32(0);
  }

  return stats;
}

export function updateStatsForTransfer(
  from: Address,
  to: Address,
  tokenAmount: BigInt
): void {
  let fromUserStats = getOrCreateUserStats(from.toHexString());
  let toUserStats = getOrCreateUserStats(to.toHexString());

  if (isBurnEvent(to) || isTransferEvent(from, to)) {
    fromUserStats.ownedCount = fromUserStats.ownedCount.minus(tokenAmount);
    fromUserStats.save();
  }

  toUserStats.ownedCount = toUserStats.ownedCount.plus(tokenAmount);
  toUserStats.save();
}

export function updateCreatedStatsForBurn(
  userAddress: string,
  tokenAmount: BigInt
): void {
  let userStats = getOrCreateUserStats(userAddress);
  userStats.createdCount = userStats.createdCount.minus(tokenAmount);
  userStats.save();
}

export function updateStatsForCreate(
  userAddress: Address,
  tokenAmount: BigInt
): void {
  let userStats = getOrCreateUserStats(userAddress.toHexString());
  userStats.createdCount = userStats.createdCount.plus(tokenAmount);
  userStats.save();
}

export function updateStatsForAuctionCreate(
  userAddress: Bytes,
  tokenAmount: BigInt
): void {
  let userStats = getOrCreateUserStats(userAddress.toHexString());
  userStats.onSaleCount = userStats.onSaleCount.plus(tokenAmount);
  userStats.save();
}

export function updateStatsForAuctionCancel(
  userAddress: Bytes,
  tokenAmount: BigInt
): void {
  let userStats = getOrCreateUserStats(userAddress.toHexString());
  userStats.onSaleCount = userStats.onSaleCount.minus(tokenAmount);
  userStats.save();
}

export function updateStatsForAuctionCompleted(
  blockTimestamp: BigInt,
  buyerAddress: Bytes,
  sellerAddress: Bytes,
  volumeTraded: BigInt,
  tokenAmount: BigInt
): void {
  let buyerStats = getOrCreateUserStats(buyerAddress.toHexString());
  buyerStats.takerVolume = buyerStats.takerVolume.plus(volumeTraded);
  buyerStats.save();

  let sellerStats = getOrCreateUserStats(sellerAddress.toHexString());
  sellerStats.onSaleCount = sellerStats.onSaleCount.minus(tokenAmount);
  sellerStats.makerVolume = sellerStats.makerVolume.plus(volumeTraded);
  sellerStats.save();

  updateDayStats(blockTimestamp, buyerAddress, BigInt.fromI32(0), volumeTraded);
}

export function updateStatsForBidAccepted(
  blockTimestamp: BigInt,
  buyerAddress: Bytes,
  sellerAddress: Bytes,
  volumeTraded: BigInt
): void {
  let buyerStats = getOrCreateUserStats(buyerAddress.toHexString());
  buyerStats.takerVolume = buyerStats.takerVolume.plus(volumeTraded);
  buyerStats.save();

  let sellerStats = getOrCreateUserStats(sellerAddress.toHexString());
  sellerStats.makerVolume = sellerStats.makerVolume.plus(volumeTraded);
  sellerStats.save();

  updateDayStats(blockTimestamp, buyerAddress, BigInt.fromI32(0), volumeTraded);

  updateDayStats(
    blockTimestamp,
    sellerAddress,
    volumeTraded,
    BigInt.fromI32(0)
  );
}

export function updateDayStats(
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
    userDayData.makerVolume = BigInt.fromI32(0);
    userDayData.takerVolume = BigInt.fromI32(0);
  }

  userDayData.makerVolume = userDayData.makerVolume.plus(makerVolume);
  userDayData.takerVolume = userDayData.takerVolume.plus(takerVolume);

  userDayData.save();
}
