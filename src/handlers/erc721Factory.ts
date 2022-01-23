import { NFTContractCreated } from '../../generated/EndemicNFTFactory/EndemicNFTFactory';
import { EndemicNFT } from '../../generated/templates';
import { NftContract } from '../../generated/schema';
import { toLowerCase } from '../utils/string';

export function handleCreated(event: NFTContractCreated): void {
  let nftContract = NftContract.load(event.params.nftContract.toHex());
  if (!nftContract) {
    nftContract = new NftContract(event.params.nftContract.toHex());
  }

  nftContract.name = event.params.name;
  nftContract.symbol = event.params.symbol;
  nftContract.category = event.params.category;
  nftContract.createdAt = event.block.timestamp;
  nftContract.searchText = toLowerCase(nftContract.name);
  nftContract.save();

  EndemicNFT.create(event.params.nftContract);
}
