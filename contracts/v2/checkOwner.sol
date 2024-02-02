//SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;
import 'hardhat/console.sol';

contract isItMine {
    address owner;

    constructor(address _owner) {
        owner = _owner;
    }

    function checkOwner() public view returns (address) {
        return owner;
    }
}
