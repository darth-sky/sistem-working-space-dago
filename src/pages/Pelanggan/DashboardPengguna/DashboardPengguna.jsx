// DashboardPengguna.jsx
import React, { useState, useContext, useEffect } from "react";
import {
  Home,
  Menu,
  X,
  Calendar,
  CreditCard,
  Building,
  Users,
  Diamond,
  History,
  LogOut,
} from "lucide-react";
import { useNavigate, useLocation, Outlet } from "react-router-dom";
import logo from "../../../assets/images/logo.png";
import { AuthContext } from "../../../providers/AuthProvider";
import { MdOutlineDiscount, MdOutlineMeetingRoom } from "react-icons/md";
import { HiOutlineBuildingOffice2 } from "react-icons/hi2";

const DashboardPengguna = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { userProfile, logout } = useContext(AuthContext);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const basePath = "";

  useEffect(() => {
    if (location.pathname === basePath || location.pathname === `${basePath}/`) {
      navigate(`${basePath}/informasi-ruangan`, { replace: true });
    }
  }, [location.pathname, navigate, basePath]);

  const handleLogout = () => {
    logout?.();
    navigate("/");
  };

  const menuItems = [
    {
      key: "informasi-ruangan",
      label: "Pesan Ruangan",
      icon: <Diamond size={18} />,
      path: "/informasi-ruangan",
    },
    {
      key: "membership",
      label: "Membership",
      icon: <Users size={18} />,
      path: "/membership",
    },
    {
      key: "virtual-office",
      label: "Virtual Office",
      icon: <Building size={18} />,
      path: "/virtual-office",
    },
    {
      key: "cek-kredit-membership",
      label: "Cek Kredit Membership",
      icon: <CreditCard size={18} />,
      path: "/cek-kredit-membership",
    },
    {
      key: "cek-masa-vo",
      label: "Cek Masa VO",
      icon: <Calendar size={18} />,
      path: "/cek-masa-vo",
    },
    {
      key: "event-spaces",
      label: "Event Spaces",
      icon: <MdOutlineMeetingRoom size={18} />,
      path: "/event-spaces",
    },
    {
      key: "promo-pelanggan",
      label: "Promo",
      icon: <MdOutlineDiscount size={18} />,
      path: "/promo-pelanggan",
    },
    {
      key: "private-office",
      label: "Private Office",
      icon: <HiOutlineBuildingOffice2 size={18} />,
      path: "/private-office",
    },
    {
      key: "riwayat-transaksi",
      label: "Riwayat Transaksi",
      icon: <History size={18} />,
      path: "/riwayat-transaksi",
    },
  ];

  const isActive = (path) => location.pathname?.startsWith(`${basePath}${path}`);

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* === Overlay hitam, muncul di semua layar === */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* === Sidebar === */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 bg-white border-r border-gray-200 w-64 transform transition-transform duration-300 flex flex-col
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        {/* Header Sidebar */}
        <div className="flex items-center justify-between h-20 px-4 lg:px-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <img src={logo} alt="Logo" className="h-8 object-contain" />
            <span className="font-semibold text-gray-700">Dago Space</span>
          </div>
          <button
            className="p-1 rounded-md hover:bg-gray-100"
            onClick={() => setSidebarOpen(false)}
            aria-label="Tutup menu"
          >
            <X size={20} />
          </button>
        </div>

        {/* Menu Sidebar */}
        <nav className="flex-grow p-4 space-y-2 overflow-y-auto">
          {menuItems.map((item) => (
            <button
              key={item.key}
              onClick={() => {
                navigate(`${basePath}${item.path}`);
                setSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-left
                ${
                  isActive(item.path)
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-800"
                }`}
            >
              <span
                className={
                  isActive(item.path) ? "text-white" : "text-gray-500"
                }
              >
                {item.icon}
              </span>
              <span className="font-medium text-sm">{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Logout */}
        <div className="p-2 lg:p-4 border-t border-gray-100">
          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 lg:space-x-4 px-3 lg:px-4 py-2 lg:py-3 rounded-xl transition-all duration-300 text-left text-red-600 hover:bg-red-50"
          >
            <LogOut size={20} />
            <span className="font-medium text-sm lg:text-base">Logout</span>
          </button>
        </div>
      </aside>

      {/* === Konten Utama === */}
      <div className="flex-1 flex flex-col">
        <header className="flex items-center justify-between h-20 px-4 lg:px-6 bg-white border-b border-gray-200 sticky top-0 z-20">
          <div className="flex items-center gap-2">
            <button
              className="p-2 rounded-full hover:bg-gray-100"
              onClick={() => setSidebarOpen(true)}
              aria-label="Buka menu"
            >
              <Menu size={20} />
            </button>
            <div>
              <p className="text-sm text-gray-500">Halo, Selamat Datang!</p>
              <h1 className="text-lg font-bold text-gray-800">
                {userProfile?.detail?.nama || "Pengguna"}
              </h1>
            </div>
          </div>

          <button
            onClick={() => navigate("/")}
            className="p-2 rounded-full text-gray-600 hover:bg-gray-100 transition-colors"
            aria-label="Kembali ke Beranda"
          >
            <Home size={20} />
          </button>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          {children || <Outlet />}
        </main>
      </div>
    </div>
  );
};

export default DashboardPengguna;