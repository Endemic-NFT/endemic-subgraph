import { store, Bytes, BigInt, Address } from '@graphprotocol/graph-ts';
import { NFT, NFTOwnership } from '../../generated/schema';
import { isMintEvent } from './nft';

export function getNftOwnershipId(
  nftId: string,
  accountAddress: string
): string {
  return nftId + '-' + accountAddress;
}

export function deleteOwnership(nftId: string, accountId: Bytes): void {
  let oldBalanceId = getNftOwnershipId(nftId, accountId.toHexString());
  store.remove('NFTOwnership', oldBalanceId);
}

export function getOrCreateOwnership(nft: NFT, accountId: Bytes): NFTOwnership {
  let nftOwnershipId = getNftOwnershipId(nft.id, accountId.toHexString());
  let nftOwnership = NFTOwnership.load(nftOwnershipId);
  if (!nftOwnership) {
    nftOwnership = new NFTOwnership(nftOwnershipId);
    nftOwnership.account = accountId.toHexString();
    nftOwnership.nft = nft.id;
    nftOwnership.nftCategory = nft.category;
    nftOwnership.nftPrice = nft.price;
    nftOwnership.nftContractId = nft.contractId;
    nftOwnership.nftBurned = nft.burned;
    nftOwnership.nftCreatedAt = nft.createdAt;
    nftOwnership.nftIsOnSale = false;
  }

  return nftOwnership;
}

export function updateERC721Ownership(
  nft: NFT,
  fromAccountId: Address,
  toAccountId: Address
): void {
  if (!isMintEvent(fromAccountId)) {
    deleteOwnership(nft.id, fromAccountId);
  }

  let nftOwnership = getOrCreateOwnership(nft, toAccountId);
  nftOwnership.value = BigInt.fromI32(1);
  nftOwnership.nftBurned = nft.burned;
  nftOwnership.nftIsOnSale = false;
  nftOwnership.save();
}

export function updateERC1155Ownership(
  nft: NFT,
  fromAccountId: Address,
  toAccountId: Address,
  tokenAmount: BigInt
): void {
  let nftOwnership = getOrCreateOwnership(nft, toAccountId);
  nftOwnership.value = nftOwnership.value.plus(tokenAmount);
  nftOwnership.save();

  let sourceOwnership = NFTOwnership.load(
    getNftOwnershipId(nft.id, fromAccountId.toHexString())
  );
  if (sourceOwnership) {
    sourceOwnership.value = sourceOwnership.value.minus(tokenAmount);
    sourceOwnership.save();
  }
}
