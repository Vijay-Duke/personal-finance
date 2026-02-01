import type { APIRoute } from 'astro';
import { db } from '../../../lib/db';
import { accounts, realEstateProperties, type NewRealEstateProperty } from '../../../lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { getSession } from '../../../lib/auth/session';
import { json, error, created, unauthorized } from '../../../lib/api/response';

/**
 * GET /api/accounts/real-estate
 * List all real estate properties with their details.
 *
 * Query params:
 * - active: Filter by active status (true/false)
 * - propertyType: Filter by property type
 */
export const GET: APIRoute = async (context) => {
  const session = await getSession(context);
  if (!session?.user?.householdId) {
    return unauthorized('Please log in and join a household');
  }

  const url = new URL(context.request.url);
  const activeFilter = url.searchParams.get('active');
  const propertyTypeFilter = url.searchParams.get('propertyType');

  try {
    const conditions = [
      eq(accounts.householdId, session.user.householdId),
      eq(accounts.type, 'real_estate'),
    ];

    if (activeFilter !== null) {
      conditions.push(eq(accounts.isActive, activeFilter === 'true'));
    }

    // Join accounts with property details
    const results = await db
      .select({
        id: accounts.id,
        name: accounts.name,
        type: accounts.type,
        currency: accounts.currency,
        currentBalance: accounts.currentBalance,
        isActive: accounts.isActive,
        isLiquid: accounts.isLiquid,
        includeInNetWorth: accounts.includeInNetWorth,
        icon: accounts.icon,
        color: accounts.color,
        sortOrder: accounts.sortOrder,
        notes: accounts.notes,
        createdAt: accounts.createdAt,
        updatedAt: accounts.updatedAt,
        // Property-specific fields
        propertyId: realEstateProperties.id,
        propertyType: realEstateProperties.propertyType,
        address: realEstateProperties.address,
        city: realEstateProperties.city,
        state: realEstateProperties.state,
        postalCode: realEstateProperties.postalCode,
        country: realEstateProperties.country,
        squareFootage: realEstateProperties.squareFootage,
        bedrooms: realEstateProperties.bedrooms,
        bathrooms: realEstateProperties.bathrooms,
        yearBuilt: realEstateProperties.yearBuilt,
        lotSize: realEstateProperties.lotSize,
        purchasePrice: realEstateProperties.purchasePrice,
        purchaseDate: realEstateProperties.purchaseDate,
        currentEstimatedValue: realEstateProperties.currentEstimatedValue,
        lastAppraisalDate: realEstateProperties.lastAppraisalDate,
        lastAppraisalValue: realEstateProperties.lastAppraisalValue,
        isRental: realEstateProperties.isRental,
        monthlyRentIncome: realEstateProperties.monthlyRentIncome,
        occupancyRate: realEstateProperties.occupancyRate,
        annualPropertyTax: realEstateProperties.annualPropertyTax,
        annualInsurance: realEstateProperties.annualInsurance,
        monthlyHOA: realEstateProperties.monthlyHOA,
        annualMaintenance: realEstateProperties.annualMaintenance,
        linkedMortgageId: realEstateProperties.linkedMortgageId,
      })
      .from(accounts)
      .leftJoin(realEstateProperties, eq(accounts.id, realEstateProperties.accountId))
      .where(and(...conditions))
      .orderBy(accounts.sortOrder, desc(accounts.updatedAt));

    // Filter by property type if specified
    const filtered = propertyTypeFilter
      ? results.filter(r => r.propertyType === propertyTypeFilter)
      : results;

    // Calculate equity for each property
    const enriched = filtered.map(property => ({
      ...property,
      equity: (property.currentEstimatedValue || property.currentBalance) - 0, // TODO: Subtract linked mortgage balance
      annualRentIncome: (property.monthlyRentIncome || 0) * 12 * (property.occupancyRate || 1),
      totalAnnualExpenses: (property.annualPropertyTax || 0) +
        (property.annualInsurance || 0) +
        ((property.monthlyHOA || 0) * 12) +
        (property.annualMaintenance || 0),
    }));

    return json(enriched);
  } catch (err) {
    console.error('Error fetching real estate:', err);
    return error('Failed to fetch real estate properties', 500);
  }
};

/**
 * POST /api/accounts/real-estate
 * Create a new real estate property.
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
      return error('Property name is required');
    }

    const name = body.name.trim();
    const currentValue = body.currentEstimatedValue || body.purchasePrice || 0;

    // Create base account
    const [newAccount] = await db.insert(accounts).values({
      householdId: session.user.householdId,
      name,
      type: 'real_estate',
      currency: body.currency || 'USD',
      currentBalance: currentValue,
      isActive: body.isActive ?? true,
      isLiquid: false, // Real estate is not liquid
      includeInNetWorth: body.includeInNetWorth ?? true,
      icon: body.icon || 'home',
      color: body.color,
      sortOrder: body.sortOrder || 0,
      notes: body.notes,
    }).returning();

    // Create property details
    const propertyData: NewRealEstateProperty = {
      accountId: newAccount.id,
      propertyType: body.propertyType || 'primary_residence',
      address: body.address,
      city: body.city,
      state: body.state,
      postalCode: body.postalCode,
      country: body.country || 'US',
      squareFootage: body.squareFootage,
      bedrooms: body.bedrooms,
      bathrooms: body.bathrooms,
      yearBuilt: body.yearBuilt,
      lotSize: body.lotSize,
      purchasePrice: body.purchasePrice,
      purchaseDate: body.purchaseDate ? new Date(body.purchaseDate) : undefined,
      currentEstimatedValue: body.currentEstimatedValue,
      isRental: body.isRental ?? false,
      monthlyRentIncome: body.monthlyRentIncome,
      occupancyRate: body.occupancyRate,
      annualPropertyTax: body.annualPropertyTax,
      annualInsurance: body.annualInsurance,
      monthlyHOA: body.monthlyHOA,
      annualMaintenance: body.annualMaintenance,
      linkedMortgageId: body.linkedMortgageId,
    };

    const [propertyDetail] = await db.insert(realEstateProperties).values(propertyData).returning();

    return created({
      ...newAccount,
      ...propertyDetail,
      equity: currentValue,
    });
  } catch (err) {
    console.error('Error creating real estate:', err);
    return error('Failed to create real estate property', 500);
  }
};
