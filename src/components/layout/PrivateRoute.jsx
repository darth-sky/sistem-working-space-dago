// import { useContext } from "react";
// import { AuthContext } from "../../providers/AuthProvider";
// import { Navigate, useLocation } from "react-router-dom";

// const PrivateRoute = ({ children }) => {
//   const { isLoggedIn, loading, userProfile } = useContext(AuthContext);
//   const location = useLocation();
//   console.log(userProfile);
  

//   if (loading) {
//     return (
//       <div className="flex items-center justify-center min-h-screen">
//         <p className="text-lg font-semibold">Loading...</p>
//       </div>
//     );
//   }

//   if (isLoggedIn) {
//     return children;
//   }

//   // Redirect ke login, simpan lokasi sebelumnya biar bisa balik setelah login
//   return <Navigate to="/login" state={{ from: location }} replace />;
// };

// export default PrivateRoute;


import { useContext } from "react";
import { AuthContext } from "../../providers/AuthProvider";
import { Navigate, useLocation } from "react-router-dom";

const PrivateRoute = ({ children, allowedRoles }) => {
  const { isLoggedIn, loading, userProfile } = useContext(AuthContext);
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-lg font-semibold">Loading...</p>
      </div>
    );
  }

  if (!isLoggedIn) {
    // Belum login → lempar ke /login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles?.length > 0) {
    const role = userProfile?.roles?.toLowerCase();
    if (!allowedRoles.includes(role)) {
      // Role tidak punya izin → lempar ke /forbidden
      return <Navigate to="/forbidden" replace />;
    }
  }

  return children;
};

export default PrivateRoute;
