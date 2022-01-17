import { Address, BigInt, Bytes } from '@graphprotocol/graph-ts';
import { CollectionDayData, CollectionStatistic } from '../../generated/schema';
import { isBurnEvent, isMintEvent } from './nft';

export function getOrCreateColectionStats(
  contractAddress: Bytes
): CollectionStatistic {
  let stats = CollectionStatistic.load(contractAddress.toHexString());

  if (!stats) {
    stats = new CollectionStatistic(contractAddress.toHexString());
    stats.onSaleCount = BigInt.fromI32(0);
    stats.totalCount = BigInt.fromI32(0);
    stats.volumeTraded = BigInt.fromI32(0);
    stats.save();
  }

  return stats;
}

export function updateStatsForTransfer(
  contractAddress: Bytes,
  from: Address,
  to: Address,
  tokenAmount: BigInt
): void {
  let collectionStats = getOrCreateColectionStats(contractAddress);

  if (isMintEvent(from)) {
    collectionStats.totalCount = collectionStats.totalCount.plus(tokenAmount);
    collectionStats.save();
  } else if (isBurnEvent(to)) {
    collectionStats.totalCount = collectionStats.totalCount.minus(tokenAmount);
    collectionStats.save();
  }
}

export function updateStatsForAuctionCreate(
  contractAddress: Bytes,
  tokenAmount: BigInt
): void {
  let collectionStats = getOrCreateColectionStats(contractAddress);
  collectionStats.onSaleCount = collectionStats.onSaleCount.plus(tokenAmount);
  collectionStats.save();
}

export function updateStatsForAuctionCancel(
  contractAddress: Bytes,
  tokenAmount: BigInt
): void {
  let collectionStats = getOrCreateColectionStats(contractAddress);
  collectionStats.onSaleCount = collectionStats.onSaleCount.minus(tokenAmount);
  collectionStats.save();
}

export function updateStatsForAuctionCompleted(
  blockTimestamp: BigInt,
  contractAddress: Bytes,
  volumeTraded: BigInt,
  tokenAmount: BigInt
): void {
  let collectionStats = getOrCreateColectionStats(contractAddress);
  collectionStats.onSaleCount = collectionStats.onSaleCount.minus(tokenAmount);
  collectionStats.volumeTraded =
    collectionStats.volumeTraded.plus(volumeTraded);
  collectionStats.save();

  updateDayStats(blockTimestamp, contractAddress, volumeTraded);
}

export function updateStatsForBidAccepted(
  blockTimestamp: BigInt,
  contractAddress: Bytes,
  volumeTraded: BigInt
): void {
  let collectionStats = getOrCreateColectionStats(contractAddress);
  collectionStats.volumeTraded =
    collectionStats.volumeTraded.plus(volumeTraded);
  collectionStats.save();

  updateDayStats(blockTimestamp, contractAddress, volumeTraded);
}

export function updateDayStats(
  blockTimestamp: BigInt,
  contractAddress: Bytes,
  volumeTraded: BigInt
): void {
  const timestamp = blockTimestamp.toI32();
  const dayID = timestamp / 86400;
  const dayStartTimestamp = dayID * 86400;
  const dayDataId = contractAddress.toHexString() + '-' + dayID.toString();

  let collectionDayData = CollectionDayData.load(dayDataId);
  if (collectionDayData == null) {
    collectionDayData = new CollectionDayData(dayDataId);
    collectionDayData.date = dayStartTimestamp;
    collectionDayData.volumeTraded = BigInt.fromI32(0);
    collectionDayData.contractId = contractAddress;
  }

  collectionDayData.volumeTraded =
    collectionDayData.volumeTraded.plus(volumeTraded);

  collectionDayData.save();
}
