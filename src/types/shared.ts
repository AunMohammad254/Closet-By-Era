export interface ShippingAddress {
    firstName: string;
    lastName: string;
    address: string;
    apartment?: string;
    city: string;
    state?: string;
    postalCode: string; // Unified to string
    country: string;
    phone: string;
}

// Shared Result Type for Server Actions
export interface ActionResult<T = unknown> {
    success: boolean;
    message?: string;
    data?: T;
    error?: string;
}

