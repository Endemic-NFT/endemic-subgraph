import {
  AuctionCancelled,
  AuctionCreated,
  AuctionSuccessful,
  PrivateSaleSuccess,
} from '../../generated/EndemicExchange/EndemicExchange';
import { Nft, Auction } from '../../generated/schema';
import {
  createNftId,
  handleAuctionCompletedForNFT,
  handleAuctionCreatedForNFT,
} from '../modules/nft';
import {
  createAuctionActivity,
  createPrivateSaleActivity,
} from '../modules/activity';
import { log, store } from '@graphprotocol/graph-ts';
import { getOrCreateNftOwnership } from '../modules/ownership';
import * as userData from '../modules/userData';
import * as collectionData from '../modules/collectionData';
import { ZERO_BI } from '../utils/constants';
import { createAccount } from '../modules/account';

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
    createAccount(event.params.seller);
  } else {
    userData.updateHistoricDataForAuctionCancel(
      auction.seller,
      auction.tokenAmount
    );
    collectionData.updateHistoricDataForAuctionCancel(
      nft.contractId,
      auction.endingPrice,
      auction.tokenAmount
    );
  }

  auction.startedAt = event.block.timestamp;
  auction.seller = event.params.seller.toHexString();
  auction.startingPrice = event.params.startingPrice;
  auction.endingPrice = event.params.endingPrice;
  auction.isDutch = event.params.startingPrice != event.params.endingPrice;
  auction.duration = event.params.duration;
  auction.nft = nftId;
  auction.tokenAmount = event.params.amount;
  auction.soldTokenAmount = ZERO_BI;

  auction.save();

  nft = handleAuctionCreatedForNFT(nft, auction, event.block.timestamp);
  nft.save();

  let nftOwnership = getOrCreateNftOwnership(nft, auction.seller);
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
    auction.endingPrice,
    auction.tokenAmount
  );
  createAuctionActivity(auction, nft, 'auctionCreate', ZERO_BI, event);
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

  let isAuctionCompleted = auction.tokenAmount <= ZERO_BI;
  if (isAuctionCompleted) {
    store.remove('Auction', auction.id);
    nft = handleAuctionCompletedForNFT(nft, auction.id);
    nft.lastSalePrice = auction.totalPrice;
    nft.save();
  }

  userData.updateHistoricDataForAuctionCompleted(
    auction.buyer!.toHexString(),
    auction.seller,
    auction.totalPrice!,
    event.params.amount
  );
  userData.updateHourDataForSaleCompleted(
    event.block.timestamp,
    auction.totalPrice!,
    auction.buyer!.toHexString(),
    auction.seller
  );
  collectionData.updateHistoricDataForAuctionCompleted(
    nft.contractId,
    auction.totalPrice!,
    auction.endingPrice,
    event.params.amount
  );
  collectionData.updateHourData(
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

  let nftOwnership = getOrCreateNftOwnership(nft, auction.seller);
  nftOwnership.nftIsOnSale = false;
  nftOwnership.nftPrice = nft.price;
  nftOwnership.nftListedAt = nft.listedAt;
  nftOwnership.save();

  userData.updateHistoricDataForAuctionCancel(
    auction.seller,
    auction.tokenAmount
  );

  collectionData.updateHistoricDataForAuctionCancel(
    nft.contractId,
    auction.endingPrice,
    auction.tokenAmount
  );

  createAuctionActivity(auction, nft, 'auctionCancel', ZERO_BI, event);
}

export function handlePrivateSaleSuccess(event: PrivateSaleSuccess): void {
  userData.updateHistoricDataForOfferAccepted(
    event.params.buyer.toHexString(),
    event.params.seller.toHexString(),
    event.params.totalFees
  );

  userData.updateHourDataForSaleCompleted(
    event.block.timestamp,
    event.params.totalFees,
    event.params.buyer.toHexString(),
    event.params.seller.toHexString()
  );

  collectionData.updateHourData(
    event.block.timestamp,
    event.params.nftContract,
    event.params.totalFees
  );

  collectionData.updateHistoricDataForTransfer(
    event.params.nftContract,
    event.params.seller,
    event.params.buyer,
    event.params.totalFees
  );

  createPrivateSaleActivity(
    event.params.nftContract,
    event.params.tokenId,
    event.params.seller.toHexString(),
    event.params.buyer.toHexString(),
    event.params.price,
    event.params.totalFees,
    event
  );
}
