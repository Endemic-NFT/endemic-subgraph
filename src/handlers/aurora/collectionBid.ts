// import { log, store } from '@graphprotocol/graph-ts';
// import {
//   BidAccepted,
//   BidCancelled,
//   BidCreated,
// } from '../../../generated/CollectionBid/CollectionBid';
// import { Offer, Nft, NftContract } from '../../../generated/schema';
// import { createOfferActivity } from '../../modules/activity';
// import * as userData from '../../modules/userData';
// import * as collectionData from '../../modules/collectionData';
// import { createAccount } from '../../modules/account';

// export function handleBidCreated(event: BidCreated): void {
//   let bidId = event.params.id.toHexString();
//   let bid = new Offer(bidId);

//   let nftContract = NftContract.load(event.params.nftContract.toHexString());
//   if (nftContract == null) {
//     log.info('NFT contract not found {} for bid {}', [
//       event.params.nftContract.toHexString(),
//       bidId,
//     ]);
//     return;
//   }

//   bid.nftContract = event.params.nftContract.toHexString();
//   bid.bidder = event.params.bidder.toHexString();
//   bid.price = event.params.price;
//   bid.expiresAt = event.params.expiresAt;
//   bid.createdAt = event.block.timestamp;
//   bid.isCollectionOffer = true;

//   bid.save();

//   createAccount(event.params.bidder);
//   createOfferActivity(
//     bid,
//     null,
//     event.params.nftContract.toHexString(),
//     'offerCreate',
//     event.params.bidder,
//     event
//   );
// }

// export function handleBidAccepted(event: BidAccepted): void {
//   let bidId = event.params.id.toHexString();

//   let bid = Bid.load(bidId);
//   if (bid == null) {
//     log.info('Bid not found {}', [bidId]);
//     return;
//   }

//   let nftContract = NftContract.load(event.params.nftContract.toHexString());
//   if (nftContract == null) {
//     log.info('NFT contract not found {} for bid {}', [
//       event.params.nftContract.toHexString(),
//       bidId,
//     ]);
//     return;
//   }

//   store.remove('Bid', bid.id);

//   userData.updateHistoricDataForBidAccepted(
//     event.params.bidder.toHexString(),
//     event.params.seller.toHexString(),
//     event.params.price
//   );
//   userData.updateDayDataForSaleCompleted(
//     event.block.timestamp,
//     event.params.price,
//     event.params.bidder.toHexString(),
//     event.params.seller.toHexString()
//   );

//   collectionData.updateHistoricDataForBidAccepted(
//     event.params.nftContract,
//     event.params.price
//   );
//   collectionData.updateDayData(
//     event.block.timestamp,
//     event.params.nftContract,
//     event.params.price
//   );

//   createBidActivity(
//     bid,
//     null,
//     event.params.nftContract.toHexString(),
//     'bidAccept',
//     event.params.seller,
//     event
//   );
// }

// export function handleBidCanceled(event: BidCancelled): void {
//   let bidId = event.params.id.toHexString();

//   let bid = Bid.load(bidId);
//   if (bid == null) {
//     log.info('Bid not found {}', [bidId]);
//     return;
//   }

//   let nftContract = NftContract.load(event.params.nftContract.toHexString());
//   if (nftContract == null) {
//     log.info('NFT contract not found {} for bid {}', [
//       event.params.nftContract.toHexString(),
//       bidId,
//     ]);
//     return;
//   }

//   store.remove('Bid', bid.id);

//   createBidActivity(
//     bid,
//     null,
//     event.params.nftContract.toHexString(),
//     'offerCancel',
//     event.params.bidder,
//     event
//   );
// }
