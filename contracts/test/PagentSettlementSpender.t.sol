// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "forge-std/Test.sol";
import "../src/PagentSettlementSpender.sol";
import "../src/CreditRegistry.sol";

contract MockERC20 is Test {
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;
    
    uint8 public decimals = 6;
    string public name = "Mock USDC";
    string public symbol = "USDC";
    
    function transfer(address to, uint256 amount) external returns (bool) {
        require(balanceOf[msg.sender] >= amount, "Insufficient balance");
        balanceOf[msg.sender] -= amount;
        balanceOf[to] += amount;
        return true;
    }
    
    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        require(balanceOf[from] >= amount, "Insufficient balance");
        require(allowance[from][msg.sender] >= amount, "Insufficient allowance");
        
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        allowance[from][msg.sender] -= amount;
        return true;
    }
    
    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        return true;
    }
    
    function mint(address to, uint256 amount) external {
        balanceOf[to] += amount;
    }
}

contract PagentSettlementSpenderTest is Test {
    PagentSettlementSpender public spender;
    CreditRegistry public registry;
    MockERC20 public usdc;
    
    address public owner;
    address public treasury;
    address public authorizedSpender;
    address public user;
    
    event Charged(
        address indexed user,
        address indexed token,
        uint256 amount,
        bytes32 indexed authId,
        string merchant,
        uint256 timestamp
    );
    
    function setUp() public {
        owner = makeAddr("owner");
        treasury = makeAddr("treasury");
        authorizedSpender = makeAddr("authorizedSpender");
        user = makeAddr("user");
        
        usdc = new MockERC20();
        
        vm.startPrank(owner);
        spender = new PagentSettlementSpender(owner, treasury, authorizedSpender);
        registry = new CreditRegistry(owner);
        vm.stopPrank();
        
        // Mint some USDC for testing
        usdc.mint(address(spender), 1000e6);
        usdc.mint(user, 1000e6);
    }
    
    function test_deployment() public {
        assertEq(spender.owner(), owner);
        assertEq(spender.treasury(), treasury);
        assertTrue(spender.authorizedSpenders(authorizedSpender));
        assertFalse(spender.authorizedSpenders(user));
    }
    
    function test_chargeSimple() public {
        bytes32 authId = keccak256("test-auth-1");
        string memory merchant = "Test Merchant";
        uint256 amount = 50e6; // 50 USDC
        
        vm.expectEmit(true, true, true, true);
        emit Charged(authorizedSpender, address(0), amount, authId, merchant, block.timestamp);
        
        vm.prank(authorizedSpender);
        spender.chargeSimple("", amount, authId, merchant);
        
        // Check that auth is marked as processed
        assertTrue(spender.isAuthProcessed(authId));
    }
    
    function test_chargeSimple_unauthorized() public {
        bytes32 authId = keccak256("test-auth-2");
        
        vm.expectRevert(PagentSettlementSpender.UnauthorizedSpender.selector);
        vm.prank(user);
        spender.chargeSimple("", 50e6, authId, "Test Merchant");
    }
    
    function test_chargeSimple_duplicate() public {
        bytes32 authId = keccak256("test-auth-3");
        string memory merchant = "Test Merchant";
        uint256 amount = 50e6;
        
        // First charge should work
        vm.prank(authorizedSpender);
        spender.chargeSimple("", amount, authId, merchant);
        
        // Second charge with same authId should fail
        vm.expectRevert(abi.encodeWithSelector(PagentSettlementSpender.AuthAlreadyProcessed.selector, authId));
        vm.prank(authorizedSpender);
        spender.chargeSimple("", amount, authId, merchant);
    }
    
    function test_chargeSimple_invalidAmount() public {
        bytes32 authId = keccak256("test-auth-4");
        
        vm.expectRevert(PagentSettlementSpender.InvalidAmount.selector);
        vm.prank(authorizedSpender);
        spender.chargeSimple("", 0, authId, "Test Merchant");
    }
    
    function test_chargeSimple_invalidAuthId() public {
        vm.expectRevert(PagentSettlementSpender.InvalidAuthId.selector);
        vm.prank(authorizedSpender);
        spender.chargeSimple("", 50e6, bytes32(0), "Test Merchant");
    }
    
    function test_setTreasury() public {
        address newTreasury = makeAddr("newTreasury");
        
        vm.prank(owner);
        spender.setTreasury(newTreasury);
        
        assertEq(spender.treasury(), newTreasury);
    }
    
    function test_setAuthorizedSpender() public {
        address newSpender = makeAddr("newSpender");
        
        vm.prank(owner);
        spender.setAuthorizedSpender(newSpender, true);
        
        assertTrue(spender.authorizedSpenders(newSpender));
        
        vm.prank(owner);
        spender.setAuthorizedSpender(newSpender, false);
        
        assertFalse(spender.authorizedSpenders(newSpender));
    }
    
    function test_pause_unpause() public {
        vm.prank(owner);
        spender.pause();
        
        bytes32 authId = keccak256("test-auth-paused");
        vm.expectRevert("Pausable: paused");
        vm.prank(authorizedSpender);
        spender.chargeSimple("", 50e6, authId, "Test Merchant");
        
        vm.prank(owner);
        spender.unpause();
        
        // Should work again after unpause
        vm.prank(authorizedSpender);
        spender.chargeSimple("", 50e6, authId, "Test Merchant");
    }
    
    function test_emergencyWithdraw() public {
        uint256 amount = 100e6;
        uint256 ownerBalanceBefore = usdc.balanceOf(owner);
        
        vm.prank(owner);
        spender.emergencyWithdraw(address(usdc), amount);
        
        assertEq(usdc.balanceOf(owner), ownerBalanceBefore + amount);
    }
}
