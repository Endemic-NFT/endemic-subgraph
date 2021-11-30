import { Address, BigInt } from '@graphprotocol/graph-ts';
import * as userStats from './userStats';
import * as collectionStats from './collectionStats';
import { Auction, NFT } from '../../generated/schema';
import { isBurnEvent } from './nft';

export function updateStatsForAuctionCreate(
  auction: Auction,
  contractAddress: string
): void {
  userStats.updateStatsForAuctionCreate(
    auction.seller.toHexString(),
    auction.tokenAmount
  );

  collectionStats.updateStatsForAuctionCreate(
    contractAddress,
    auction.tokenAmount
  );
}

export function updateStatsForAuctionCancel(nft: NFT, auction: Auction): void {
  collectionStats.updateStatsForAuctionCancel(
    nft.contractId.toHexString(),
    auction.tokenAmount
  );

  userStats.updateStatsForAuctionCancel(
    auction.seller.toHexString(),
    auction.tokenAmount
  );
}

export function updateStatsForAuctionCompleted(
  auction: Auction,
  nft: NFT,
  tokenAmount: BigInt
): void {
  collectionStats.updateStatsForAuctionCompleted(
    nft.contractId.toHexString(),
    auction.totalPrice!,
    tokenAmount
  );

  userStats.updateStatsForAuctionCompleted(
    auction.buyer!.toHexString(),
    auction.seller.toHexString(),
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
  collectionStats.updateStatsForTransfer(
    nft.contractId.toHexString(),
    from,
    to,
    tokenAmount
  );

  userStats.updateStatsForTransfer(from, to, tokenAmount);

  if (isBurnEvent(to) && nft.artistId !== null) {
    userStats.updateCreatedStatsForBurn(
      nft.artistId!.toHexString(),
      BigInt.fromI32(1)
    );
  }
}
