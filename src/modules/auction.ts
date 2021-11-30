import { Address, BigInt, store } from '@graphprotocol/graph-ts';
import { Auction, NFT } from '../../generated/schema';
import { Marketplace } from '../../generated/Marketplace/Marketplace';
import * as addresses from '../data/addresses';
import { handleAuctionCompletedForNFT } from './nft';
import * as userStats from './userStats';
import * as collectionStats from './collectionStats';

export function removeActiveAuction(
  nft: NFT,
  seller: Address,
  amount: BigInt
): void {
  let marketplace = Marketplace.bind(
    Address.fromString(addresses.EndemicMarketplace)
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

  userStats.updateStatsForAuctionCancel(auction.seller.toHexString(), amount);
  collectionStats.updateStatsForAuctionCancel(
    nft.contractId.toHexString(),
    amount
  );

  handleAuctionCompletedForNFT(nft, auctionIdValue);
}
