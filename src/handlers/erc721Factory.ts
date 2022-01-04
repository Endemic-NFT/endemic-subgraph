import { BigInt, Address } from '@graphprotocol/graph-ts';
import { NFTContractCreated } from '../../generated/EndemicNFTFactory/EndemicNFTFactory';
import { EndemicNFT } from '../../generated/templates';
import { EndemicNFT as EndemicNFTTemplate } from '../../generated/templates/EndemicNFT/EndemicNFT';

import { NFT, NFTContract } from '../../generated/schema';
import { createAccount } from '../modules/account';
import { toLowerCase } from '../utils/string';
import { log } from '@graphprotocol/graph-ts';
import { getNFTId, updateTokenMetadataFromIPFS } from '../modules/nft';
import * as addresses from '../data/addresses';
import { updateStatsForTransfer } from '../modules/stats';
import { updateERC721Ownership } from '../modules/ownership';

export function handleCreated(event: NFTContractCreated): void {
  let nftContract = NFTContract.load(event.params.nftContract.toHex());
  if (!nftContract) {
    nftContract = new NFTContract(event.params.nftContract.toHex());
  }

  nftContract.name = event.params.name;
  nftContract.symbol = event.params.symbol;
  nftContract.category = event.params.category;
  nftContract.createdAt = event.block.timestamp;
  nftContract.searchText = toLowerCase(nftContract.name);
  nftContract.save();

  EndemicNFT.create(event.params.nftContract);
  createAccount(event.params.owner);
}

export function handleExisting(event: NFTContractCreated): void {
  let nftContract = NFTContract.load(event.params.nftContract.toHex());
  if (nftContract) {
    log.warning('NFT contract already indexed {}', [
      event.params.nftContract.toHex(),
    ]);
    return;
  }
  let erc721 = EndemicNFTTemplate.bind(event.params.nftContract);

  let name = erc721.try_name();
  if (name.reverted) {
    log.warning('Invalid ERC721 {} - name error', [
      event.params.nftContract.toHex(),
    ]);
    return;
  }

  let symbol = erc721.try_name();
  if (symbol.reverted) {
    log.warning('Invalid ERC721 {} - symbol error', [
      event.params.nftContract.toHex(),
    ]);
    return;
  }

  nftContract = new NFTContract(event.params.nftContract.toHex());

  nftContract.name = name.value;
  nftContract.symbol = symbol.value;
  nftContract.category = event.params.category;
  nftContract.createdAt = event.block.timestamp;
  nftContract.searchText = toLowerCase(nftContract.name);
  nftContract.save();

  EndemicNFT.create(event.params.nftContract);
  createAccount(event.params.owner);

  let totalSupply = erc721.try_totalSupply();
  if (totalSupply.reverted) {
    log.warning('Invalid ERC721 {} - total supply error', [
      event.params.nftContract.toHex(),
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
        event.params.nftContract.toHex(),
        tokenIndex.toString(),
      ]);
      return;
    }

    let tokenOwner = erc721.try_ownerOf(tokenId.value);
    if (tokenOwner.reverted) {
      log.warning('Invalid ERC721 {} - owner {}', [
        event.params.nftContract.toHex(),
        tokenId.value.toString(),
      ]);
      return;
    }

    if (tokenOwner.value.toHexString() == addresses.Null) {
      continue;
    }

    let tokenURI = erc721.try_tokenURI(tokenId.value);

    let id = getNFTId(
      event.params.nftContract.toHexString(),
      tokenId.value.toString()
    );

    let nft = new NFT(id);
    nft.auctionIds = [];
    nft.type = 'ERC-721';
    nft.tokenId = tokenId.value;
    nft.contract = event.params.nftContract.toHexString();
    nft.updatedAt = event.block.timestamp;
    nft.price = BigInt.fromI32(0);
    nft.burned = false;
    nft.isOnSale = false;
    nft.createdAt = event.block.timestamp;
    nft.category = nftContract.category;
    nft.contractId = event.address;
    nft.contractName = nftContract.name;
    nft.tokenURI = tokenURI.value;
    nft.supply = BigInt.fromI32(1);
    nft = updateTokenMetadataFromIPFS(nft);

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
