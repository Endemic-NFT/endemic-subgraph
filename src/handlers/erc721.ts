import { BigInt } from '@graphprotocol/graph-ts';
import {
  Transfer,
  Mint,
} from '../../generated/templates/EndemicNFT/EndemicNFT';
import { Nft, NftContract } from '../../generated/schema';
import {
  getERC721TokenURI,
  createNftId,
  updateTokenMetadataFromIPFS,
  isBurnEvent,
  isMintEvent,
  isMarketplaceAddress,
} from '../modules/nft';
import { removeActiveAuction } from '../modules/auction';
import { createERC721TransferActivity } from '../modules/activity';
import { createNFTContract } from '../modules/nftContract';
import * as userData from '../modules/userData';
import * as collectionData from '../modules/collectionData';
import { updateERC721Ownership } from '../modules/ownership';
import { toLowerCase } from '../utils/string';

export function handleTransfer(event: Transfer): void {
  let id = createNftId(
    event.address.toHexString(),
    event.params.tokenId.toString()
  );

  let nft = Nft.load(id);

  if (!nft) {
    nft = new Nft(id);
    nft.auctionIds = [];
    nft.type = 'ERC-721';
  }

  let contract = NftContract.load(event.address.toHexString());
  if (!contract) {
    contract = createNFTContract(event.address, event.block.timestamp);
  }

  nft.tokenId = event.params.tokenId;
  nft.contract = event.address.toHexString();
  nft.updatedAt = event.block.timestamp;
  nft.price = BigInt.fromI32(0);
  nft.burned = false;
  nft.isOnSale = false;
  nft.listedAt = BigInt.fromI32(0);

  if (isMintEvent(event.params.from)) {
    let tokenURI = getERC721TokenURI(event.address, event.params.tokenId);

    nft.createdAt = event.block.timestamp;
    nft.category = contract.category;
    nft.contractId = event.address;
    nft.contractName = contract.name;
    nft.tokenURI = tokenURI;
    nft.supply = BigInt.fromI32(1);

    nft = updateTokenMetadataFromIPFS(nft);
    if (nft.name !== null) {
      nft.searchText = toLowerCase(nft.name!);
    }
  } else if (isBurnEvent(event.params.to)) {
    nft.burned = true;
  }

  if (
    event.transaction.to !== null &&
    !isMarketplaceAddress(event.transaction.to!.toHexString()) &&
    !isMintEvent(event.params.from)
  ) {
    removeActiveAuction(nft, event.params.from, BigInt.fromI32(1));
  }

  nft.save();

  userData.updateHistoricDataForTransfer(
    event.params.from,
    event.params.to,
    BigInt.fromI32(1)
  );
  collectionData.updateHistoricDataForTransfer(
    nft.contractId,
    event.params.from,
    event.params.to,
    BigInt.fromI32(1)
  );

  updateERC721Ownership(nft, event.params.from, event.params.to);
  createERC721TransferActivity(nft, event);
}

export function handleMint(event: Mint): void {
  let id = createNftId(
    event.address.toHexString(),
    event.params.tokenId.toString()
  );

  let nft = Nft.load(id)!;
  nft.artistId = event.params.artistId;
  nft.save();

  userData.updateHistoricDataForCreate(
    event.params.artistId,
    BigInt.fromI32(1)
  );
}
