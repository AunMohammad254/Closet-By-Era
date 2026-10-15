import { logger, noopLogger } from '../logger';

describe('logger', () => {
    let consoleLogSpy: jest.SpyInstance;
    let consoleInfoSpy: jest.SpyInstance;
    let consoleWarnSpy: jest.SpyInstance;
    let consoleErrorSpy: jest.SpyInstance;

    beforeEach(() => {
        consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
        consoleInfoSpy = jest.spyOn(console, 'info').mockImplementation(() => {});
        consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
        consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('warn logs formatted warning message to console.warn', () => {
        logger.warn('Warning test', { extra: 'info' });
        expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('[WARN] Warning test | {"extra":"info"}'));
    });

    it('error formats message with Error instance', () => {
        const error = new Error('Database timeout');
        logger.error('Failed request', error, { action: 'fetch' });
        expect(consoleErrorSpy).toHaveBeenCalledWith(
            expect.stringContaining('[ERROR] Failed request: Database timeout | {"action":"fetch"}')
        );
    });

    it('error formats message with string error', () => {
        logger.error('String failure', 'Network timeout');
        expect(consoleErrorSpy).toHaveBeenCalledWith(
            expect.stringContaining('[ERROR] String failure: Network timeout')
        );
    });

    it('error formats message with object containing message, code, details and hint', () => {
        const customErr = {
            message: 'Violated constraint',
            code: '23505',
            details: 'Key already exists',
            hint: 'Use a unique identifier'
        };
        logger.error('PG Error', customErr);
        expect(consoleErrorSpy).toHaveBeenCalledWith(
            expect.stringContaining('Violated constraint [Code: 23505] (Key already exists) - Hint: Use a unique identifier')
        );
    });

    it('error handles generic object and circular/unexpected objects safely', () => {
        logger.error('Object error', { foo: 'bar' });
        expect(consoleErrorSpy).toHaveBeenCalledWith(
            expect.stringContaining('{"foo":"bar"}')
        );

        const circular: Record<string, unknown> = {};
        circular.self = circular;
        logger.error('Circular error', circular);
        expect(consoleErrorSpy).toHaveBeenCalledWith(
            expect.stringContaining('An unexpected error occurred')
        );

        logger.error('Number error', 12345);
        expect(consoleErrorSpy).toHaveBeenCalledWith(
            expect.stringContaining('An unexpected error occurred')
        );
    });

    it('debug and info methods execute without error', () => {
        logger.debug('Debug message', { trace: 'xyz' });
        logger.info('Info message', { user: 'u1' });
        expect(consoleLogSpy).toBeDefined();
        expect(consoleInfoSpy).toBeDefined();
    });

    it('noopLogger provides functional empty implementations', () => {
        expect(() => {
            noopLogger.debug();
            noopLogger.info();
            noopLogger.warn();
            noopLogger.error();
        }).not.toThrow();
    });
});
