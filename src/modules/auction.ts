import { Address, BigInt, store } from '@graphprotocol/graph-ts';
import { Auction, Nft } from '../../generated/schema';
import { Marketplace } from '../../generated/Marketplace/Marketplace';
import * as addresses from '../utils/addresses';
import { handleAuctionCompletedForNFT } from './nft';
import * as userData from './userData';
import * as collectionData from './collectionData';

export function removeActiveAuction(
  nft: Nft,
  seller: Address,
  amount: BigInt
): void {
  let marketplace = Marketplace.bind(
    Address.fromString(addresses.getEndemicMarketplaceAddress())
  );

  let auctionId = marketplace.try_createAuctionId(
    Address.fromString(nft.contractId.toHexString()),
    nft.tokenId,
    seller
  );
  if (auctionId.reverted) {
    return;
  }

  let auctionIdValue = auctionId.value.toHexString();
  let auction = Auction.load(auctionIdValue);
  if (auction == null) return;

  auction.tokenAmount = auction.tokenAmount.minus(amount);
  if (auction.tokenAmount <= BigInt.fromI32(0)) {
    store.remove('Auction', auctionIdValue);
  } else {
    auction.save();
  }

  userData.updateHistoricDataForAuctionCancel(auction.seller, amount);
  collectionData.updateHistoricDataForAuctionCancel(nft.contractId, amount);

  handleAuctionCompletedForNFT(nft, auctionIdValue);
}
