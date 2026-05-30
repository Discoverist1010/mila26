import type { Eip1193Provider } from './eip1193WalletAdapter';

export type BrowserEthereumProviderHost = {
  ethereum?: Eip1193Provider;
};

export function getBrowserEthereumProvider(host?: BrowserEthereumProviderHost): Eip1193Provider | undefined {
  const source = host ?? (typeof globalThis === 'undefined' ? undefined : (globalThis as unknown as BrowserEthereumProviderHost));
  return source?.ethereum;
}
