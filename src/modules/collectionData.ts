import { Address, BigInt, Bytes } from '@graphprotocol/graph-ts';
import {
  CollectionDayData,
  CollectionHistoricData,
} from '../../generated/schema';
import { ZERO_BI } from '../utils/constants';
import { isBurnEvent, isMintEvent } from './nft';

export function getOrCreateColectionHistoricData(
  contractAddress: Bytes
): CollectionHistoricData {
  let stats = CollectionHistoricData.load(contractAddress.toHexString());

  if (!stats) {
    stats = new CollectionHistoricData(contractAddress.toHexString());
    stats.onSaleCount = ZERO_BI;
    stats.totalCount = ZERO_BI;
    stats.volumeTraded = ZERO_BI;
    stats.save();
  }

  return stats;
}

export function updateHistoricDataForTransfer(
  contractAddress: Bytes,
  from: Address,
  to: Address,
  tokenAmount: BigInt
): void {
  let collectionStats = getOrCreateColectionHistoricData(contractAddress);

  if (isMintEvent(from)) {
    collectionStats.totalCount = collectionStats.totalCount.plus(tokenAmount);
    collectionStats.save();
  } else if (isBurnEvent(to)) {
    collectionStats.totalCount = collectionStats.totalCount.minus(tokenAmount);
    collectionStats.save();
  }
}

export function updateHistoricDataForAuctionCreate(
  contractAddress: Bytes,
  tokenAmount: BigInt
): void {
  let collectionStats = getOrCreateColectionHistoricData(contractAddress);
  collectionStats.onSaleCount = collectionStats.onSaleCount.plus(tokenAmount);
  collectionStats.save();
}

export function updateHistoricDataForAuctionCancel(
  contractAddress: Bytes,
  tokenAmount: BigInt
): void {
  let collectionStats = getOrCreateColectionHistoricData(contractAddress);
  collectionStats.onSaleCount = collectionStats.onSaleCount.minus(tokenAmount);
  collectionStats.save();
}

export function updateHistoricDataForAuctionCompleted(
  contractAddress: Bytes,
  volumeTraded: BigInt,
  tokenAmount: BigInt
): void {
  let collectionStats = getOrCreateColectionHistoricData(contractAddress);
  collectionStats.onSaleCount = collectionStats.onSaleCount.minus(tokenAmount);
  collectionStats.volumeTraded =
    collectionStats.volumeTraded.plus(volumeTraded);
  collectionStats.save();
}

export function updateHistoricDataForBidAccepted(
  contractAddress: Bytes,
  volumeTraded: BigInt
): void {
  let collectionStats = getOrCreateColectionHistoricData(contractAddress);
  collectionStats.volumeTraded =
    collectionStats.volumeTraded.plus(volumeTraded);
  collectionStats.save();
}

export function updateDayData(
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
    collectionDayData.volumeTraded = ZERO_BI;
    collectionDayData.contractId = contractAddress;
  }

  collectionDayData.volumeTraded =
    collectionDayData.volumeTraded.plus(volumeTraded);

  collectionDayData.save();
}
