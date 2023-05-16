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
  const [owner] = await hre.ethers.getSigners();

  // We get the contract to deploy.
  const LotterySystem = await hre.ethers.getContractFactory("LotterySystem");
  const lotterySystem = LotterySystem.attach("0x17EaD498653439eE2b79e36E4a5CFb2483Ad4929");

  // Check balances before the ticket purchases.
  const addresses = [owner.address, lotterySystem.address];
  console.log("== start ==");
  await printBalances(addresses);

  // Buy some shares.
  const numShares = {value: 10};
  await lotterySystem.connect(owner).buyTicketShares(numShares);

  // Check balances after the ticket purchases.
  console.log("== bought tickets ==");
  await printBalances(addresses);

  // Pay out
  await lotterySystem.connect(owner).initiateLottery({
    gasLimit: 100000
  });

  // Check balances after lottery ends.
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
