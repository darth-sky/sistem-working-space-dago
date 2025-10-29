// --- PERBAIKAN: Import 'useAuth' dan 'useNavigate' ---
import React, { useState } from 'react';
import { useAuth } from '../../../providers/AuthProvider'; // (Pastikan path ini benar)
import { useNavigate } from 'react-router-dom';

// A reusable Toggle Switch component
const ToggleSwitch = ({ id, checked, onChange }) => {
  return (
    <label htmlFor={id} className="flex items-center cursor-pointer">
      <div className="relative">
        <input id={id} type="checkbox" className="sr-only" checked={checked} onChange={onChange} />
        <div className={`block w-12 h-6 rounded-full transition-colors ${checked ? 'bg-blue-500' : 'bg-gray-300'}`}></div>
        <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${checked ? 'transform translate-x-6' : ''}`}></div>
      </div>
    </label>
  );
};

// Main Settings Page Component
const SettingsKasir = () => {
  // State for the toggle switches
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isNetworkIndicator, setIsNetworkIndicator] = useState(true);
  const [isBackgroundTask, setIsBackgroundTask] = useState(false);

  // --- PERBAIKAN: Hubungkan ke AuthContext ---
  const { logout, closeSession, activeSession } = useAuth();
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [saldoAktual, setSaldoAktual] = useState('');
  const [error, setError] = useState('');

  const handleCloseSessionClick = () => {
    // Di sini Anda bisa mengambil data summary sesi jika perlu
    // Untuk saat ini, kita langsung tampilkan modal
    setShowModal(true);
    setError('');
  };

  const handleConfirmCloseSession = async () => {
    if (!saldoAktual || isNaN(parseFloat(saldoAktual))) {
        setError('Saldo aktual wajib diisi dan harus angka.');
        return;
    }
    try {
        await closeSession(parseFloat(saldoAktual));
        alert('Sesi berhasil ditutup!');
        setShowModal(false);
        navigate('/kasir/buka-sesi'); // Arahkan kembali ke BukaSesi
    } catch (err) {
        setError(err.message || 'Gagal menutup sesi');
    }
  };

  // Fungsi untuk logout (dari tombol Sign Out)
  const handleSignOut = () => {
    // AuthProvider.jsx sudah mengatur navigate ke /login
    logout(); 
  };
  // --- AKHIR PERBAIKAN ---

  return (
    <div className="bg-gray-100 min-h-screen p-4 sm:p-6 lg:p-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* General Settings Section (Kode Anda) */}
        <div className="bg-white rounded-lg shadow">
          {/* ... (bagian Dark Mode, Network, dll. tetap sama) ... */}
          <div className="p-6 flex justify-between items-center border-b border-gray-200">
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Dark Mode</h3>
            </div>
            <ToggleSwitch id="darkMode" checked={isDarkMode} onChange={() => setIsDarkMode(!isDarkMode)} />
          </div>
          <div className="p-6 flex justify-between items-center border-b border-gray-200">
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Network Indicator</h3>
              <p className="text-sm text-gray-500">Tampilkan indikator jaringan pada aplikasi</p>
            </div>
            <ToggleSwitch id="networkIndicator" checked={isNetworkIndicator} onChange={() => setIsNetworkIndicator(!isNetworkIndicator)} />
          </div>
          <div className="p-6 flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Background Task Indicator</h3>
              <p className="text-sm text-gray-500">Menampilkan indicator data pada pojok kanan atas</p>
            </div>
            <ToggleSwitch id="backgroundTask" checked={isBackgroundTask} onChange={() => setIsBackgroundTask(!isBackgroundTask)} />
          </div>
        </div>

        {/* Hardware Section (Kode Anda) */}
        <div>
          {/* ... (bagian Hardware tetap sama) ... */}
        </div>

        {/* Session Section */}
        <div>
          <h2 className="text-sm font-bold text-gray-600 uppercase mb-2 px-2">Session</h2>
          <div className="bg-red-50 border border-red-200 rounded-lg shadow">
            {/* ... (bagian Timezone & Export File tetap sama) ... */}
             <div className="p-6 flex justify-between items-center">
                <h3 className="text-lg font-semibold text-red-700">Close Cashier Session</h3>
                {/* --- PERBAIKAN: Hubungkan tombol Close --- */}
                <button 
                  onClick={handleCloseSessionClick}
                  className="px-5 py-2 text-sm font-semibold text-white bg-red-500 rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50">
                    Close
                </button>
            </div>
          </div>
        </div>
        
        {/* Account Section */}
        <div>
          <h2 className="text-sm font-bold text-gray-600 uppercase mb-2 px-2">Account</h2>
          <div className="bg-red-50 border border-red-200 rounded-lg shadow p-6 flex justify-between items-center">
            <h3 className="text-lg font-semibold text-red-700">Sign Out</h3>
             {/* --- PERBAIKAN: Hubungkan tombol Sign Out --- */}
            <button 
              onClick={handleSignOut}
              className="px-5 py-2 text-sm font-semibold text-white bg-red-500 rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50">
                Sign Out
            </button>
          </div>
        </div>

      </div>

      {/* --- PERBAIKAN: Modal untuk Konfirmasi Tutup Sesi --- */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full">
                <h3 className="text-lg font-bold mb-4">Tutup Sesi Kasir</h3>
                <p className="text-sm mb-2">Sesi: <span className="font-semibold">{activeSession?.nama_sesi || 'N/A'}</span></p>
                <p className="text-sm mb-4">Saldo Awal: <span className="font-semibold">Rp {new Intl.NumberFormat('id-ID').format(activeSession?.saldo_awal || 0)}</span></p>
                
                {/* Anda bisa menambahkan API untuk mengambil total tunai tercatat di sini */}

                <div className="mt-4">
                    <label htmlFor="saldo_aktual" className="block text-sm font-medium text-gray-700">
                        Masukkan Saldo Tunai Aktual (yang dihitung manual)
                    </label>
                    <input 
                        type="number" 
                        id="saldo_aktual"
                        value={saldoAktual}
                        onChange={(e) => setSaldoAktual(e.target.value)}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Contoh: 1500000"
                    />
                </div>

                {error && <p className="text-red-500 text-sm mt-2">{error}</p>}

                <div className="mt-6 flex justify-end space-x-3">
                    <button 
                        onClick={() => setShowModal(false)}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                    >
                        Batal
                    </button>
                    <button 
                        onClick={handleConfirmCloseSession}
                        className="px-4 py-2 text-sm font-medium text-white bg-red-500 rounded-md hover:bg-red-600"
                    >
                        Konfirmasi Tutup Sesi
                    </button>
                </div>
            </div>
        </div>
      )}
      {/* --- AKHIR PERBAIKAN --- */}
    </div>
  );
};

export default SettingsKasir;
// --- PERBAIKAN: Karakter '}' ekstra di bawah baris ini telah dihapus ---