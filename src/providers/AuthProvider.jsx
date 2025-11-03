import { createContext, useState, useEffect, useMemo, useContext } from "react";
import { useNavigate } from "react-router";
import { jwtStorage } from "../utils/jwtStorage";
import { getDataPrivate } from "../services/service";

import {
    apiCheckActiveSession,
    apiOpenSession,
    apiCloseSession,
    apiGetLastSaldo
} from "../services/service"; // (Atau dari sessionService.js jika Anda memisahnya)


export const AuthContext = createContext(null);

// --- PERBAIKAN: Tambahkan custom hook 'useAuth' ---
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth harus digunakan di dalam AuthProvider');
    }
    return context;
};
// --- AKHIR PERBAIKAN ---


const AuthProvider = ({ children }) => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [userProfile, setUserProfile] = useState({});
    const [loading, setLoading] = useState(true); // Tetap true by default

    const [activeSession, setActiveSession] = useState(null);
    const [isSessionLoading, setIsSessionLoading] = useState(true);

    const navigate = useNavigate();

    const getDataProfile = async () => {
        try {
            const result = await getDataPrivate();
            if (result?.user_logged) {
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
            // Bersihkan token jika tidak valid
            jwtStorage.removeItem();
            return null;
        } finally {
            setLoading(false);
        }
    };

    // --- PERBAIKAN: Modifikasi useEffect on-mount ---
    useEffect(() => {
        const checkTokenOnMount = async () => {
            try {
                const token = await jwtStorage.retrieveToken();
                if (token) {
                    // Jika ada token di storage (cth: user refresh halaman),
                    // baru kita coba ambil data profile
                    await getDataProfile();
                } else {
                    // Jika tidak ada token, selesai loading.
                    setLoading(false);
                }
            } catch (error) {
                // Terjadi error saat retrieve token (jarang)
                setLoading(false);
            }
        };

        checkTokenOnMount();
    }, []); // Hanya berjalan sekali saat app dimuat
    // --- AKHIR PERBAIKAN ---

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
            // Kirim objek yang berisi kedua data
            const sessionData = {
                saldo_akhir_aktual: saldo_akhir_aktual,
                nama_kasir_penutup: nama_kasir_penutup
            };
            const response = await apiCloseSession(sessionData); // Service apiCloseSession sudah benar (menerima 1 objek)
            setActiveSession(null); // Langsung set null di frontend
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
        if (isLoggedIn && userProfile.roles === 'kasir') {
            checkActiveSession();
        } else {
            setIsSessionLoading(false);
            setActiveSession(null);
        }
    }, [isLoggedIn, userProfile]);

    const login = async (access_token) => {
        jwtStorage.storeToken(access_token);
        setLoading(true); // Mulai loading saat login
        try {
            // Panggil getDataProfile SETELAH token disimpan
            const profile = await getDataProfile();

            if (!profile) {
                navigate("/", { replace: true });
                return;
            }
            // (setLoading(false) akan di-handle oleh finally di getDataProfile)

            switch (profile.roles) {
                case "admin":
                    navigate("/virtualofficeadmin", { replace: true });
                    break;
                case "kasir":
                    navigate("/kasir/buka-sesi", { replace: true });
                    break;
                case "admin_tenant":
                    navigate("/dashboardtenant", { replace: true });
                    break;
                default:
                    navigate("/daftar-member", { replace: true });
                    break;
            }
        } catch (error) {
            console.error("Gagal login:", error);
            setLoading(false); // Pastikan loading berhenti jika login gagal
            navigate("/", { replace: true });
        }
    };

    const logout = () => {
        jwtStorage.removeItem();
        setIsLoggedIn(false);
        setUserProfile({});
        setActiveSession(null);
        setIsSessionLoading(false);
        navigate("/login", { replace: true });
    };

    const contextValue = useMemo(() => ({
        isLoggedIn,
        loading,
        login,
        logout,
        userProfile,
        activeSession,
        isSessionLoading,
        openSession,
        closeSession,
        getLastSaldo
    }), [
        isLoggedIn,
        loading,
        userProfile,
        activeSession,
        isSessionLoading
    ]);


    return (
        <AuthContext.Provider value={contextValue} >
            {children}
        </AuthContext.Provider>
    );
};

export default AuthProvider;