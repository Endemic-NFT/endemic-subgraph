import { CollectionAdded } from '../../generated/ContractImporter/ContractImporter';
import { Collection } from '../../generated/templates';
import { ERC721Enumerable } from '../../generated/ContractImporter/ERC721Enumerable';
import { Nft, NftContract } from '../../generated/schema';
import { toLowerCase } from '../utils/string';
import { log } from '@graphprotocol/graph-ts';
import { createNftId, updateTokenMetadataFromIPFS } from '../modules/nft';
import * as userData from '../modules/userData';
import * as collectionData from '../modules/collectionData';
import { updateERC721Ownership } from '../modules/ownership';
import { NULL_ADDRESS, ONE_BI, ZERO_BI } from '../utils/constants';
import { createAccount } from '../modules/account';

export function handleCollectionAdded(event: CollectionAdded): void {
  let nftContract = NftContract.load(event.params.contractAddress.toHex());
  if (nftContract) {
    log.warning('NFT contract already indexed {}', [
      event.params.contractAddress.toHex(),
    ]);
    return;
  }
  let erc721 = ERC721Enumerable.bind(event.params.contractAddress);

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

  nftContract = new NftContract(event.params.contractAddress.toHex());
  nftContract.name = name.value;
  nftContract.symbol = symbol.value;
  nftContract.category = event.params.category;
  nftContract.createdAt = event.block.timestamp;
  nftContract.searchText = toLowerCase(nftContract.name);
  nftContract.save();

  Collection.create(event.params.contractAddress);

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
    let tokenIndex = ZERO_BI;
    tokenIndex < totalSupply.value;
    tokenIndex = tokenIndex.plus(ONE_BI)
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

    if (tokenOwner.value.toHexString() == NULL_ADDRESS.toHexString()) {
      continue;
    }

    let tokenURI = erc721.try_tokenURI(tokenId.value);

    let id = createNftId(
      event.params.contractAddress.toHexString(),
      tokenId.value.toString()
    );

    let nft = new Nft(id);
    nft.auctionIds = [];
    nft.type = 'ERC-721';
    nft.tokenId = tokenId.value;
    nft.contract = event.params.contractAddress.toHexString();
    nft.updatedAt = event.block.timestamp;
    nft.price = ZERO_BI;
    nft.burned = false;
    nft.isOnSale = false;
    nft.createdAt = event.block.timestamp;
    nft.category = nftContract.category;
    nft.contractId = event.params.contractAddress;
    nft.contractName = nftContract.name;
    nft.tokenURI = tokenURI.value;
    nft.supply = ONE_BI;
    nft = updateTokenMetadataFromIPFS(nft);
    if (nft.name !== null) {
      nft.searchText = toLowerCase(nft.name!);
    }

    nft.save();

    userData.updateHistoricDataForTransfer(
      NULL_ADDRESS,
      tokenOwner.value,
      ONE_BI
    );
    collectionData.updateHistoricDataForTransfer(
      nft.contractId,
      NULL_ADDRESS,
      tokenOwner.value,
      ONE_BI
    );
    createAccount(tokenOwner.value);
    updateERC721Ownership(nft, NULL_ADDRESS, tokenOwner.value);
  }

  createAccount(owner.value);
}
