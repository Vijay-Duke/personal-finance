import type { APIRoute } from 'astro';
import { db } from '../../../lib/db';
import { accounts, personalAssets, type NewPersonalAsset } from '../../../lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { getSession } from '../../../lib/auth/session';
import { json, error, created, unauthorized } from '../../../lib/api/response';

/**
 * GET /api/accounts/personal-assets
 * List all personal assets with their details.
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
      eq(accounts.type, 'personal_asset'),
    ];

    if (activeFilter !== null) {
      conditions.push(eq(accounts.isActive, activeFilter === 'true'));
    }

    // Join accounts with personal asset details
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
        // Asset-specific fields
        assetId: personalAssets.id,
        assetType: personalAssets.assetType,
        make: personalAssets.make,
        model: personalAssets.model,
        year: personalAssets.year,
        serialNumber: personalAssets.serialNumber,
        vin: personalAssets.vin,
        licensePlate: personalAssets.licensePlate,
        mileage: personalAssets.mileage,
        purchasePrice: personalAssets.purchasePrice,
        purchaseDate: personalAssets.purchaseDate,
        currentEstimatedValue: personalAssets.currentEstimatedValue,
        lastAppraisalDate: personalAssets.lastAppraisalDate,
        lastAppraisalValue: personalAssets.lastAppraisalValue,
        depreciationRate: personalAssets.depreciationRate,
        insuranceCoverage: personalAssets.insuranceCoverage,
        insurancePolicyNumber: personalAssets.insurancePolicyNumber,
        condition: personalAssets.condition,
        location: personalAssets.location,
        linkedLoanId: personalAssets.linkedLoanId,
      })
      .from(accounts)
      .leftJoin(personalAssets, eq(accounts.id, personalAssets.accountId))
      .where(and(...conditions))
      .orderBy(accounts.sortOrder, desc(accounts.updatedAt));

    // Filter by asset type if specified
    const filtered = assetTypeFilter
      ? results.filter(r => r.assetType === assetTypeFilter)
      : results;

    // Calculate depreciation
    const enriched = filtered.map(asset => {
      const depreciation = asset.purchasePrice && asset.currentEstimatedValue
        ? asset.purchasePrice - asset.currentEstimatedValue
        : 0;
      const depreciationPercent = asset.purchasePrice
        ? (depreciation / asset.purchasePrice) * 100
        : 0;

      return {
        ...asset,
        depreciation,
        depreciationPercent,
      };
    });

    return json(enriched);
  } catch (err) {
    console.error('Error fetching personal assets:', err);
    return error('Failed to fetch personal assets', 500);
  }
};

/**
 * POST /api/accounts/personal-assets
 * Create a new personal asset.
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

    // Determine icon based on asset type
    const icons: Record<string, string> = {
      vehicle: 'car',
      jewelry: 'gem',
      art: 'palette',
      collectibles: 'trophy',
      electronics: 'laptop',
      furniture: 'armchair',
      other: 'box',
    };

    // Create base account
    const [newAccount] = await db.insert(accounts).values({
      householdId: session.user.householdId,
      name,
      type: 'personal_asset',
      currency: body.currency || 'USD',
      currentBalance: currentValue,
      isActive: body.isActive ?? true,
      isLiquid: false,
      includeInNetWorth: body.includeInNetWorth ?? true,
      icon: body.icon || icons[body.assetType] || 'box',
      color: body.color,
      sortOrder: body.sortOrder || 0,
      notes: body.notes,
    }).returning();

    // Create personal asset details
    const assetData: NewPersonalAsset = {
      accountId: newAccount.id,
      assetType: body.assetType,
      make: body.make,
      model: body.model,
      year: body.year,
      serialNumber: body.serialNumber,
      vin: body.vin,
      licensePlate: body.licensePlate,
      mileage: body.mileage,
      purchasePrice: body.purchasePrice,
      purchaseDate: body.purchaseDate ? new Date(body.purchaseDate) : undefined,
      currentEstimatedValue: body.currentEstimatedValue,
      depreciationRate: body.depreciationRate,
      insuranceCoverage: body.insuranceCoverage,
      insurancePolicyNumber: body.insurancePolicyNumber,
      condition: body.condition,
      location: body.location,
      linkedLoanId: body.linkedLoanId,
    };

    const [assetDetail] = await db.insert(personalAssets).values(assetData).returning();

    return created({
      ...newAccount,
      ...assetDetail,
    });
  } catch (err) {
    console.error('Error creating personal asset:', err);
    return error('Failed to create personal asset', 500);
  }
};
