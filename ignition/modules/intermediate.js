const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

module.exports = buildModule("Intermediate_Contract", (m) => {
  const OwnerAddress = "0x92E90747aaE09aD36fD0F6122e029b02CE0757fa";

  const Intermediate = m.contract("pancakerouter02", [
    OwnerAddress,
    OwnerAddress,
  ]);
  console.log("Intermediate Contract", Intermediate);
  return { Intermediate };
});
