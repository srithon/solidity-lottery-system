const hre = require("hardhat");

// Returns the Ether balance of a given address.
async function getBalance(address) {
  const balanceBigInt = await hre.ethers.provider.getBalance(address);
  return hre.ethers.utils.formatEther(balanceBigInt);
}

// Logs the Ether balances for a list of addresses.
async function printBalances(addresses) {
  let idx = 0;
  for (const address of addresses) {
    console.log(`Address ${idx} balance: `, await getBalance(address));
    idx ++;
  }
}

async function main() {
  // Get the example accounts we'll be working with.
  const [owner, buyer, buyer2, buyer3] = await hre.ethers.getSigners();

  // We get the contract to deploy.
  const LotterySystem = await hre.ethers.getContractFactory("LotterySystem");
  const lotterySystem = await LotterySystem.deploy();

  // Deploy the contract.
  await lotterySystem.deployed();
  console.log("LotterySystem deployed to:", lotterySystem.address);

  // Check balances before the ticket purchases.
  const addresses = [owner.address, buyer.address, lotterySystem.address];
  console.log("== start ==");
  await printBalances(addresses);

  // Buy some shares.
  const numShares = {value: hre.ethers.utils.parseEther("1")};
  await lotterySystem.connect(buyer).buyTicketShares(numShares);
  await lotterySystem.connect(buyer2).buyTicketShares(numShares);
  await lotterySystem.connect(buyer3).buyTicketShares(numShares);

  // Check balances after the ticket purchases.
  console.log("== bought tickets ==");
  await printBalances(addresses);

  // Pay out
  await lotterySystem.connect(owner).initiateLottery();

  // Check balances after lottery ends.
  console.log("== withdrawTips ==");
  await printBalances(addresses);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
