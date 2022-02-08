import { log, store } from '@graphprotocol/graph-ts';
import { BidAccepted, BidCancelled, BidCreated } from '../../generated/Bid/Bid';
import { Bid, Nft } from '../../generated/schema';
import { createNftId } from '../modules/nft';
import { createBidActivity } from '../modules/activity';
import * as userData from '../modules/userData';
import * as collectionData from '../modules/collectionData';
import { createAccount } from '../modules/account';

export function handleBidCreated(event: BidCreated): void {
  let nftId = createNftId(
    event.params.nftContract.toHexString(),
    event.params.tokenId.toString()
  );

  let bidId = event.params.id.toHexString();
  let bid = new Bid(bidId);

  let nft = Nft.load(nftId);
  if (nft == null) {
    log.info('NFT not found {} for bid {}', [nftId, bidId]);
    return;
  }

  bid.nft = nftId;
  bid.bidder = event.params.bidder.toHexString();
  bid.price = event.params.price;
  bid.expiresAt = event.params.expiresAt;
  bid.createdAt = event.block.timestamp;

  bid.save();

  createAccount(event.params.bidder);
  createBidActivity(bid, nft, 'bidCreate', event.params.bidder, event);
}

export function handleBidAccepted(event: BidAccepted): void {
  let bidId = event.params.id.toHexString();

  let bid = Bid.load(bidId);
  if (bid == null) {
    log.info('Bid not found {}', [bidId]);
    return;
  }

  let nft = Nft.load(bid.nft);
  if (nft == null) {
    log.info('NFT not found {} for bid {}', [nft!.id, bidId]);
    return;
  }

  store.remove('Bid', bid.id);

  userData.updateHistoricDataForBidAccepted(
    event.params.bidder.toHexString(),
    event.params.seller.toHexString(),
    event.params.price
  );
  userData.updateDayDataForSaleCompleted(
    event.block.timestamp,
    event.params.price,
    event.params.bidder.toHexString(),
    event.params.seller.toHexString()
  );

  collectionData.updateHistoricDataForBidAccepted(
    nft.contractId,
    event.params.price
  );
  collectionData.updateDayData(
    event.block.timestamp,
    nft.contractId,
    event.params.price
  );

  createBidActivity(bid, nft, 'bidAccept', event.params.seller, event);
}

export function handleBidCanceled(event: BidCancelled): void {
  let bidId = event.params.id.toHexString();

  let bid = Bid.load(bidId);
  if (bid == null) {
    log.info('Bid not found {}', [bidId]);
    return;
  }

  let nft = Nft.load(bid.nft);
  if (nft == null) {
    log.info('NFT not found {} for bid {}', [nft!.id, bidId]);
    return;
  }

  store.remove('Bid', bid.id);

  createBidActivity(bid, nft, 'bidCancel', event.params.bidder, event);
}
