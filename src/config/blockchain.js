export const blockchainConfig = {
  network: 'polygon',
  rpcUrl: process.env.POLYGON_RPC_URL || 'https://polygon-amoy.drpc.org',
  contractAddress: process.env.CONTRACT_ADDRESS || '0x0000000000000000000000000000000000000000'
};
