import { BigInt } from '@graphprotocol/graph-ts';
import {
  Transfer,
  Mint,
} from '../../generated/templates/EndemicNFT/EndemicNFT';
import { NFT, NFTContract } from '../../generated/schema';
import {
  getERC721TokenURI,
  getNFTId,
  updateTokenMetadataFromIPFS,
  isBurnEvent,
  isMintEvent,
  isMarketplaceAddress,
} from '../modules/nft';
import { removeActiveAuction } from '../modules/auction';
import { createERC721TransferActivity } from '../modules/activity';
import { createNFTContract } from '../modules/nftContract';
import { updateStatsForCreate as updateUserStatsForCreate } from '../modules/userStats';
import { updateERC721Ownership } from '../modules/ownership';
import { updateStatsForTransfer } from '../modules/stats';
import { toLowerCase } from '../utils/string';

export function handleTransfer(event: Transfer): void {
  let id = getNFTId(
    event.address.toHexString(),
    event.params.tokenId.toString()
  );

  let nft = NFT.load(id);

  if (!nft) {
    nft = new NFT(id);
    nft.auctionIds = [];
    nft.type = 'ERC-721';
  }

  let contract = NFTContract.load(event.address.toHexString());
  if (!contract) {
    contract = createNFTContract(event.address, event.block.timestamp);
  }

  nft.tokenId = event.params.tokenId;
  nft.contract = event.address.toHexString();
  nft.updatedAt = event.block.timestamp;
  nft.price = BigInt.fromI32(0);
  nft.burned = false;
  nft.isOnSale = false;

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

  updateStatsForTransfer(
    nft,
    event.params.from,
    event.params.to,
    BigInt.fromI32(1)
  );

  updateERC721Ownership(nft, event.params.from, event.params.to);
  createERC721TransferActivity(nft, event);
}

export function handleMint(event: Mint): void {
  let id = getNFTId(
    event.address.toHexString(),
    event.params.tokenId.toString()
  );
  let nft = NFT.load(id)!;

  nft.artistId = event.params.artistId;

  nft.save();

  updateUserStatsForCreate(event.params.artistId, BigInt.fromI32(1));
}
