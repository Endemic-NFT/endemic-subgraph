import { Address, BigInt, Bytes } from '@graphprotocol/graph-ts';
import {
  CollectionHistoricData,
  CollectionHourData,
} from '../../generated/schema';
import { ONE_BI, ZERO_BI } from '../utils/constants';
import {
  updateFloorPrice,
  updatePriceTracker,
  AUCTION_MODE,
} from '../utils/floorPrices';
import { isBurnEvent, isMintEvent } from './nft';
import { getOrCreateOwnershipPerContract } from './ownership';

export function getOrCreateColectionHistoricData(
  contractAddress: Bytes
): CollectionHistoricData {
  let stats = CollectionHistoricData.load(contractAddress.toHexString());

  if (!stats) {
    stats = new CollectionHistoricData(contractAddress.toHexString());
    stats.onSaleCount = ZERO_BI;
    stats.totalCount = ZERO_BI;
    stats.volumeTraded = ZERO_BI;
    stats.ownersCount = ZERO_BI;
    stats.floorPrice = null;
    stats.floorPriceTracker = [];
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
    // creates ownership per contract so we can track num of owners in collection
    let toOwnershipPerContract = getOrCreateOwnershipPerContract(
      contractAddress.toHexString(),
      to.toHexString()
    );
    if (toOwnershipPerContract.tokensCount.equals(ZERO_BI)) {
      // we have new owner
      collectionStats.ownersCount = collectionStats.ownersCount.plus(ONE_BI);
    }
    collectionStats.totalCount = collectionStats.totalCount.plus(tokenAmount);
    collectionStats.save();

    toOwnershipPerContract.tokensCount =
      toOwnershipPerContract.tokensCount.plus(tokenAmount);
    toOwnershipPerContract.save();
  } else if (isBurnEvent(to)) {
    let fromOwnershipPerContract = getOrCreateOwnershipPerContract(
      contractAddress.toHexString(),
      from.toHexString()
    );
    fromOwnershipPerContract.tokensCount =
      fromOwnershipPerContract.tokensCount.minus(tokenAmount);

    if (fromOwnershipPerContract.tokensCount.equals(ZERO_BI)) {
      // owner has no tokens left
      collectionStats.ownersCount = collectionStats.ownersCount.minus(ONE_BI);
    }
    collectionStats.totalCount = collectionStats.totalCount.minus(tokenAmount);
    collectionStats.save();
    fromOwnershipPerContract.save();
  } else {
    // it's transfer event
    let fromOwnershipPerContract = getOrCreateOwnershipPerContract(
      contractAddress.toHexString(),
      from.toHexString()
    );
    fromOwnershipPerContract.tokensCount =
      fromOwnershipPerContract.tokensCount.minus(tokenAmount);

    if (fromOwnershipPerContract.tokensCount.equals(ZERO_BI)) {
      collectionStats.ownersCount = collectionStats.ownersCount.minus(ONE_BI);
    }

    let toOwnershipPerContract = getOrCreateOwnershipPerContract(
      contractAddress.toHexString(),
      to.toHexString()
    );
    if (toOwnershipPerContract.tokensCount.equals(ZERO_BI)) {
      collectionStats.ownersCount = collectionStats.ownersCount.plus(ONE_BI);
    }

    toOwnershipPerContract.tokensCount =
      toOwnershipPerContract.tokensCount.plus(ONE_BI);

    fromOwnershipPerContract.save();
    toOwnershipPerContract.save();
    collectionStats.save();
  }
}

export function updateHistoricDataForAuctionCreate(
  contractAddress: Bytes,
  auctionPrice: BigInt,
  tokenAmount: BigInt
): void {
  let collectionStats = getOrCreateColectionHistoricData(contractAddress);
  collectionStats.onSaleCount = collectionStats.onSaleCount.plus(tokenAmount);

  if (
    !collectionStats.floorPrice ||
    auctionPrice < collectionStats.floorPrice!
  ) {
    collectionStats = updateFloorPrice(
      AUCTION_MODE.CREATE,
      collectionStats,
      auctionPrice
    );
  } else {
    collectionStats = updatePriceTracker(
      AUCTION_MODE.CREATE,
      collectionStats,
      auctionPrice
    );
  }

  collectionStats.save();
}

export function updateHistoricDataForAuctionCancel(
  contractAddress: Bytes,
  auctionPrice: BigInt,
  tokenAmount: BigInt
): void {
  let collectionStats = getOrCreateColectionHistoricData(contractAddress);
  collectionStats.onSaleCount = collectionStats.onSaleCount.minus(tokenAmount);

  if (
    collectionStats.floorPrice &&
    auctionPrice == collectionStats.floorPrice!
  ) {
    collectionStats = updateFloorPrice(
      AUCTION_MODE.FINALIZE,
      collectionStats,
      auctionPrice
    );
  } else {
    collectionStats = updatePriceTracker(
      AUCTION_MODE.FINALIZE,
      collectionStats,
      auctionPrice
    );
  }

  collectionStats.save();
}

export function updateHistoricDataForAuctionCompleted(
  contractAddress: Bytes,
  volumeTraded: BigInt,
  auctionPrice: BigInt,
  tokenAmount: BigInt
): void {
  let collectionStats = getOrCreateColectionHistoricData(contractAddress);
  collectionStats.onSaleCount = collectionStats.onSaleCount.minus(tokenAmount);
  collectionStats.volumeTraded =
    collectionStats.volumeTraded.plus(volumeTraded);

  if (
    collectionStats.floorPrice &&
    auctionPrice == collectionStats.floorPrice!
  ) {
    collectionStats = updateFloorPrice(
      AUCTION_MODE.FINALIZE,
      collectionStats,
      auctionPrice
    );
  } else {
    collectionStats = updatePriceTracker(
      AUCTION_MODE.FINALIZE,
      collectionStats,
      auctionPrice
    );
  }

  collectionStats.save();
}

export function updateHistoricDataForOfferAccepted(
  contractAddress: Bytes,
  volumeTraded: BigInt
): void {
  let collectionStats = getOrCreateColectionHistoricData(contractAddress);
  collectionStats.volumeTraded =
    collectionStats.volumeTraded.plus(volumeTraded);
  collectionStats.save();
}

export function updateHourData(
  blockTimestamp: BigInt,
  contractAddress: Bytes,
  volumeTraded: BigInt
): void {
  const timestamp = blockTimestamp.toI32();

  const hourID = Math.floor(timestamp / 3600000) * 3600000;

  const hourDataId = contractAddress.toHexString() + '-' + hourID.toString();

  let collectionHourData = CollectionHourData.load(hourDataId);

  if (collectionHourData == null) {
    collectionHourData = new CollectionHourData(hourDataId);

    collectionHourData.epoch = timestamp;
    collectionHourData.volumeTraded = ZERO_BI;
    collectionHourData.contractId = contractAddress;
  }

  collectionHourData.volumeTraded =
    collectionHourData.volumeTraded.plus(volumeTraded);

  collectionHourData.save();
}
