import { log, BigInt } from '@graphprotocol/graph-ts';
import {
  TransferSingle,
  Create,
} from '../../generated/templates/EndemicERC1155/EndemicERC1155';

import { NFT, NFTContract } from '../../generated/schema';
import {
  getERC1155TokenURI,
  getNFTId,
  isMarketplaceAddress,
  isMintEvent,
  readTokenMetadataFromIPFS,
} from '../modules/nft';
import { createAccount } from '../modules/account';
import { createERC1155TransferActivity } from '../modules/activity';
import { updateStatsForCreate as updateUserStatsForCreate } from '../modules/userStats';
import { updateERC1155Ownership } from '../modules/ownership';
import { removeActiveAuction } from '../modules/auction';
import { updateStatsForTransfer } from '../modules/stats';

export function handleTransferSingle(event: TransferSingle): void {
  let nftId = getNFTId(event.address.toHexString(), event.params.id.toString());
  let nft = <NFT>NFT.load(nftId);

  if (
    event.transaction.to !== null &&
    !isMarketplaceAddress(event.transaction.to!.toHexString()) &&
    !isMintEvent(event.params.from)
  ) {
    removeActiveAuction(nft, event.params.from, event.params.value);
    nft.save();
  }

  createAccount(event.params.to);
  createERC1155TransferActivity(nft, event);
  updateStatsForTransfer(
    nft,
    event.params.from,
    event.params.to,
    event.params.value
  );
  updateERC1155Ownership(
    nft,
    event.params.from,
    event.params.to,
    event.params.value
  );
}

export function handleCreate(event: Create): void {
  let id = getNFTId(
    event.address.toHexString(),
    event.params.tokenId.toString()
  );
  let nft = new NFT(id);
  nft.auctionIds = [];

  let contract = NFTContract.load(event.address.toHexString());
  if (!contract) {
    log.warning('Contract: {} not available', [event.address.toHexString()]);
    return;
  }

  let tokenURI = getERC1155TokenURI(event.address, event.params.tokenId);

  nft.type = 'ERC-1155';
  nft.category = contract.category;
  nft.artist = event.params.artistId.toHex();
  nft.artistId = event.params.artistId;

  nft.contract = event.address.toHexString();
  nft.contractId = event.address;
  nft.contractName = contract.name;

  nft.createdAt = event.block.timestamp;
  nft.updatedAt = event.block.timestamp;

  nft.tokenURI = tokenURI;
  nft.tokenId = event.params.tokenId;
  nft.supply = event.params.supply;

  nft.price = BigInt.fromI32(0);
  nft.isOnSale = false;
  nft.burned = false;

  let metaData = readTokenMetadataFromIPFS(tokenURI);
  if (metaData) {
    nft.image = metaData.image;
    nft.name = metaData.name;
    nft.description = metaData.description;
  } else {
    log.warning('TokenURI: {} not available', [tokenURI]);
  }

  nft.save();

  updateUserStatsForCreate(event.params.artistId, BigInt.fromI32(1));
}
