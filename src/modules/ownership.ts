import { store, Bytes, BigInt, Address } from '@graphprotocol/graph-ts';
import { Nft, NftOwnership } from '../../generated/schema';
import { ONE_BI } from '../utils/constants';
import { isMintEvent } from './nft';

export function createNftOwnershipId(
  nftId: string,
  accountAddress: string
): string {
  return nftId + '-' + accountAddress;
}

export function deleteOwnership(nftId: string, accountId: Bytes): void {
  let oldBalanceId = createNftOwnershipId(nftId, accountId.toHexString());
  store.remove('NftOwnership', oldBalanceId);
}

export function getOrCreateOwnership(
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
    nftOwnership.nftContractId = nft.contractId;
    nftOwnership.nftBurned = nft.burned;
    nftOwnership.nftCreatedAt = nft.createdAt;
    nftOwnership.nftListedAt = nft.listedAt;
    nftOwnership.nftIsOnSale = false;
  }

  return nftOwnership;
}

export function updateERC721Ownership(
  nft: Nft,
  fromAccountId: Address,
  toAccountId: Address
): void {
  if (!isMintEvent(fromAccountId)) {
    deleteOwnership(nft.id, fromAccountId);
  }

  let nftOwnership = getOrCreateOwnership(nft, toAccountId.toHexString());
  nftOwnership.value = ONE_BI;
  nftOwnership.nftBurned = nft.burned;
  nftOwnership.nftIsOnSale = false;
  nftOwnership.save();
}

export function updateERC1155Ownership(
  nft: Nft,
  fromAccountId: Address,
  toAccountId: Address,
  tokenAmount: BigInt
): void {
  let nftOwnership = getOrCreateOwnership(nft, toAccountId.toHexString());
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
