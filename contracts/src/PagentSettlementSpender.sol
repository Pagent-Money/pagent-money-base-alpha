// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title PagentSettlementSpender
 * @dev Single entrypoint spender contract for Pagent credit card settlements
 * @dev Executes spend pipeline exactly as returned by prepareSpendCallData from Spend Permission Manager
 * @dev Handles authorization verification, replay protection, and treasury fund management
 * @dev Supports pausable operations and authorized spender management for enhanced security
 */
contract PagentSettlementSpender is Ownable, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;

    // Events
    event Charged(
        address indexed user,
        address indexed token,
        uint256 amount,
        bytes32 indexed authId,
        string merchant,
        uint256 timestamp
    );

    event TreasuryUpdated(address indexed oldTreasury, address indexed newTreasury);
    event AuthorizedSpenderUpdated(address indexed spender, bool authorized);

    // State variables
    address public treasury;
    mapping(address => bool) public authorizedSpenders;
    mapping(bytes32 => bool) public processedAuths;

    // Custom errors
    error UnauthorizedSpender();
    error AuthAlreadyProcessed(bytes32 authId);
    error InvalidAmount();
    error InvalidAuthId();
    error TreasuryTransferFailed();
    error SpendCallFailed(bytes data);

    constructor(
        address initialOwner,
        address _treasury,
        address _authorizedSpender
    ) Ownable(initialOwner) {
        treasury = _treasury;
        authorizedSpenders[_authorizedSpender] = true;
        
        emit TreasuryUpdated(address(0), _treasury);
        emit AuthorizedSpenderUpdated(_authorizedSpender, true);
    }

    modifier onlyAuthorizedSpender() {
        if (!authorizedSpenders[msg.sender]) {
            revert UnauthorizedSpender();
        }
        _;
    }

    /**
     * @dev Main charge function that executes the spend pipeline
     * @param calls Array of call data prepared by prepareSpendCallData
     * @param token The token being spent (typically USDC)
     * @param amount Amount being charged
     * @param authId Unique identifier for this authorization from card vendor
     * @param merchant Merchant identifier
     * @param user The user whose spend permission is being used
     * 
     * 主要的收费函数，执行支出管道
     */
    function charge(
        bytes[] calldata calls,
        address token,
        uint256 amount,
        bytes32 authId,
        string calldata merchant,
        address user
    ) external onlyAuthorizedSpender nonReentrant whenNotPaused {
        if (amount == 0) revert InvalidAmount();
        if (authId == bytes32(0)) revert InvalidAuthId();
        if (processedAuths[authId]) revert AuthAlreadyProcessed(authId);

        // Mark auth as processed to prevent replay
        processedAuths[authId] = true;

        // Get balance before executing calls
        uint256 balanceBefore = IERC20(token).balanceOf(address(this));

        // Execute all prepared calls in sequence
        for (uint256 i = 0; i < calls.length; i++) {
            (bool success, bytes memory returnData) = address(this).call(calls[i]);
            if (!success) {
                revert SpendCallFailed(returnData);
            }
        }

        // Verify we received the expected amount
        uint256 balanceAfter = IERC20(token).balanceOf(address(this));
        uint256 received = balanceAfter - balanceBefore;
        
        if (received < amount) {
            revert InvalidAmount();
        }

        // Forward to treasury if configured
        if (treasury != address(0) && received > 0) {
            IERC20(token).safeTransfer(treasury, received);
        }

        emit Charged(user, token, amount, authId, merchant, block.timestamp);
    }

    /**
     * @dev Simplified charge function for direct spend permission usage
     * @param permission The spend permission data
     * @param amount Amount to charge
     * @param authId Unique authorization ID
     * @param merchant Merchant identifier
     * 
     * 简化的收费函数，用于直接使用支出权限
     */
    function chargeSimple(
        bytes calldata permission,
        uint256 amount,
        bytes32 authId,
        string calldata merchant
    ) external onlyAuthorizedSpender nonReentrant whenNotPaused {
        if (amount == 0) revert InvalidAmount();
        if (authId == bytes32(0)) revert InvalidAuthId();
        if (processedAuths[authId]) revert AuthAlreadyProcessed(authId);

        // Mark auth as processed
        processedAuths[authId] = true;

        // This would integrate with the actual Spend Permission Manager
        // For now, we emit the event to track the charge
        // In production, this would call the spend permission contract
        
        emit Charged(msg.sender, address(0), amount, authId, merchant, block.timestamp);
    }

    // Admin functions

    /**
     * @dev Update treasury address
     * @param newTreasury New treasury address
     */
    function setTreasury(address newTreasury) external onlyOwner {
        address oldTreasury = treasury;
        treasury = newTreasury;
        emit TreasuryUpdated(oldTreasury, newTreasury);
    }

    /**
     * @dev Authorize or deauthorize a spender
     * @param spender Spender address
     * @param authorized Whether to authorize the spender
     */
    function setAuthorizedSpender(address spender, bool authorized) external onlyOwner {
        authorizedSpenders[spender] = authorized;
        emit AuthorizedSpenderUpdated(spender, authorized);
    }

    /**
     * @dev Pause the contract
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @dev Unpause the contract
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    /**
     * @dev Emergency withdraw function
     * @param token Token to withdraw
     * @param amount Amount to withdraw
     */
    function emergencyWithdraw(address token, uint256 amount) external onlyOwner {
        IERC20(token).safeTransfer(owner(), amount);
    }

    /**
     * @dev Check if an auth ID has been processed
     * @param authId Authorization ID to check
     * @return Whether the auth has been processed
     */
    function isAuthProcessed(bytes32 authId) external view returns (bool) {
        return processedAuths[authId];
    }
}
