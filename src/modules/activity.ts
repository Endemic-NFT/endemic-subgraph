import { Address, Bytes, ethereum, BigInt } from '@graphprotocol/graph-ts';
import { Transfer } from '../../generated/templates/EndemicNFT/EndemicNFT';
import { TransferSingle } from '../../generated/templates/EndemicERC1155/EndemicERC1155';
import { Activity, Nft, Auction, Bid } from '../../generated/schema';
import { isMintEvent, isBurnEvent } from './nft';

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
  activity.auctionTotalPrice = auction.totalPrice;
  activity.auctionStartingPrice = auction.startingPrice;
  activity.auctionSeller = auction.seller;
  activity.auctionBuyer = null;
  activity.type = type;
  activity.createdAt = event.block.timestamp;
  activity.nft = nft.id;
  activity.transactionHash = event.transaction.hash;
  activity.auctionFee = totalFee;

  if (type == 'auctionCreate' || type == 'auctionCancel') {
    activity.from = auction.seller;
  } else if (type == 'auctionSuccess') {
    activity.auctionBuyer = auction.buyer!.toHexString();
    activity.from = auction.buyer!.toHexString();
  }

  activity.save();
}

export function createBidActivity(
  bid: Bid,
  nftId: string | null,
  nftContractId: string | null,
  type: string,
  actor: Bytes,
  event: ethereum.Event
): void {
  let id = 'bid/' + event.transaction.hash.toHex() + event.logIndex.toHex();
  let activity = new Activity(id);
  activity.type = type;
  activity.bidBidder = bid.bidder;
  activity.bidPrice = bid.price;
  activity.createdAt = event.block.timestamp;
  activity.nft = nftId;
  activity.nftContract = nftContractId;
  activity.transactionHash = event.transaction.hash;
  activity.from = actor.toHexString();

  activity.save();
}

export function createERC721TransferActivity(nft: Nft, event: Transfer): void {
  let id =
    'transfer/' + event.transaction.hash.toHex() + event.logIndex.toHex();
  let activity = new Activity(id);
  activity.nft = nft.id;
  activity.type = getTransferActivityType(event.params.from, event.params.to);
  activity.transferFrom = event.params.from.toHexString();
  activity.transferTo = event.params.to.toHexString();
  activity.createdAt = event.block.timestamp;
  activity.transactionHash = event.transaction.hash;

  if (activity.type == 'mint') {
    activity.from = activity.transferTo!;
  } else if (activity.type == 'burn' || activity.type == 'transfer') {
    activity.from = activity.transferFrom!;
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
  activity.nft = nft.id;
  activity.type = getTransferActivityType(event.params.from, event.params.to);
  activity.transferFrom = event.params.from.toHexString();
  activity.transferTo = event.params.to.toHexString();
  activity.createdAt = event.block.timestamp;
  activity.transactionHash = event.transaction.from;

  if (activity.type == 'mint') {
    activity.from = activity.transferTo!;
  } else if (activity.type == 'burn' || activity.type == 'transfer') {
    activity.from = activity.transferFrom!;
  }

  activity.save();
}
