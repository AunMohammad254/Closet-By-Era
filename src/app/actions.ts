'use server';

import { revalidatePath } from 'next/cache';

/**
 * Revalidates the account page cache.
 * Call this after placing an order to ensure the orders list is fresh.
 */
export async function revalidateAccountPage() {
    revalidatePath('/account');
}

/**
 * Revalidates the orders section specifically.
 * This is useful after any order-related changes.
 */
export async function revalidateOrders() {
    revalidatePath('/account', 'page');
}
