import React, { useEffect, useState } from "react"; // Hapus useContext
import { Menu, X } from "lucide-react"; 
import { Link, useNavigate, Outlet } from "react-router-dom";

// --- PERBAIKAN: Gunakan 'useAuth' hook ---
import { useAuth } from "../../../providers/AuthProvider"; 
// --- AKHIR PERBAIKAN ---

import { BsBox2, BsBox2Fill, BsCart, BsCart3, BsCartFill, BsFileBarGraph, BsGraphUpArrow } from "react-icons/bs";
import { MdChair, MdHistory, MdMoney, MdOutlineChair, MdOutlineHistory } from "react-icons/md";
import { FaDatabase } from "react-icons/fa";
import { GrCart } from "react-icons/gr";
import { FaHouse } from "react-icons/fa6";
import { RiHomeOfficeLine } from "react-icons/ri";
import { IoSettingsOutline } from "react-icons/io5";
import { SlLogout } from "react-icons/sl";
import GlobalRentalMonitor from "../../../components/GlobalRentalMonitor";


const SidebarKasir = ({ children }) => {
    const [selectedMenu, setSelectedMenu] = useState("Transaksi");
    const [showBilling, setShowBilling] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const navigate = useNavigate();

    // --- PERBAIKAN: Ambil 'userProfile' dan 'logout' dari useAuth ---
    const { userProfile, logout } = useAuth();
    // --- AKHIR PERBAIKAN ---

    const handleLogout = () => {
        logout();            
        // navigate("/login") tidak perlu, 'logout' di AuthProvider sudah menanganinya
    };

    // useEffect ini sudah tidak diperlukan karena PrivateRoute menanganinya
    // useEffect(() => {
    //     if (userProfile.roles !== "kasir") {
    //         navigate("/");
    //     }
    // }, [userProfile]);

    const [orders, setOrders] = useState([
        // ... (data order Anda) ...
    ]);

    const menuItems = [
        { name: "Transaksi", icon: <GrCart />, path: "/transaksikasir" },
        { name: "Merchant", icon: <RiHomeOfficeLine />, path: "/merchantkasir" },
        { name: "Product", icon: <BsBox2 />, path: "/productkasir" },
        { name: "History", icon: <MdOutlineHistory />, path: "/historykasir" },
        { name: "Space", icon: <MdOutlineChair />, path: "/spacekasir" },
        { name: "Laporan Pembayaran", icon: <MdMoney />, path: "/laporanpembayarankasir" },
        { name: "Settings", icon: <IoSettingsOutline />, path: "/settingskasir" },
        {
            name: "Logout",
            icon: <SlLogout />,
            action: handleLogout
        }
    ];

    // ... (sisa fungsi Anda: getStatusColor, handleStatusChange, formatPrice) ...

    return (
        <div className="flex h-screen bg-gradient-to-br from-blue-50 via-gray-100 to-blue-100 overflow-hidden">

            {/* Sidebar */}
            <div
                className={`
                            fixed md:static inset-y-0 left-0 z-40 bg-gray-100 border-r border-gray-300 
                            transform transition-all duration-300
                            ${isSidebarOpen
                        ? "translate-x-0 w-64"
                        : "-translate-x-full md:translate-x-0 md:w-20"}
                        `}
            >
                {/* Logo Section */}
                <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                    <img
                        src="/img/logo_dago.png" // Path relatif dari folder public
                        alt="Dago Logo"
                        className="h-10 mx-auto"
                    />
                    {/* Tombol close di mobile */}
                    {isSidebarOpen && (
                        <button
                            className="md:hidden p-2 rounded-lg hover:bg-gray-200"
                            onClick={() => setIsSidebarOpen(false)}
                        >
                            <X className="h-6 w-6 text-gray-700" />
                        </button>
                    )}
                </div>


                {/* Menu Section */}
                <nav className="flex-1 py-4 space-y-1">
                    {menuItems.map((item, index) => (
                        <div
                            key={index}
                            onClick={() => {
                                if (item.path) navigate(item.path);
                                if (item.action) item.action();
                                setSelectedMenu(item.name);
                                if (window.innerWidth < 768) setIsSidebarOpen(false);
                            }}
                            className={`w-full flex items-center px-4 py-3 space-x-3 text-left transition-all duration-200 ${selectedMenu === item.name
                                ? "bg-blue-600 text-white"
                                : "text-gray-800 hover:bg-blue-100"
                                }`}
                        >
                            <span className={`text-xl ${selectedMenu === item.name ? "text-white" : "text-gray-700"}`}>
                                {item.icon}
                            </span>
                            {/* --- PERBAIKAN: Tampilkan menu saat sidebar full (w-64) --- */}
                            {isSidebarOpen && <span className="font-medium">{item.name}</span>}
                        </div>
                    ))}
                </nav>
            </div>
            {/* Overlay (hanya tampil di mobile saat sidebar terbuka) */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 z-30 md:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}


            {/* Main Content */}
            <div className="flex-1 flex flex-col bg-white overflow-hidden"> {/* PERBAIKAN: Tambah flex-col */}
                {/* Header */}
                <div className="w-full bg-gray-100 border-b border-gray-300 px-4 lg:px-8 py-3 flex items-center justify-between sticky top-0 z-30">
                    {/* Left Section */}
                    <div className="flex items-center space-x-3">
                        {/* Tombol menu (tampil di mobile & desktop) */}
                        <button
                            className="p-2 rounded-lg hover:bg-gray-200"
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        >
                            {/* --- PERBAIKAN: Logika tombol harus konsisten --- */}
                            <Menu className="h-6 w-6 text-gray-700" />
                        </button>

                        <div>
                            <h1 className="text-lg lg:text-xl font-bold text-gray-800">POS KASIR</h1>
                            <p className="text-sm text-gray-600">Dago Creative Hub & Coffee Lab</p>
                        </div>
                    </div>

                    {/* Right Section */}
                    <div className="flex items-center space-x-3">
                        <span className="text-sm font-semibold text-gray-800">
                            {userProfile?.detail?.nama || userProfile?.email || "Pengguna"}
                        </span>
                        <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-full bg-gray-300 flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M5.121 17.804A9.969 9.969 0 0112 15c2.21 0 4.236.714 5.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                        </div>
                    </div>
                </div>

                {/* Scrollable Content */}
                <main className="flex-1 overflow-y-auto">
                    {/* INI ADALAH TEMPAT HALAMAN /transaksikasir RENDER */}
                    <Outlet />
                </main>
                <GlobalRentalMonitor />
            </div>
        </div>
    );
};

export default SidebarKasir;