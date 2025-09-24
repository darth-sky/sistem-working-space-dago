// DashboardPengguna.jsx
import React, { useState, useContext, useEffect } from "react";
import { LogOut, Menu, X, Calendar, CreditCard, Building, Users, Diamond, History } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import logo from "../../../assets/images/logo.png";
import { AuthContext } from "../../../providers/AuthProvider";
import { MdOutlineMeetingRoom } from "react-icons/md";

const DashboardPengguna = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { userProfile, logout } = useContext(AuthContext);

  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    // Jika user buka /dashboard (tanpa child), redirect ke halaman default
    if (location.pathname === "/dashboard" || location.pathname === "/dashboard/") {
      navigate("/dashboard/informasi-ruangan", { replace: true });
    }
  }, [location.pathname, navigate]);

  const handleLogout = () => {
    logout?.();
    navigate("/");
  };

  // menu items: pastikan path sesuai route yang dibuat di App.jsx
  const menuItems = [
    { key: "informasi-ruangan", label: "Pesan Ruangan", icon: <Diamond size={18} />, path: "/informasi-ruangan" },
    { key: "membership", label: "Membership", icon: <Users size={18} />, path: "/membership" },
    { key: "virtual-office", label: "Virtual Office", icon: <Building size={18} />, path: "/virtual-office" },
    { key: "cek-kredit-membership", label: "Cek Kredit Membership", icon: <CreditCard size={18} />, path: "/cek-kredit-membership" },
    { key: "cek-masa-vo", label: "Cek Masa VO", icon: <Calendar size={18} />, path: "/cek-masa-vo" },
    { key: "riwayat-transaksi", label: "Riwayat Transaksi", icon: <History size={18} />, path: "/riwayat-transaksi" },
    { key: "event-spaces", label: "Event Spaces", icon: <MdOutlineMeetingRoom size={18} />, path: "/event-spaces" },
  ];

  // helper: apakah menu aktif (jika path child, tetap true karena startsWith)
  const isActive = (path) => location.pathname?.startsWith(path);

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Mobile overlay saat sidebar terbuka */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 md:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 bg-white border-r border-gray-200 transform transition-transform duration-300
          ${sidebarOpen ? "translate-x-0 w-64" : "-translate-x-full md:translate-x-0 md:w-64"}`}
      >
        {/* Header / Logo */}
        <div className="flex items-center gap-3 p-4 lg:p-6 border-b border-gray-100">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
            <span className="text-white font-bold">DS</span>
          </div>
          <div className="hidden md:block">
            <img src={logo} alt="Dago Space" className="h-6 object-contain" />
            <div className="text-sm text-gray-500">Dago Space</div>
          </div>
          {/* close button (mobile) */}
          <button
            className="ml-auto md:hidden p-2 rounded-md hover:bg-gray-100"
            onClick={() => setSidebarOpen(false)}
            aria-label="Tutup menu"
          >
            <X size={18} />
          </button>
        </div>

        {/* Menu */}
        <nav className="p-3 md:p-4 space-y-2">
          {menuItems.map((item) => (
            <button
              key={item.key}
              onClick={() => {
                setSidebarOpen(false);
                navigate(item.path);
              }}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-left
                ${isActive(item.path) ? "bg-blue-600 text-white shadow" : "text-gray-700 hover:bg-gray-100"}`}
            >
              <span className={`${isActive(item.path) ? "text-white" : "text-gray-600"}`}>{item.icon}</span>
              <span className="font-medium text-sm">{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Logout */}
        <div className="p-3 md:p-4 border-t border-gray-100 mt-auto">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left text-red-600 hover:bg-red-50"
          >
            <LogOut size={18} />
            <span className="font-medium text-sm">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main area */}
      {/* Main area */}
      <div className="flex-1 flex flex-col min-h-0 md:ml-64">
        {/* Header */}
        <header className="flex items-center justify-between gap-4 p-4 lg:p-6 bg-white border-b border-gray-100 sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <button
              className="p-2 rounded-md md:hidden hover:bg-gray-100"
              onClick={() => setSidebarOpen((v) => !v)}
              aria-label="Buka menu"
            >
              <Menu size={18} />
            </button>

            <div className="flex items-center gap-3">
              <img src={logo} alt="Logo" className="h-10 object-contain" />
              <div>
                <div className="text-sm text-gray-500">Halo,</div>
                <div className="text-lg font-semibold text-gray-800">
                  {userProfile?.name || "Pengguna"}
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/")}
              className="text-sm text-gray-600 hover:underline"
            >
              Kembali ke Beranda
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardPengguna;
