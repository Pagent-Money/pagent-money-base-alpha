// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title CreditRegistry
 * @dev Optional contract to mirror period usage for analytics and guardrails
 * @dev Provides a consistent view of spend permission usage across periods
 * 
 * 可选的合约，用于镜像周期使用情况，用于分析和护栏
 * 提供跨周期支出权限使用的一致视图
 */
contract CreditRegistry is Ownable, ReentrancyGuard {
    
    // Structs
    struct UserCredit {
        uint256 totalLimit;      // Total credit limit for the period
        uint256 usedAmount;      // Amount used in current period
        uint256 periodStart;     // Start of current period
        uint256 periodDuration;  // Duration of the period in seconds
        bool isActive;           // Whether credit is currently active
    }

    struct CreditUpdate {
        address user;
        uint256 amount;
        uint256 timestamp;
        string authId;
        string merchant;
    }

    // Events
    event CreditInitialized(
        address indexed user,
        uint256 totalLimit,
        uint256 periodDuration,
        uint256 periodStart
    );

    event CreditUsed(
        address indexed user,
        uint256 amount,
        uint256 remainingCredit,
        string authId,
        string merchant,
        uint256 timestamp
    );

    event CreditPeriodReset(
        address indexed user,
        uint256 newPeriodStart,
        uint256 totalLimit
    );

    event CreditLimitUpdated(
        address indexed user,
        uint256 oldLimit,
        uint256 newLimit
    );

    event CreditRevoked(address indexed user, uint256 timestamp);

    // State variables
    mapping(address => UserCredit) public userCredits;
    mapping(address => CreditUpdate[]) public userCreditHistory;
    mapping(address => bool) public authorizedUpdaters;

    // Constants
    uint256 public constant WEEK_IN_SECONDS = 7 days;
    uint256 public constant MAX_CREDIT_LIMIT = 10000e6; // 10,000 USDC with 6 decimals

    // Custom errors
    error UnauthorizedUpdater();
    error InsufficientCredit(uint256 requested, uint256 available);
    error InvalidAmount();
    error InvalidPeriodDuration();
    error CreditNotActive();
    error CreditAlreadyActive();

    constructor(address initialOwner) Ownable(initialOwner) {}

    modifier onlyAuthorizedUpdater() {
        if (!authorizedUpdaters[msg.sender] && msg.sender != owner()) {
            revert UnauthorizedUpdater();
        }
        _;
    }

    /**
     * @dev Initialize credit for a user
     * @param user User address
     * @param totalLimit Total credit limit
     * @param periodDuration Duration of credit period in seconds
     * 
     * 为用户初始化信用额度
     */
    function initializeCredit(
        address user,
        uint256 totalLimit,
        uint256 periodDuration
    ) external onlyAuthorizedUpdater {
        if (totalLimit == 0 || totalLimit > MAX_CREDIT_LIMIT) revert InvalidAmount();
        if (periodDuration == 0) revert InvalidPeriodDuration();
        if (userCredits[user].isActive) revert CreditAlreadyActive();

        userCredits[user] = UserCredit({
            totalLimit: totalLimit,
            usedAmount: 0,
            periodStart: block.timestamp,
            periodDuration: periodDuration,
            isActive: true
        });

        emit CreditInitialized(user, totalLimit, periodDuration, block.timestamp);
    }

    /**
     * @dev Update credit usage when a charge occurs
     * @param user User address
     * @param amount Amount being charged
     * @param authId Authorization ID from card vendor
     * @param merchant Merchant identifier
     * 
     * 当收费发生时更新信用使用情况
     */
    function updateOnCharge(
        address user,
        uint256 amount,
        string calldata authId,
        string calldata merchant
    ) external onlyAuthorizedUpdater nonReentrant {
        if (amount == 0) revert InvalidAmount();
        
        UserCredit storage credit = userCredits[user];
        if (!credit.isActive) revert CreditNotActive();

        // Check if we need to reset the period
        if (block.timestamp >= credit.periodStart + credit.periodDuration) {
            _resetPeriod(user);
            credit = userCredits[user]; // Refresh reference after reset
        }

        uint256 remainingCredit = credit.totalLimit - credit.usedAmount;
        if (amount > remainingCredit) {
            revert InsufficientCredit(amount, remainingCredit);
        }

        // Update usage
        credit.usedAmount += amount;
        remainingCredit = credit.totalLimit - credit.usedAmount;

        // Record in history
        userCreditHistory[user].push(CreditUpdate({
            user: user,
            amount: amount,
            timestamp: block.timestamp,
            authId: authId,
            merchant: merchant
        }));

        emit CreditUsed(user, amount, remainingCredit, authId, merchant, block.timestamp);
    }

    /**
     * @dev Get remaining credit for a user
     * @param user User address
     * @return remainingCredit Amount of credit remaining
     * 
     * 获取用户的剩余信用额度
     */
    function getRemainingCredit(address user) external view returns (uint256 remainingCredit) {
        UserCredit memory credit = userCredits[user];
        if (!credit.isActive) return 0;

        // Check if period has expired
        if (block.timestamp >= credit.periodStart + credit.periodDuration) {
            return credit.totalLimit; // Full credit available after period reset
        }

        return credit.totalLimit - credit.usedAmount;
    }

    /**
     * @dev Get user credit details
     * @param user User address
     * @return credit UserCredit struct
     * 
     * 获取用户信用详情
     */
    function getUserCredit(address user) external view returns (UserCredit memory credit) {
        return userCredits[user];
    }

    /**
     * @dev Get user credit history
     * @param user User address
     * @return history Array of credit updates
     * 
     * 获取用户信用历史
     */
    function getUserCreditHistory(address user) external view returns (CreditUpdate[] memory history) {
        return userCreditHistory[user];
    }

    /**
     * @dev Check if period needs reset and return updated info
     * @param user User address
     * @return needsReset Whether period needs reset
     * @return newPeriodStart New period start timestamp
     * 
     * 检查是否需要重置周期并返回更新信息
     */
    function checkPeriodReset(address user) external view returns (bool needsReset, uint256 newPeriodStart) {
        UserCredit memory credit = userCredits[user];
        if (!credit.isActive) return (false, 0);

        needsReset = block.timestamp >= credit.periodStart + credit.periodDuration;
        if (needsReset) {
            // Calculate new period start aligned to period boundaries
            uint256 periodsElapsed = (block.timestamp - credit.periodStart) / credit.periodDuration;
            newPeriodStart = credit.periodStart + (periodsElapsed * credit.periodDuration);
        }
        
        return (needsReset, newPeriodStart);
    }

    // Admin functions

    /**
     * @dev Update credit limit for a user
     * @param user User address
     * @param newLimit New credit limit
     */
    function updateCreditLimit(address user, uint256 newLimit) external onlyOwner {
        if (newLimit == 0 || newLimit > MAX_CREDIT_LIMIT) revert InvalidAmount();
        
        UserCredit storage credit = userCredits[user];
        if (!credit.isActive) revert CreditNotActive();

        uint256 oldLimit = credit.totalLimit;
        credit.totalLimit = newLimit;

        emit CreditLimitUpdated(user, oldLimit, newLimit);
    }

    /**
     * @dev Revoke credit for a user
     * @param user User address
     */
    function revokeCredit(address user) external onlyOwner {
        userCredits[user].isActive = false;
        emit CreditRevoked(user, block.timestamp);
    }

    /**
     * @dev Set authorized updater
     * @param updater Updater address
     * @param authorized Whether to authorize
     */
    function setAuthorizedUpdater(address updater, bool authorized) external onlyOwner {
        authorizedUpdaters[updater] = authorized;
    }

    /**
     * @dev Manually reset period for a user
     * @param user User address
     */
    function resetPeriod(address user) external onlyAuthorizedUpdater {
        _resetPeriod(user);
    }

    // Internal functions

    /**
     * @dev Internal function to reset credit period
     * @param user User address
     */
    function _resetPeriod(address user) internal {
        UserCredit storage credit = userCredits[user];
        
        // Calculate new period start aligned to period boundaries
        uint256 periodsElapsed = (block.timestamp - credit.periodStart) / credit.periodDuration;
        uint256 newPeriodStart = credit.periodStart + (periodsElapsed * credit.periodDuration);
        
        credit.periodStart = newPeriodStart;
        credit.usedAmount = 0;

        emit CreditPeriodReset(user, newPeriodStart, credit.totalLimit);
    }
}
