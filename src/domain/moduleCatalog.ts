import type { ModuleId, ServicingModule } from './schemas';

type CatalogEntry = {
  id: ModuleId;
  label: string;
  plainEnglish: string;
  defaultRationale: string;
};

export const moduleCatalog: CatalogEntry[] = [
  {
    id: 'erc20-base',
    label: 'Fund Token Base',
    plainEnglish: 'Creates the core ERC20-like token that represents fund units.',
    defaultRationale: 'Required base token for tokenized fund units.',
  },
  {
    id: 'whitelist',
    label: 'Whitelist',
    plainEnglish: 'Restricts eligible investors to approved wallet addresses.',
    defaultRationale: 'Limits transfers and subscriptions to approved investors.',
  },
  {
    id: 'blacklist',
    label: 'Sanctions Blacklist',
    plainEnglish: 'Blocks addresses that must not hold or receive fund units.',
    defaultRationale: 'Adds sanctions and restricted-address controls.',
  },
  {
    id: 'nav-oracle',
    label: 'NAV Oracle',
    plainEnglish: 'Records net asset value inputs used for pricing and reporting.',
    defaultRationale: 'Supports pricing discipline through NAV updates.',
  },
  {
    id: 'investor-registry',
    label: 'Investor Registry',
    plainEnglish: 'Tracks investor records needed for servicing and reporting.',
    defaultRationale: 'Creates an operational registry for approved investors.',
  },
  {
    id: 'cash-registry',
    label: 'Cash Registry',
    plainEnglish: 'Tracks cash movements that support subscriptions and redemptions.',
    defaultRationale: 'Links cash records to token servicing workflows.',
  },
  {
    id: 'dividend',
    label: 'Distribution Module',
    plainEnglish: 'Prepares distribution records for income or redemption payouts.',
    defaultRationale: 'Supports structured distribution workflows.',
  },
];

export function defaultModules(): ServicingModule[] {
  return moduleCatalog
    .filter((entry) => ['erc20-base', 'whitelist', 'blacklist', 'nav-oracle', 'investor-registry'].includes(entry.id))
    .map((entry) => ({
      id: entry.id,
      enabled: true,
      rationale: entry.defaultRationale,
    }));
}

export function labelForModule(id: ModuleId): string {
  return moduleCatalog.find((entry) => entry.id === id)?.label ?? id;
}
