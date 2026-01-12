export interface SizeChart {
    category: string;
    description: string;
    headers: string[];
    rows: string[][];
}

export const SIZE_DATA: Record<string, SizeChart> = {
    'mens-tops': {
        category: "Men's Tops",
        description: "Measurements for T-shirts, Shirts, Hoodies, and Jackets.",
        headers: ['Size', 'Chest (cm)', 'Length (cm)', 'Shoulder (cm)'],
        rows: [
            ['S', '96', '68', '43'],
            ['M', '102', '70', '45'],
            ['L', '108', '72', '47'],
            ['XL', '114', '74', '49'],
            ['XXL', '120', '76', '51'],
        ],
    },
    'mens-bottoms': {
        category: "Men's Bottoms",
        description: "Measurements for Jeans, Trousers, and Shorts.",
        headers: ['Size', 'Waist (cm)', 'Length (cm)', 'Thigh (cm)'],
        rows: [
            ['30', '76', '102', '56'],
            ['32', '81', '103', '58'],
            ['34', '86', '104', '60'],
            ['36', '91', '105', '62'],
            ['38', '96', '106', '64'],
        ],
    },
    'womens-tops': {
        category: "Women's Tops",
        description: "Measurements for Tops, Blouses, and Dresses.",
        headers: ['Size', 'Bust (cm)', 'Waist (cm)', 'Hips (cm)'],
        rows: [
            ['XS', '80', '60', '86'],
            ['S', '84', '64', '90'],
            ['M', '88', '68', '94'],
            ['L', '94', '74', '100'],
            ['XL', '100', '80', '106'],
        ],
    },
    'womens-bottoms': {
        category: "Women's Bottoms",
        description: "Measurements for Skirts, Pants, and Shorts.",
        headers: ['Size', 'Waist (cm)', 'Hips (cm)', 'Length (cm)'],
        rows: [
            ['26', '66', '90', '100'],
            ['28', '71', '95', '101'],
            ['30', '76', '100', '102'],
            ['32', '81', '105', '103'],
            ['34', '86', '110', '104'],
        ],
    },
};
