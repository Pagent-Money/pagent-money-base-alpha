// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "forge-std/Script.sol";
import "../src/PagentSettlementSpender.sol";
import "../src/CreditRegistry.sol";

/**
 * @title Deploy script for Pagent contracts
 * @dev Deploys PagentSettlementSpender and CreditRegistry contracts
 * 
 * 部署 Pagent 合约的脚本
 */
contract DeployScript is Script {
    
    // Configuration
    address constant TREASURY_ADDRESS = 0x1234567890123456789012345678901234567890; // Replace with actual treasury
    address constant INITIAL_SPENDER = 0x2345678901234567890123456789012345678901; // Replace with backend wallet
    
    function run() external {
        // Use string and parse manually to handle hex format
        string memory pkString = vm.envString("PRIVATE_KEY");
        uint256 deployerPrivateKey = vm.parseUint(string(abi.encodePacked("0x", pkString)));
        address deployer = vm.addr(deployerPrivateKey);
        
        console.log("Deploying contracts with deployer:", deployer);
        console.log("Deployer balance:", deployer.balance);
        
        vm.startBroadcast(deployerPrivateKey);
        
        // Deploy PagentSettlementSpender
        PagentSettlementSpender spender = new PagentSettlementSpender(
            deployer,          // initial owner
            TREASURY_ADDRESS,  // treasury
            INITIAL_SPENDER   // authorized spender
        );
        
        console.log("PagentSettlementSpender deployed at:", address(spender));
        
        // Deploy CreditRegistry
        CreditRegistry registry = new CreditRegistry(deployer);
        
        console.log("CreditRegistry deployed at:", address(registry));
        
        // Authorize the spender contract to update the registry
        registry.setAuthorizedUpdater(address(spender), true);
        registry.setAuthorizedUpdater(INITIAL_SPENDER, true);
        
        console.log("Registry authorization complete");
        
        vm.stopBroadcast();
        
        // Verification commands
        console.log("\nVerification commands:");
        console.log("forge verify-contract", address(spender), "src/PagentSettlementSpender.sol:PagentSettlementSpender");
        console.log("forge verify-contract", address(registry), "src/CreditRegistry.sol:CreditRegistry");
    }
}
