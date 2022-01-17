import { Address, BigInt, Bytes } from '@graphprotocol/graph-ts';
import * as userStats from './userStats';
import * as collectionStats from './collectionStats';
import { Auction, NFT } from '../../generated/schema';
import { isBurnEvent } from './nft';

export function updateStatsForAuctionCreate(
  auction: Auction,
  contractAddress: Bytes
): void {
  userStats.updateStatsForAuctionCreate(auction.seller, auction.tokenAmount);

  collectionStats.updateStatsForAuctionCreate(
    contractAddress,
    auction.tokenAmount
  );
}

export function updateStatsForAuctionCancel(nft: NFT, auction: Auction): void {
  collectionStats.updateStatsForAuctionCancel(
    nft.contractId,
    auction.tokenAmount
  );

  userStats.updateStatsForAuctionCancel(auction.seller, auction.tokenAmount);
}

export function updateStatsForAuctionCompleted(
  blockTimestamp: BigInt,
  auction: Auction,
  nft: NFT,
  tokenAmount: BigInt
): void {
  collectionStats.updateStatsForAuctionCompleted(
    blockTimestamp,
    nft.contractId,
    auction.totalPrice!,
    tokenAmount
  );

  userStats.updateStatsForAuctionCompleted(
    blockTimestamp,
    auction.buyer!,
    auction.seller,
    auction.totalPrice!,
    tokenAmount
  );
}

export function updateStatsForTransfer(
  nft: NFT,
  from: Address,
  to: Address,
  tokenAmount: BigInt
): void {
  collectionStats.updateStatsForTransfer(nft.contractId, from, to, tokenAmount);

  userStats.updateStatsForTransfer(from, to, tokenAmount);

  if (isBurnEvent(to) && nft.artistId !== null) {
    userStats.updateCreatedStatsForBurn(
      nft.artistId!.toHexString(),
      BigInt.fromI32(1)
    );
  }
}

export function updateStatsForBidAccepted(
  blockTimestamp: BigInt,
  nft: NFT,
  bidder: Bytes,
  seller: Bytes,
  price: BigInt
): void {
  collectionStats.updateStatsForBidAccepted(
    blockTimestamp,
    nft.contractId,
    price
  );

  userStats.updateStatsForBidAccepted(blockTimestamp, bidder, seller, price);
}
