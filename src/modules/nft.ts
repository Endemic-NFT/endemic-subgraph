import {
  log,
  ipfs,
  json,
  BigInt,
  Address,
  JSONValue,
} from '@graphprotocol/graph-ts';
import { Auction, Nft, NftAttribute } from '../../generated/schema';
import { Collection } from '../../generated/templates/Collection/Collection';
import { EndemicERC1155 } from '../../generated/templates/EndemicERC1155/EndemicERC1155';
import * as addresses from '../utils/addresses';
import { filter } from '../utils/array';
import { NULL_ADDRESS, ZERO_BI } from '../utils/constants';

export function isExchangeAddress(address: String): boolean {
  return (
    address.toLowerCase() == addresses.getEndemicExchangeAddress().toLowerCase()
  );
}

export function isMintEvent(from: Address): boolean {
  return from.toHexString() == NULL_ADDRESS.toHexString();
}

export function isBurnEvent(to: Address): boolean {
  return to.toHexString() == NULL_ADDRESS.toHexString();
}

export function isTransferEvent(from: Address, to: Address): boolean {
  return (
    from.toHexString() != NULL_ADDRESS.toHexString() &&
    to.toHexString() != NULL_ADDRESS.toHexString()
  );
}

export function createNftId(contractAddress: string, tokenId: string): string {
  return contractAddress + '-' + tokenId;
}

export function getERC721TokenURI(address: Address, tokenId: BigInt): string {
  let erc721 = Collection.bind(address);
  let tokenURICallResult = erc721.try_tokenURI(tokenId);

  let tokenURI = '';

  if (tokenURICallResult.reverted) {
    log.warning('ERC721 tokenURI reverted for tokenID: {} contract: {}', [
      tokenId.toString(),
      address.toHexString(),
    ]);
  } else {
    if (tokenURICallResult.value == null) {
      log.warning('ERC721 got NULL tokenURI for tokenID: {} contract: {}', [
        tokenId.toString(),
        address.toHexString(),
      ]);
    }
    tokenURI = tokenURICallResult.value;
  }

  return tokenURI;
}

export function getERC1155TokenURI(address: Address, tokenId: BigInt): string {
  let erc1155 = EndemicERC1155.bind(address);
  let tokenURICallResult = erc1155.try_uri(tokenId);

  let tokenURI = '';

  if (tokenURICallResult.reverted) {
    log.warning('ERC1155 tokenURI reverted for tokenID: {} contract: {}', [
      tokenId.toString(),
      address.toHexString(),
    ]);
  } else {
    tokenURI = tokenURICallResult.value;
  }

  return tokenURI;
}

export function updateTokenMetadataFromIPFS(nft: Nft): Nft {
  if (!nft.tokenURI) {
    log.warning('TokenURI not available: {}', [nft.id]);
    return nft;
  }

  let uriParts = nft.tokenURI!.split('/');
  if (!uriParts.length) return nft;

  uriParts.splice(0, 2);
  let ipfsHash = uriParts.join('/');
  let bytes = ipfs.cat(ipfsHash);
  if (bytes !== null) {
    let data = json.fromBytes(bytes);
    if (data === null) {
      log.warning('Metadata not available: {}', [nft.tokenURI!]);
      return nft;
    }
    let metaData = data.toObject();
    if (metaData === null) {
      log.warning('Metadata not available: {}', [nft.tokenURI!]);
      return nft;
    }

    const image = metaData.get('image');
    const thumbnail = metaData.get('thumbnail');
    const name = metaData.get('name');
    const description = metaData.get('description');

    let attributes: JSONValue[] = [];
    let atts = metaData.get('attributes');
    if (atts) {
      attributes = atts.toArray();
    }

    for (let i = 0; i < attributes.length; i++) {
      let item = attributes[i].toObject();
      let traitType: string = '';
      let t = item.get('trait_type');
      if (t) {
        traitType = t.toString();
      }
      let traitValue: string = '';
      let v = item.get('value');
      if (v) {
        traitValue = v.toString();
      }

      let attribute = new NftAttribute(nft.id + '-' + i.toString());
      attribute.nft = nft.id;
      attribute.contractId = nft.contractId;
      attribute.value = traitValue;
      attribute.type = traitType;
      attribute.save();
    }

    nft.image = image ? image.toString() : null;
    nft.thumbnail = thumbnail ? thumbnail.toString() : nft.image;
    nft.name = name ? name.toString() : null;
    nft.description = description ? description.toString() : null;
  } else {
    log.warning('Metadata not available: {}', [nft.tokenURI!]);
  }

  return nft;
}

export function handleAuctionCreatedForNFT(
  nft: Nft,
  auction: Auction,
  listedAt: BigInt
): Nft {
  let auctionIds = nft.auctionIds;
  auctionIds.push(auction.id.toString());

  nft.auctionIds = auctionIds;
  nft.isOnSale = true;
  nft.listedAt = listedAt;
  nft.paymentErc20TokenAddress = auction.paymentErc20TokenAddress;

  if (nft.type == 'ERC-1155') {
    if (nft.price === null || nft.price > auction.startingPrice) {
      nft.price = auction.startingPrice;
    }
  } else {
    // we only support immutable price for now. Starting and ending prices will always be the same in the contract
    nft.price = auction.startingPrice;
  }

  return nft;
}

export function handleAuctionCompletedForNFT(nft: Nft, auctionId: string): Nft {
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
      nft.listedAt = ZERO_BI;
      nft.price = ZERO_BI;
      nft.paymentErc20TokenAddress = null;
    }
  } else {
    nft.isOnSale = false;
    nft.listedAt = ZERO_BI;
    nft.price = ZERO_BI;
    nft.paymentErc20TokenAddress = null;
  }

  return nft;
}
