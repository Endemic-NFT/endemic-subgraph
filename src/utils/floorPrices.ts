import { add, removeFirst } from './array';
import { CollectionHistoricData } from '../../generated/schema';
import { BigInt } from '@graphprotocol/graph-ts';

export enum AUCTION_MODE {
  CREATE,
  FINALIZE,
}

export function updateFloorPrice(
  type: AUCTION_MODE,
  collectionStats: CollectionHistoricData,
  auctionPrice: BigInt
): CollectionHistoricData {
  switch (type) {
    case AUCTION_MODE.CREATE:
      return updateFloorPriceOnCreate(collectionStats, auctionPrice);
    case AUCTION_MODE.FINALIZE:
      return updateFloorPriceOnFinalize(collectionStats);
    default:
      return collectionStats;
  }
}

export function updatePriceTracker(
  type: AUCTION_MODE,
  collectionStats: CollectionHistoricData,
  auctionPrice: BigInt
): CollectionHistoricData {
  switch (type) {
    case AUCTION_MODE.CREATE:
      return updatePriceTrackerOnCreate(collectionStats, auctionPrice);
    case AUCTION_MODE.FINALIZE:
      return updatePriceTrackerOnFinalize(collectionStats, auctionPrice);
    default:
      return collectionStats;
  }
}

function updateFloorPriceOnCreate(
  collectionStats: CollectionHistoricData,
  newFloorPrice: BigInt
): CollectionHistoricData {
  const currentFloorPrice = collectionStats.floorPrice;
  const floorPriceTracker = collectionStats.floorPriceTracker;

  if (currentFloorPrice) {
    floorPriceTracker!.push(currentFloorPrice);
  }

  collectionStats.floorPrice = newFloorPrice;
  collectionStats.floorPriceTracker = floorPriceTracker;

  return collectionStats;
}

function updateFloorPriceOnFinalize(
  collectionStats: CollectionHistoricData
): CollectionHistoricData {
  const floorPriceTracker = collectionStats.floorPriceTracker;

  collectionStats.floorPrice =
    floorPriceTracker!.length !== 0 ? floorPriceTracker!.pop() : null;
  collectionStats.floorPriceTracker = floorPriceTracker;

  return collectionStats;
}

function updatePriceTrackerOnCreate(
  collectionStats: CollectionHistoricData,
  newPrice: BigInt
): CollectionHistoricData {
  collectionStats.floorPriceTracker = add(
    collectionStats.floorPriceTracker!,
    newPrice
  );

  return collectionStats;
}

function updatePriceTrackerOnFinalize(
  collectionStats: CollectionHistoricData,
  priceToRemove: BigInt
): CollectionHistoricData {
  collectionStats.floorPriceTracker = removeFirst(
    collectionStats.floorPriceTracker!,
    priceToRemove
  );

  return collectionStats;
}
