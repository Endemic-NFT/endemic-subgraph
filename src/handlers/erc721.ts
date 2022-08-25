import {
  Transfer,
  Mint,
  RoyaltiesUpdated,
} from '../../generated/templates/Collection/Collection';
import { Nft, NftContract } from '../../generated/schema';
import {
  getERC721TokenURI,
  createNftId,
  updateTokenMetadataFromIPFS,
  isBurnEvent,
  isMintEvent,
  isExchangeAddress,
} from '../modules/nft';
import { removeActiveAuction } from '../modules/auction';
import { createERC721TransferActivity } from '../modules/activity';
import { createNFTContract } from '../modules/nftContract';
import * as userData from '../modules/userData';
import * as collectionData from '../modules/collectionData';
import { updateERC721Ownership } from '../modules/ownership';
import { toLowerCase } from '../utils/string';
import { NULL_ADDRESS, ONE_BI, ZERO_BI } from '../utils/constants';
import { createAccount } from '../modules/account';

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
  nft.price = ZERO_BI;
  nft.burned = false;
  nft.isOnSale = false;
  nft.listedAt = ZERO_BI;

  if (isMintEvent(event.params.from)) {
    let tokenURI = getERC721TokenURI(event.address, event.params.tokenId);

    nft.createdAt = event.block.timestamp;
    nft.category = contract.category;
    nft.contractId = event.address;
    nft.contractName = contract.name;
    nft.tokenURI = tokenURI;
    nft.supply = ONE_BI;
    nft.paymentErc20TokenAddress = NULL_ADDRESS;

    nft = updateTokenMetadataFromIPFS(nft);
    if (nft.name !== null) {
      nft.searchText = toLowerCase(nft.name!);
    }
  } else if (isBurnEvent(event.params.to)) {
    nft.burned = true;
    if (nft.artistId) {
      userData.updateHistoricDataForBurn(nft.artistId!.toHexString(), ONE_BI);
    }
  }

  if (
    event.transaction.to !== null &&
    !isExchangeAddress(event.transaction.to!.toHexString()) &&
    !isMintEvent(event.params.from)
  ) {
    removeActiveAuction(nft, event.params.from, ONE_BI);
  }

  nft.save();

  userData.updateHistoricDataForTransfer(
    event.params.from,
    event.params.to,
    ONE_BI
  );
  collectionData.updateHistoricDataForTransfer(
    nft.contractId,
    event.params.from,
    event.params.to,
    ONE_BI
  );

  createAccount(event.params.from);
  createAccount(event.params.to);
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
  nft.artist = event.params.artistId.toHexString();
  nft.save();

  userData.updateHistoricDataForCreate(event.params.artistId, ONE_BI);
}

export function handleRoyaltiesUpdated(event: RoyaltiesUpdated): void {}
