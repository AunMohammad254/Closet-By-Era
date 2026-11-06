import { toCsvCell } from '../order-display';

describe('toCsvCell', () => {
    describe('normal values', () => {
        it('wraps normal strings in quotes', () => {
            expect(toCsvCell('hello')).toBe('"hello"');
            expect(toCsvCell('world 123')).toBe('"world 123"');
        });

        it('converts numbers to strings', () => {
            expect(toCsvCell(42)).toBe('"42"');
            expect(toCsvCell(0)).toBe('"0"');
            // Since `-` is considered a spreadsheet formula character,
            // negative numbers stringified get a leading single quote before being quoted
            expect(toCsvCell(-1.5)).toBe('"'+ "'-1.5" + '"');
        });

        it('converts booleans to strings', () => {
            expect(toCsvCell(true)).toBe('"true"');
            expect(toCsvCell(false)).toBe('"false"');
        });
    });

    describe('edge cases', () => {
        it('handles null and undefined', () => {
            expect(toCsvCell(null)).toBe('""');
            expect(toCsvCell(undefined)).toBe('""');
        });

        it('handles empty strings', () => {
            expect(toCsvCell('')).toBe('""');
        });
    });

    describe('escaping double quotes', () => {
        it('escapes single double quotes', () => {
            expect(toCsvCell('12" pizza')).toBe('"12"" pizza"');
        });

        it('escapes multiple double quotes', () => {
            expect(toCsvCell('She said "hello" to him')).toBe('"She said ""hello"" to him"');
        });
    });

    describe('neutralizing spreadsheet formulas', () => {
        it('prepends single quote if string starts with =', () => {
            expect(toCsvCell('=1+1')).toBe('"' + "'=1+1" + '"');
            expect(toCsvCell('=SUM(A1:A2)')).toBe('"' + "'=SUM(A1:A2)" + '"');
        });

        it('prepends single quote if string starts with +', () => {
            expect(toCsvCell('+1')).toBe('"' + "'+1" + '"');
        });

        it('prepends single quote if string starts with -', () => {
            expect(toCsvCell('-1')).toBe('"' + "'-1" + '"');
        });

        it('prepends single quote if string starts with @', () => {
            expect(toCsvCell('@name')).toBe('"' + "'@name" + '"');
        });

        it('does not prepend single quote if special character is not at the start', () => {
            expect(toCsvCell('1+1=2')).toBe('"1+1=2"');
            expect(toCsvCell('email@example.com')).toBe('"email@example.com"');
            expect(toCsvCell('a-b')).toBe('"a-b"');
        });
    });
});
