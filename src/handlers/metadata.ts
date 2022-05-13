import { Address } from '@graphprotocol/graph-ts';
import { UpdateMetadata } from '../../generated/MetadataUpdater/MetadataUpdater';
import { ERC721Enumerable } from '../../generated/ContractImporter/ERC721Enumerable';
import { Nft } from '../../generated/schema';
import { updateTokenMetadataFromIPFS } from '../modules/nft';

export function handleMetadataUpdate(event: UpdateMetadata): void {
  for (let tokenIndex = 0; tokenIndex < event.params.ids.length; tokenIndex++) {
    let id = event.params.ids[tokenIndex];
    let nft = Nft.load(id);
    if (nft) {
      let erc721 = ERC721Enumerable.bind(
        Address.fromString(nft.contractId.toHexString())
      );
      let tokenURI = erc721.try_tokenURI(nft.tokenId);

      nft.tokenURI = tokenURI.value;
      nft = updateTokenMetadataFromIPFS(nft);

      nft.save();
    }
  }
}
