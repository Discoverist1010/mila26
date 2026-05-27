// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC20Pausable} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Pausable.sol";

/// @title MILA26 restricted ERC-20-compatible fund unit fixture
/// @notice Local compile/test fixture only. Not deployed, audited, or production-ready.
contract Mila26RestrictedFundToken is ERC20Pausable, AccessControl {
    bytes32 public constant ISSUER_ROLE = keccak256("ISSUER_ROLE");
    bytes32 public constant VALUATION_ROLE = keccak256("VALUATION_ROLE");
    bytes32 public constant DISTRIBUTION_ROLE = keccak256("DISTRIBUTION_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    mapping(address wallet => bool allowed) private _allowedWallets;

    bool public transferRestrictionsEnabled = true;
    uint256 public latestValuation;
    string public latestValuationReference;

    event WalletWhitelisted(address indexed wallet, bool allowed, address indexed operator);
    event AllocationMinted(address indexed wallet, uint256 amount, address indexed operator);
    event ValuationUpdated(uint256 valuation, string valuationReference, address indexed operator);
    event DistributionRecorded(uint256 amount, string distributionReference, address indexed operator);
    event TransferRestrictionUpdated(bool enabled, address indexed operator);
    event ContractPaused(address indexed operator);
    event ContractUnpaused(address indexed operator);

    constructor(string memory name_, string memory symbol_, address admin) ERC20(name_, symbol_) {
        require(admin != address(0), "MILA26: admin required");

        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(ISSUER_ROLE, admin);
        _grantRole(VALUATION_ROLE, admin);
        _grantRole(DISTRIBUTION_ROLE, admin);
        _grantRole(PAUSER_ROLE, admin);
        _setWalletAllowed(admin, true);
    }

    function isWalletAllowed(address wallet) external view returns (bool) {
        return _allowedWallets[wallet];
    }

    function setWalletAllowed(address wallet, bool allowed) external onlyRole(ISSUER_ROLE) {
        require(wallet != address(0), "MILA26: wallet required");
        _setWalletAllowed(wallet, allowed);
    }

    function mintAllocation(address wallet, uint256 amount) external onlyRole(ISSUER_ROLE) {
        require(_allowedWallets[wallet], "MILA26: wallet not whitelisted");
        require(amount > 0, "MILA26: amount required");

        _mint(wallet, amount);
        emit AllocationMinted(wallet, amount, _msgSender());
    }

    function setTransferRestrictionsEnabled(bool enabled) external onlyRole(DEFAULT_ADMIN_ROLE) {
        transferRestrictionsEnabled = enabled;
        emit TransferRestrictionUpdated(enabled, _msgSender());
    }

    function recordValuation(uint256 valuation, string calldata valuationReference) external onlyRole(VALUATION_ROLE) {
        require(valuation > 0, "MILA26: valuation required");

        latestValuation = valuation;
        latestValuationReference = valuationReference;
        emit ValuationUpdated(valuation, valuationReference, _msgSender());
    }

    function recordDistribution(uint256 amount, string calldata distributionReference) external onlyRole(DISTRIBUTION_ROLE) {
        require(amount > 0, "MILA26: distribution amount required");

        emit DistributionRecorded(amount, distributionReference, _msgSender());
    }

    function pause() external onlyRole(PAUSER_ROLE) {
        _pause();
        emit ContractPaused(_msgSender());
    }

    function unpause() external onlyRole(PAUSER_ROLE) {
        _unpause();
        emit ContractUnpaused(_msgSender());
    }

    function _update(address from, address to, uint256 value) internal override(ERC20Pausable) {
        if (transferRestrictionsEnabled) {
            if (from != address(0)) {
                require(_allowedWallets[from], "MILA26: sender not whitelisted");
            }

            if (to != address(0)) {
                require(_allowedWallets[to], "MILA26: recipient not whitelisted");
            }
        }

        super._update(from, to, value);
    }

    function _setWalletAllowed(address wallet, bool allowed) private {
        _allowedWallets[wallet] = allowed;
        emit WalletWhitelisted(wallet, allowed, _msgSender());
    }
}
