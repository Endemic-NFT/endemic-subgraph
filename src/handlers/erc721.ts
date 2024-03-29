import { dataSource } from '@graphprotocol/graph-ts';
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
} from '../modules/nft';
import { removePossibleActiveAuction } from '../modules/auction';
import { createERC721TransferActivity } from '../modules/activity';
import { createNFTContract } from '../modules/nftContract';
import * as userData from '../modules/userData';
import * as collectionData from '../modules/collectionData';
import { updateERC721Ownership } from '../modules/ownership';
import { toLowerCase } from '../utils/string';
import {
  NULL_ADDRESS,
  ONE_BI,
  ZERO_BI,
  ZERO_DECIMAL,
} from '../utils/constants';
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
    nft.blockchain = dataSource.network();
  }

  let contract = NftContract.load(event.address.toHexString());
  if (!contract) {
    contract = createNFTContract(event.address, event.block.timestamp);
  }

  nft.tokenId = event.params.tokenId;
  nft.contract = event.address.toHexString();
  nft.contractId = event.address;
  nft.updatedAt = event.block.timestamp;
  nft.price = ZERO_BI;
  nft.auctionSortingPrice = ZERO_DECIMAL;
  nft.burned = false;
  nft.isOnSale = false;
  nft.listedAt = ZERO_BI;

  if (isMintEvent(event.params.from)) {
    let tokenURI = getERC721TokenURI(event.address, event.params.tokenId);

    nft.createdAt = event.block.timestamp;
    nft.category = contract.category;
    nft.contractName = contract.name;
    nft.tokenURI = tokenURI;
    nft.supply = ONE_BI;
    nft.paymentErc20TokenAddress = NULL_ADDRESS;

    nft = updateTokenMetadataFromIPFS(nft);
    if (nft.name != null) {
      nft.searchText = toLowerCase(nft.name!);
    }
  } else if (isBurnEvent(event.params.to)) {
    nft.burned = true;
    if (nft.artistId) {
      userData.updateHistoricDataForBurn(nft.artistId!.toHexString(), ONE_BI);
    }
  }

  nft = removePossibleActiveAuction(
    event.transaction.to,
    event.params.from,
    nft,
    ONE_BI
  );

  //avoid row size limit on existing NFTs
  if (nft.description != null) {
    if (nft.description!.length > 5000) {
      return;
    }
  }

  if (nft.name != null) {
    if (nft.name!.length > 500) {
      return;
    }
  }

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

  nft.save();

  createERC721TransferActivity(nft, event);
}

export function handleMint(event: Mint): void {
  let id = createNftId(
    event.address.toHexString(),
    event.params.tokenId.toString()
  );

  let nft = Nft.load(id);

  if (nft == null) {
    return;
  }

  nft.artistId = event.params.artistId;
  nft.artist = event.params.artistId.toHexString();
  nft.save();

  userData.updateHistoricDataForCreate(event.params.artistId, ONE_BI);
}

export function handleRoyaltiesUpdated(event: RoyaltiesUpdated): void {}
