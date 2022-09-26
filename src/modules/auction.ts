import { Address, BigInt, store } from '@graphprotocol/graph-ts';
import { Auction, Nft } from '../../generated/schema';
import { EndemicExchange } from '../../generated/EndemicExchange/EndemicExchange';
import * as addresses from '../utils/addresses';
import { handleAuctionCompletedForNFT } from './nft';
import * as userData from './userData';
import * as collectionData from './collectionData';
import { getOrCreateNftOwnership } from './ownership';

export function removeActiveAuction(
  nft: Nft,
  seller: Address,
  amount: BigInt
): Nft {
  let exchange = EndemicExchange.bind(
    Address.fromString(addresses.getEndemicExchangeAddress())
  );

  let auctionId = exchange.try_createAuctionId(
    Address.fromString(nft.contractId.toHexString()),
    nft.tokenId,
    seller
  );
  if (auctionId.reverted) {
    return nft;
  }

  let auctionIdValue = auctionId.value.toHexString();
  let auction = Auction.load(auctionIdValue);
  if (auction == null) return nft;

  auction.tokenAmount = auction.tokenAmount.minus(amount);
  let auctionSeller = auction.seller;
  let auctionEndingPrice = auction.endingPrice;

  nft = handleAuctionCompletedForNFT(nft, auctionIdValue);

  if (auction.tokenAmount <= BigInt.fromI32(0)) {
    store.remove('Auction', auctionIdValue);
    let nftOwnership = getOrCreateNftOwnership(nft, auctionSeller);
    nftOwnership.nftIsOnSale = false;
    nftOwnership.nftPrice = nft.price;
    nftOwnership.nftListedAt = nft.listedAt;
    nftOwnership.save();
  } else {
    auction.save();
  }

  userData.updateHistoricDataForAuctionCancel(auctionSeller, amount);
  collectionData.updateHistoricDataForAuctionCancel(
    nft.contractId,
    auctionEndingPrice,
    amount
  );

  return nft;
}
