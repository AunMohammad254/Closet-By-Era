import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import ProductCard from '../ProductCard';

// Mock contexts
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

describe('ProductCard', () => {
    const mockProduct = {
        id: '1',
        name: 'Test Product',
        price: 1000,
        image: '/products/test.jpg',
        category: 'Test Category',
    };

    it('renders product information correctly', () => {
        render(<ProductCard {...mockProduct} />);

        expect(screen.getByText('Test Product')).toBeInTheDocument();
        expect(screen.getByText('PKR 1,000')).toBeInTheDocument();
        expect(screen.getByText('Test Category')).toBeInTheDocument();
    });
});
