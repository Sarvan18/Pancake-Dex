require("@nomiclabs/hardhat-web3");
require("@nomiclabs/hardhat-truffle5");
require("@nomicfoundation/hardhat-ignition");

require("dotenv").config();
const BSC_USD_SETTINGS = {
  version: "0.5.16",
  settings: {
    optimizer: {
      enabled: true,
      runs: 200,
    },
  },
};

const FACTORY_COMPILER_SETTINGS = {
  version: "0.5.16",
  settings: {
    optimizer: {
      enabled: true,
      runs: 200,
    },
  },
};

const ROUTER_COMPILER_SETTINGS = {
  version: "0.6.6",
  settings: {
    optimizer: {
      enabled: true,
      runs: 200,
    },
  },
};

const WETH_COMPILER_SETTINGS = {
  version: "0.4.18",
  settings: {
    optimizer: {
      enabled: true,
      runs: 200,
    },
  },
};

module.exports = {
  defaultNetwork: "hardhat",
  solidity: {
    compilers: [
      {
        version: "0.8.20",
        settings: {
          optimizer: {
            enabled: true,
            runs: 800,
          },
        },
      },
    ],
    overrides: {
      "contracts/Tokens/BSC-USD.sol": BSC_USD_SETTINGS,
      "contracts/Factory.sol": FACTORY_COMPILER_SETTINGS,
      "contracts/Router.sol": ROUTER_COMPILER_SETTINGS,
      "contracts/WBNB.sol": WETH_COMPILER_SETTINGS,
    },
  },

  networks: {
    bsctestnet: {
      url: "https://bsc-testnet-rpc.publicnode.com",
      accounts: [`0x${process.env.PRIVATEKEY}`],
    },
  },
};
