import { Transfer } from '../../generated/templates/EndemicNFT/EndemicNFT';
import { TransferSingle } from '../../generated/templates/EndemicERC1155/EndemicERC1155';
import { Activity, NFT, Auction } from '../../generated/schema';
import { isMintEvent, isBurnEvent } from './nft';
import { Address, ethereum } from '@graphprotocol/graph-ts';

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
  nft: NFT,
  type: string,
  event: ethereum.Event
): void {
  let id = 'auction/' + event.transaction.hash.toHex() + event.logIndex.toHex();
  let activity = new Activity(id);
  activity.auctionTotalPrice = auction.totalPrice;
  activity.auctionStartingPrice = auction.startingPrice;
  activity.auctionSeller = auction.seller;
  activity.auctionBuyer = auction.buyer;
  activity.type = type;
  activity.createdAt = event.block.timestamp;
  activity.nft = nft.id;
  activity.transactionHash = event.transaction.hash;

  if (type == 'auctionSuccess' || type == 'auctionCancel') {
    activity.from = auction.seller;
  } else if (type == 'auctionSuccess') {
    activity.from = auction.buyer!;
  }

  activity.save();
}

export function createERC721TransferActivity(nft: NFT, event: Transfer): void {
  let id =
    'transfer/' + event.transaction.hash.toHex() + event.logIndex.toHex();
  let activity = new Activity(id);
  activity.nft = nft.id;
  activity.type = getTransferActivityType(event.params.from, event.params.to);
  activity.transferFrom = event.params.from;
  activity.transferTo = event.params.to;
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
  nft: NFT,
  event: TransferSingle
): void {
  let id =
    'transfer/' + event.transaction.hash.toHex() + event.logIndex.toHex();
  let activity = new Activity(id);
  activity.nft = nft.id;
  activity.type = getTransferActivityType(event.params.from, event.params.to);
  activity.transferFrom = event.params.from;
  activity.transferTo = event.params.to;
  activity.createdAt = event.block.timestamp;
  activity.transactionHash = event.transaction.from;

  if (activity.type == 'mint') {
    activity.from = activity.transferTo!;
  } else if (activity.type == 'burn' || activity.type == 'transfer') {
    activity.from = activity.transferFrom!;
  }

  activity.save();
}
