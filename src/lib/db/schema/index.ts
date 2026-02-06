// Core entities
export * from './household';
export * from './user';
export * from './user-financial-profile';
export * from './dashboard-layout';

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

export {
  dashboardLayouts,
  type DashboardLayout,
  type NewDashboardLayout,
} from './dashboard-layout';

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

// Categories
export {
  categories,
  categoryTypes,
  defaultCategories,
  type Category,
  type NewCategory,
  type CategoryType,
} from './category';

// Integrations (Phase 7)
export {
  dataSources,
  dataSourceTypes,
  dataSourceProviders,
  syncFrequencies,
  type DataSource,
  type NewDataSource,
  type DataSourceType,
  type DataSourceProvider,
  type SyncFrequency,
} from './integrations';

export {
  exchangeRates,
  type ExchangeRate,
  type NewExchangeRate,
} from './integrations';

export {
  netWorthSnapshots,
  type NetWorthSnapshot,
  type NewNetWorthSnapshot,
  type AssetBreakdown,
} from './integrations';

export {
  monthlyAnalyticsRollups,
  type MonthlyAnalyticsRollup,
  type NewMonthlyAnalyticsRollup,
} from './integrations';

// User permissions
export {
  userAccountPermissions,
  accountVisibilitySettings,
  permissionLevels,
  hasPermissionLevel,
  type UserAccountPermission,
  type NewUserAccountPermission,
  type AccountVisibilitySettings,
  type NewAccountVisibilitySettings,
  type PermissionLevel,
} from './user-account-permission';

// Transactions
export {
  transactions,
  transactionTypes,
  transactionStatuses,
  transactionSplits,
  tags,
  transactionTags,
  importBatches,
  categoryRules,
  recurringSchedules,
  type Transaction,
  type NewTransaction,
  type TransactionType,
  type TransactionStatus,
  type TransactionSplit,
  type NewTransactionSplit,
  type Tag,
  type NewTag,
  type TransactionTag,
  type NewTransactionTag,
  type ImportBatch,
  type NewImportBatch,
  type CategoryRule,
  type NewCategoryRule,
  type RecurringSchedule,
  type NewRecurringSchedule,
} from './transaction';

// Budgets, Goals, Insurance
export * from './budget';
export {
  budgets,
  budgetPeriods,
  goals,
  goalStatuses,
  goalTypes,
  goalContributions,
  insurancePolicies,
  insuranceTypes,
  insuranceStatuses,
  premiumFrequencies,
  financialProjections,
  type Budget,
  type NewBudget,
  type BudgetPeriod,
  type Goal,
  type NewGoal,
  type GoalStatus,
  type GoalType,
  type GoalContribution,
  type NewGoalContribution,
  type InsurancePolicy,
  type NewInsurancePolicy,
  type InsuranceType,
  type InsuranceStatus,
  type PremiumFrequency,
  type FinancialProjection,
  type NewFinancialProjection,
} from './budget';

// Notifications
export {
  notifications,
  notificationTypes,
  notificationPriorities,
  defaultNotificationPreferences,
  type Notification,
  type NewNotification,
  type NotificationType,
  type NotificationPriority,
} from './notifications';

// API Keys (programmatic access)
export {
  apiKeys,
  type ApiKey,
  type NewApiKey,
  type ApiKeyScope,
  type ApiKeySource,
} from './api-key';
