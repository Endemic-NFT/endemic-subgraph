import { BigInt, Address } from '@graphprotocol/graph-ts';
import { CollectionAdded } from '../../generated/ContractImporter/ContractImporter';
import { EndemicNFT } from '../../generated/templates';
import { EndemicNFT as EndemicNFTTemplate } from '../../generated/templates/EndemicNFT/EndemicNFT';
import { NFT, NFTContract } from '../../generated/schema';
import { toLowerCase } from '../utils/string';
import { log } from '@graphprotocol/graph-ts';
import { getNFTId, updateTokenMetadataFromIPFS } from '../modules/nft';
import * as addresses from '../data/addresses';
import { updateStatsForTransfer } from '../modules/stats';
import { updateERC721Ownership } from '../modules/ownership';

export function handleCollectionAdded(event: CollectionAdded): void {
  let nftContract = NFTContract.load(event.params.contractAddress.toHex());
  if (nftContract) {
    log.warning('NFT contract already indexed {}', [
      event.params.contractAddress.toHex(),
    ]);
    return;
  }
  let erc721 = EndemicNFTTemplate.bind(event.params.contractAddress);

  let name = erc721.try_name();
  if (name.reverted) {
    log.warning('Invalid ERC721 {} - name error', [
      event.params.contractAddress.toHex(),
    ]);
    return;
  }

  let symbol = erc721.try_symbol();
  if (symbol.reverted) {
    log.warning('Invalid ERC721 {} - symbol error', [
      event.params.contractAddress.toHex(),
    ]);
    return;
  }

  nftContract = new NFTContract(event.params.contractAddress.toHex());

  nftContract.name = name.value;
  nftContract.symbol = symbol.value;
  nftContract.category = event.params.category;
  nftContract.createdAt = event.block.timestamp;
  nftContract.searchText = toLowerCase(nftContract.name);
  nftContract.save();

  EndemicNFT.create(event.params.contractAddress);

  let owner = erc721.try_owner();
  if (owner.reverted) {
    log.warning('Invalid ERC721 {} - owner error', [
      event.params.contractAddress.toHex(),
    ]);
    return;
  }

  let totalSupply = erc721.try_totalSupply();
  if (totalSupply.reverted) {
    log.warning('Invalid ERC721 {} - total supply error', [
      event.params.contractAddress.toHex(),
    ]);
    return;
  }

  for (
    let tokenIndex = BigInt.fromI32(0);
    tokenIndex < totalSupply.value;
    tokenIndex = tokenIndex.plus(BigInt.fromI32(1))
  ) {
    let tokenId = erc721.try_tokenByIndex(tokenIndex);
    if (tokenId.reverted) {
      log.warning('Invalid ERC721 {} - token by index {}', [
        event.params.contractAddress.toHex(),
        tokenIndex.toString(),
      ]);
      return;
    }

    let tokenOwner = erc721.try_ownerOf(tokenId.value);
    if (tokenOwner.reverted) {
      log.warning('Invalid ERC721 {} - owner {}', [
        event.params.contractAddress.toHex(),
        tokenId.value.toString(),
      ]);
      return;
    }

    if (tokenOwner.value.toHexString() == addresses.Null) {
      continue;
    }

    let tokenURI = erc721.try_tokenURI(tokenId.value);

    let id = getNFTId(
      event.params.contractAddress.toHexString(),
      tokenId.value.toString()
    );

    let nft = new NFT(id);
    nft.auctionIds = [];
    nft.type = 'ERC-721';
    nft.tokenId = tokenId.value;
    nft.contract = event.params.contractAddress.toHexString();
    nft.updatedAt = event.block.timestamp;
    nft.price = BigInt.fromI32(0);
    nft.burned = false;
    nft.isOnSale = false;
    nft.createdAt = event.block.timestamp;
    nft.category = nftContract.category;
    nft.contractId = event.params.contractAddress;
    nft.contractName = nftContract.name;
    nft.tokenURI = tokenURI.value;
    nft.supply = BigInt.fromI32(1);
    nft = updateTokenMetadataFromIPFS(nft);
    if (nft.name !== null) {
      nft.searchText = toLowerCase(nft.name!);
    }

    nft.save();

    updateStatsForTransfer(
      nft,
      Address.fromString(addresses.Null),
      tokenOwner.value,
      BigInt.fromI32(1)
    );

    updateERC721Ownership(
      nft,
      Address.fromString(addresses.Null),
      tokenOwner.value
    );
  }
}
