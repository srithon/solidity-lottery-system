// scripts/deploy.js

const hre = require("hardhat");

async function main() {
  // We get the contract to deploy.
  const LotterySystem = await hre.ethers.getContractFactory("LotterySystem");
  const lotterySystem = await LotterySystem.deploy();

  await lotterySystem.deployed();

  console.log("LotterySystem deployed to:", lotterySystem.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

