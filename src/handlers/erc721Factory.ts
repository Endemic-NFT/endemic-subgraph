import { NFTContractCreated } from '../../generated/EndemicNFTFactory/EndemicNFTFactory';
import { EndemicNFT } from '../../generated/templates';
import { NFTContract } from '../../generated/schema';
import { createAccount } from '../modules/account';

export function handleCreated(event: NFTContractCreated): void {
  let nftContract = NFTContract.load(event.params.nftContract.toHex());
  if (!nftContract) {
    nftContract = new NFTContract(event.params.nftContract.toHex());
  }

  nftContract.name = event.params.name;
  nftContract.symbol = event.params.symbol;
  nftContract.category = event.params.category;
  nftContract.createdAt = event.block.timestamp;

  nftContract.save();

  EndemicNFT.create(event.params.nftContract);
  createAccount(event.params.owner);
}
