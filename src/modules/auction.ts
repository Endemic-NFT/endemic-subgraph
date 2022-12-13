import { Address, BigInt, log, store } from '@graphprotocol/graph-ts';
import { Auction, Nft } from '../../generated/schema';
import { EndemicExchange } from '../../generated/EndemicExchange/EndemicExchange';
import * as addresses from '../utils/addresses';
import { handleAuctionCompletedForNFT, isMintEvent } from './nft';
import * as userData from './userData';
import * as collectionData from './collectionData';

function getAuctionIdForAdress(
  nft: Nft,
  seller: Address,
  exchangeAddress: Address
): string | null {
  let exchange = EndemicExchange.bind(exchangeAddress);

  let auctionId = exchange.try_createAuctionId(
    Address.fromString(nft.contractId.toHexString()),
    nft.tokenId,
    seller
  );
  if (auctionId.reverted) {
    return null;
  }

  return auctionId.value.toHexString();
}

function getAuctionId(nft: Nft, seller: Address): string | null {
  let auctionId = getAuctionIdForAdress(
    nft,
    seller,
    Address.fromString(addresses.getLatestEndemicExchangeAddress())
  );
  if (auctionId != null) {
    return auctionId;
  }

  return getAuctionIdForAdress(
    nft,
    seller,
    Address.fromString(addresses.getLegacyEndemicExchangeAddress())
  );
}

export function removeActiveAuction(
  nft: Nft,
  seller: Address,
  amount: BigInt
): Nft {
  let auctionId = getAuctionId(nft, seller);
  if (auctionId == null) return nft;

  let auction = Auction.load(auctionId!);
  if (auction == null) return nft;

  auction.tokenAmount = auction.tokenAmount.minus(amount);
  let auctionEndingPrice = auction.endingPrice;

  nft = handleAuctionCompletedForNFT(nft, auctionId!);

  if (nft.type == 'ERC-721') {
    store.remove('Auction', auctionId!);
  } else {
    auction.save();
  }

  userData.updateHistoricDataForAuctionCancel(seller.toHexString(), amount);
  collectionData.updateHistoricDataForAuctionCancel(
    nft.contractId,
    auctionEndingPrice,
    amount
  );

  return nft;
}

export function removePossibleActiveAuction(
  transactionOrigin: Address | null,
  fromAccount: Address,
  nft: Nft,
  amount: BigInt
): Nft {
  let isOwnershipChangedWithoutTrade =
    transactionOrigin !== null &&
    !addresses.isExchangeAddress(transactionOrigin.toHexString()) &&
    !isMintEvent(fromAccount);

  if (isOwnershipChangedWithoutTrade) {
    nft = removeActiveAuction(nft, fromAccount, amount);
  }
  return nft;
}
