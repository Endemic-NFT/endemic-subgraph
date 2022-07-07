//** This file is used to index previous offers contract data on Aurora **/
//** Contract is no longer is use**/

import { log, store } from '@graphprotocol/graph-ts';
import {
  OfferAccepted,
  OfferCancelled,
  OfferCreated,
} from '../../../generated/Offer/Offer';
import { Offer, Nft } from '../../../generated/schema';
import { createNftId } from '../../modules/nft';
import { createOfferActivity } from '../../modules/activity';
import * as userData from '../../modules/userData';
import * as collectionData from '../../modules/collectionData';
import { createAccount } from '../../modules/account';
import { NULL_ADDRESS, ZERO_BI } from '../../utils/constants';

export function handleOfferCreated(event: OfferCreated): void {
  let nftId = createNftId(
    event.params.nftContract.toHexString(),
    event.params.tokenId.toString()
  );

  let offerId = event.params.id.toString();
  let offer = new Offer(offerId);

  let nft = Nft.load(nftId);
  if (nft == null) {
    log.info('NFT not found {} for offer {}', [nftId, offerId]);
    return;
  }

  offer.nft = nftId;
  offer.bidder = event.params.bidder.toHexString();
  offer.price = event.params.price;
  offer.expiresAt = event.params.expiresAt;
  offer.createdAt = event.block.timestamp;
  offer.isCollectionOffer = false;
  offer.paymentErc20TokenAddress = NULL_ADDRESS;

  offer.save();

  createAccount(event.params.bidder);
  createOfferActivity(
    offer,
    nft.id,
    nft.contractId.toHexString(),
    ZERO_BI,
    'offerCreate',
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
  if (nft == null) {
    log.info('NFT not found {} for offer {}', [nft!.id, offerId]);
    return;
  }

  store.remove('Offer', offer.id);

  userData.updateHistoricDataForOfferAccepted(
    event.params.bidder.toHexString(),
    event.params.seller.toHexString(),
    event.params.price
  );
  userData.updateHourDataForSaleCompleted(
    event.block.timestamp,
    event.params.price,
    event.params.bidder.toHexString(),
    event.params.seller.toHexString()
  );

  collectionData.updateHistoricDataForOfferAccepted(
    nft.contractId,
    event.params.price
  );
  collectionData.updateHourData(
    event.block.timestamp,
    nft.contractId,
    event.params.price
  );

  createOfferActivity(
    offer,
    nft.id,
    nft.contractId.toHexString(),
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

  let nft = Nft.load(offer.nft!);
  if (nft == null) {
    log.info('NFT not found {} for offer {}', [nft!.id, offerId]);
    return;
  }

  store.remove('Offer', offer.id);

  createOfferActivity(
    offer,
    nft.id,
    nft.contractId.toHexString(),
    ZERO_BI,
    'offerCancel',
    event.params.bidder,
    event
  );
}
