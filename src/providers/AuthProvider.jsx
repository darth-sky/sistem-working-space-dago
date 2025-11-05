// Di file: src/providers/AuthProvider.jsx
import { createContext, useState, useEffect, useMemo, useContext } from "react";
import { useNavigate } from "react-router";
import { jwtStorage } from "../utils/jwtStorage";
import { 
    getDataPrivate,
    apiCheckActiveSession,
    apiOpenSession,
    apiCloseSession,
    apiGetLastSaldo
} from "../services/service";


export const AuthContext = createContext(null);

export const useAuth = () => {
    // ... (Fungsi useAuth sudah benar)
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth harus digunakan di dalam AuthProvider');
    }
    return context;
};

const AuthProvider = ({ children }) => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [userProfile, setUserProfile] = useState({});
    const [loading, setLoading] = useState(true);
    const [activeSession, setActiveSession] = useState(null);
    const [isSessionLoading, setIsSessionLoading] = useState(true);
    const [isFirstLogin, setIsFirstLogin] = useState(null);
    const [userRole, setUserRole] = useState(null);
    const navigate = useNavigate();

    // getDataProfile HANYA digunakan untuk 'useEffect on-mount' (saat refresh)
    const getDataProfile = async () => {
        try {
            const result = await getDataPrivate(); // Panggil /profile (yang sudah fix)
            if (result?.user_logged) {
                setUserProfile(result);
                setIsLoggedIn(true);
                setIsFirstLogin(result.is_first_login); 
                setUserRole(result.roles);
                return result;
            } else {
                // ... (logika else Anda sudah benar)
                setUserProfile({});
                setIsLoggedIn(false);
                setIsFirstLogin(null);
                setUserRole(null);
                return null;
            }
        } catch (error) {
            // ... (logika catch Anda sudah benar)
            console.error("Gagal mendapatkan data profile:", error);
            setIsLoggedIn(false);
            setUserProfile({});
            setIsFirstLogin(null);
            setUserRole(null);
            jwtStorage.removeItem();
            return null;
        } finally {
            setLoading(false);
        }
    };

    // useEffect on-mount (Sudah benar, memanggil getDataProfile)
    useEffect(() => {
        const checkTokenOnMount = async () => {
            try {
                const token = await jwtStorage.retrieveToken();
                if (token) {
                    await getDataProfile();
                } else {
                    setLoading(false);
                }
            } catch (error) {
                setLoading(false);
            }
        };
        checkTokenOnMount();
    }, []);

    
    // ... (Fungsi Sesi Kasir tidak berubah) ...
    const checkActiveSession = async () => {
        setIsSessionLoading(true);
        try {
            const response = await apiCheckActiveSession();
            if (response.session) {
                setActiveSession(response.session);
            } else {
                setActiveSession(null);
            }
        } catch (error) {
            console.error("Error checking active session:", error);
            setActiveSession(null);
        } finally {
            setIsSessionLoading(false);
        }
    };

    const openSession = async (nama_sesi, saldo_awal) => {
        try {
            const response = await apiOpenSession({ nama_sesi, saldo_awal });
            await checkActiveSession();
            return response;
        } catch (error) {
            console.error("Error opening session:", error);
            throw error;
        }
    };

    const closeSession = async (saldo_akhir_aktual, nama_kasir_penutup) => {
        try {
            const sessionData = {
                saldo_akhir_aktual: saldo_akhir_aktual,
                nama_kasir_penutup: nama_kasir_penutup
            };
            const response = await apiCloseSession(sessionData); 
            setActiveSession(null);
            return response;
        } catch (error) {
            console.error("Error closing session:", error);
            throw error;
        }
    };

    const getLastSaldo = async () => {
        try {
            const response = await apiGetLastSaldo();
            return response.saldo_terakhir;
        } catch (error) {
            console.error("Error getting last saldo:", error);
            return 0;
        }
    };
    
    useEffect(() => {
        if (isLoggedIn && userRole === 'kasir') { 
            checkActiveSession();
        } else {
            setIsSessionLoading(false);
            setActiveSession(null);
        }
    }, [isLoggedIn, userRole]);


    // --- PERBAIKAN BESAR: 'login' function ---
    // Terima 'loginData' ({ access_token, is_first_login, role })
    // dari Login.jsx
    const login = async (loginData) => {
        // 1. Simpan token
        jwtStorage.storeToken(loginData.access_token);
        setLoading(true);

        try {
            // 2. Panggil getDataProfile HANYA untuk melengkapi profile
            //    (seperti email, id_user, dll)
            const profile = await getDataProfile();

            if (!profile) {
                 // getDataProfile gagal (cth: token tidak valid)
                navigate("/", { replace: true });
                return;
            }

            // 3. GUNAKAN DATA DARI 'loginData' (hasil /login) UNTUK NAVIGASI
            //    Ini adalah sumber data 'terbaru'
            if (loginData.role === 'kasir' && loginData.is_first_login === 1) {
                // KASUS 1: Kasir login pertama kali
                navigate("/kasir/ganti-password", { replace: true });
            } else {
                // KASUS 2: Login normal
                switch (loginData.role) {
                    case "admin_dago":
                        navigate("/virtualofficeadmin", { replace: true });
                        break;
                    case "kasir":
                        navigate("/kasir/buka-sesi", { replace: true });
                        break;
                    case "admin_tenant":
                        navigate("/ordertenant", { replace: true });
                        break;
                    case "owner":
                        navigate("/laporan", { replace: true });
                        break;
                    default: // 'pelanggan'
                        navigate("/informasi-ruangan", { replace: true });
                        break;
                }
            }
        } catch (error) {
            console.error("Gagal login:", error);
            setLoading(false);
            navigate("/", { replace: true });
        }
        // setLoading(false) di-handle oleh finally di getDataProfile
    };
    // --- AKHIR PERBAIKAN ---


    // --- PERBAIKAN: logout function ---
    const logout = () => {
        // ... (Logika logout Anda sudah benar)
        jwtStorage.removeItem();
        setIsLoggedIn(false);
        setUserProfile({});
        setActiveSession(null);
        setIsSessionLoading(false);
        setIsFirstLogin(null);
        setUserRole(null);
        navigate("/login", { replace: true });
    };

    // --- PERBAIKAN: contextValue ---
    const contextValue = useMemo(() => ({
        // ... (Konteks Anda sudah benar)
        isLoggedIn,
        loading,
        login,
        logout,
        userProfile,
        activeSession,
        isSessionLoading,
        openSession,
        closeSession,
        getLastSaldo,
        isFirstLogin, 
        userRole
    }), [
        isLoggedIn,
        loading,
        userProfile,
        activeSession,
        isSessionLoading,
        isFirstLogin, 
        userRole      
    ]);


    return (
        <AuthContext.Provider value={contextValue} >
            {children}
        </AuthContext.Provider>
    );
};

export default AuthProvider;