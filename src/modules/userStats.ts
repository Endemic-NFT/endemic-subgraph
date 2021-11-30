import { Address, BigInt } from '@graphprotocol/graph-ts';
import { UserStatistic } from '../../generated/schema';
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
  userAddress: string,
  tokenAmount: BigInt
): void {
  let userStats = getOrCreateUserStats(userAddress);
  userStats.onSaleCount = userStats.onSaleCount.plus(tokenAmount);
  userStats.save();
}

export function updateStatsForAuctionCancel(
  userAddress: string,
  tokenAmount: BigInt
): void {
  let userStats = getOrCreateUserStats(userAddress);
  userStats.onSaleCount = userStats.onSaleCount.minus(tokenAmount);
  userStats.save();
}

export function updateStatsForAuctionCompleted(
  buyerAddress: string,
  sellerAddress: string,
  volumeTraded: BigInt,
  tokenAmount: BigInt
): void {
  let buyerStats = getOrCreateUserStats(buyerAddress);
  buyerStats.takerVolume = buyerStats.takerVolume.plus(volumeTraded);
  buyerStats.save();

  let sellerStats = getOrCreateUserStats(sellerAddress);
  sellerStats.onSaleCount = sellerStats.onSaleCount.minus(tokenAmount);
  sellerStats.makerVolume = sellerStats.makerVolume.plus(volumeTraded);
  sellerStats.save();
}
