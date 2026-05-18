import { labelForModule } from './moduleCatalog';
import type { GeneratedArtifact, RequirementBrief } from './schemas';

function contractNameFromFund(fundName: string): string {
  const safe = fundName.replace(/[^a-zA-Z0-9]/g, ' ').trim();
  const pascal = safe
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
  return `${pascal || 'Mila'}FundToken`;
}

export function generateSolidityArtifact(brief: RequirementBrief, sourceTaskId: string): GeneratedArtifact {
  const enabledModules = brief.modules.filter((module) => module.enabled);
  const contractName = contractNameFromFund(brief.fundFacts.fundName);
  const moduleComments = enabledModules.map((module) => `// - ${labelForModule(module.id)}: ${module.rationale}`).join('\n');
  const whitelistEnabled = enabledModules.some((module) => module.id === 'whitelist');
  const blacklistEnabled = enabledModules.some((module) => module.id === 'blacklist');

  const transferGuard = [
    whitelistEnabled ? '        require(whitelisted[to], "recipient not whitelisted");' : '',
    blacklistEnabled ? '        require(!blacklisted[msg.sender] && !blacklisted[to], "restricted address");' : '',
  ]
    .filter(Boolean)
    .join('\n');

  const content = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title ${contractName}
 * @notice Beta scaffold generated from MILA26 RequirementBrief ${brief.id}.
 * @dev This is audit-preparation code, not production deployment code.
 *
${moduleComments}
 */
contract ${contractName} {
    string public name = "${brief.fundFacts.fundName}";
    string public symbol = "${brief.fundFacts.tokenSymbol}";
    uint8 public decimals = 18;
    uint256 public totalSupply = ${Math.trunc(brief.fundFacts.totalSupply)};
    address public owner;

    mapping(address => uint256) public balanceOf;
    mapping(address => bool) public whitelisted;
    mapping(address => bool) public blacklisted;
    uint256 public latestNav = ${Math.trunc(brief.fundFacts.initialNav)};

    event Transfer(address indexed from, address indexed to, uint256 amount);
    event NavUpdated(uint256 nav);
    event WhitelistUpdated(address indexed account, bool allowed);
    event BlacklistUpdated(address indexed account, bool blocked);

    modifier onlyOwner() {
        require(msg.sender == owner, "only owner");
        _;
    }

    constructor(address initialHolder) {
        require(initialHolder != address(0), "initial holder required");
        owner = msg.sender;
        balanceOf[initialHolder] = totalSupply;
        whitelisted[initialHolder] = true;
        emit Transfer(address(0), initialHolder, totalSupply);
    }

    function setWhitelist(address account, bool allowed) external onlyOwner {
        require(account != address(0), "account required");
        whitelisted[account] = allowed;
        emit WhitelistUpdated(account, allowed);
    }

    function setBlacklist(address account, bool blocked) external onlyOwner {
        require(account != address(0), "account required");
        blacklisted[account] = blocked;
        emit BlacklistUpdated(account, blocked);
    }

    function updateNav(uint256 newNav) external onlyOwner {
        latestNav = newNav;
        emit NavUpdated(newNav);
    }

    function transfer(address to, uint256 amount) external returns (bool) {
        require(to != address(0), "recipient required");
        require(balanceOf[msg.sender] >= amount, "insufficient balance");
${transferGuard || '        // No optional transfer guards selected.'}
        balanceOf[msg.sender] -= amount;
        balanceOf[to] += amount;
        emit Transfer(msg.sender, to, amount);
        return true;
    }
}
`;

  return {
    id: `artifact-${brief.id}-solidity`,
    kind: 'solidity',
    filename: `contracts/${contractName}.sol`,
    content,
    sourceTaskId,
  };
}

export function generateDeploymentManifest(brief: RequirementBrief, sourceTaskId: string): GeneratedArtifact {
  return {
    id: `artifact-${brief.id}-manifest`,
    kind: 'manifest',
    filename: 'deployment/manifest.json',
    sourceTaskId,
    content: JSON.stringify(
      {
        requirementBriefId: brief.id,
        mode: 'simulation-only',
        deploymentTarget: brief.deploymentTarget,
        steps: [
          { id: 'compile', label: 'Compile generated fund contract' },
          { id: 'review', label: 'Confirm audit and security review findings' },
          { id: 'simulate', label: 'Run deployment simulation only' },
        ],
      },
      null,
      2,
    ),
  };
}
