import { log } from '@graphprotocol/graph-ts';
import {
  RoyaltiesSetForCollection,
  RoyaltiesSetForToken,
} from '../../generated/RoyaltiesProvider/RoyaltiesProvider';
import { NFT, NFTContract } from '../../generated/schema';
import { getNFTId } from '../modules/nft';

export function handleRoyaltiesSetForCollection(
  event: RoyaltiesSetForCollection
): void {
  let nftContract = NFTContract.load(event.params.nftContract.toHex());
  if (!nftContract) {
    log.warning('NFT contract {} not available', [
      event.params.nftContract.toHexString(),
    ]);
    return;
  }

  nftContract.royalties = event.params.fee;
  nftContract.royaltiesRecipient = event.params.feeRecipient;
  nftContract.save();
}

export function handleRoyaltiesSetForToken(event: RoyaltiesSetForToken): void {
  let nftId = getNFTId(
    event.params.nftContract.toHexString(),
    event.params.tokenId.toString()
  );
  let nft = NFT.load(nftId);
  if (!nft) {
    log.warning('NFT {} not available', [nftId]);
    return;
  }

  nft.royalties = event.params.fee;
  nft.save();
}
