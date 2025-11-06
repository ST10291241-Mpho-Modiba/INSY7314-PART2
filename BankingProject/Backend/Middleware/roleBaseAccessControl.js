/**
 * Role-Based Access Control (RBAC) Middleware
 * Ensures only employees with 'employee' role can access protected endpoints
 */

const requireEmployee = (req, res, next) => {
  // Check if user is authenticated (from auth middleware)
  if (!req.user) {
    return res.status(401).json({ 
      message: 'Authentication required. Please login first.' 
    });
  }

  // Check if user has 'employee' role
  if (req.user.role !== 'employee') {
    return res.status(403).json({ 
      message: 'Access denied. Employee role required.' 
    });
  }

  // User is authenticated and has employee role
  next();
};

export default requireEmployee;

