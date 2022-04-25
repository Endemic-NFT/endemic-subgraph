import { NFTContractCreated } from '../../generated/EndemicCollectionFactory/EndemicCollectionFactory';
import { Collection } from '../../generated/templates';
import { NftContract } from '../../generated/schema';
import { toLowerCase } from '../utils/string';
import { createAccount } from '../modules/account';

export function handleCreated(event: NFTContractCreated): void {
  let nftContract = NftContract.load(event.params.nftContract.toHexString());
  if (!nftContract) {
    nftContract = new NftContract(event.params.nftContract.toHexString());
  }

  nftContract.name = event.params.name;
  nftContract.symbol = event.params.symbol;
  nftContract.category = event.params.category;
  nftContract.createdAt = event.block.timestamp;
  nftContract.searchText = toLowerCase(nftContract.name);
  nftContract.royalties = event.params.royalties;
  nftContract.royaltiesRecipient = event.params.owner;
  nftContract.save();

  Collection.create(event.params.nftContract);
  createAccount(event.params.owner);
}
