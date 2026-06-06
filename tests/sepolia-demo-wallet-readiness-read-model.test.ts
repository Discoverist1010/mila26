import { describe, expect, it } from 'vitest';
import {
  toSepoliaDemoWalletReadinessReadModel,
  type SepoliaDemoWalletReadinessState,
} from '../src/domain/sepoliaDemoWalletReadiness';
import { SEPOLIA_CHAIN_ID_HEX, toWalletConnectionReadModel } from '../src/domain/walletConnectionReadModel';

const issuerWallet = '0x1111111111111111111111111111111111111111';
const investorOne = '0x2222222222222222222222222222222222222222';
const investorTwo = '0x3333333333333333333333333333333333333333';
const paymentWallet = '0x4444444444444444444444444444444444444444';
const redemptionWallet = '0x5555555555555555555555555555555555555555';

describe('Sepolia demo wallet readiness read model', () => {
  it('builds copyable funding targets from wallet, investor, payment, and redemption state', () => {
    const state: SepoliaDemoWalletReadinessState = {
      checkStatus: 'needs_funding',
      checkedWalletAddress: issuerWallet,
      signerBalanceWei: '1',
      localSessionOnly: true,
    };

    const readModel = toSepoliaDemoWalletReadinessReadModel({
      state,
      walletConnection: toWalletConnectionReadModel({
        providerStatus: 'available',
        connectionStatus: 'connected',
        chainId: SEPOLIA_CHAIN_ID_HEX,
        connectedWalletAddress: issuerWallet,
      }),
      investorWalletCount: 2,
      paymentAddress: paymentWallet,
      redemptionWalletAddress: redemptionWallet,
      generatedTestWalletCount: 2,
      generatedTestInvestorWallets: [
        { label: 'Investor 01', walletAddress: investorOne },
        { label: 'Investor 02', walletAddress: investorTwo },
      ],
    });

    expect(readModel.status).toBe('needs_funding');
    expect(readModel.copyAllInvestorAddresses).toContain(`Investor 01: ${investorOne}`);
    expect(readModel.fundingTargets).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'issuer-admin-signer',
          address: issuerWallet,
          copyValue: issuerWallet,
          status: 'needs_funding',
        }),
        expect.objectContaining({
          id: 'all-generated-investors',
          copyValue: expect.stringContaining(investorTwo),
        }),
        expect.objectContaining({
          label: 'Investor 01',
          address: investorOne,
          status: 'needs_funding',
        }),
        expect.objectContaining({
          id: 'payment-destination',
          address: paymentWallet,
        }),
        expect.objectContaining({
          id: 'redemption-wallet',
          address: redemptionWallet,
        }),
      ]),
    );
  });
});
