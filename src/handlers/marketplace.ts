import {
  AuctionCancelled,
  AuctionCreated,
  AuctionSuccessful,
} from '../../generated/Marketplace/Marketplace';
import { Nft, Auction } from '../../generated/schema';
import {
  createNftId,
  handleAuctionCompletedForNFT,
  handleAuctionCreatedForNFT,
} from '../modules/nft';
import { createAuctionActivity } from '../modules/activity';
import { BigInt, log, store } from '@graphprotocol/graph-ts';
import { getOrCreateOwnership } from '../modules/ownership';
import * as userData from '../modules/userData';
import * as collectionData from '../modules/collectionData';

export function handleAuctionCreated(event: AuctionCreated): void {
  let nftId = createNftId(
    event.params.nftContract.toHexString(),
    event.params.tokenId.toString()
  );

  let nft = Nft.load(nftId);
  if (nft == null) {
    log.warning('NFT {} not available', [nftId]);
    return;
  }

  let auction = Auction.load(event.params.id.toHexString());
  if (!auction) {
    auction = new Auction(event.params.id.toHexString());
  } else {
    userData.updateHistoricDataForAuctionCancel(
      auction.seller,
      auction.tokenAmount
    );
    collectionData.updateHistoricDataForAuctionCancel(
      nft.contractId,
      auction.tokenAmount
    );
  }

  auction.startedAt = event.block.timestamp;
  auction.seller = event.params.seller;
  auction.startingPrice = event.params.startingPrice;
  auction.endingPrice = event.params.endingPrice;
  auction.duration = event.params.duration;
  auction.nft = nftId;
  auction.tokenAmount = event.params.amount;
  auction.soldTokenAmount = BigInt.fromI32(0);

  auction.save();

  nft = handleAuctionCreatedForNFT(nft, auction, event.block.timestamp);
  nft.save();

  let nftOwnership = getOrCreateOwnership(nft, auction.seller);
  nftOwnership.nftPrice = nft.price;
  nftOwnership.nftIsOnSale = true;
  nftOwnership.nftListedAt = nft.listedAt;
  nftOwnership.save();

  userData.updateHistoricDataForAuctionCreate(
    auction.seller,
    auction.tokenAmount
  );
  collectionData.updateHistoricDataForAuctionCreate(
    nft.contractId,
    auction.tokenAmount
  );
  createAuctionActivity(
    auction,
    nft,
    'auctionCreate',
    BigInt.fromI32(0),
    event
  );
}

export function handleAuctionSuccessful(event: AuctionSuccessful): void {
  let auction = Auction.load(event.params.id.toHexString());
  if (auction == null) {
    log.warning('Auction {} not available', [event.params.id.toHexString()]);
    return;
  }
  let nft = Nft.load(auction.nft);
  if (nft == null) {
    log.warning('NFT {} not available', [auction.nft]);
    return;
  }

  auction.buyer = event.params.winner;
  auction.soldTokenAmount = auction.soldTokenAmount.plus(event.params.amount);
  auction.tokenAmount = auction.tokenAmount.minus(event.params.amount);
  auction.totalPrice = event.params.totalPrice;
  auction.save();

  let isAuctionCompleted = auction.tokenAmount <= BigInt.fromI32(0);
  if (isAuctionCompleted) {
    store.remove('Auction', auction.id);
    nft = handleAuctionCompletedForNFT(nft, auction.id);
    nft.lastSalePrice = auction.totalPrice;
    nft.save();
  }

  userData.updateHistoricDataForAuctionCompleted(
    auction.buyer!,
    auction.seller,
    auction.totalPrice!,
    event.params.amount
  );
  userData.updateDayDataForSaleCompleted(
    event.block.timestamp,
    auction.totalPrice!,
    auction.buyer!,
    auction.seller
  );
  collectionData.updateHistoricDataForAuctionCompleted(
    nft.contractId,
    auction.totalPrice!,
    event.params.amount
  );
  collectionData.updateDayData(
    event.block.timestamp,
    nft.contractId,
    auction.totalPrice!
  );

  createAuctionActivity(
    auction,
    nft,
    'auctionSuccess',
    event.params.totalFees,
    event
  );
}

export function handleAuctionCancelled(event: AuctionCancelled): void {
  let auction = Auction.load(event.params.id.toHexString());
  if (auction == null) {
    log.warning('Auction {} not available', [event.params.id.toHexString()]);
    return;
  }
  store.remove('Auction', auction.id);

  let nft = Nft.load(auction.nft);
  if (nft == null) {
    log.warning('NFT {} not available', [auction.nft]);
    return;
  }
  nft = handleAuctionCompletedForNFT(nft, auction.id);
  nft.save();

  let nftOwnership = getOrCreateOwnership(nft, auction.seller);
  nftOwnership.nftIsOnSale = false;
  nftOwnership.nftPrice = nft.price;
  nftOwnership.nftListedAt = nft.listedAt;
  nftOwnership.save();

  userData.updateHistoricDataForAuctionCancel(
    nft.contractId,
    auction.tokenAmount
  );

  collectionData.updateHistoricDataForAuctionCancel(
    nft.contractId,
    auction.tokenAmount
  );

  createAuctionActivity(
    auction,
    nft,
    'auctionCancel',
    BigInt.fromI32(0),
    event
  );
}
