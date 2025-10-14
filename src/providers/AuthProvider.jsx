// /* eslint-disable react/prop-types */
// import { createContext, useState, useEffect } from "react";
// import { useNavigate } from "react-router";
// import { jwtStorage } from "../utils/jwtStorage";
// import { getDataPrivate } from "../services/service";


// export const AuthContext = createContext(null);

// const AuthProvider = ({ children }) => {
//   const [isLoggedIn, setIsLoggedIn] = useState(false); // Replace with your logic
//   const [userProfile, setUserProfile] = useState({});
//   const [loading, setLoading] = useState(true);

//   const navigate = useNavigate();

//   const getDataProfile = async () => {
//     try {
//       const result = await getDataPrivate();

//       if (result?.user_logged) {
//         setUserProfile(result);
//         setIsLoggedIn(true);
//         return result; // ⬅️ kembalikan result
//       } else {
//         setIsLoggedIn(false);
//         return null;
//       }
//     } catch (error) {
//       setIsLoggedIn(false);
//       return null;
//     } finally {
//       setLoading(false); // selesai ngecek
//     }
//   };

//   useEffect(() => {
//     getDataProfile();
//   }, []);

//   const login = async (access_token) => {
//     jwtStorage.storeToken(access_token);

//     try {
//       // tunggu profil selesai diambil
//       const profile = await getDataProfile();

//       if (!profile) {
//         navigate("/", { replace: true });
//         return;
//       }

//       // navigasi sesuai role
//       switch (profile.roles) {
//         case "admin":
//           navigate("/dashboardadmin", { replace: true });
//           break;
//         case "kasir":
//           navigate("/mengelola-orderan_fb", { replace: true });
//           break;
//         default:
//           navigate("/daftar-member", { replace: true });
//           break;
//       }
//     } catch (error) {
//       console.error("Gagal login:", error);
//       navigate("/", { replace: true });
//     }
//   };

//   const logout = () => {
//     jwtStorage.removeItem();
//     setIsLoggedIn(false);
//     navigate("/login", { replace: true });
//   };

//   return (
//     <AuthContext.Provider
//       value={{ isLoggedIn, loading, login, logout, userProfile }}
//     >
//       {children}
//     </AuthContext.Provider>
//   );
// };

// export default AuthProvider;


// const getDataProfile = async () => {
//   try {
//     const result = await getDataPrivate(); // GET /profile

//     if (result?.user_logged) {
//       setUserProfile({
//         id_user: result.id_user,
//         email: result.email,
//         roles: result.roles,
//       });
//       setIsLoggedIn(true);
//       return result;
//     } else {
//       setIsLoggedIn(false);
//       return null;
//     }
//   } catch (error) {
//     setIsLoggedIn(false);
//     return null;
//   } finally {
//     setLoading(false);
//   }
// };
import { createContext, useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { jwtStorage } from "../utils/jwtStorage";
import { getDataPrivate } from "../services/service";


export const AuthContext = createContext(null);

const AuthProvider = ({ children }) => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    // userProfile akan menyimpan seluruh payload dari /protected/data,
    // termasuk detail.id_tenant
    const [userProfile, setUserProfile] = useState({}); 
    const [loading, setLoading] = useState(true);

    const navigate = useNavigate();

    const getDataProfile = async () => {
        try {
            const result = await getDataPrivate();

            if (result?.user_logged) {
                // MODIFIKASI: Simpan SELURUH hasil (result) ke userProfile
                // Ini akan memastikan userProfile memiliki detail: { ..., id_tenant: X }
                setUserProfile(result); 
                setIsLoggedIn(true);
                return result; 
            } else {
                setUserProfile({});
                setIsLoggedIn(false);
                return null;
            }
        } catch (error) {
            console.error("Gagal mendapatkan data profile:", error);
            setIsLoggedIn(false);
            setUserProfile({});
            return null;
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // Cek status login saat komponen pertama kali dimuat
        getDataProfile();
    }, []);

    const login = async (access_token) => {
        jwtStorage.storeToken(access_token);
        
        // Atur loading ke true saat login dimulai
        setLoading(true); 

        try {
            // Tunggu profil selesai diambil
            const profile = await getDataProfile(); 

            if (!profile) {
                navigate("/", { replace: true });
                return;
            }

            // MODIFIKASI: Navigasi sesuai role, tambahkan "admin_tenant"
            switch (profile.roles) {
                case "admin":
                    navigate("/dashboardadmin", { replace: true });
                    break;
                case "kasir":
                    navigate("/transaksikasir", { replace: true });
                    break;
                case "admin_tenant": // PERAN BARU
                    // Admin tenant diarahkan ke DashboardTenant
                    navigate("/dashboardtenant", { replace: true }); 
                    break;
                default:
                    navigate("/daftar-member", { replace: true });
                    break;
            }
        } catch (error) {
            console.error("Gagal login:", error);
            navigate("/", { replace: true });
        } finally {
             setLoading(false);
        }
    };

    const logout = () => {
        jwtStorage.removeItem();
        setIsLoggedIn(false);
        setUserProfile({});
        navigate("/login", { replace: true });
    };

    return (
        <AuthContext.Provider
            value={{ isLoggedIn, loading, login, logout, userProfile }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export default AuthProvider;

// Catatan: Anda memiliki definisi getDataProfile duplikat di bawah,
// pastikan hanya menggunakan yang pertama dan terintegrasi ke AuthProvider.