import { Created } from '../../generated/EndemicERC1155Factory/EndemicERC1155Factory';
import { EndemicERC1155 } from '../../generated/templates';
import { NftContract } from '../../generated/schema';
import { createAccount } from '../modules/account';

export function handleCreated(event: Created): void {
  let nftContract = NftContract.load(event.params.nftContract.toHex());
  if (!nftContract) {
    nftContract = new NftContract(event.params.nftContract.toHex());
  }

  nftContract.name = event.params.name;
  nftContract.symbol = event.params.symbol;
  nftContract.category = event.params.category;
  nftContract.createdAt = event.block.timestamp;

  nftContract.save();

  EndemicERC1155.create(event.params.nftContract);
  createAccount(event.params.owner);
}
