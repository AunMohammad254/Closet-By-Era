import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import FeaturedProductsGrid from '../FeaturedProductsGrid';

// Mock contexts that might be needed by ProductCard
jest.mock('@/context/CartContext', () => ({
    useCart: () => ({
        addItem: jest.fn(),
    }),
}));

jest.mock('@/context/WishlistContext', () => ({
    useWishlist: () => ({
        addItem: jest.fn(),
        removeItem: jest.fn(),
        isInWishlist: jest.fn().mockReturnValue(false),
    }),
}));

// Mock next/image
jest.mock('next/image', () => ({
    __esModule: true,
    default: (props: any) => {
        // eslint-disable-next-line @next/next/no-img-element
        return <img {...props} alt={props.alt} />;
    },
}));

describe('FeaturedProductsGrid', () => {
    it('renders empty state message when no products are provided', () => {
        render(<FeaturedProductsGrid products={[]} />);
        expect(screen.getByText('No featured products found.')).toBeInTheDocument();
    });

    it('renders products when provided', () => {
        const mockProducts = [
            {
                id: '1',
                slug: 'test-product-1',
                name: 'Test Product 1',
                price: 1000,
                image: '/products/test1.jpg',
                category: 'Test Category',
            },
            {
                id: '2',
                slug: 'test-product-2',
                name: 'Test Product 2',
                price: 2000,
                image: '/products/test2.jpg',
                category: 'Test Category',
            }
        ];

        render(<FeaturedProductsGrid products={mockProducts} />);
        expect(screen.getByText('Test Product 1')).toBeInTheDocument();
        expect(screen.getByText('Test Product 2')).toBeInTheDocument();
    });
});
