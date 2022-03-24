import { add, removeFirst } from './array';

export const AUCTION_MODE = {
  CREATE: 'Create',
  FINALIZE: 'Finalize',
};

export function updateFloorPrice(type, data) {
  switch (type) {
    case AUCTION_MODE.CREATE:
      return updateFloorPriceOnCreate(data);
    case AUCTION_MODE.FINALIZE:
      return updateFloorPriceOnFinalize(data);
    default:
      return null;
  }
}

export function updatePriceTracker(type, data) {
  switch (type) {
    case AUCTION_MODE.CREATE:
      return updatePriceTrackerOnCreate(data);
    case AUCTION_MODE.FINALIZE:
      return updatePriceTrackerOnFinalize(data);
    default:
      return null;
  }
}

function updateFloorPriceOnCreate(data) {
  const { collectionStats, newFloorPrice } = data;

  const currentFloorPrice = collectionStats.floorPrice;
  const floorPriceTracker = collectionStats.floorPriceTracker;

  floorPriceTracker.push(currentFloorPrice);

  collectionStats.floorPrice = newFloorPrice;
  collectionStats.floorPriceTracker = floorPriceTracker;

  return collectionStats;
}

function updateFloorPriceOnFinalize(data) {
  const { collectionStats } = data;
  const floorPriceTracker = collectionStats.floorPriceTracker;

  collectionStats.floorPrice = floorPriceTracker.pop();
  collectionStats.floorPriceTracker = floorPriceTracker;

  return collectionStats;
}

function updatePriceTrackerOnCreate(data) {
  const { collectionStats, newPrice } = data;

  collectionStats.floorPriceTracker = add(
    collectionStats.floorPriceTracker,
    newPrice
  );

  return collectionStats;
}

function updatePriceTrackerOnFinalize(data) {
  const { collectionStats, priceToRemove } = data;

  collectionStats.floorPriceTracker = removeFirst(
    collectionStats.floorPriceTracker,
    priceToRemove
  );

  return collectionStats;
}
