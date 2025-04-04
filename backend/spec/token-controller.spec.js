// spec/token-controller.spec.js
const jwt = require('jsonwebtoken');
const tokenController = require('../controllers/tokenController');

describe('Token Controller Tests', () => {
  const testPayload = {
    user: {
      id: 'test-user-id',
      email: 'test@example.com'
    }
  };

  describe('createToken', () => {
    it('should create a valid JWT token', () => {
      const token = tokenController.createToken(testPayload);
      expect(token).toBeDefined();
      
      // Verify the token is valid and contains expected payload
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'jwt_secret');
      expect(decoded.payload).toBeDefined();
      expect(decoded.payload.user.id).toBe(testPayload.user.id);
    });
  });
  
  describe('getTokenData', () => {
    it('should extract data from a valid token', () => {
      const token = tokenController.createToken(testPayload);
      const data = tokenController.getTokenData(token);
      
      expect(data).toBeDefined();
      expect(data.payload).toBeDefined();
      expect(data.payload.user.id).toBe(testPayload.user.id);
    });
    
    it('should return null for an invalid token', () => {
      const data = tokenController.getTokenData('invalid.token.string');
      expect(data).toBeNull();
    });
  });
  
  describe('verifyToken', () => {
    it('should return true for a valid token', () => {
      const token = tokenController.createToken(testPayload);
      const result = tokenController.verifyToken(token);
      expect(result).toBe(true);
    });
    
    it('should return false for an invalid token', () => {
      const result = tokenController.verifyToken('invalid.token.string');
      expect(result).toBe(false);
    });
  });
  
  describe('refreshToken', () => {
    it('should refresh a valid token', () => {
      const token = tokenController.createToken(testPayload);
      const refreshedToken = tokenController.refreshToken(token);
      
      expect(refreshedToken).toBeDefined();
      expect(refreshedToken).not.toBe(token);
      
      // Verify the refreshed token
      const decoded = jwt.verify(refreshedToken, process.env.JWT_SECRET || 'jwt_secret');
      expect(decoded.user).toBeDefined();
      expect(decoded.user.id).toBe(testPayload.user.id);
    });
    
    it('should handle refreshing an invalid token', () => {
      const refreshedToken = tokenController.refreshToken('invalid.token');
      
      // It should return the original token if it can't refresh
      expect(refreshedToken).toBe('invalid.token');
    });
  });
  
  describe('authenticateToken middleware', () => {
    it('should add user and refreshedToken to request for valid tokens', () => {
      const token = tokenController.createToken(testPayload);
      
      // Match the exact structure expected by the middleware
      const req = {
        headers: {
          'authorization': `Bearer ${token}`
        },
        body: {},
        query: {}
      };
      
      const res = {
        status: jasmine.createSpy('status').and.returnValue({
          json: jasmine.createSpy('json')
        })
      };
      
      const next = jasmine.createSpy('next');
      
      tokenController.authenticateToken(req, res, next);
      
      expect(req.user).toBeDefined();
      expect(req.user.user.id).toBe(testPayload.user.id);
      expect(req.refreshedToken).toBeDefined();
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });
    
    it('should return 401 for requests with no token', () => {
      // Match the expected structure but without a token
      const req = { 
        headers: {},
        body: {},
        query: {}
      };
      
      const res = {
        status: jasmine.createSpy('status').and.returnValue({
          json: jasmine.createSpy('json')
        })
      };
      
      const next = jasmine.createSpy('next');
      
      tokenController.authenticateToken(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });
  });
});
