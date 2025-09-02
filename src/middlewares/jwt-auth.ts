import { Context, Next, HonoRequest } from 'hono'
import { jwt } from 'hono/jwt'
import { getCookie } from 'hono/cookie'
import env from '@/env'
import { UserJwtPayload } from '@/lib/types'

export const jwtAuth = (options: { secret: string }) => {
  return async (c: Context, next: Next) => {
    // Skip auth for public routes
    const publicPaths = [
      '/api/users/register',
      '/api/users/login',
      '/api/health',
      '/api/stripe/webhook', // Webhook endpoints should be public
      // Public catalog/content endpoints
      '/api/banners',
      '/api/brands',
      '/api/categories',
      '/api/departments',
      '/api/nav-departments',
      '/api/products',
      '/api/product-deals',
      '/api/home',
      '/api/stats',
      '/api/payment-intent',
      // Docs
      '/doc',
      '/scalar'
    ]
    
    if (publicPaths.some(path => c.req.path.startsWith(path))) {
      return next()
    }

    // First try to get token from Authorization header
    let token: string | undefined
    const authHeader = c.req.header('Authorization')
    
    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1]
      c.set('authToken', token)
    } else {
      // Try to get token from cookie
      const cookieToken = getCookie(c, 'token')
      if (cookieToken) {
        token = cookieToken
      }
    }

    if (!token) {
      return c.json({ error: 'No token provided' }, 401)
    }

    // Verify the token and get the payload
    const auth = jwt({
      secret: options.secret,
      cookie: 'token',
    })
    
    // Create a mock context for JWT verification
    const mockCtx = {
      req: c.req,
      set: (key: string, value: any) => {
        if (key === 'jwtPayload') {
          c.set('jwtPayload', value)
        }
      },
      get: (key: string) => c.get(key),
      header: (name: string) => c.req.header(name),
    } as any
    
    // Create a mock next function
    const mockNext = async () => {}
    
    try {
      // Run the JWT middleware
      await auth(mockCtx, mockNext)
      
      // Get the payload from the context
      const payload = c.get('jwtPayload')
      
      if (payload && typeof payload === 'object' && 'userId' in payload) {
        // Set the user in the context with proper typing
        c.set('user', payload as UserJwtPayload)
        return next()
      }
      
      return c.json({ error: 'Invalid token' }, 401)
    } catch (error) {
      console.error('JWT verification error:', error)
      return c.json({ error: 'Invalid token' }, 401)
    }
  }
}

export const getAuth = (c: Context): UserJwtPayload | null => {
  // Get the user from the context set by our JWT middleware
  const user = c.get('user')
  return user || null
}

export const requireAuth = () => {
  return async (c: Context, next: Next) => {
    const user = getAuth(c)
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401)
    }
    return next()
  }
}

export const requireRole = (role: string) => {
  return async (c: Context, next: Next) => {
    const user = getAuth(c)
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401)
    }
    
    if (user.role !== role) {
      return c.json({ error: 'Forbidden' }, 403)
    }
    
    return next()
  }
}
