import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ProductTableClient from '@/app/(admin)/dashboard/products/ProductTableClient';
import OrdersTableClient from '@/app/(admin)/dashboard/orders/OrdersTableClient';
import { deleteProduct, toggleProductStatus } from '@/actions/products';
import { updateOrderStatus, updatePaymentStatus } from '@/actions/orders';
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

describe('dashboard tables', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        window.alert = jest.fn();
        window.confirm = jest.fn();
    });

    const mockProduct: Product = {
        id: 'product-1',
        name: 'Oxford Shirt',
        price: 3500,
        stock: 12,
        images: ['/img.jpg'],
        is_active: true,
        category: 'Shirts',
    } as unknown as Product;

    const mockOrder: Order = {
        id: 'order-1-abcdef',
        payment_method: 'cod',
        customer_name: 'Ayesha',
        customer_email: 'ayesha@example.com',
        total: 12990,
        status: 'pending',
        payment_status: 'pending',
        created_at: '2026-10-01T10:00:00Z',
    } as unknown as Order;

    it('shows product prices in PKR', () => {
        const { container } = render(<ProductTableClient initialProducts={[mockProduct]} />);
        expect(screen.getByText(/^PKR\s3,500$/)).toBeInTheDocument();
        expect(container).not.toHaveTextContent('$');
    });

    it('toggles product active status and handles error alert', async () => {
        (toggleProductStatus as jest.Mock).mockResolvedValueOnce({ success: true });
        const { unmount } = render(<ProductTableClient initialProducts={[mockProduct]} />);

        const toggleBtn = screen.getByRole('button', { name: 'Active' });
        fireEvent.click(toggleBtn);
        await waitFor(() => {
            expect(toggleProductStatus).toHaveBeenCalledWith('product-1', false);
        });

        unmount();

        // Error branch
        (toggleProductStatus as jest.Mock).mockResolvedValueOnce({ success: false, error: 'Failed to update' });
        render(<ProductTableClient initialProducts={[mockProduct]} />);
        const toggleBtnErr = screen.getByRole('button', { name: 'Active' });
        fireEvent.click(toggleBtnErr);
        await waitFor(() => {
            expect(window.alert).toHaveBeenCalledWith('Failed to update');
        });
    });

    it('deletes a product when confirmed and handles cancellation or failure', async () => {
        (deleteProduct as jest.Mock).mockResolvedValue({ success: true });

        // Cancelled branch
        (window.confirm as jest.Mock).mockReturnValueOnce(false);
        const { container, unmount } = render(<ProductTableClient initialProducts={[mockProduct]} />);
        const deleteBtn = container.querySelector('.action-btn.delete') as HTMLButtonElement;

        fireEvent.click(deleteBtn);
        expect(window.confirm).toHaveBeenCalled();
        expect(deleteProduct).not.toHaveBeenCalled();

        unmount();

        // Confirmed with error branch
        (window.confirm as jest.Mock).mockReturnValueOnce(true);
        (deleteProduct as jest.Mock).mockResolvedValueOnce({ success: false, error: 'Delete failed' });
        const render2 = render(<ProductTableClient initialProducts={[mockProduct]} />);
        const deleteBtnErr = render2.container.querySelector('.action-btn.delete') as HTMLButtonElement;
        fireEvent.click(deleteBtnErr);
        await waitFor(() => {
            expect(window.alert).toHaveBeenCalledWith('Delete failed');
        });

        render2.unmount();

        // Confirmed success branch
        (window.confirm as jest.Mock).mockReturnValueOnce(true);
        (deleteProduct as jest.Mock).mockResolvedValueOnce({ success: true });
        const render3 = render(<ProductTableClient initialProducts={[mockProduct]} />);
        const deleteBtnSuccess = render3.container.querySelector('.action-btn.delete') as HTMLButtonElement;
        fireEvent.click(deleteBtnSuccess);
        await waitFor(() => {
            expect(deleteProduct).toHaveBeenCalledWith('product-1');
        });
    });

    it('shows order totals in PKR and handles status dropdown updates and errors', async () => {
        (updateOrderStatus as jest.Mock).mockResolvedValueOnce({ success: true });
        (updatePaymentStatus as jest.Mock).mockResolvedValueOnce({ success: true });

        render(<OrdersTableClient initialOrders={[mockOrder]} />);

        expect(screen.getByText(/^PKR\s12,990$/)).toBeInTheDocument();

        const selects = screen.getAllByRole('combobox');
        // selects[0] is payment status
        fireEvent.change(selects[0], { target: { value: 'paid' } });
        await waitFor(() => {
            expect(updatePaymentStatus).toHaveBeenCalledWith('order-1-abcdef', 'paid');
        });

        // selects[1] is order status
        fireEvent.change(selects[1], { target: { value: 'delivered' } });
        await waitFor(() => {
            expect(updateOrderStatus).toHaveBeenCalledWith('order-1-abcdef', 'delivered');
        });

        // Error branches
        (updatePaymentStatus as jest.Mock).mockResolvedValueOnce({ success: false, error: 'Payment error' });
        fireEvent.change(selects[0], { target: { value: 'failed' } });
        await waitFor(() => {
            expect(window.alert).toHaveBeenCalledWith('Payment error');
        });

        (updateOrderStatus as jest.Mock).mockResolvedValueOnce({ success: false, error: 'Order error' });
        fireEvent.change(selects[1], { target: { value: 'cancelled' } });
        await waitFor(() => {
            expect(window.alert).toHaveBeenCalledWith('Order error');
        });
    });
});
