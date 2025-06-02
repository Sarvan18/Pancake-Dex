const {
  expectEvent, // Assertions for emitted events
  time,
  expectRevert,
  ether,
} = require("@openzeppelin/test-helpers");

var chai = require("chai");
const Web3 = require("web3");
const { web3, artifacts } = require("hardhat");
var expect = chai.expect;
const BEPUSDT = artifacts.require("BEP20USDT");
const WMETA = artifacts.require("WMETA");
const Factory = artifacts.require("metatrondexFactory");
const Intermediate = artifacts.require("metatronRouter02");
const Router = artifacts.require("metatrondexRouter");
const pair = artifacts.require("metatrondexPair");

contract("DEX Contract testing", async (accounts) => {
  const owner = accounts[0];
  const PK =
    "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
  const _period = 0;

  before(async function () {
    BEPUSDT_Instance = await BEPUSDT.new();
    WMETA_Instance = await WMETA.new(owner);
    Factory_Instance = await Factory.new(owner, owner, owner, _period);
    Intermediate_Instance = await Intermediate.new(owner, owner);
    Router_Instance = await Router.new(
      Factory_Instance.address,
      WMETA_Instance.address,
      owner,
      Intermediate_Instance.address
    );
  });

  function testAccount(account) {
    return accounts[account + 1];
  }

  describe(" <------------> Getting INIT Code  <------------>  ", () => {
    it("check init code", async () => {
      const initcode = await Factory_Instance.INIT_CODE_PAIR_HASH();
      console.log("initcode", initcode);
    });
  });

  describe(" <----------------------> Metatron USDT Pool Testing <---------------------->", () => {
    it(" ", async () => {

      async function deadlineTime() {
        return String(
          Number(await time.latest()) + Number(time.duration.minutes(10))
        );
      }
      async function tokenData(user, liquidity) {
        const GetLiquidityData = await Intermediate_Instance.getLiquidityData(
          user,
          BEPUSDT_Instance.address
        );
        const userLiquidity = GetLiquidityData[4];

        const pariAddress = await Factory_Instance.getPair(
          BEPUSDT_Instance.address,
          WMETA_Instance.address
        );
        let paircakeInstance = await pair.at(pariAddress);

        const _reserve0 = await paircakeInstance.getReserves();
        const _reserve1 = await paircakeInstance.getReserves();

        const UserLiquidity = (100e18 * liquidity) / userLiquidity;
        const tokenAmount = ((Number(GetLiquidityData[2]) * Number(UserLiquidity)) / Number(100e18)) / Number(1e18);

        const ethAmount = (((Number(GetLiquidityData[3]) * Number(UserLiquidity)) / Number(100e18))) / Number(1e18);
        let amountToken = String(tokenAmount);
        let amountETH = String(ethAmount);

        const amountData = await Intermediate_Instance.amountReturns(
          amountToken,
          amountETH,
          pariAddress,
          WMETA_Instance.address
        );

        amountToken = String(convertAmount(amountData[0]));
        amountETH = String(convertAmount(amountData[1]));
        return { amountETH, amountToken };
      }


      function expectData(_beforeBalance, _afterBalance, expectedAmount) {
        expect(String(Number(_afterBalance) - Number(_beforeBalance))).equal(
          String(Number(expectedAmount))
        );
      }

      async function ownerTransfer(_tokenInstance, _user, _amount) {
        const beforeBalance = await balanceOf(_tokenInstance, _user);
        await _tokenInstance.transfer(_user, _amount, { from: owner });
        const afterBalance = await balanceOf(_tokenInstance, _user);
        expectData(beforeBalance, afterBalance, _amount);
      }

      async function approve(_tokenInstance, _spendor, _amount, _user) {
        await _tokenInstance.approve(_spendor, _amount, { from: _user });
        await checkAllowance(_tokenInstance, _user, _spendor, _amount);
      }

      async function balanceOf(_tokenInstance, _user) {
        return String(await _tokenInstance.balanceOf(_user));
      }

      async function checkAllowance(_tokenInstance, _from, _to, _amount) {
        const expectedAmount = await _tokenInstance.allowance(_from, _to);
        expect(String(expectedAmount)).equal(String(_amount));
      }

      async function signature(
        _address,
        _amountIn,
        _amountMin,
        _tokenAddress1,
        _tokenAddress2,
        _user,
        _deadline
      ) {
        const prepareHash = await Intermediate_Instance.prepareMessageHash(
          _address,
          _amountIn,
          _amountMin,
          _tokenAddress1,
          _tokenAddress2,
          _user,
          _deadline
        );
        return {
          hash: prepareHash,
          sig: await web3.eth.accounts.sign(prepareHash, PK).signature,
        };
      }

      async function verifySignature(_hash, _sig) {
        const verifySignature = await Intermediate_Instance.verifySignature(
          _hash,
          _sig
        );
        expect(verifySignature).equal(owner);
      }

      async function checkLiquidity(
        liquidityData,
        beforeBalanceA,
        beforeBalanceB,
        isFirst
      ) {
        await ownerTransfer(
          BEPUSDT_Instance,
          liquidityData.user,
          liquidityData.amountADesired
        );
        await approve(
          BEPUSDT_Instance,
          Intermediate_Instance.address,
          liquidityData.amountADesired,
          liquidityData.user
        );
        const beforeLiquidityData = await Intermediate_Instance.getLiquidityData(
          liquidityData.user,
          liquidityData.tokenA
        );
        let beforeReserve = [];
        if (isFirst) {
          const pairContract = await pairInstance();
          beforeReserve = await pairContract.getReserves();
        }
        await Intermediate_Instance.addLiquidityETH(
          [
            liquidityData.router,
            liquidityData.tokenA,
            liquidityData.tokenB,
            liquidityData.amountADesired,
            liquidityData.amountTokenMin,
            liquidityData.amountETHMin,
            liquidityData.user,
            liquidityData.deadline,
            liquidityData.sig,
          ],
          {
            from: liquidityData.user,
            value: liquidityData.amountBDesired,
          }
        );


        const pairContract = await pairInstance();
        const afterReserve = await pairContract.getReserves();

        expect(String((afterReserve[0] / 1e18).toFixed())).equal(
          String(
            (
              (Number(
                beforeReserve[0] == undefined ? Number(0) : beforeReserve[0]
              ) +
                Number(liquidityData.amountADesired)) /
              1e18
            ).toFixed()
          )
        );
        expect(String((afterReserve[1] / 1e18).toFixed())).equal(
          String(
            (
              (Number(
                beforeReserve[1] == undefined ? Number(0) : beforeReserve[1]
              ) +
                Number(Number(liquidityData.amountBDesired))) /
              1e18
            ).toFixed()
          )
        );
        const afterBalanceA = await balanceOf(
          BEPUSDT_Instance,
          liquidityData.user
        );

        const afterBalanceB = await web3.eth.getBalance(liquidityData.user);
        const userLiquidityBalance = await balanceOf(
          pairContract,
          liquidityData.user
        );
        const data = await Intermediate_Instance.getLiquidityData(
          liquidityData.user,
          liquidityData.tokenA
        );
        expect(String(data[0])).equal(String(liquidityData.tokenA));
        expect(String(data[1])).equal(String(liquidityData.tokenB));
        expect(String(((data[2]) / 1e18).toFixed())).equal(
          String(
            ((Number(liquidityData.amountADesired) +
              Number(beforeLiquidityData[2])) / 1e18).toFixed()
          )
        );
        expect(String(Number(((data[3]) / 1e18).toFixed()))).equal(
          String(
            ((Number(liquidityData.amountBDesired) +
              Number(beforeLiquidityData[3])) / 1e18).toFixed()
          )
        );
        expect(String(((data[4]) / 1e18).toFixed())).equal(
          String(((Number(userLiquidityBalance)) / 1e18).toFixed())
        );

        expect(
          String(
            ((Number(afterBalanceA)) / 1e18).toFixed()
          )
        ).equal(
          String(0));
        expect(
          String(
            ((Number(beforeBalanceB) - Number(afterBalanceB)) / 1e18).toFixed()
          )
        ).equal(
          String(Number((liquidityData.amountBDesired / 1e18).toFixed()))
        );
      }

      function liquidityParams(
        router,
        tokenA,
        tokenB,
        amountADesired,
        amountBDesired,
        amountTokenMin,
        amountETHMin,
        user,
        deadline,
        _sig
      ) {
        return {
          router,
          tokenA,
          tokenB,
          amountADesired,
          amountBDesired,
          amountTokenMin,
          amountETHMin,
          user,
          deadline,
          sig: _sig,
        };
      }

      async function getAmountsOut(amountIn, path) {
        const amountOut = await Router_Instance.getAmountsOut(amountIn, path);
        return String(amountOut[1]);
      }
      async function getAmountsIn(amountOut, path) {
        const amountsIn = await Router_Instance.getAmountsIn(amountOut, path);
        return String(amountsIn[0]);
      }
      async function swapExactETHForTokens(
        amountOut,
        amountIn,
        path,
        user,
        beforeBalanceFrom,
        beforeBalanceTo
      ) {
        const deadline = await deadlineTime();
        const sig = await signature(
          Router_Instance.address,
          amountIn,
          amountOut,
          String(path[0]),
          String(path[1]),
          user,
          deadline
        );

        await verifySignature(sig.hash, sig.sig);

        await Intermediate_Instance.swapExactETHForTokens(
          Router_Instance.address,
          amountOut,
          path,
          user,
          deadline,
          sig.sig,
          { from: user, value: amountIn }
        );

        await expectTokensBalance(
          beforeBalanceFrom,
          beforeBalanceTo,
          amountIn,
          amountOut,
          user
        );
      }

      async function swapTokensForExactETH(
        amountOut,
        amountIn,
        path,
        user,
        beforeBalanceFrom,
        beforeBalanceTo
      ) {
        const deadline = await deadlineTime();
        const sig = await signature(
          Router_Instance.address,
          amountIn,
          amountOut,
          String(path[0]),
          String(path[1]),
          user,
          deadline
        );

        await verifySignature(sig.hash, sig.sig);
        await ownerTransfer(BEPUSDT_Instance, user, amountIn);
        await approve(
          BEPUSDT_Instance,
          Intermediate_Instance.address,
          amountIn,
          user
        );
        await Intermediate_Instance.swapTokensForExactETH(
          Router_Instance.address,
          amountOut,
          amountIn,
          path,
          user,
          deadline,
          sig.sig,
          { from: user }
        );
        const afterBalanceFrom = await balanceOf(BEPUSDT_Instance, user);
        const afterBalanceTo = await web3.eth.getBalance(user);
        expect(
          String(
            (
              (Number(beforeBalanceFrom) - Number(afterBalanceFrom)) /
              1e18
            ).toFixed()
          )
        ).equal(String((Number(0) / 1e18).toFixed()));
        expect(
          String(
            (
              (Number(afterBalanceTo) - Number(beforeBalanceTo)) /
              1e18
            ).toFixed()
          )
        ).equal(String((Number(amountOut) / 1e18).toFixed()));
      }
      async function swapExactTokensForETH(
        amountOut,
        amountIn,
        path,
        user,
        beforeBalanceFrom,
        beforeBalanceTo
      ) {
        const deadline = await deadlineTime();
        const sig = await signature(
          Router_Instance.address,
          amountIn,
          amountOut,
          String(path[0]),
          String(path[1]),
          user,
          deadline
        );

        await verifySignature(sig.hash, sig.sig);
        await ownerTransfer(BEPUSDT_Instance, user, amountIn);
        await approve(
          BEPUSDT_Instance,
          Intermediate_Instance.address,
          amountIn,
          user
        );
        await Intermediate_Instance.swapExactTokensForETH(
          Router_Instance.address,
          amountIn,
          amountOut,
          path,
          user,
          deadline,
          sig.sig,
          { from: user }
        );
        const afterBalanceFrom = await balanceOf(BEPUSDT_Instance, user);
        const afterBalanceTo = await web3.eth.getBalance(user);
        expect(
          String(
            (
              (Number(beforeBalanceFrom) - Number(afterBalanceFrom)) /
              1e18
            ).toFixed()
          )
        ).equal(String((Number(0) / 1e18).toFixed()));
        expect(
          String(
            (
              (Number(afterBalanceTo) - Number(beforeBalanceTo)) /
              1e18
            ).toFixed()
          )
        ).equal(String((Number(amountOut) / 1e18).toFixed()));
      }

      async function swapETHForExactTokens(
        amountOut,
        amountIn,
        path,
        user,
        beforeBalanceFrom,
        beforeBalanceTo
      ) {
        const deadline = await deadlineTime();
        const sig = await signature(
          Router_Instance.address,
          amountIn,
          amountOut,
          String(path[0]),
          String(path[1]),
          user,
          deadline
        );

        await verifySignature(sig.hash, sig.sig);

        await Intermediate_Instance.swapETHForExactTokens(
          Router_Instance.address,
          amountOut,
          path,
          user,
          deadline,
          sig.sig,
          {
            from: user,
            value: amountIn,
          }
        );
        const afterBalanceFrom = await web3.eth.getBalance(user);
        const afterBalanceTo = await balanceOf(BEPUSDT_Instance, user);
        expect(
          String(
            (
              (Number(beforeBalanceFrom) - Number(afterBalanceFrom)) /
              1e18
            ).toFixed()
          )
        ).equal(String((Number(amountIn) / 1e18).toFixed()));
        expect(
          String(
            (
              (Number(afterBalanceTo) - Number(beforeBalanceTo)) /
              1e18
            ).toFixed()
          )
        ).equal(String((Number(amountOut) / 1e18).toFixed()));
      }

      function convertAmount(_amount) {
        return String(web3.utils.toWei(String(_amount), "ether"));
      }

      async function expectTokensBalance(
        beforeBalanceFrom,
        beforeBalanceTo,
        expectedAmountA,
        expectedAmountB,
        user
      ) {
        const afterBalanceFrom = await web3.eth.getBalance(user);
        const afterBalanceTo = await balanceOf(BEPUSDT_Instance, user);
        expect(
          String(
            (
              (Number(beforeBalanceFrom) - Number(afterBalanceFrom)) /
              1e18
            ).toFixed()
          )
        ).equal(String((Number(expectedAmountA) / 1e18).toFixed()));
        expect(
          String(
            (
              (Number(afterBalanceTo) - Number(beforeBalanceTo)) /
              1e18
            ).toFixed()
          )
        ).equal(String((Number(expectedAmountB) / 1e18).toFixed()));
      }

      async function pairInstance() {
        const pairAddress = await Factory_Instance.getPair(
          WMETA_Instance.address,
          BEPUSDT_Instance.address
        );
        return await pair.at(pairAddress);
      }

      async function slippageAmount(liquidityAmount) {
        let slippage =
          (Number(liquidityAmount) * Number(0.01e18)) / Number(100e18);
        slippage = String((Number(liquidityAmount) - Number(slippage)) / 1e18);
        return convertAmount(slippage);
      }

      async function removeLiquidityETH(liquidityAmount, user) {
        const deadline = await deadlineTime();
        const beforeBalanceFrom = await web3.eth.getBalance(user);

        const beforeBalanceTo = await balanceOf(BEPUSDT_Instance, user);
        const slippageAmt = await slippageAmount(liquidityAmount);
        const sig = await signature(
          Router_Instance.address,
          slippageAmt,
          "0",
          WMETA_Instance.address,
          BEPUSDT_Instance.address,
          user,
          deadline
        );
        const paramsData = [
          Router_Instance.address,
          Factory_Instance.address,
          BEPUSDT_Instance.address,
          WMETA_Instance.address,
          slippageAmt,
          "0",
          "0",
          user,
          deadline,
          sig.sig,
        ];
        await verifySignature(sig.hash, sig.sig);
        const pairContract = await pairInstance();
        await approve(
          pairContract,
          Router_Instance.address,
          slippageAmt,
          user
        );
        const tx = await Intermediate_Instance.removeLiquidityOnETH(paramsData, {
          from: user,
        });
        const amountETH = String(tx.receipt.logs[0].args.amountETH);
        const amountToken = String(tx.receipt.logs[0].args.amountToken);

        const afterBalanceFrom = await web3.eth.getBalance(user);
        const afterBalanceTo = await balanceOf(BEPUSDT_Instance, user);
        expect(
          String(
            (
              (Number(afterBalanceFrom)) /
              1e18
            ).toFixed()
          )
        ).equal(String(Number(((Number(amountETH) + Number(beforeBalanceFrom)) / 1e18).toFixed())));

        expect(
          String(
            (
              (Number(afterBalanceTo) - Number(beforeBalanceTo)) /
              1e18
            ).toFixed()
          )
        ).equal(String(Number((amountToken / 1e18).toFixed())));
      }

      describe(" ------------ ADD LIQUIDITY ------------ ", function () {
        describe(" ", function () {
          it(" ------- USER - 1 ( USDT - 500 / META 1000 ) [ addLiquidityETH ] ------- ", async () => {
            const user = testAccount(1);
            const router = Router_Instance.address;
            const token0 = BEPUSDT_Instance.address;
            const token1 = WMETA_Instance.address;
            const amount0 = convertAmount(500);
            const amount1 = convertAmount(1000);
            const amount0Min = "0";
            const amount1Min = "0";
            const deadline = await deadlineTime();
            const sig = await signature(
              router,
              amount0,
              amount0Min,
              token0,
              token1,
              user,
              deadline
            );
            await verifySignature(sig.hash, sig.sig);
            const liquidityData = liquidityParams(
              Router_Instance.address,
              BEPUSDT_Instance.address,
              WMETA_Instance.address,
              amount0,
              amount1,
              "0",
              "0",
              user,
              await deadlineTime(),
              sig.sig
            );
            const beforeBalanceA = await balanceOf(BEPUSDT_Instance, user);
            const beforeBalanceB = await web3.eth.getBalance(user);
            await checkLiquidity(
              liquidityData,
              beforeBalanceA,
              beforeBalanceB,
              false
            );
          });
          it(" ------- USER - 1 ( USDT - 1000 / META 1000 ) [ addLiquidityETH ]  ------- ", async () => {
            const user = testAccount(1);
            const router = Router_Instance.address;
            const token0 = BEPUSDT_Instance.address;
            const token1 = WMETA_Instance.address;
            const amount0 = convertAmount(1000);
            const amount1 = convertAmount(1000);
            const amount0Min = "0";
            const amount1Min = "0";
            const deadline = await deadlineTime();
            const sig = await signature(
              router,
              amount0,
              amount0Min,
              token0,
              token1,
              user,
              deadline
            );
            await verifySignature(sig.hash, sig.sig);
            const liquidityData = liquidityParams(
              Router_Instance.address,
              BEPUSDT_Instance.address,
              WMETA_Instance.address,
              amount0,
              amount1,
              "0",
              "0",
              user,
              await deadlineTime(),
              sig.sig
            );
            const beforeBalanceA = await balanceOf(BEPUSDT_Instance, user);
            const beforeBalanceB = await web3.eth.getBalance(user);
            await checkLiquidity(
              liquidityData,
              beforeBalanceA,
              beforeBalanceB,
              true
            );
          });
          it(" ------- USER - 2 ( USDT - 10000 / META 50 ) [ addLiquidityETH ]  ------- ", async () => {
            const user = testAccount(2);
            const router = Router_Instance.address;
            const token0 = BEPUSDT_Instance.address;
            const token1 = WMETA_Instance.address;
            const amount0 = convertAmount(10000);
            const amount1 = convertAmount(50);
            const amount0Min = "0";
            const amount1Min = "0";
            const deadline = await deadlineTime();
            const sig = await signature(
              router,
              amount0,
              amount0Min,
              token0,
              token1,
              user,
              deadline
            );
            await verifySignature(sig.hash, sig.sig);
            const liquidityData = liquidityParams(
              Router_Instance.address,
              BEPUSDT_Instance.address,
              WMETA_Instance.address,
              amount0,
              amount1,
              "0",
              "0",
              user,
              await deadlineTime(),
              sig.sig
            );
            const beforeBalanceA = await balanceOf(BEPUSDT_Instance, user);
            const beforeBalanceB = await web3.eth.getBalance(user);
            await checkLiquidity(
              liquidityData,
              beforeBalanceA,
              beforeBalanceB,
              true
            );
          });
          it(" ------- USER - 3 ( USDT - 10 / META 5000 ) [ addLiquidityETH ]  ------- ", async () => {
            const user = testAccount(3);
            const router = Router_Instance.address;
            const token0 = BEPUSDT_Instance.address;
            const token1 = WMETA_Instance.address;
            const amount0 = convertAmount(10);
            const amount1 = convertAmount(5000);
            const amount0Min = "0";
            const amount1Min = "0";
            const deadline = await deadlineTime();
            const sig = await signature(
              router,
              amount0,
              amount0Min,
              token0,
              token1,
              user,
              deadline
            );
            await verifySignature(sig.hash, sig.sig);
            const liquidityData = liquidityParams(
              Router_Instance.address,
              BEPUSDT_Instance.address,
              WMETA_Instance.address,
              amount0,
              amount1,
              "0",
              "0",
              user,
              await deadlineTime(),
              sig.sig
            );
            const beforeBalanceA = await balanceOf(BEPUSDT_Instance, user);
            const beforeBalanceB = await web3.eth.getBalance(user);
            await checkLiquidity(
              liquidityData,
              beforeBalanceA,
              beforeBalanceB,
              true
            );
          });
          it(" ------- USER - 4 ( USDT - 100000 / META 5000 ) [ addLiquidityETH ]  ------- ", async () => {
            const user = testAccount(4);
            const router = Router_Instance.address;
            const token0 = BEPUSDT_Instance.address;
            const token1 = WMETA_Instance.address;
            const amount0 = convertAmount(100000);
            const amount1 = convertAmount(5000);
            const amount0Min = "0";
            const amount1Min = "0";
            const deadline = await deadlineTime();
            const sig = await signature(
              router,
              amount0,
              amount0Min,
              token0,
              token1,
              user,
              deadline
            );
            await verifySignature(sig.hash, sig.sig);
            const liquidityData = liquidityParams(
              Router_Instance.address,
              BEPUSDT_Instance.address,
              WMETA_Instance.address,
              amount0,
              amount1,
              "0",
              "0",
              user,
              await deadlineTime(),
              sig.sig
            );
            const beforeBalanceA = await balanceOf(BEPUSDT_Instance, user);
            const beforeBalanceB = await web3.eth.getBalance(user);
            await checkLiquidity(
              liquidityData,
              beforeBalanceA,
              beforeBalanceB,
              true
            );
          });
          it(" ------- USER - 5 ( USDT - 100000 / META 9000 ) [ addLiquidityETH ]  ------- ", async () => {
            const user = testAccount(5);
            const router = Router_Instance.address;
            const token0 = BEPUSDT_Instance.address;
            const token1 = WMETA_Instance.address;
            const amount0 = convertAmount(100000);
            const amount1 = convertAmount(9000);
            const amount0Min = "0";
            const amount1Min = "0";
            const deadline = await deadlineTime();
            const sig = await signature(
              router,
              amount0,
              amount0Min,
              token0,
              token1,
              user,
              deadline
            );
            await verifySignature(sig.hash, sig.sig);
            const liquidityData = liquidityParams(
              Router_Instance.address,
              BEPUSDT_Instance.address,
              WMETA_Instance.address,
              amount0,
              amount1,
              "0",
              "0",
              user,
              await deadlineTime(),
              sig.sig
            );
            const beforeBalanceA = await balanceOf(BEPUSDT_Instance, user);
            const beforeBalanceB = await web3.eth.getBalance(user);
            await checkLiquidity(
              liquidityData,
              beforeBalanceA,
              beforeBalanceB,
              true
            );
          });
        });
      });

      describe(" ------------ SWAP TOKENS ------------ ", function () {
        describe(" ", function () {
          it(" ------- USER - 6 ( USDT - 50 / META - 100 ) [ swapExactTokensForETH ] ------- ", async () => {
            const user = testAccount(6);
            const amountIn = convertAmount(50);
            const amountOut = convertAmount(100);
            const path = [BEPUSDT_Instance.address, WMETA_Instance.address];
            const beforeBalanceFrom = await balanceOf(BEPUSDT_Instance, user);
            const beforeBalanceTo = await web3.eth.getBalance(user);
            await swapExactTokensForETH(
              amountOut,
              amountIn,
              path,
              user,
              beforeBalanceFrom,
              beforeBalanceTo
            );

          });
          it(" ------- USER - 7 ( META - 1000 / USDT - 1 ) [ swapETHForExactTokens ] ------- ", async () => {
            const user = testAccount(7);
            const amountIn = convertAmount(1000);
            const amountOut = convertAmount(1);
            const path = [WMETA_Instance.address, BEPUSDT_Instance.address];
            const beforeBalanceFrom = await web3.eth.getBalance(user);
            const beforeBalanceTo = await balanceOf(BEPUSDT_Instance, user);

            await swapETHForExactTokens(
              amountOut,
              amountIn,
              path,
              user,
              beforeBalanceFrom,
              beforeBalanceTo
            );

          });
          it(" ------- USER - 8 ( META - 1 / USDT - 1000 ) [ swapExactETHForTokens ] ------- ", async () => {
            const user = testAccount(8);
            const amountIn = convertAmount(1);
            const amountOut = convertAmount(1000);
            const path = [WMETA_Instance.address, BEPUSDT_Instance.address];
            const beforeBalanceFrom = await web3.eth.getBalance(user);
            const beforeBalanceTo = await balanceOf(BEPUSDT_Instance, user);

            await swapExactETHForTokens(
              amountOut,
              amountIn,
              path,
              user,
              beforeBalanceFrom,
              beforeBalanceTo
            );

          });
          it(" ------- USER - 9 (  META - 2 / USDT - 1 ) [ swapETHForExactTokens ] ------- ", async () => {
            const user = testAccount(9);
            const amountIn = convertAmount(2);
            const amountOut = convertAmount(1);
            const path = [WMETA_Instance.address, BEPUSDT_Instance.address];
            const beforeBalanceFrom = await web3.eth.getBalance(user);
            const beforeBalanceTo = await balanceOf(BEPUSDT_Instance, user);

            await swapETHForExactTokens(
              amountOut,
              amountIn,
              path,
              user,
              beforeBalanceFrom,
              beforeBalanceTo
            );

          });
        });
      });

      describe(" ------------ REMOVE LIQUIDITY ------------ ", function () {
        describe(" ", function () {
          it(" ------- USER - 1 ( USDT - 750 / META 1000 ) [ removeLiquidityOnETH ] ------- ", async () => {
            // await time.increase(time.duration.years(1));
            const user = testAccount(1);
            const pairContract = await pairInstance();
            const liquidityBalance = String(Number(await balanceOf(pairContract, user)) / Number(2));

            await removeLiquidityETH(liquidityBalance, user);
          });
          it(" ------- USER - 1 ( 100% LP ) [ removeLiquidityOnETH ] ------- ", async () => {
            const user = testAccount(1);
            const pairContract = await pairInstance();
            const liquidityBalance = String(Number(await balanceOf(pairContract, user)));

            await removeLiquidityETH(liquidityBalance, user);
          });
          it(" ------- USER - 2 ( 100% LP ) [ removeLiquidityOnETH ] ------- ", async () => {
            const user = testAccount(2);
            const pairContract = await pairInstance();
            const liquidityBalance = String(Number(await balanceOf(pairContract, user)));

            await removeLiquidityETH(liquidityBalance, user);
          });
          it(" ------- USER - 3 ( 100% LP ) [ removeLiquidityOnETH ] ------- ", async () => {
            const user = testAccount(3);
            const pairContract = await pairInstance();
            const liquidityBalance = String(Number(await balanceOf(pairContract, user)));

            await removeLiquidityETH(liquidityBalance, user);
          });
          it(" ------- USER - 4 ( 100% LP ) [ removeLiquidityOnETH ] ------- ", async () => {
            const user = testAccount(4);
            const pairContract = await pairInstance();
            const liquidityBalance = String(Number(await balanceOf(pairContract, user)));

            await removeLiquidityETH(liquidityBalance, user);
          });
          it(" ------- USER - 5 ( 100% LP ) [ removeLiquidityOnETH ] ------- ", async () => {
            const user = testAccount(5);
            const pairContract = await pairInstance();
            const liquidityBalance = String(Number(await balanceOf(pairContract, user)));
            await removeLiquidityETH(liquidityBalance, user);
          });

        });
      });


    });
  });
});