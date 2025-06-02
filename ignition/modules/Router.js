const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

module.exports = buildModule("Router_Contract", (m) => {
  const factory = "";
  const WETH = "";
  const authorizer = "0x92E90747aaE09aD36fD0F6122e029b02CE0757fa";
  const _swapper = "";

  const router = m.contract("pancakerouter02", [
    factory,
    WETH,
    authorizer,
    _swapper,
  ]);
  console.log("router Contract", router);
  return { router };
});
