const blacklistedAuroraCollections = [
  '0xc93235fe5caa615f39fd8f8b6dadafa742e77399', //zapiro portals,
  '0xa5f39526d6c229f5f0e36f6239060d8c9b4d49e4', // cyber babies,
  '0x5bc73dfcbd6fc0305335b13dd4800c84e9950693', // shroomables goodies,
  '0x00860ef075a7f6719cad8d89433e3558c5d22dcc', // shroomables baddies,
  '0xf18ca1c9e69e784f04aefaf806763eb85472c871', // che flies
  '0x9f028079723735276102a0953f2debae7650dc50', // bored ape pro club
  '0x36904b103c7afc1cb983afcb94e1bd70e555c869', // ape king
  '0x414f674004f04273516b937b1459f8f99d478a6c', // skull man art
  '0xa15c70a3cf8bce384c483946149f36a4f5c77f4e', // Alliaihe and the Fades
  '0xad00fb5f1b7c7085919eb2bc07411c34bf6ddd10', // Crossoverse
  '0x6d32a8ea13cac04769c17ff8f451c8ca998ba394', // Stones, Bones, and Dark Tones
  '0xffd2d4af03f1d9397e98ff4ab68f977d130cabae', // Endemix
  '0xe758e1da8c61cbd6837b76b932fb73db265149e1', // Null - KwADRA
  '0xfe0e947a50c2dc8a569a6e4376e92d7ccb26b23d', // Dystopia
  '0xbc07f5257cc2fbc815a5a75f8a6e4649f71d60d2', // Last Kuna Politician
  '0xd6ceb3e7ba303b65bd08a24c02ac8559273d7d74', // Cool Cats Kitten Club
  '0x4928f55aaa5a6e9392d53ebf82b1089a1fe161af', // Golden Super Rare
  '0x821a4bed869515fd181dcc4cbe160521ba76a4ea', // The Kallé
  '0x388e7c4b0b5b3c3795574c42472afdc461d4e670', // MULTIVERSE
  '0x5f0b1817028424ef68954608402ee5cfa9650e55', // Neon Nova Dream Scene
  '0x414f674004f04273516b937b1459f8f99d478a6c', // Skull Man Art
  '0x36904b103c7afc1cb983afcb94e1bd70e555c869', // Ape king
  '0x9f028079723735276102a0953f2debae7650dc50', // 0000000
  '0x5792f7a08dcc425cbd7ba34e2384fe6700abef47', // Skull art
  '0x185d94ced9af21253011d3710985eee785e90828', // Max art
  '0x61fff6bdd68b59ae59793559da2fbb47c6a0e8a8', // Endemic Skull Hood
  '0x0df452fd7ac97a93e6f91a9fc27e230e370cbee1', // Legends of Bebronis
  '0xb1fd715799ef388ac026af3ba1252eb390be6148', // 3D short cuts
  '0x04e1afd460117aa85e9fcaa6fbd5dd941724f45e', // Digital Artwork Collections
  '0x0887e040cfb3585d93ecd6ecea7ca998f72898e7', // People on the beach
  '0xb0677ffd731de440c30e890304a1140f2ef781c2', // Enclosed rhyme
  '0x734702555067ff74da8b9d37a15d113b038c5dd7', // Posters
  '0x5378c1afd389dbd6a211aa5c8b138916763d3d9b', // Pattern
  '0xc628796dfcf140f16e6e9599a23aee2349eecdcf', // Motion patterns
  '0x82ffbf543d4cd2e99b09e780caadd4d1675eac77', // Reach out and touch me
  '0xba4af6ccb5d31949dd90bae55e2db717b78b89c6', // Watercolor Electric
  '0x9da76367fd298936d8c6a8c1062698544ef5db43', // EndeGloo
  '0x114f38cb8315a79442c8857e424febf983794dc2', // WM Artifacts
  '0x004c85a0b159f673334e76e2f2bf14893863cb41', // AMARTYPE PEACE
  '0x0d2d200a1d6c606daf77d0f6c2c50f33a56195f1', // GANsta
  '0xa8bcf071981174ce03062484114ce7200b0445cf', // Fever105
  '0xa5be6c7e62c5da5dcef4f8388bbe7f12e0785a43', // 3D motion letters
  '0x1ac01e9c0cd853fcc8feb1f95e12aba9143969c3', // Water memory
  '0x8efb4dd6b7ffff551cbe6cc9709a88b26a7c8d38', // Jadran swimming pool
  '0xc0bdc6fc1433cd6c5b803d570c6a1c83b530bd5b', // Don't believe in fairytales You'll all end up driving Ubers
  '0xe741b04882842c628dea87dd406d613a638291b9', // Downward spiral, Where's the lifeguard
  '0x3aa81cf6ca07d7f58769b138ad9bfc9e7b784ce7', // Puppy In LOVE
  '0x599e85c73fd0f5daeadb650811ca9a6261e309dd', // AMARTYPE
  '0x630299ddc7575e323918d93cb2378e0d62740db7', // ~ Visualize Chakra ~
  '0xadfa4215ec01cbc7810c38044b84ec86e0550504', // Verse Illustrations
  '0x3d80c19e4b2b80ef327f02e9a36e59e8832e30ab', // One endemic piece
  '0x43fd3beb4a10f69c445534f2ac94de3aabb8d0b9', // Nature
  '0x414f674004f04273516b937b1459f8f99d478a6c', // Skull Man Art
  '0x36904b103c7afc1cb983afcb94e1bd70e555c869', // Ape king
  '0x6624a03ca80a5048d5ba056d2bc0c1b0c5ae4c4f', // Oxymoron
  '0x9f028079723735276102a0953f2debae7650dc50', // 0000000
  '0x8a8fe317f8e4ac4e0e185e3ad64bc161abf0c52c', // Lu-Luzes
  '0x5792f7a08dcc425cbd7ba34e2384fe6700abef47', // Skull art
  '0x38ae4e3c0a0c9099e749adeaa53a1219adb8a3e1', // Tools of the trade
  '0x769b020e44cafd18d5185821a4686f8ad8d3d315', // MushHeadLand
  '0xdc070c384bf287a518d5ec1dccb405f7aa7f8a98', // Endemic Dino Army
  '0x3b675ddbb38cf82db70c5263513bc6a4434323e3', // Unique Moment
  '0x8b2e2790e1f92ee18180a022aad5da2b3d6f4943', // Panku Kawaii
  '0x4278d7725efbbd914fcc0a4aac6a880d7b39af5e', // Chan Society
  '0x836fcd2d3109d347ee1a5fb5b762c0375fbe18f8', // PUNK
  '0x0c93c3b035b60add99caea8af90b83e49b2ae1d5', // Masked Punk
  '0x042d8f8b2f38c4c524dd9d884ab8675e7acbed4a', // Endemic Punk
  '0x5e83707b02cef88ffe5a8ed666e5fbe2286ac126', // Retro archive
  '0x1e49b6607f5e4d6b4479ea53f1b96eeed07b6e8c', // EXE
  '0x185d94ced9af21253011d3710985eee785e90828', // Max art
  '0x29ef3c4ecb4204b8278a81e030dd9a7a03fc4679', // Vuja De
  '0x5f194ea3a4d1298c2d8f7c5dea0c2004b6156563', // UNBOTHERED CHAMELEON
  '0xe2c48170cfc3fb40197dae258dd0ad3922208a92', // Nervous Ape DOODLE
  '0x9f37f668312b707c421c42025297600636266387', // Abstract Sourcery
  '0x4af92ad2a5e1022db9f8b9d3d1127c54aebbdbc5', // Nervous APE
  '0xc4314663240d07aac1dd8f0fd239ac090b9203d2', // Rejected photographs
  '0xf33dbf2c65095101c696b7ce2ee4cbb7cfa6501c', // Philosophy
  '0xbb8f36263de92f009781e0cdb6f7f8daab175e9a', // Goodstuff
  '0x067672b7e1c98d89a45f9267b67008a5af04799d', // Lost in Anthropocene
  '0xe5f231b6167252cf28759966c1054f9d95f90258', // exhibition
  '0x556a09797bff2fee805b613a92de9c9d94afbeae', // The life of birds illustrations
  '0x3301304568c97509f3df3b043e07866077d7e3cd', // I want you so bad
  '0x067632c05809905c786bed8acca87ccc82e879b1', // Sketches
  '0xbcc3251e2cd2af4d1b93e35e63a6ee4ae4e51af6', // Endemic Kids
  '0xa731ddda8a9dd2587be65738efe6f9aab58ec548', // Digital landscapes
  '0xea5655dc71adbfb9e6e0be6f9aa820c4d9c247dd', // Distorted ideas
  '0x5701b55121f728e7fb60df859f33496c17a87150', // Melancholy
  '0x36e49325d93d5e4244b74cfee1b47985839e5153', // Generative Art
  '0x95b9673ad6df7d42677fcff3f07be340f8208ac0', // Isometric Generative Art
  '0xe25c7f37485dfae15da3ca4e1b7b35e78565a82e', // Water GIFs
  '0x76d15efecc92662dab69714c6c000a47806e4165', // Fire
  '0x707ce09b079fe21ab9e40fe7d221c30d7541c914', // LAND OF SACRED ANIMALS
  '0x8d7709c6a1f2322c7b7796e421cff63d804be472', // Afterlife
  '0xfdb2bf802bcee88428b2ffa8e2d738be898b28a5', // Dreamy Silhouettes
  '0x7e904e7d62f9ba13756ea46f147fea1dccc940d2', // WM Physical NFT/Artifacts
  '0xda480f88329167331595934eaece059e7c891c76', // Surreal Art
  '0xa86baf3b227801ea483834875c1e6c1169b856c0', // The life of birds collectibles
  '0x8679939a1467621403d8928d102240485c9ce7e7', // Ferry
  '0x8e5ae25d8e2bde9e37cf9b9f515420874a04ac1b', // Endemic Beetles
  '0x075e2403e7ca575fe03ff4a8d6855530e2c89cad', // Digital Painting
  '0x83afc490b52e2e2c06cf92c784e0c92597c7c21d', // N-Demic Man
  '0xeeb5e7200213a3cfe0b607073afb2a8bc494c1f4', // Endemic Doodle Man
  '0x735e5e94f7864f82e4298668deb2b05c9a2df2e8', // Digital Bodies
  '0xa512a7644e206a8b97ef836ae1849ea0817c3bec', // Rocks of a new world
];

export { blacklistedAuroraCollections };
