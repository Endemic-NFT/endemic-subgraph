import { log, BigInt } from '@graphprotocol/graph-ts';
import {
  Transfer,
  Mint,
} from '../../generated/templates/EndemicNFT/EndemicNFT';
import { NFT, NFTContract } from '../../generated/schema';
import {
  getERC721TokenURI,
  getNFTId,
  readTokenMetadataFromIPFS,
  isBurnEvent,
  isMintEvent,
  isMarketplaceAddress,
} from '../modules/nft';
import { removeActiveAuction } from '../modules/auction';
import { createAccount } from '../modules/account';
import { createERC721TransferActivity } from '../modules/activity';
import { createThirdPartyNFTContract } from '../modules/nftContract';
import { updateStatsForCreate as updateUserStatsForCreate } from '../modules/userStats';
import { updateERC721Ownership } from '../modules/ownership';
import { updateStatsForTransfer } from '../modules/stats';

export function handleTransfer(event: Transfer): void {
  log.warning('handleTransfer: {} to {}', [
    event.params.from.toHexString(),
    event.params.to.toHexString(),
  ]);

  let id = getNFTId(
    event.address.toHexString(),
    event.params.tokenId.toString()
  );

  let tokenURI = getERC721TokenURI(event.address, event.params.tokenId);
  let nft = NFT.load(id);

  if (!nft) {
    nft = new NFT(id);
    nft.auctionIds = [];
    nft.type = 'ERC-721';
  }

  let contract = NFTContract.load(event.address.toHexString());
  if (!contract) {
    // Contract is not created via our factory, it's third party
    contract = createThirdPartyNFTContract(
      event.address,
      event.block.timestamp
    );
  }

  nft.tokenId = event.params.tokenId;
  nft.contract = event.address.toHexString();
  nft.updatedAt = event.block.timestamp;
  nft.price = BigInt.fromI32(0);
  nft.burned = false;
  nft.isOnSale = false;

  if (isMintEvent(event.params.from)) {
    nft.createdAt = event.block.timestamp;
    nft.category = contract.category;
    nft.contractId = event.address;
    nft.contractName = contract.name;
    nft.tokenURI = tokenURI;
    nft.supply = BigInt.fromI32(1);

    let metaData = readTokenMetadataFromIPFS(tokenURI);
    if (metaData != null) {
      nft.image = metaData.image;
      nft.name = metaData.name;
      nft.description = metaData.description;
    } else {
      log.warning('TokenURI: {} not available', [tokenURI]);
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

  createAccount(event.params.to);
  updateStatsForTransfer(
    nft,
    event.params.from,
    event.params.to,
    BigInt.fromI32(1)
  );
  log.warning('Updating ownership: {} to {}', [
    event.params.from.toHexString(),
    event.params.to.toHexString(),
  ]);
  updateERC721Ownership(nft, event.params.from, event.params.to);
  log.warning('Updating activity: {} to {}', [
    event.params.from.toHexString(),
    event.params.to.toHexString(),
  ]);
  createERC721TransferActivity(nft, event);

  log.warning('done {}', [nft.id]);
}

export function handleMint(event: Mint): void {
  let id = getNFTId(
    event.address.toHexString(),
    event.params.tokenId.toString()
  );
  let nft = NFT.load(id)!;

  nft.artist = event.params.artistId.toHex();
  nft.artistId = event.params.artistId;

  nft.save();

  updateUserStatsForCreate(event.params.artistId, BigInt.fromI32(1));
}
