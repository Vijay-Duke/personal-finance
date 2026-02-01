import type { APIRoute } from 'astro';
import { db } from '../../../lib/db';
import { accounts, businessAssets, type NewBusinessAsset } from '../../../lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { getSession } from '../../../lib/auth/session';
import { json, error, created, unauthorized } from '../../../lib/api/response';

/**
 * GET /api/accounts/business-assets
 * List all business assets with their details.
 *
 * Query params:
 * - active: Filter by active status (true/false)
 * - assetType: Filter by asset type
 */
export const GET: APIRoute = async (context) => {
  const session = await getSession(context);
  if (!session?.user?.householdId) {
    return unauthorized('Please log in and join a household');
  }

  const url = new URL(context.request.url);
  const activeFilter = url.searchParams.get('active');
  const assetTypeFilter = url.searchParams.get('assetType');

  try {
    const conditions = [
      eq(accounts.householdId, session.user.householdId),
      eq(accounts.type, 'business_asset'),
    ];

    if (activeFilter !== null) {
      conditions.push(eq(accounts.isActive, activeFilter === 'true'));
    }

    // Join accounts with business asset details
    const results = await db
      .select({
        id: accounts.id,
        name: accounts.name,
        type: accounts.type,
        currency: accounts.currency,
        currentBalance: accounts.currentBalance,
        isActive: accounts.isActive,
        includeInNetWorth: accounts.includeInNetWorth,
        icon: accounts.icon,
        color: accounts.color,
        sortOrder: accounts.sortOrder,
        notes: accounts.notes,
        createdAt: accounts.createdAt,
        updatedAt: accounts.updatedAt,
        // Business asset-specific fields
        businessAssetId: businessAssets.id,
        assetType: businessAssets.assetType,
        businessName: businessAssets.businessName,
        entityType: businessAssets.entityType,
        ein: businessAssets.ein,
        stateOfFormation: businessAssets.stateOfFormation,
        dateFormed: businessAssets.dateFormed,
        industry: businessAssets.industry,
        ownershipPercentage: businessAssets.ownershipPercentage,
        shareCount: businessAssets.shareCount,
        totalShares: businessAssets.totalShares,
        shareClass: businessAssets.shareClass,
        vestingSchedule: businessAssets.vestingSchedule,
        fullyVestedDate: businessAssets.fullyVestedDate,
        purchasePrice: businessAssets.purchasePrice,
        purchaseDate: businessAssets.purchaseDate,
        currentEstimatedValue: businessAssets.currentEstimatedValue,
        lastValuationDate: businessAssets.lastValuationDate,
        valuationMethod: businessAssets.valuationMethod,
        annualRevenue: businessAssets.annualRevenue,
        annualDistributions: businessAssets.annualDistributions,
      })
      .from(accounts)
      .leftJoin(businessAssets, eq(accounts.id, businessAssets.accountId))
      .where(and(...conditions))
      .orderBy(accounts.sortOrder, desc(accounts.updatedAt));

    // Filter by asset type if specified
    const filtered = assetTypeFilter
      ? results.filter(r => r.assetType === assetTypeFilter)
      : results;

    // Calculate ownership value and metrics
    const enriched = filtered.map(asset => {
      const ownershipValue = asset.currentEstimatedValue && asset.ownershipPercentage
        ? asset.currentEstimatedValue * (asset.ownershipPercentage / 100)
        : asset.currentEstimatedValue || asset.currentBalance;

      const gainLoss = asset.purchasePrice
        ? (asset.currentEstimatedValue || asset.currentBalance) - asset.purchasePrice
        : 0;

      const gainLossPercent = asset.purchasePrice
        ? (gainLoss / asset.purchasePrice) * 100
        : 0;

      return {
        ...asset,
        ownershipValue,
        gainLoss,
        gainLossPercent,
      };
    });

    return json(enriched);
  } catch (err) {
    console.error('Error fetching business assets:', err);
    return error('Failed to fetch business assets', 500);
  }
};

/**
 * POST /api/accounts/business-assets
 * Create a new business asset.
 */
export const POST: APIRoute = async (context) => {
  const session = await getSession(context);
  if (!session?.user?.householdId) {
    return unauthorized('Please log in and join a household');
  }

  try {
    const body = await context.request.json();

    // Validate required fields
    if (!body.name?.trim()) {
      return error('Asset name is required');
    }
    if (!body.assetType) {
      return error('Asset type is required');
    }

    const name = body.name.trim();
    const currentValue = body.currentEstimatedValue || body.purchasePrice || 0;

    // Create base account
    const [newAccount] = await db.insert(accounts).values({
      householdId: session.user.householdId,
      name,
      type: 'business_asset',
      currency: body.currency || 'USD',
      currentBalance: currentValue,
      isActive: body.isActive ?? true,
      isLiquid: false,
      includeInNetWorth: body.includeInNetWorth ?? true,
      icon: body.icon || 'building',
      color: body.color,
      sortOrder: body.sortOrder || 0,
      notes: body.notes,
    }).returning();

    // Create business asset details
    const assetData: NewBusinessAsset = {
      accountId: newAccount.id,
      assetType: body.assetType,
      businessName: body.businessName,
      entityType: body.entityType,
      ein: body.ein,
      stateOfFormation: body.stateOfFormation,
      dateFormed: body.dateFormed ? new Date(body.dateFormed) : undefined,
      industry: body.industry,
      ownershipPercentage: body.ownershipPercentage,
      shareCount: body.shareCount,
      totalShares: body.totalShares,
      shareClass: body.shareClass,
      vestingSchedule: body.vestingSchedule,
      fullyVestedDate: body.fullyVestedDate ? new Date(body.fullyVestedDate) : undefined,
      purchasePrice: body.purchasePrice,
      purchaseDate: body.purchaseDate ? new Date(body.purchaseDate) : undefined,
      currentEstimatedValue: body.currentEstimatedValue,
      lastValuationDate: body.lastValuationDate ? new Date(body.lastValuationDate) : undefined,
      valuationMethod: body.valuationMethod,
      annualRevenue: body.annualRevenue,
      annualDistributions: body.annualDistributions,
    };

    const [assetDetail] = await db.insert(businessAssets).values(assetData).returning();

    return created({
      ...newAccount,
      ...assetDetail,
    });
  } catch (err) {
    console.error('Error creating business asset:', err);
    return error('Failed to create business asset', 500);
  }
};
