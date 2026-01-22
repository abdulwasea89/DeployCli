import { Context, Next } from 'hono';

interface RateLimitConfig {
    windowMs: number;      // Time window in milliseconds
    maxRequests: number;   // Max requests per window
}

interface RateLimitStore {
    [key: string]: {
        count: number;
        resetTime: number;
    };
}

// In-memory store (upgrade to Redis for production/distributed deployments)
const store: RateLimitStore = {};

// Clean up expired entries every 5 minutes
setInterval(() => {
    const now = Date.now();
    for (const key in store) {
        if (store[key].resetTime < now) {
            delete store[key];
        }
    }
}, 5 * 60 * 1000);

/**
 * Creates a rate limiting middleware for Hono
 * @param config - Rate limit configuration
 * @returns Hono middleware function
 */
export const createRateLimiter = (config: RateLimitConfig) => {
    return async (c: Context, next: Next) => {
        // Use IP address as identifier (falls back to 'unknown' for CLI clients)
        const clientId = c.req.header('x-forwarded-for') || 
                         c.req.header('x-real-ip') || 
                         'cli-client';
        
        const key = `${c.req.path}:${clientId}`;
        const now = Date.now();
        
        // Initialize or reset if window expired
        if (!store[key] || store[key].resetTime < now) {
            store[key] = {
                count: 0,
                resetTime: now + config.windowMs
            };
        }
        
        store[key].count++;
        
        // Check if rate limit exceeded
        if (store[key].count > config.maxRequests) {
            const retryAfter = Math.ceil((store[key].resetTime - now) / 1000);
            
            c.header('Retry-After', String(retryAfter));
            c.header('X-RateLimit-Limit', String(config.maxRequests));
            c.header('X-RateLimit-Remaining', '0');
            c.header('X-RateLimit-Reset', String(store[key].resetTime));
            
            return c.json({
                error: 'Too Many Requests',
                message: `Rate limit exceeded. Try again in ${retryAfter} seconds.`,
                retryAfter
            }, 429);
        }
        
        // Add rate limit headers to response
        c.header('X-RateLimit-Limit', String(config.maxRequests));
        c.header('X-RateLimit-Remaining', String(config.maxRequests - store[key].count));
        c.header('X-RateLimit-Reset', String(store[key].resetTime));
        
        await next();
    };
};

// Pre-configured limiters for common use cases
export const authInitiateLimiter = createRateLimiter({
    windowMs: 60 * 1000,  // 1 minute
    maxRequests: 10       // 10 requests per minute
});

export const authPollLimiter = createRateLimiter({
    windowMs: 60 * 1000,  // 1 minute  
    maxRequests: 60       // 60 requests per minute (polling every second)
});

export const authValidateLimiter = createRateLimiter({
    windowMs: 60 * 1000,  // 1 minute
    maxRequests: 30       // 30 requests per minute
});
