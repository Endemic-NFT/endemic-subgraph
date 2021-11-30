import {
  AuctionCancelled,
  AuctionCreated,
  AuctionSuccessful,
} from '../../generated/Marketplace/Marketplace';
import { NFT, Auction } from '../../generated/schema';
import {
  getNFTId,
  handleAuctionCompletedForNFT,
  handleAuctionCreatedForNFT,
} from '../modules/nft';
import { createAuctionActivity } from '../modules/activity';
import { BigInt, log, store } from '@graphprotocol/graph-ts';
import { getOrCreateOwnership } from '../modules/ownership';
import {
  updateStatsForAuctionCancel,
  updateStatsForAuctionCompleted,
  updateStatsForAuctionCreate,
} from '../modules/stats';

export function handleAuctionCreated(event: AuctionCreated): void {
  let nftId = getNFTId(
    event.params.nftContract.toHexString(),
    event.params.tokenId.toString()
  );

  let nft = NFT.load(nftId);
  if (nft == null) {
    log.warning('NFT {} not available', [nftId]);
    return;
  }

  let auction = Auction.load(event.params.id.toHexString());
  if (!auction) {
    auction = new Auction(event.params.id.toHexString());
  } else {
    updateStatsForAuctionCancel(nft, auction);
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

  handleAuctionCreatedForNFT(nft, auction);
  nft.save();

  let nftOwnership = getOrCreateOwnership(nft, auction.seller);
  nftOwnership.nftPrice = nft.price;
  nftOwnership.nftIsOnSale = true;
  nftOwnership.save();

  updateStatsForAuctionCreate(auction, nft.contractId.toHexString());
  createAuctionActivity(auction, nft, 'auctionCreate', event);
}

export function handleAuctionSuccessful(event: AuctionSuccessful): void {
  let auction = Auction.load(event.params.id.toHexString());
  if (auction == null) {
    log.warning('Auction {} not available', [event.params.id.toHexString()]);
    return;
  }
  let nft = NFT.load(auction.nft);
  if (nft == null) {
    log.warning('NFT {} not available', [auction.nft]);
    return;
  }

  auction.soldAt = event.block.timestamp;
  auction.buyer = event.params.winner;
  auction.soldTokenAmount = auction.soldTokenAmount.plus(event.params.amount);
  auction.tokenAmount = auction.tokenAmount.minus(event.params.amount);
  auction.totalPrice = event.params.totalPrice;
  auction.save();

  let isAuctionCompleted = auction.tokenAmount <= BigInt.fromI32(0);

  if (isAuctionCompleted) {
    store.remove('Auction', auction.id);
    handleAuctionCompletedForNFT(nft, auction.id);
    nft.lastSalePrice = auction.totalPrice;
    nft.save();
  }

  updateStatsForAuctionCompleted(auction, nft, event.params.amount);
  createAuctionActivity(auction, nft, 'auctionSuccess', event);
}

export function handleAuctionCancelled(event: AuctionCancelled): void {
  let auction = Auction.load(event.params.id.toHexString());
  if (auction == null) {
    log.warning('Auction {} not available', [event.params.id.toHexString()]);
    return;
  }
  store.remove('Auction', auction.id);

  let nft = NFT.load(auction.nft);
  if (nft == null) {
    log.warning('NFT {} not available', [auction.nft]);
    return;
  }
  handleAuctionCompletedForNFT(nft, auction.id);
  nft.save();

  let nftOwnership = getOrCreateOwnership(nft, auction.seller);
  nftOwnership.nftIsOnSale = false;
  nftOwnership.nftPrice = nft.price;
  nftOwnership.save();

  updateStatsForAuctionCancel(nft, auction);
  createAuctionActivity(auction, nft, 'auctionCancel', event);
}
