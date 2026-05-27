import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { network } from 'hardhat';
import { getAddress, parseEventLogs } from 'viem';

const { viem, networkHelpers } = await network.create();

const tokenName = 'MILA Income Fund Unit';
const tokenSymbol = 'MILA';
const allocationAmount = 1_000n;

async function expectRevert(action: Promise<unknown>, expectedMessage: string) {
  await assert.rejects(action, (error) => String(error).includes(expectedMessage));
}

function sameAddress(actual: string, expected: string) {
  assert.equal(getAddress(actual), getAddress(expected));
}

async function deployFixture() {
  const [admin, investorA, investorB, outsider] = await viem.getWalletClients();
  const publicClient = await viem.getPublicClient();
  const token = await viem.deployContract('Mila26RestrictedFundToken', [
    tokenName,
    tokenSymbol,
    admin.account.address,
  ]);

  return {
    admin,
    investorA,
    investorB,
    outsider,
    publicClient,
    token,
  };
}

async function receiptFor(hash: `0x${string}`) {
  const publicClient = await viem.getPublicClient();
  return publicClient.waitForTransactionReceipt({ hash });
}

describe('Mila26RestrictedFundToken', () => {
  it('compiles, deploys locally, and exposes ERC-20 identity', async () => {
    const { token } = await networkHelpers.loadFixture(deployFixture);

    assert.equal(await token.read.name(), tokenName);
    assert.equal(await token.read.symbol(), tokenSymbol);
    assert.equal(await token.read.decimals(), 18);
    assert.equal(await token.read.totalSupply(), 0n);
  });

  it('supports ERC-20 mint, balance, transfer, approve, allowance, transferFrom, Transfer, and Approval behavior', async () => {
    const { admin, investorA, investorB, token } = await networkHelpers.loadFixture(deployFixture);

    await token.write.setWalletAllowed([investorA.account.address, true]);
    await token.write.setWalletAllowed([investorB.account.address, true]);

    const mintReceipt = await receiptFor(await token.write.mintAllocation([investorA.account.address, allocationAmount]));
    const transferLogs = parseEventLogs({
      abi: token.abi,
      eventName: 'Transfer',
      logs: mintReceipt.logs,
    });
    assert.equal(transferLogs[0].args.from, '0x0000000000000000000000000000000000000000');
    sameAddress(transferLogs[0].args.to, investorA.account.address);
    assert.equal(transferLogs[0].args.value, allocationAmount);

    assert.equal(await token.read.totalSupply(), allocationAmount);
    assert.equal(await token.read.balanceOf([investorA.account.address]), allocationAmount);

    await token.write.transfer([investorB.account.address, 250n], { account: investorA.account });
    assert.equal(await token.read.balanceOf([investorB.account.address]), 250n);

    const approvalReceipt = await receiptFor(
      await token.write.approve([admin.account.address, 100n], { account: investorA.account }),
    );
    const approvalLogs = parseEventLogs({
      abi: token.abi,
      eventName: 'Approval',
      logs: approvalReceipt.logs,
    });
    sameAddress(approvalLogs[0].args.owner, investorA.account.address);
    sameAddress(approvalLogs[0].args.spender, admin.account.address);
    assert.equal(approvalLogs[0].args.value, 100n);
    assert.equal(await token.read.allowance([investorA.account.address, admin.account.address]), 100n);

    await token.write.transferFrom([investorA.account.address, investorB.account.address, 60n]);
    assert.equal(await token.read.allowance([investorA.account.address, admin.account.address]), 40n);
    assert.equal(await token.read.balanceOf([investorB.account.address]), 310n);
  });

  it('enforces issuer-only whitelist and allocation minting', async () => {
    const { investorA, outsider, token } = await networkHelpers.loadFixture(deployFixture);

    await expectRevert(
      token.write.setWalletAllowed([investorA.account.address, true], { account: outsider.account }),
      'AccessControlUnauthorizedAccount',
    );
    await token.write.setWalletAllowed([investorA.account.address, true]);
    assert.equal(await token.read.isWalletAllowed([investorA.account.address]), true);

    await expectRevert(
      token.write.mintAllocation([investorA.account.address, allocationAmount], { account: outsider.account }),
      'AccessControlUnauthorizedAccount',
    );
    await token.write.mintAllocation([investorA.account.address, allocationAmount]);
    assert.equal(await token.read.balanceOf([investorA.account.address]), allocationAmount);
  });

  it('restricts transfers and transferFrom to whitelisted wallets', async () => {
    const { admin, investorA, investorB, outsider, token } = await networkHelpers.loadFixture(deployFixture);

    await token.write.setWalletAllowed([investorA.account.address, true]);
    await token.write.setWalletAllowed([investorB.account.address, true]);
    await token.write.mintAllocation([investorA.account.address, allocationAmount]);

    await token.write.transfer([investorB.account.address, 100n], { account: investorA.account });
    await expectRevert(
      token.write.transfer([outsider.account.address, 1n], { account: investorA.account }),
      'MILA26: recipient not whitelisted',
    );

    await token.write.approve([admin.account.address, 50n], { account: investorA.account });
    await expectRevert(
      token.write.transferFrom([investorA.account.address, outsider.account.address, 1n]),
      'MILA26: recipient not whitelisted',
    );
  });

  it('records valuation updates and distributions with role checks and events', async () => {
    const { outsider, token } = await networkHelpers.loadFixture(deployFixture);

    await expectRevert(
      token.write.recordValuation([1_050_000n, 'NAV-2026-05-27'], { account: outsider.account }),
      'AccessControlUnauthorizedAccount',
    );
    const valuationReceipt = await receiptFor(await token.write.recordValuation([1_050_000n, 'NAV-2026-05-27']));
    const valuationLogs = parseEventLogs({
      abi: token.abi,
      eventName: 'ValuationUpdated',
      logs: valuationReceipt.logs,
    });
    assert.equal(valuationLogs[0].args.valuation, 1_050_000n);
    assert.equal(valuationLogs[0].args.valuationReference, 'NAV-2026-05-27');

    await expectRevert(
      token.write.recordDistribution([25_000n, 'DIST-2026-Q2'], { account: outsider.account }),
      'AccessControlUnauthorizedAccount',
    );
    const distributionReceipt = await receiptFor(await token.write.recordDistribution([25_000n, 'DIST-2026-Q2']));
    const distributionLogs = parseEventLogs({
      abi: token.abi,
      eventName: 'DistributionRecorded',
      logs: distributionReceipt.logs,
    });
    assert.equal(distributionLogs[0].args.amount, 25_000n);
    assert.equal(distributionLogs[0].args.distributionReference, 'DIST-2026-Q2');
  });

  it('allows authorized pause/unpause and blocks transfers while paused', async () => {
    const { investorA, investorB, outsider, token } = await networkHelpers.loadFixture(deployFixture);

    await token.write.setWalletAllowed([investorA.account.address, true]);
    await token.write.setWalletAllowed([investorB.account.address, true]);
    await token.write.mintAllocation([investorA.account.address, allocationAmount]);

    await expectRevert(token.write.pause({ account: outsider.account }), 'AccessControlUnauthorizedAccount');
    const pauseReceipt = await receiptFor(await token.write.pause());
    const pauseLogs = parseEventLogs({
      abi: token.abi,
      eventName: 'ContractPaused',
      logs: pauseReceipt.logs,
    });
    sameAddress(pauseLogs[0].args.operator, (await viem.getWalletClients())[0].account.address);

    await expectRevert(
      token.write.transfer([investorB.account.address, 1n], { account: investorA.account }),
      'EnforcedPause',
    );

    await token.write.unpause();
    await token.write.transfer([investorB.account.address, 1n], { account: investorA.account });
    assert.equal(await token.read.balanceOf([investorB.account.address]), 1n);
  });

  it('keeps local boundary assumptions out of test execution', async () => {
    const { token } = await networkHelpers.loadFixture(deployFixture);

    assert.equal(await token.read.transferRestrictionsEnabled(), true);
    assert.equal(process.env.PRIVATE_KEY, undefined);
    assert.equal(process.env.WALLET_PRIVATE_KEY, undefined);
    assert.equal(process.env.MAINNET_URL, undefined);
  });
});
