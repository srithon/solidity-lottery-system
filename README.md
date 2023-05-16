# Solidity Lottery System

This project is a smart contract designed to run on the Ethereum blockchain, implemented in Solidity. It models a Lottery system where users can buy lottery shares, with each share being equivalent to one wei. The contract allows the contract holder to initiate the lottery, and the contract will request a random number from [ChainLink VRF](https://docs.chain.link/vrf/v2/introduction) in order to ensure a fair selection process.

## Functionality

- Users can purchase lottery shares by sending a specified amount of Ether to the contract.
- When the contract holder decides to run the lottery, the contract will utilize ChainLink VRF to obtain a random number.
   - In order to interact with ChainLink, the contract must be loaded up with [LINK tokens](https://docs.chain.link/resources/link-token-contracts)
- Based on the number of shares held by each participant, the contract will determine a winner.
- The contract will distribute the winnings, paying out half of the contract's balance to the winner and the other half to the contract owner.

## Motivation

This project was created as the final project for CMSC398F at the University of Maryland. Its purpose is to demonstrate the implementation of a decentralized lottery system on the Ethereum blockchain, utilizing smart contracts and external oracles like ChainLink VRF.

## Getting Started

To deploy and interact with the contract, follow these steps:

1. Clone the repository:
   ```
   git clone https://github.com/srithon/solidity-lottery-system.git && cd solidity-lottery-system
   ```

2. Install the necessary dependencies:
   ```
   npm install
   ```

3. Supply `GOERLI_URL`, `GOERLI_API_KEY`, and `PRIVATE_KEY` in a `.env` file at the root
   ```
   vi .env
   ```

4. Deploy the smart contract to the desired Ethereum network:
   ```
   npx hardhat run scripts/deploy.js --network <network-name>
   ```

5. Update the hardcoded contract address in `test-lottery-live.js`, and then run the test script on the desired network:
   ```
   vi scripts/test-lottery-live.js && npx hardhat run scripts/test-lottery-live.js --network <network-name>
   ```

## License

This project is licensed under the [MIT License](LICENSE). Feel free to use, modify, and distribute the code for personal and commercial purposes.
