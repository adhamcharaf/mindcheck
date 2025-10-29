/**
 * Mock RevenueCat Service
 *
 * This is a mock implementation to test the IAP flow without a real Apple Developer account.
 * When ready to switch to real RevenueCat:
 * 1. Install @revenuecat/purchases-react-native
 * 2. Replace mock functions with actual RevenueCat SDK calls
 * 3. Configure RevenueCat API keys in environment variables
 * 4. Set up webhook in Supabase Edge Function
 */

import { supabase } from './supabase';
import { Alert } from 'react-native';

// TODO: Replace with actual RevenueCat API keys when ready
const REVENUECAT_API_KEY_IOS = 'your_ios_api_key_here';
const REVENUECAT_API_KEY_ANDROID = 'your_android_api_key_here';

export type PackageType = 'weekly' | 'annual';

/**
 * Initialize RevenueCat SDK (MOCK)
 *
 * Real implementation would be:
 * ```
 * import Purchases from '@revenuecat/purchases-react-native';
 * await Purchases.configure({ apiKey: REVENUECAT_API_KEY_IOS });
 * ```
 */
export function initRevenueCat(): void {
  console.log('[RevenueCat MOCK] Initialized (mock mode)');

  // TODO: Real implementation
  // import Purchases from '@revenuecat/purchases-react-native';
  // const apiKey = Platform.OS === 'ios' ? REVENUECAT_API_KEY_IOS : REVENUECAT_API_KEY_ANDROID;
  // await Purchases.configure({ apiKey });
}

/**
 * Purchase premium package (MOCK)
 *
 * Simulates a successful purchase and updates the database.
 *
 * Real implementation would be:
 * ```
 * const offerings = await Purchases.getOfferings();
 * const packageToPurchase = packageType === 'weekly'
 *   ? offerings.current?.weekly
 *   : offerings.current?.annual;
 * const { customerInfo } = await Purchases.purchasePackage(packageToPurchase);
 * ```
 */
export async function purchasePremium(
  userId: string,
  packageType: PackageType
): Promise<{ success: boolean; error: string | null }> {
  console.log(`[RevenueCat MOCK] Purchasing ${packageType} package for user ${userId}`);

  try {
    // Simulate purchase delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    // TODO: Real RevenueCat purchase flow
    // const offerings = await Purchases.getOfferings();
    // const packageToPurchase = packageType === 'weekly'
    //   ? offerings.current?.weekly
    //   : offerings.current?.annual;
    // const { customerInfo } = await Purchases.purchasePackage(packageToPurchase);

    // MOCK: Update database directly
    const { error } = await supabase
      .from('users')
      .update({
        is_premium: true,
        trial_ends_at: null, // Clear trial when premium purchased
      })
      .eq('id', userId);

    if (error) {
      console.error('[RevenueCat MOCK] Database update error:', error);
      return { success: false, error: error.message };
    }

    console.log(`[RevenueCat MOCK] Purchase successful - ${packageType} package`);
    return { success: true, error: null };
  } catch (err) {
    console.error('[RevenueCat MOCK] Purchase error:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Purchase failed',
    };
  }
}

/**
 * Restore previous purchases (MOCK)
 *
 * Simulates checking for existing purchases and syncs with database.
 *
 * Real implementation would be:
 * ```
 * const customerInfo = await Purchases.restorePurchases();
 * const isPremium = customerInfo.entitlements.active['premium'] !== undefined;
 * ```
 */
export async function restorePurchases(
  userId: string
): Promise<{ isPremium: boolean; error: string | null }> {
  console.log(`[RevenueCat MOCK] Restoring purchases for user ${userId}`);

  try {
    // Simulate restore delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // TODO: Real RevenueCat restore flow
    // const customerInfo = await Purchases.restorePurchases();
    // const isPremium = customerInfo.entitlements.active['premium'] !== undefined;

    // MOCK: Check database for premium status
    const { data: user, error } = await supabase
      .from('users')
      .select('is_premium, trial_ends_at')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('[RevenueCat MOCK] Restore error:', error);
      return { isPremium: false, error: error.message };
    }

    const isPremium = user?.is_premium || false;
    const hasActiveTrial =
      user?.trial_ends_at && new Date(user.trial_ends_at) > new Date();

    console.log(`[RevenueCat MOCK] Restore result - isPremium: ${isPremium}, hasActiveTrial: ${hasActiveTrial}`);

    return { isPremium: isPremium || hasActiveTrial || false, error: null };
  } catch (err) {
    console.error('[RevenueCat MOCK] Restore error:', err);
    return {
      isPremium: false,
      error: err instanceof Error ? err.message : 'Restore failed',
    };
  }
}

/**
 * Check if user has active premium access
 * Includes both paid premium and active trial
 */
export async function checkPremiumStatus(
  userId: string
): Promise<{ hasPremium: boolean; error: string | null }> {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('is_premium, trial_ends_at')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('[RevenueCat] Check premium status error:', error);
      return { hasPremium: false, error: error.message };
    }

    const isPremium = user?.is_premium || false;
    const hasActiveTrial =
      user?.trial_ends_at && new Date(user.trial_ends_at) > new Date();

    return { hasPremium: isPremium || hasActiveTrial || false, error: null };
  } catch (err) {
    console.error('[RevenueCat] Check premium status error:', err);
    return {
      hasPremium: false,
      error: err instanceof Error ? err.message : 'Check failed',
    };
  }
}

/**
 * Get package pricing info
 * Returns the pricing from constants
 */
export function getPackagePricing(packageType: PackageType): { amount: number; currency: string } {
  const pricing = {
    weekly: { amount: 8.99, currency: 'CAD' },
    annual: { amount: 79, currency: 'CAD' },
  };

  return pricing[packageType];
}
