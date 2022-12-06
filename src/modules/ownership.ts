import { store, Bytes, BigInt, Address } from '@graphprotocol/graph-ts';
import {
  Nft,
  NftOwnership,
  NftOwnershipPerContract,
} from '../../generated/schema';
import { ONE_BI, ZERO_BI } from '../utils/constants';
import { isMintEvent } from './nft';

export function createNftOwnershipId(
  nftId: string,
  accountAddress: string
): string {
  return nftId + '-' + accountAddress;
}

export function createOwnershipPerContractId(
  contractId: string,
  accountAddress: string
): string {
  return contractId + '-' + accountAddress;
}

export function deleteNftOwnership(nftId: string, accountId: Bytes): void {
  let oldBalanceId = createNftOwnershipId(nftId, accountId.toHexString());
  store.remove('NftOwnership', oldBalanceId);
}

export function getOrCreateNftOwnership(
  nft: Nft,
  accountId: string
): NftOwnership {
  let nftOwnershipId = createNftOwnershipId(nft.id, accountId);
  let nftOwnership = NftOwnership.load(nftOwnershipId);
  if (!nftOwnership) {
    nftOwnership = new NftOwnership(nftOwnershipId);
    nftOwnership.account = accountId;
    nftOwnership.nft = nft.id;
    nftOwnership.nftCategory = nft.category;
    nftOwnership.nftPrice = nft.price;
    nftOwnership.nftAuctionStartingPrice = nft.auctionStartingPrice;
    nftOwnership.nftAuctionEndingPrice = nft.auctionEndingPrice;
    nftOwnership.nftContractId = nft.contractId;
    nftOwnership.nftBurned = nft.burned;
    nftOwnership.nftCreatedAt = nft.createdAt;
    nftOwnership.nftListedAt = nft.listedAt;
    nftOwnership.nftIsOnSale = false;
    nftOwnership.nftPaymentErc20TokenAddress = nft.paymentErc20TokenAddress;
  }

  return nftOwnership;
}

export function getOrCreateOwnershipPerContract(
  contractId: string,
  accountId: string
): NftOwnershipPerContract {
  let ownershipId = createOwnershipPerContractId(contractId, accountId);
  let ownership = NftOwnershipPerContract.load(ownershipId);
  if (!ownership) {
    ownership = new NftOwnershipPerContract(ownershipId);
    ownership.account = accountId;
    ownership.contract = contractId;
    ownership.tokensCount = ZERO_BI;
  }

  return ownership;
}

export function updateERC721Ownership(
  nft: Nft,
  fromAccountId: Address,
  toAccountId: Address
): void {
  if (!isMintEvent(fromAccountId)) {
    deleteNftOwnership(nft.id, fromAccountId);
  }

  let nftOwnership = getOrCreateNftOwnership(nft, toAccountId.toHexString());
  nftOwnership.value = ONE_BI;
  nftOwnership.nftBurned = nft.burned;
  nftOwnership.nftIsOnSale = nft.isOnSale;
  nftOwnership.nftPrice = nft.price;
  nftOwnership.nftAuctionStartingPrice = nft.auctionStartingPrice;
  nftOwnership.nftAuctionEndingPrice = nft.auctionEndingPrice;
  nftOwnership.nftListedAt = nft.listedAt;
  nftOwnership.save();
}

export function updateERC1155Ownership(
  nft: Nft,
  fromAccountId: Address,
  toAccountId: Address,
  tokenAmount: BigInt
): void {
  let nftOwnership = getOrCreateNftOwnership(nft, toAccountId.toHexString());
  nftOwnership.value = nftOwnership.value.plus(tokenAmount);
  nftOwnership.save();

  let sourceOwnership = NftOwnership.load(
    createNftOwnershipId(nft.id, fromAccountId.toHexString())
  );
  if (sourceOwnership) {
    sourceOwnership.value = sourceOwnership.value.minus(tokenAmount);
    sourceOwnership.save();
  }
}
