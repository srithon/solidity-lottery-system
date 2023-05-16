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

// Logs the memos stored on-chain from coffee purchases.
async function printMemos(memos) {
  for (const memo of memos) {
    const timestamp = memo.timestamp;
    const tipper = memo.name;
    const tipperAddress = memo.from;
    const message = memo.message;
    console.log(`At ${timestamp}, ${tipper} (${tipperAddress}) said: "${message}"`);
  }
}

async function main() {
  // Get the example accounts we'll be working with.
  const [owner, tipper, tipper2, tipper3] = await hre.ethers.getSigners();

  // let's deploy our mock vrf coordinator contract
  const VRFCoordinatorV2Mock = await hre.ethers.getContractFactory("VRFCoordinatorV2Mock");
  // https://docs.chain.link/vrf/v2/subscription/examples/test-locally#deploy-vrfcoordinatorv2mock
  const vrfCoordinatorV2Mock = await VRFCoordinatorV2Mock.deploy(1000000000000000, 1000000000);

  // let's deploy our mock oracle price feed
  const MockV3Aggregator = await hre.ethers.getContractFactory("MockV3Aggregator");
  const mockV3Aggregator = await MockV3Aggregator.deploy(18, 3000000000000000);

  // let's deploy the link token contract, which allows us to directly fund our VRF requests
  const LinkToken = await hre.ethers.getContractFactory("LinkToken");
  const linkToken = await LinkToken.deploy();

  const VRFV2Wrapper = await hre.ethers.getContractFactory("VRFV2Wrapper");
  const vrfV2Wrapper = await VRFV2Wrapper.deploy(linkToken.address, mockV3Aggregator.address, vrfCoordinatorV2Mock.address);

  // We get the contract to deploy.
  const LotterySystem = await hre.ethers.getContractFactory("LotterySystem");
  const lotterySystemInstance = await LotterySystem.deploy(linkToken.address, vrfV2Wrapper.address);

  // Deploy the contract.
  await lotterySystemInstance.deployed();
  console.log("LotterySystem deployed to:", lotterySystemInstance.address);

  // Check balances before the coffee purchase.
  const addresses = [owner.address, tipper.address, lotterySystemInstance.address];
  console.log("== start ==");
  await printBalances(addresses);

  // const lotterySystemInstance = await lotterySystem.connect(owner).CreateNewLotterySystem(mockLinkToken.address, VRFCoordinatorV2Mock.address);

  // Buy the owner a few coffees.
  const tip = {value: hre.ethers.utils.parseEther("1")};
  await lotterySystemInstance.connect(tipper).buyTicketShares(tip);
  await lotterySystemInstance.connect(tipper2).buyTicketShares(tip);
  await lotterySystemInstance.connect(tipper3).buyTicketShares(tip);

  // Check balances after the coffee purchase.
  console.log("== bought coffee ==");
  await printBalances(addresses);

  // Withdraw.
  await lotterySystemInstance.connect(owner).initiateLottery();

  // Check balances after withdrawal.
  console.log("== withdrawTips ==");
  await printBalances(addresses);

  // Check out the memos.
  // console.log("== memos ==");
  // const memos = await lotterySystemInstance.getMemos();
  // printMemos(memos);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
