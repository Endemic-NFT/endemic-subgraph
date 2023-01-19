import {
  AuctionCancelled,
  AuctionCreated,
  AuctionSuccessful,
  OfferAccepted,
  OfferCancelled,
  OfferCreated,
  PrivateSaleSuccess,
  ReserveBidPlaced,
} from '../../generated/EndemicExchange/EndemicExchange';
import { Nft, Auction, Offer } from '../../generated/schema';
import {
  createNftId,
  handleAuctionCompletedForNFT,
  handleAuctionCreatedForNFT,
} from '../modules/nft';
import {
  createAuctionActivity,
  createOfferActivity,
  createPrivateSaleActivity,
  createReserveBidPlacedActivity,
} from '../modules/activity';
import { Bytes, log, store } from '@graphprotocol/graph-ts';
import { getOrCreateNftOwnership } from '../modules/ownership';
import * as userData from '../modules/userData';
import * as collectionData from '../modules/collectionData';
import { ONE_BI, ZERO_BI } from '../utils/constants';
import { createAccount } from '../modules/account';
import { removeActiveAuction } from '../modules/auction';
import { toHighDenom } from '../utils/prices';

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
  auction.endingAt = event.params.endingAt;
  auction.seller = event.params.seller.toHexString();
  auction.startingPrice = event.params.startingPrice;
  auction.endingPrice = event.params.endingPrice;
  auction.isDutch = event.params.startingPrice != event.params.endingPrice;
  auction.nft = nftId;
  auction.tokenAmount = event.params.amount;
  auction.soldTokenAmount = ZERO_BI;
  auction.paymentErc20TokenAddress = event.params.paymentErc20TokenAddress;
  auction.sourceVersion = 'V2';
  auction.sortingPrice = toHighDenom(
    auction.endingPrice,
    auction.paymentErc20TokenAddress
  );

  auction.save();

  nft = handleAuctionCreatedForNFT(nft, auction, event.block.timestamp);
  nft.save();

  let nftOwnership = getOrCreateNftOwnership(nft, auction.seller);
  nftOwnership.nftPrice = nft.price;
  nftOwnership.nftAuctionSortingPrice = nft.auctionSortingPrice;
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
    event.params.amount,
    auction.paymentErc20TokenAddress
  );
  userData.updateHourDataForSaleCompleted(
    event.block.timestamp,
    auction.totalPrice!,
    auction.buyer!.toHexString(),
    auction.seller,
    auction.paymentErc20TokenAddress
  );
  collectionData.updateHistoricDataForAuctionCompleted(
    nft.contractId,
    auction.totalPrice!,
    auction.endingPrice,
    event.params.amount,
    auction.paymentErc20TokenAddress
  );
  collectionData.updateHourData(
    event.block.timestamp,
    nft.contractId,
    auction.totalPrice!,
    auction.paymentErc20TokenAddress
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
  nftOwnership.nftAuctionSortingPrice = nft.auctionSortingPrice;
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

export function handleOfferCreated(event: OfferCreated): void {
  let nftContract = event.params.nftContract.toHexString();

  let nftId = createNftId(nftContract, event.params.tokenId.toString());

  let offerId = event.params.id.toString();
  let offer = new Offer(offerId);

  let isForCollection = event.params.isForCollection;

  let nft = Nft.load(nftId);
  if (!isForCollection && nft == null) {
    log.info('NFT not found {} for offer {}', [nftId, offerId]);
    return;
  }

  offer.nft = nftId;
  offer.nftContract = nftContract;
  offer.bidder = event.params.bidder.toHexString();
  offer.price = event.params.price;
  offer.expiresAt = event.params.expiresAt;
  offer.createdAt = event.block.timestamp;
  offer.paymentErc20TokenAddress = event.params.paymentErc20TokenAddress;
  offer.isForCollection = isForCollection;
  offer.sourceVersion = 'V2';

  offer.save();

  createAccount(event.params.bidder);
  createOfferActivity(
    offer,
    isForCollection ? null : nftId,
    nftContract,
    ZERO_BI,
    !isForCollection ? 'offerCreate' : 'collectionOfferCreate',
    event.params.bidder,
    event
  );
}

export function handleOfferAccepted(event: OfferAccepted): void {
  let offerId = event.params.id.toString();

  let offer = Offer.load(offerId);
  if (offer == null) {
    log.info('Offer not found {}', [offerId]);
    return;
  }

  let nft = Nft.load(offer.nft!);
  if (!offer.isForCollection && nft == null) {
    log.info('NFT not found {} for offer {}', [nft!.id, offerId]);
    return;
  }

  let nftId: string;
  let contractId: Bytes;
  if (nft != null) {
    nftId = nft.id;
    contractId = nft.contractId;
  } else {
    nftId = createNftId(offer.nftContract, event.params.tokenId.toString());
    contractId = Bytes.fromByteArray(Bytes.fromHexString(offer.nftContract));
  }

  if (nft === null) {
    //Offer is for collection -> load nft from store with new nftId
    nft = Nft.load(nftId);

    if (nft === null) {
      log.warning('NFT not found {} for offer {}', [nftId, offerId]);
      return;
    }
  }

  nft = removeActiveAuction(nft, event.params.seller, ONE_BI);
  nft.save();

  store.remove('Offer', offer.id);

  userData.updateHistoricDataForOfferAccepted(
    event.params.bidder.toHexString(),
    event.params.seller.toHexString(),
    event.params.price,
    offer.paymentErc20TokenAddress
  );
  userData.updateHourDataForSaleCompleted(
    event.block.timestamp,
    event.params.price,
    event.params.bidder.toHexString(),
    event.params.seller.toHexString(),
    offer.paymentErc20TokenAddress
  );

  collectionData.updateHistoricDataForOfferAccepted(
    contractId,
    event.params.price,
    offer.paymentErc20TokenAddress
  );
  collectionData.updateHourData(
    event.block.timestamp,
    contractId,
    event.params.price,
    offer.paymentErc20TokenAddress
  );

  createOfferActivity(
    offer,
    offer.isForCollection ? null : nftId,
    offer.nftContract,
    event.params.totalFees,
    'offerAccept',
    event.params.seller,
    event
  );
}

export function handleOfferCancelled(event: OfferCancelled): void {
  let offerId = event.params.id.toString();

  let offer = Offer.load(offerId);
  if (offer == null) {
    log.info('Offer not found {}', [offerId]);
    return;
  }

  let isForCollection = offer.isForCollection;

  let nft = Nft.load(offer.nft!);
  if (!isForCollection && nft == null) {
    log.info('NFT not found {} for offer {}', [nft!.id, offerId]);
    return;
  }

  let nftId: string;
  if (nft != null) {
    nftId = nft.id;
  } else {
    nftId = createNftId(offer.nftContract, '0');
  }

  store.remove('Offer', offer.id);

  createOfferActivity(
    offer,
    isForCollection ? null : nftId,
    offer.nftContract,
    ZERO_BI,
    !isForCollection ? 'offerCancel' : 'collectionOfferCancel',
    event.params.bidder,
    event
  );
}

export function handlePrivateSaleSuccess(event: PrivateSaleSuccess): void {
  userData.updateHistoricDataForOfferAccepted(
    event.params.buyer.toHexString(),
    event.params.seller.toHexString(),
    event.params.totalFees,
    event.params.paymentErc20TokenAddress
  );

  userData.updateHourDataForSaleCompleted(
    event.block.timestamp,
    event.params.totalFees,
    event.params.buyer.toHexString(),
    event.params.seller.toHexString(),
    event.params.paymentErc20TokenAddress
  );

  collectionData.updateHourData(
    event.block.timestamp,
    event.params.nftContract,
    event.params.totalFees,
    event.params.paymentErc20TokenAddress
  );

  collectionData.updateHistoricDataForTransfer(
    event.params.nftContract,
    event.params.seller,
    event.params.buyer,
    event.params.totalFees
  );

  createPrivateSaleActivity(event);
}

export function handleReserveBidPlaced(event: ReserveBidPlaced): void {
  let auction = Auction.load(event.params.id.toHexString());

  if (auction == null) {
    log.warning('Auction {} not available', [event.params.id.toHexString()]);
    return;
  }

  auction.buyer = event.params.bidder;
  auction.endingAt = event.params.endingAt;
  auction.endingPrice = event.params.reservePrice;

  auction.save();

  createReserveBidPlacedActivity(auction.nft, event);
}
