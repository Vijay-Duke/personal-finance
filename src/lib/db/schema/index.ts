// Core entities
export * from './household';
export * from './user';
export * from './user-financial-profile';

// Financial accounts (polymorphic)
export * from './accounts';

// Re-export for convenience
export {
  households,
  type Household,
  type NewHousehold,
} from './household';

export {
  users,
  sessions,
  authAccounts,
  verifications,
  twoFactors,
  passkeys,
  userRoles,
  type User,
  type NewUser,
  type UserRole,
  type Session,
  type NewSession,
  type AuthAccount,
  type NewAuthAccount,
} from './user';

export {
  userFinancialProfiles,
  riskToleranceLevels,
  incomeFrequencies,
  type UserFinancialProfile,
  type NewUserFinancialProfile,
  type RiskTolerance,
  type IncomeFrequency,
} from './user-financial-profile';

// Financial accounts
export {
  accounts,
  accountTypes,
  bankAccounts,
  bankAccountTypes,
  stocks,
  cryptoAssets,
  valuationHistory,
  valuationSources,
  type Account,
  type NewAccount,
  type AccountType,
  type BankAccount,
  type NewBankAccount,
  type BankAccountType,
  type Stock,
  type NewStock,
  type CryptoAsset,
  type NewCryptoAsset,
  type ValuationHistory,
  type NewValuationHistory,
  type ValuationSource,
} from './accounts';

// AI Integration
export {
  aiProviders,
  aiProviderTypes,
  type AIProvider,
  type NewAIProvider,
  type AIProviderType,
} from './ai-provider';

export {
  aiConversations,
  type AIConversation,
  type NewAIConversation,
  type AIMessage,
} from './ai-conversation';
