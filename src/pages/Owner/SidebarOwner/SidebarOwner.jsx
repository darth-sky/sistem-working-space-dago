import React, { useEffect, useState } from "react"; // Hapus useContext
import { Menu, X } from "lucide-react";

// --- PERBAIKAN 1: Import Outlet ---
import { Link, useNavigate, Outlet } from "react-router-dom";
// --- AKHIR PERBAIKAN 1 ---

// --- PERBAIKAN 2: Gunakan useAuth ---
import { useAuth } from "../../../providers/AuthProvider";
// --- AKHIR PERBAIKAN 2 ---

import { BsGraphUpArrow } from "react-icons/bs";
import { SlLogout } from "react-icons/sl";
import { CiDollar } from "react-icons/ci";


const SidebarOwner = () => { // Hapus prop { children }
    const [selectedMenu, setSelectedMenu] = useState("Laporan");
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const navigate = useNavigate();

    // --- PERBAIKAN 3: Ambil dari useAuth ---
    const { userProfile, logout } = useAuth();
    // --- AKHIR PERBAIKAN 3 ---

    const handleLogout = () => {
        logout();
        // navigate("/login") tidak perlu
    };

    // useEffect ini tidak diperlukan lagi
    // useEffect(() => {
    //     if (userProfile.roles !== "owner") {
    //         navigate("/");
    //     }
    // }, [userProfile]);


    const menuItems = [
        { name: "Laporan", icon: <BsGraphUpArrow />, path: "/laporan" },
        { name: "Bagi Hasil", icon: <CiDollar />, path: "/bagihasil" },
        // Anda mungkin ingin menambahkan FnbDashboard dan WorkingSpace ke menu?
        // { name: "F&B Dashboard", icon: <IconLain />, path: "/fnbdashboard" },
        // { name: "Working Space", icon: <IconLain />, path: "/workingspace" },
        {
            name: "Logout",
            icon: <SlLogout />,
            action: handleLogout
        }
    ];

    // (Fungsi getStatusColor, handleStatusChange, formatPrice sepertinya tidak dipakai di sini, bisa dihapus)

    return (
        <div className="flex h-screen bg-gradient-to-br from-blue-50 via-gray-100 to-blue-100 overflow-hidden">

            {/* Sidebar */}
            <div
                className={`
                    fixed md:static inset-y-0 left-0 z-40 bg-gray-100 border-r border-gray-300
                    transform transition-all duration-300
                    ${isSidebarOpen ? "translate-x-0 w-64" : "-translate-x-full md:translate-x-0 md:w-20"}
                `}
            >
                {/* Logo Section */}
                <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                    <img
                        src="/img/logo_dago.png" // Path relatif dari folder public
                        alt="Dago Logo"
                        className="h-10 mx-auto"
                    />
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
                <nav className="flex-1 py-4 space-y-1 overflow-y-auto">
                     {menuItems.map((item, index) =>
                        item.action ? ( // Jika item punya 'action' (Logout)
                            <button
                                key={index}
                                onClick={item.action}
                                className={`w-full flex items-center px-4 py-3 space-x-3 text-left transition-all duration-200 ${selectedMenu === item.name
                                ? "bg-blue-600 text-white"
                                : "text-gray-800 hover:bg-blue-100"
                                }`}
                            >
                                <span className={`text-xl ${selectedMenu === item.name ? "text-white" : "text-gray-700"}`}>
                                {item.icon}
                                </span>
                                <span className={`font-medium ${!isSidebarOpen && 'md:hidden'}`}>{item.name}</span>
                            </button>
                        ) : ( // Jika item punya 'path' (Link biasa)
                            <Link
                                to={item.path}
                                key={index}
                                onClick={() => {
                                setSelectedMenu(item.name);
                                if (window.innerWidth < 768) {
                                    setIsSidebarOpen(false); // Tutup di mobile saat klik menu
                                }
                                }}
                                className={`w-full flex items-center px-4 py-3 space-x-3 text-left transition-all duration-200 ${selectedMenu === item.name
                                ? "bg-blue-600 text-white"
                                : "text-gray-800 hover:bg-blue-100"
                                }`}
                            >
                                <span className={`text-xl ${selectedMenu === item.name ? "text-white" : "text-gray-700"}`}>
                                {item.icon}
                                </span>
                                <span className={`font-medium ${!isSidebarOpen && 'md:hidden'}`}>{item.name}</span>
                            </Link>
                        )
                    )}
                </nav>
            </div>

            {/* Overlay (untuk mobile) */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 z-30 bg-black bg-opacity-25 md:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}


            {/* Main Content */}
            <div className="flex-1 flex flex-col bg-white overflow-hidden">
                {/* Header */}
                <div className="w-full bg-gray-100 border-b border-gray-300 px-4 lg:px-8 py-3 flex items-center justify-between sticky top-0 z-20">
                    {/* Left Section */}
                    <div className="flex items-center space-x-3">
                        <button
                            className="p-2 rounded-lg hover:bg-gray-200"
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        >
                            <Menu className="h-6 w-6 text-gray-700" />
                        </button>
                        <div>
                            <h1 className="text-lg lg:text-xl font-bold text-gray-800">Welcome Owner</h1>
                            <p className="text-sm text-gray-600">Dago Creative Hub & Coffee Lab</p>
                        </div>
                    </div>

                    {/* Right Section */}
                    <div className="flex items-center space-x-3">
                        {/* Menampilkan nama dari profile jika ada */}
                        <span className="text-sm font-semibold text-gray-800">
                            {userProfile?.detail?.nama || userProfile?.email || "Owner"}
                        </span>
                        <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-full bg-gray-300 flex items-center justify-center">
                            {/* Icon User */}
                             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                        </div>
                    </div>
                </div>

                {/* --- PERBAIKAN 4: Gunakan Outlet --- */}
                {/* Scrollable Content Area */}
                <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
                     <Outlet /> {/* <-- Halaman anak (Laporan, BagiHasil, dll.) akan dirender di sini */}
                </main>
                {/* --- AKHIR PERBAIKAN 4 --- */}

            </div>
        </div>
    );
};

export default SidebarOwner;