import { log } from '@graphprotocol/graph-ts';
import {
  RoyaltiesSetForCollection,
  RoyaltiesSetForToken,
} from '../../generated/RoyaltiesProvider/RoyaltiesProvider';
import { Nft, NftContract } from '../../generated/schema';
import { createNftId } from '../modules/nft';
import { createAccount } from '../modules/account';

export function handleRoyaltiesSetForCollection(
  event: RoyaltiesSetForCollection
): void {
  let nftContract = NftContract.load(event.params.nftContract.toHex());
  if (!nftContract) {
    log.warning('NFT contract {} not available', [
      event.params.nftContract.toHexString(),
    ]);
    return;
  }

  nftContract.royalties = event.params.fee;
  nftContract.royaltiesRecipient = event.params.feeRecipient;
  nftContract.save();

  createAccount(event.params.feeRecipient);
}

export function handleRoyaltiesSetForToken(event: RoyaltiesSetForToken): void {
  let nftId = createNftId(
    event.params.nftContract.toHexString(),
    event.params.tokenId.toString()
  );
  let nft = Nft.load(nftId);
  if (!nft) {
    log.warning('NFT {} not available', [nftId]);
    return;
  }

  nft.royalties = event.params.fee;
  nft.save();
}
