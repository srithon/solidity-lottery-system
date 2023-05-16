//SPDX-License-Identifier: Unlicense

// contracts/BuyMeACoffee.sol
pragma solidity ^0.8.0;

import "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";
import "@chainlink/contracts/src/v0.8/VRFV2WrapperConsumerBase.sol";

// We are not using this in here, but we need to have it so that HardHat will generator an artifact for it.
// See https://ethereum.stackexchange.com/questions/114376/how-to-compile-external-contracts-using-hardhat
import "@chainlink/contracts/src/v0.8/mocks/VRFCoordinatorV2Mock.sol";
import "@chainlink/contracts/src/v0.8/tests/MockV3Aggregator.sol";
import "@chainlink/contracts/src/v0.4/LinkToken.sol";
import "@chainlink/contracts/src/v0.8/VRFV2Wrapper.sol";

// Switch this to your own contract address once deployed, for bookkeeping!
// Example Contract Address on Goerli: 0xDBa03676a2fBb6711CB652beF5B7416A53c1421D

contract LotterySystem is VRFV2WrapperConsumerBase {
    // Event to emit when a Memo is created.
    event NewTransaction(
        address indexed purchaser,
        uint256 timestamp,
        uint numShares
    );

    // Event to emit when a winner is chosen, and prize money is dispersed.
    event WinnerChosen(
        address indexed winner,
        uint256 timestamp,
        uint256 winAmount
    );

    // The subscription ID that this contract uses for funding
    // requests. Initialized in the constructor.
    uint64 s_subscriptionId;

    // The address of the Chainlink VRF Coordinator contract.
    address vrfCoordinatorWrapper = 0x708701a1DfF4f478de54383E49a627eD4852C816;
    // The address of the LINK token contract.
    address linkToken = 0x326C977E6efc84E512bB9C30f76E30c160eD06FB;

    // The gas lane key hash value, which is the maximum gas price
    // you are willing to pay for a request in wei. It functions
    // as an ID of the off-chain VRF job that runs in response to
    // requests.
    bytes32 s_keyHash = 0x79d3d8832d904592c0bf9818b621522c988bb8b0c05cdc3b15aea1b6e8db0c15;
    // The limit for how much gas to use for the callback request
    // to your contract's fulfillRandomWords function. It must be
    // less than the maxGasLimit on the coordinator contract.
    // Adjust this value for larger requests depending on how your
    // fulfillRandomWords function processes and stores the
    // received random values. If your callbackGasLimit is not
    // sufficient, the callback will fail and your subscription is
    // still charged for the work done to generate your requested
    // random values.
    uint16 callbackGasLimit = 40000;
    // How many confirmations the Chainlink node should wait
    // before responding. The longer the node waits, the more
    // secure the random value is. It must be greater than the
    // minimumRequestBlockConfirmations limit on the coordinator
    // contract.
    uint16 requestConfirmations = 3;
    // How many random values to request. If you can use several
    // random values in a single callback, you can reduce the
    // amount of gas that you spend per random value. In this
    // example, each transaction requests one random value.
    uint32 numWords =  1;

    // Address of contract deployer. Marked payable so that
    // we can withdraw to this address later.
    address payable owner;

    // Maps users to number of hsares.
    mapping (address => uint256) ticketSharesPerUser;
    // Maps index of user to their address.
    mapping (uint256 => address) shareHolders;

    // Keeps track of the number of share holders, for use with
    // indexing.
    uint32 numShareHolders;

    // Keeps track of the total number of shares; this is an
    // optimization for when we draw the lottery.
    uint numShares;

    // Used for synchronization; we cannot run another lottery
    // while a winner is actively being chosen.
    bool lotteryInitiated;

    constructor(address _linkToken, address _vrfCoordinatorWrapper) VRFV2WrapperConsumerBase(_linkToken, _vrfCoordinatorWrapper) {
        // Store the address of the deployer as a payable address.
        // When we withdraw funds, we'll withdraw here.
        owner = payable(msg.sender);

        numShareHolders = 0;
        numShares = 0;
        lotteryInitiated = false;
    }

    /**
     * @dev buy 1 ticket share for every wei sent
     */
    function buyTicketShares() public payable {
        // Must accept more than 0 ETH for a coffee.
        require(msg.value > 0, "can't buy ticket shares with no money!");

        ticketSharesPerUser[msg.sender] += msg.value;
        numShares += uint(msg.value);

        bool doAddHolder = true;
        for (uint index = 0; index < numShareHolders; index += 1) {
            // see if it's equal to the address
            if (shareHolders[index] == msg.sender) {
                doAddHolder = false;
                break;
            }
        }

        if (doAddHolder) {
            // Add the holder.
            shareHolders[numShareHolders] = msg.sender;
            numShareHolders += 1;
        }

        // Emit a NewMemo event with details about the memo.
        emit NewTransaction(
            msg.sender,
            block.timestamp,
            msg.value
        );
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Only the owner can run this function!");
        _;
    }

    /**
    * @dev choose a random winner from the list of participants based on the
    * number of shares they hold. Then, pay half of the prize money to that
    * winner and pay the rest to the contract owner.
    */
    function initiateLottery() public onlyOwner {
        require(numShares > 0, "Must have people in the lottery to draw");
        require(!lotteryInitiated, "Already started lottery");
        lotteryInitiated = true;

        // To get random numbers, we need to use ChainLink
        // Will revert if subscription is not set and funded.
        requestRandomness(
            callbackGasLimit,
            requestConfirmations,
            numWords
        );
    }

    function fulfillRandomWords(uint256 _requestId, uint256[] memory _randomWords) internal override {
        uint winnerShareIndex = _randomWords[0] % numShares;
        // now, let's go through
        for (uint index = 0; index < numShares; index += 1) {
            address winnerUser = shareHolders[index];
            winnerShareIndex -= uint(ticketSharesPerUser[winnerUser]);

            if (winnerShareIndex < 0) {
                // this is the winner!
                address winnerAddress = shareHolders[index];

                // let's pay the amount.
                uint prizeMoney = address(this).balance / 2;
                require(payable(winnerAddress).send(prizeMoney));

                // now, let's send the rest of the money to the
                // owner of the contract.
                require(owner.send(address(this).balance));

                emit WinnerChosen(winnerAddress, block.timestamp, prizeMoney);
            }
        }

        lotteryInitiated = false;
    }
}
