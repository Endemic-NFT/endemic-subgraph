import { log, ipfs, json, BigInt, Address } from '@graphprotocol/graph-ts';
import { Auction, NFT } from '../../generated/schema';
import { EndemicNFT } from '../../generated/templates/EndemicNFT/EndemicNFT';
import { EndemicERC1155 } from '../../generated/templates/EndemicERC1155/EndemicERC1155';
import * as addresses from '../data/addresses';
import { Metadata } from './models';
import { filter } from '../utils/array';

export function isMarketplaceAddress(address: String): boolean {
  return address.toLowerCase() == addresses.EndemicMarketplace.toLowerCase();
}

export function isMintEvent(from: Address): boolean {
  return from.toHexString() == addresses.Null;
}

export function isBurnEvent(to: Address): boolean {
  return to.toHexString() == addresses.Null;
}

export function isTransferEvent(from: Address, to: Address): boolean {
  return (
    from.toHexString() != addresses.Null && to.toHexString() != addresses.Null
  );
}

export function getNFTId(contractAddress: string, tokenId: string): string {
  return contractAddress + '-' + tokenId;
}

export function getERC721TokenURI(address: Address, tokenId: BigInt): string {
  let erc721 = EndemicNFT.bind(address);
  let tokenURICallResult = erc721.try_tokenURI(tokenId);

  let tokenURI = '';

  if (tokenURICallResult.reverted) {
    log.warning('tokenURI reverted for tokenID: {} contract: {}', [
      tokenId.toString(),
      address.toHexString(),
    ]);
  } else {
    tokenURI = tokenURICallResult.value;
  }

  return tokenURI;
}

export function getERC1155TokenURI(address: Address, tokenId: BigInt): string {
  let erc1155 = EndemicERC1155.bind(address);
  let tokenURICallResult = erc1155.try_uri(tokenId);

  let tokenURI = '';

  if (tokenURICallResult.reverted) {
    log.warning('tokenURI reverted for tokenID: {} contract: {}', [
      tokenId.toString(),
      address.toHexString(),
    ]);
  } else {
    tokenURI = tokenURICallResult.value;
  }

  return tokenURI;
}

export function readTokenMetadataFromIPFS(tokenURI: string): Metadata | null {
  if (!tokenURI) return null;

  let uriParts = tokenURI.split('/');
  if (!uriParts.length) return null;

  uriParts.splice(0, 2);
  let ipfsHash = uriParts.join('/');
  let bytes = ipfs.cat(ipfsHash);
  if (bytes !== null) {
    let data = json.fromBytes(bytes);
    if (data === null) {
      return null;
    }
    let metaData = data.toObject();
    if (metaData === null) {
      return null;
    }

    const image = metaData.get('image');
    const name = metaData.get('name');
    const description = metaData.get('description');

    return {
      image: image ? image.toString() : null,
      name: name ? name.toString() : null,
      description: description ? description.toString() : null,
    };
  }

  return null;
}

export function handleAuctionCreatedForNFT(nft: NFT, auction: Auction): void {
  let auctionIds = nft.auctionIds;
  auctionIds.push(auction.id.toString());

  nft.auctionIds = auctionIds;
  nft.isOnSale = true;

  if (nft.type == 'ERC-1155') {
    if (nft.price === null || nft.price > auction.startingPrice) {
      nft.price = auction.startingPrice;
    }
  } else {
    // we only support immutable price for now. Starting and ending prices will always be the same in the contract
    nft.price = auction.startingPrice;
  }
}

export function handleAuctionCompletedForNFT(
  nft: NFT,
  auctionId: string
): void {
  nft.auctionIds = filter(nft.auctionIds, auctionId);

  if (nft.type == 'ERC-1155') {
    let hasOtherAuctions = nft.auctionIds.length > 0;
    if (hasOtherAuctions) {
      let lowestPrice = BigInt.fromI32(2).pow(255 as u8);
      for (let i = 0; i < nft.auctionIds.length; i++) {
        let otherAuction = Auction.load(nft.auctionIds[i])!;
        if (lowestPrice.gt(otherAuction.startingPrice)) {
          lowestPrice = otherAuction.startingPrice;
        }
      }
      nft.price = lowestPrice;
    } else {
      nft.isOnSale = false;
      nft.price = BigInt.fromI32(0);
    }
  } else {
    nft.isOnSale = false;
    nft.price = BigInt.fromI32(0);
  }
}
