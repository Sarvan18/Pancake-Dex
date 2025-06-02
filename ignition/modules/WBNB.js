const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

module.exports = buildModule("Router_Contract", (m) => {
  const WBNB = m.contract("WBNB");
  console.log("WBNB Contract", WBNB);
  return { WBNB };
});
