import { useContext } from "react";
import { AuthContext } from "../../providers/AuthProvider";
import { Navigate, useLocation } from "react-router-dom";

const PrivateRoute = ({ children }) => {
  const { isLoggedIn, loading, userProfile } = useContext(AuthContext);
  const location = useLocation();
  console.log(userProfile);
  

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-lg font-semibold">Loading...</p>
      </div>
    );
  }

  if (isLoggedIn) {
    return children;
  }

  // Redirect ke login, simpan lokasi sebelumnya biar bisa balik setelah login
  return <Navigate to="/login" state={{ from: location }} replace />;
};

export default PrivateRoute;
