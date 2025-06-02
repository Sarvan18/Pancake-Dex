const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

module.exports = buildModule("Factoey_Contract", (m) => {
  const _feeToSetter = "0x92E90747aaE09aD36fD0F6122e029b02CE0757fa";
  const _token = "0x92E90747aaE09aD36fD0F6122e029b02CE0757fa";
  const _busd = "0x92E90747aaE09aD36fD0F6122e029b02CE0757fa";
  const _period = "0";

  const factory = m.contract("pancakeFactory", [
    _feeToSetter,
    _token,
    _busd,
    _period,
  ]);
  console.log("factory Contract", factory);
  return { factory };
});
