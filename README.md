# Pancake-Dex
🥞 PancakeSwap Clone – Custom DEX with Admin-Controlled Unstable Pools

# 🥞 PancakeSwap-Clone DEX (Hardhat Implementation)

A custom PancakeSwap-inspired decentralized exchange (DEX) built solely with Hardhat and Solidity. This implementation features **unstable pools** (custom price curves) and **admin-adjustable ratios**, allowing dynamic liquidity management and experimental DeFi scenarios. No frontend or React code—just the smart contracts, tests, and deployment scripts.

---

## 📖 Table of Contents

1. [Overview](#overview)  
2. [Key Features](#key-features)  
3. [Tech Stack & Prerequisites](#tech-stack--prerequisites)  
4. [Installation & Setup](#installation--setup)  
5. [Configuration](#configuration)  
6. [Smart Contract Structure](#smart-contract-structure)  
7. [Running Tests](#running-tests)  
8. [Deployment](#deployment)  
9. [Admin Operations](#admin-operations)  
10. [Adding & Removing Liquidity](#adding--removing-liquidity)  
11. [Swap Workflow](#swap-workflow)  
12. [License](#license)  

---

## 📝 Overview

This repository contains a Hardhat-based implementation of a decentralized exchange protocol that mimics PancakeSwap, with two standout enhancements:

1. **Unstable Pools**  
   - Pools use custom, non-linear price curves instead of the standard constant-product formula (`x * y = k`).  
   - You can plug in an external oracle or implement a bespoke bonding curve.

2. **Admin-Adjustable Ratios**  
   - The contract owner (admin) can adjust pool weights, token ratios, and swap fees on the fly.  
   - This flexibility allows for experimental markets, pegged assets, or controlled liquidity environments.

---

## ✨ Key Features

- **Swap Engine**  
  - Users can swap Token A ↔ Token B via an automated market maker (AMM).  
  - Price calculation follows a custom curve rather than `x*y = k`.

- **Unstable Pool Logic**  
  - Integrate a mathematical bonding curve or price oracle.  
  - Example: `price = a * (reserveA^n) / (reserveB^m)` or an Oracle-based rate.

- **Admin-Adjustable Parameters**  
  - `setPoolWeight(uint256 newWeight)`  
  - `setSwapFee(uint256 newFeeBasisPoints)`  
  - `setCustomCurveParams(...)`  
  - Only the contract owner can call these functions.

- **Liquidity Management**  
  - `addLiquidity(...)` mints LP tokens to providers.  
  - `removeLiquidity(...)` burns LP tokens and returns underlying assets.

- **Access Control**  
  - `Ownable`-based admin functions.  
  - Non-admins cannot modify sensitive parameters.

- **Automated Testing**  
  - Comprehensive Hardhat tests covering swaps, liquidity, and admin flows.  
  - Uses `chai` assertions and `ethers.js` for contract interaction.

---

## 🛠 Tech Stack & Prerequisites

- **Node.js** v16+  
- **npm** or **Yarn** (package manager)  
- **Hardhat** v2.0+  
- **Solidity** ^0.8.0  
- **Ethers.js** v5.x  
- **Chai** for assertions  

Make sure you have these installed before proceeding.

---

## ⚙️ Installation & Setup

1. **Clone the repository**
   ```bash
   git clone (https://github.com/Sarvan18/Pancake-Dex.git
   cd Pancake-Dex

2. **Install dependencies **
```bash
npm install
# or
yarn install
```
3. **RUN Hardhat**
```bash
npx hardhat test
```


