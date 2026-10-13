import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import ProductTableClient from '@/app/(admin)/dashboard/products/ProductTableClient';
import OrdersTableClient from '@/app/(admin)/dashboard/orders/OrdersTableClient';
import type { Order, Product } from '@/types/database';

jest.mock('@/actions/products', () => ({
    deleteProduct: jest.fn(),
    toggleProductStatus: jest.fn(),
}));

jest.mock('@/actions/orders', () => ({
    updateOrderStatus: jest.fn(),
    updatePaymentStatus: jest.fn(),
}));

jest.mock('next/image', () => ({
    __esModule: true,
    default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => {
        // eslint-disable-next-line @next/next/no-img-element
        return <img {...props} alt={props.alt} />;
    },
}));

// Prices are stored and charged in PKR.
describe('dashboard tables', () => {
    it('shows product prices in PKR', () => {
        const product = {
            id: 'product-1', name: 'Oxford Shirt', price: 3500, stock: 12, images: [], is_active: true, category: 'Shirts',
        } as unknown as Product;

        const { container } = render(<ProductTableClient initialProducts={[product]} />);

        expect(screen.getByText(/^PKR\s3,500$/)).toBeInTheDocument();
        expect(container).not.toHaveTextContent('$');
    });

    it('shows order totals in PKR', () => {
        const order = {
            id: 'order-1-abcdef', payment_method: 'cod', customer_name: 'Ayesha', customer_email: 'ayesha@example.com',
            total: 12990, status: 'pending', payment_status: 'pending', created_at: '2026-10-01T10:00:00Z',
        } as unknown as Order;

        const { container } = render(<OrdersTableClient initialOrders={[order]} />);

        expect(screen.getByText(/^PKR\s12,990$/)).toBeInTheDocument();
        expect(container).not.toHaveTextContent('$');
    });
});
