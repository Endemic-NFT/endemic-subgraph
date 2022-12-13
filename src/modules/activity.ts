import { Address, Bytes, ethereum, BigInt } from '@graphprotocol/graph-ts';
import { Transfer } from '../../generated/templates/Collection/Collection';
import { TransferSingle } from '../../generated/templates/EndemicERC1155/EndemicERC1155';
import { Activity, Nft, Auction, Offer } from '../../generated/schema';
import { isMintEvent, isBurnEvent, createNftId } from './nft';
import {
  PrivateSaleSuccess,
  ReserveBidPlaced,
} from '../../generated/EndemicExchange/EndemicExchange';
import { NULL_ADDRESS } from '../utils/constants';

function getTransferActivityType(from: Address, to: Address): string {
  if (isMintEvent(from)) {
    return 'mint';
  } else if (isBurnEvent(to)) {
    return 'burn';
  } else {
    return 'transfer';
  }
}

export function createAuctionActivity(
  auction: Auction,
  nft: Nft,
  type: string,
  totalFee: BigInt,
  event: ethereum.Event
): void {
  let id = 'auction/' + event.transaction.hash.toHex() + event.logIndex.toHex();
  let activity = new Activity(id);
  activity.from = auction.seller;
  activity.to = null;
  activity.type = type;
  activity.fee = totalFee;

  activity.auctionStartingPrice = auction.startingPrice;
  activity.price = auction.startingPrice;
  activity.totalPrice = auction.totalPrice;
  activity.paymentErc20TokenAddress = auction.paymentErc20TokenAddress;
  activity.createdAt = event.block.timestamp;

  activity.nft = nft.id;
  activity.nftId = nft.id;
  activity.nftContract = nft.contractId.toHexString();
  activity.nftContractId = nft.contractId.toHexString();

  activity.transactionHash = event.transaction.hash;

  if (type == 'auctionCreate' || type == 'auctionCancel') {
    activity.initiator = auction.seller;
  } else if (type == 'auctionSuccess') {
    activity.to = auction.buyer!.toHexString();
    activity.initiator = auction.buyer!.toHexString();
  }

  activity.save();
}

export function createOfferActivity(
  offer: Offer,
  nftId: string | null,
  nftContractId: string | null,
  totalFee: BigInt,
  type: string,
  actor: Bytes,
  event: ethereum.Event
): void {
  let id = 'offer/' + event.transaction.hash.toHex() + event.logIndex.toHex();
  let activity = new Activity(id);
  activity.type = type;
  activity.from = null;
  activity.to = offer.bidder;
  activity.fee = totalFee;
  activity.price = offer.price;
  activity.totalPrice = offer.price.plus(totalFee);
  activity.createdAt = event.block.timestamp;
  activity.transactionHash = event.transaction.hash;
  activity.initiator = actor.toHexString();
  activity.paymentErc20TokenAddress = offer.paymentErc20TokenAddress;
  activity.nft = nftId;
  activity.nftId = nftId;
  activity.nftContract = nftContractId;
  activity.nftContractId = nftContractId;

  if (type == 'offerAccept') {
    activity.from = actor.toHexString();
  }

  activity.save();
}

export function createERC721TransferActivity(nft: Nft, event: Transfer): void {
  let id =
    'transfer/' + event.transaction.hash.toHex() + event.logIndex.toHex();
  let activity = new Activity(id);

  activity.type = getTransferActivityType(event.params.from, event.params.to);
  activity.from = event.params.from.toHexString();
  activity.to = event.params.to.toHexString();
  activity.createdAt = event.block.timestamp;
  activity.transactionHash = event.transaction.hash;
  activity.nft = nft.id;
  activity.nftId = nft.id;
  activity.nftContract = nft.contractId.toHexString();
  activity.nftContractId = nft.contractId.toHexString();

  if (activity.type == 'mint') {
    activity.initiator = activity.to!;
  } else if (activity.type == 'burn' || activity.type == 'transfer') {
    activity.initiator = activity.from!;
  }

  activity.save();
}

export function createERC1155TransferActivity(
  nft: Nft,
  event: TransferSingle
): void {
  let id =
    'transfer/' + event.transaction.hash.toHex() + event.logIndex.toHex();
  let activity = new Activity(id);
  activity.type = getTransferActivityType(event.params.from, event.params.to);
  activity.from = event.params.from.toHexString();
  activity.to = event.params.to.toHexString();
  activity.createdAt = event.block.timestamp;
  activity.transactionHash = event.transaction.from;
  activity.nft = nft.id;
  activity.nftId = nft.id;
  activity.nftContract = nft.contractId.toHexString();
  activity.nftContractId = nft.contractId.toHexString();

  if (activity.type == 'mint') {
    activity.initiator = activity.to!;
  } else if (activity.type == 'burn' || activity.type == 'transfer') {
    activity.initiator = activity.from!;
  }

  activity.save();
}

export function createPrivateSaleActivity(event: PrivateSaleSuccess): void {
  let id = 'auction/' + event.transaction.hash.toHex() + event.logIndex.toHex();
  let activity = new Activity(id);

  let buyerAddress = event.params.buyer.toHexString();

  let nftId = createNftId(
    event.params.nftContract.toHexString(),
    event.params.tokenId.toString()
  );

  activity.type = 'auctionSuccess';
  activity.nft = nftId;
  activity.nftContract = event.params.nftContract.toHexString();
  activity.from = event.params.seller.toHexString();
  activity.to = buyerAddress;
  activity.price = event.params.price;
  activity.fee = event.params.totalFees;
  activity.totalPrice = event.params.price.plus(event.params.totalFees);
  activity.initiator = buyerAddress;
  activity.createdAt = event.block.timestamp;
  activity.transactionHash = event.transaction.hash;
  activity.paymentErc20TokenAddress = event.params.paymentErc20TokenAddress;
  activity.nftId = nftId;
  activity.nftContractId = event.params.nftContract.toHexString();

  activity.save();
}

export function createReserveBidPlacedActivity(
  nftId: string,
  event: ReserveBidPlaced
): void {
  let id = 'reserve/' + event.transaction.hash.toHex() + event.logIndex.toHex();

  let activity = new Activity(id);

  const bidder = event.params.bidder.toHexString();

  activity.type = 'reserveBid';
  activity.nft = nftId;
  activity.nftId = nftId;
  activity.from = bidder;
  activity.to = null;
  activity.price = event.params.reservePrice;
  activity.initiator = bidder;
  activity.createdAt = event.block.timestamp;
  activity.transactionHash = event.transaction.hash;
  activity.paymentErc20TokenAddress = NULL_ADDRESS;

  activity.save();
}
