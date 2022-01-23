import { log, BigInt } from '@graphprotocol/graph-ts';
import {
  TransferSingle,
  Create,
} from '../../generated/templates/EndemicERC1155/EndemicERC1155';

import { Nft, NftContract } from '../../generated/schema';
import {
  getERC1155TokenURI,
  createNftId,
  isMarketplaceAddress,
  isMintEvent,
  updateTokenMetadataFromIPFS,
} from '../modules/nft';
import { createERC1155TransferActivity } from '../modules/activity';
import { updateERC1155Ownership } from '../modules/ownership';
import { removeActiveAuction } from '../modules/auction';
import * as userData from '../modules/userData';
import * as collectionData from '../modules/collectionData';
import { toLowerCase } from '../utils/string';

export function handleTransferSingle(event: TransferSingle): void {
  let nftId = createNftId(
    event.address.toHexString(),
    event.params.id.toString()
  );
  let nft = Nft.load(nftId);
  if (nft == null) {
    log.info('NFT not found {}', [nftId]);
    return;
  }

  if (
    event.transaction.to !== null &&
    !isMarketplaceAddress(event.transaction.to!.toHexString()) &&
    !isMintEvent(event.params.from)
  ) {
    removeActiveAuction(nft, event.params.from, event.params.value);
    nft.save();
  }

  userData.updateHistoricDataForTransfer(
    event.params.from,
    event.params.to,
    event.params.value
  );
  collectionData.updateHistoricDataForTransfer(
    nft.contractId,
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
  createERC1155TransferActivity(nft, event);
}

export function handleCreate(event: Create): void {
  let id = createNftId(
    event.address.toHexString(),
    event.params.tokenId.toString()
  );
  let nft = new Nft(id);
  nft.auctionIds = [];

  let contract = NftContract.load(event.address.toHexString());
  if (!contract) {
    log.warning('Contract: {} not available', [event.address.toHexString()]);
    return;
  }

  let tokenURI = getERC1155TokenURI(event.address, event.params.tokenId);

  nft.type = 'ERC-1155';
  nft.category = contract.category;
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

  nft = updateTokenMetadataFromIPFS(nft);
  if (nft.name !== null) {
    nft.searchText = toLowerCase(nft.name!);
  }

  nft.save();

  userData.updateHistoricDataForCreate(
    event.params.artistId,
    BigInt.fromI32(1)
  );
}
