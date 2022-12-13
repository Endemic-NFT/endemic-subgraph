import { Address, BigInt } from '@graphprotocol/graph-ts';
import { NftContract } from '../../generated/schema';
import { Collection } from '../../generated/templates/Collection/Collection';
import { toLowerCase } from '../utils/string';

const DEFAULT_CATEGORY = 'Collectibles';

export function createNFTContract(id: Address, createdAt: BigInt): NftContract {
  let nftContract = new NftContract(id.toHexString());
  nftContract.category = DEFAULT_CATEGORY;
  nftContract.createdAt = createdAt;

  let instance = Collection.bind(id);

  let name = instance.try_name();
  if (!name.reverted) {
    nftContract.name = name.value;
    nftContract.searchText = toLowerCase(nftContract.name);
  }

  let symbol = instance.try_symbol();
  if (!symbol.reverted) {
    nftContract.symbol = symbol.value;
  }

  nftContract.save();

  return nftContract;
}
