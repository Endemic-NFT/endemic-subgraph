import { log, store } from '@graphprotocol/graph-ts';
import { BidAccepted, BidCancelled, BidCreated } from '../../generated/Bid/Bid';
import { Bid, NFT } from '../../generated/schema';
import { getNFTId } from '../modules/nft';
import { createBidActivity } from '../modules/activity';
import { updateStatsForBidAccepted } from '../modules/stats';
import { createAccount } from '../modules/account';

export function handleBidCreated(event: BidCreated): void {
  let nftId = getNFTId(
    event.params.nftContract.toHexString(),
    event.params.tokenId.toString()
  );

  let bidId = event.params.id.toHexString();
  let bid = new Bid(bidId);

  let nft = NFT.load(nftId);
  if (nft == null) {
    log.info('NFT not found {} for bid {}', [nftId, bidId]);
    return;
  }

  bid.nft = nftId;
  bid.bidder = event.params.bidder;
  bid.price = event.params.price;
  bid.expiresAt = event.params.expiresAt;
  bid.createdAt = event.block.timestamp;

  bid.save();

  createAccount(event.params.bidder);
  createBidActivity(bid, nft, 'bidCreate', bid.bidder, event);
}

export function handleBidAccepted(event: BidAccepted): void {
  let bidId = event.params.id.toHexString();

  let bid = Bid.load(bidId);
  if (bid == null) {
    log.info('Bid not found {}', [bidId]);
    return;
  }

  let nft = NFT.load(bid.nft);
  if (nft == null) {
    log.info('NFT not found {} for bid {}', [nft!.id, bidId]);
    return;
  }

  store.remove('Bid', bid.id);
  updateStatsForBidAccepted(
    nft,
    event.params.bidder,
    event.params.seller,
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

  let nft = NFT.load(bid.nft);
  if (nft == null) {
    log.info('NFT not found {} for bid {}', [nft!.id, bidId]);
    return;
  }

  store.remove('Bid', bid.id);
  createBidActivity(bid, nft, 'bidCancel', event.params.bidder, event);
}
