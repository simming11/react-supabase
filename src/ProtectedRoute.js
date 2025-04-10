import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';

function ProtectedRoute({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(null);

  useEffect(() => {
    const checkAuth = () => {
      const adminUser = localStorage.getItem('adminUser');
      setIsAuthenticated(!!adminUser);
    };

    checkAuth();
  }, []);

  if (isAuthenticated === null) return <div>กำลังโหลด...</div>;
  if (!isAuthenticated) return <Navigate to="/login" />;

  return children;
}

export default ProtectedRoute;
