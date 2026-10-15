import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import ProductCard from '../ProductCard';

const mockAddToCart = jest.fn();
const mockAddToWishlist = jest.fn();
const mockRemoveFromWishlist = jest.fn();
let mockIsInWishlist = false;

jest.mock('@/context/CartContext', () => ({
    useCartActions: () => ({
        addItem: mockAddToCart,
    }),
}));

jest.mock('@/context/WishlistContext', () => ({
    useWishlist: () => ({
        addItem: mockAddToWishlist,
        removeItem: mockRemoveFromWishlist,
        isInWishlist: () => mockIsInWishlist,
    }),
}));

jest.mock('@/context/CurrencyContext', () => ({
    useCurrency: () => ({
        formatPrice: (price: number) => `PKR ${price.toLocaleString()}`,
    }),
}));

// Mock next/image
jest.mock('next/image', () => ({
    __esModule: true,
    default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => {
        // eslint-disable-next-line @next/next/no-img-element
        return <img {...props} alt={props.alt} />;
    },
}));

describe('ProductCard', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockIsInWishlist = false;
    });

    const mockProduct = {
        id: 'prod-123',
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

    it('renders discount percentage and original price when provided', () => {
        render(<ProductCard {...mockProduct} originalPrice={2000} isSale={true} />);

        expect(screen.getByText('-50%')).toBeInTheDocument();
        expect(screen.getByText('PKR 2,000')).toBeInTheDocument();
    });

    it('renders New badge when isNew is true', () => {
        render(<ProductCard {...mockProduct} isNew={true} />);
        expect(screen.getByText(/NEW/i)).toBeInTheDocument();
    });

    it('clicking Quick Add adds item to cart and triggers toast', () => {
        render(<ProductCard {...mockProduct} />);

        const quickAddBtn = screen.getByRole('button', { name: `Quick Add ${mockProduct.name}` });
        fireEvent.click(quickAddBtn);

        expect(mockAddToCart).toHaveBeenCalledWith({
            productId: mockProduct.id,
            name: mockProduct.name,
            price: mockProduct.price,
            image: mockProduct.image,
            size: '',
            color: '',
            quantity: 1,
        });

        expect(screen.getByText('Added to cart!')).toBeInTheDocument();
    });

    it('toggles wishlist item (add to wishlist when not wishlisted)', () => {
        mockIsInWishlist = false;
        render(<ProductCard {...mockProduct} />);

        const wishlistBtn = screen.getByRole('button', { name: `Add ${mockProduct.name} to wishlist` });
        fireEvent.click(wishlistBtn);

        expect(mockAddToWishlist).toHaveBeenCalledWith({
            id: mockProduct.id,
            name: mockProduct.name,
            price: mockProduct.price,
            image: mockProduct.image,
            category: mockProduct.category,
        });
    });

    it('toggles wishlist item (remove from wishlist when wishlisted)', () => {
        mockIsInWishlist = true;
        render(<ProductCard {...mockProduct} />);

        const wishlistBtn = screen.getByRole('button', { name: `Remove ${mockProduct.name} from wishlist` });
        fireEvent.click(wishlistBtn);

        expect(mockRemoveFromWishlist).toHaveBeenCalledWith(mockProduct.id);
    });
});
