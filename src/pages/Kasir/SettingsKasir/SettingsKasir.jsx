// src/pages/Kasir/SettingsKasir/SettingsKasir.jsx

import React, { useState } from 'react';
import { useAuth } from '../../../providers/AuthProvider'; // pastikan path benar
import { useNavigate } from 'react-router-dom';
import { message } from 'antd'; // Import 'message' dari antd
import { findPrinterDetails } from '../../../utils/PrinterFinder'; // Import dari file Anda

// --- (TAMBAHAN) Import fungsi printer dari service yang kita bahas sebelumnya ---
import {
  connectToPrinter,
  getPrinterStatus,
  printTestReceipt // Asumsi Anda sudah menambahkan 'printTestReceipt'
} from '../../../utils/printerService'; // Pastikan path ini benar
import { PrinterOutlined, ApiOutlined, FileSearchOutlined } from '@ant-design/icons';
// --- (AKHIR TAMBAHAN) ---

const SettingsKasir = () => {
  // --- PERUBAHAN: 'activeSession' tidak lagi diperlukan untuk validasi nama ---
  const { logout, closeSession, userProfile } = useAuth();
  const navigate = useNavigate();

  // State
  const [showModal, setShowModal] = useState(false);
  const [namaKonfirmasi, setNamaKonfirmasi] = useState('');
  const [saldoAkhir, setSaldoAkhir] = useState('');
  const [error, setError] = useState('');

  // --- (TAMBAHAN) State untuk printer ---
  const [printer, setPrinter] = useState(getPrinterStatus());
  const [isConnecting, setIsConnecting] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  // --- (AKHIR TAMBAHAN) ---

  // --- TAMBAHAN BARU: Ambil nama kasir yang login dari profile ---
  const namaKasirLogin = userProfile?.detail?.nama || userProfile?.email || '';

  // Tombol buka modal tutup sesi
  const handleCloseSessionClick = () => {
    setError('');
    setNamaKonfirmasi('');
    setSaldoAkhir('');
    setShowModal(true);
  };

  // --- PERUBAHAN UTAMA: Ubah logika konfirmasi ---
  const handleConfirmCloseSession = async () => {
    // 1. Validasi nama kasir (bukan nama sesi)
    if (!namaKonfirmasi || namaKonfirmasi.trim() === '') {
      setError('Nama kasir wajib diisi untuk konfirmasi.');
      return;
    }
    // 2. Bandingkan input dengan nama kasir yang login
    if (namaKonfirmasi.trim() !== namaKasirLogin) {
      setError(`Nama kasir tidak sesuai. Harap ketik "${namaKasirLogin}" dengan benar.`);
      return;
    }
    // 3. Validasi saldo akhir (tetap sama)
    if (!saldoAkhir || isNaN(parseFloat(saldoAkhir))) {
      setError('Saldo akhir wajib diisi dan harus berupa angka.');
      return;
    }

    try {
      // 4. Kirim nama kasir yang sudah divalidasi ke fungsi closeSession
      await closeSession(parseFloat(saldoAkhir), namaKasirLogin);

      message.success('Sesi kasir berhasil ditutup!');
      setShowModal(false);
      navigate('/kasir/buka-sesi');
    } catch (err) {
      console.error(err);
      setError(err.message || 'Gagal menutup sesi kasir.');
    }
  };
  // --- AKHIR PERUBAHAN UTAMA ---

  const handleSignOut = () => {
    logout();
  };

  // --- (TAMBAHAN) Handler untuk Printer ---
  const handleConnectPrinter = async () => {
    setIsConnecting(true);
    const device = await connectToPrinter();
    setPrinter(device); // Update state dengan device object atau null
    setIsConnecting(false);
  };

  const handleTestPrint = async () => {
    if (!printer) {
      message.warn("Printer tidak terhubung. Klik 'Hubungkan Printer' terlebih dahulu.");
      return;
    }
    setIsTesting(true);
    try {
      await printTestReceipt(); // Panggil fungsi test print
    } catch (e) {
      message.error("Gagal melakukan test print.");
    } finally {
      setIsTesting(false);
    }
  };
  // --- (AKHIR TAMBAHAN) ---

  return (
    <div className="bg-gray-100 min-h-screen p-4 sm:p-6 lg:p-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Session Section */}
        <div>
          <h2 className="text-sm font-bold text-gray-600 uppercase mb-2 px-2">Session</h2>
          <div className="bg-red-50 border border-red-200 rounded-lg shadow">
            <div className="p-6 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-red-700">Close Cashier Session</h3>
              <button
                onClick={handleCloseSessionClick}
                className="px-5 py-2 text-sm font-semibold text-white bg-red-500 rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>

        {/* --- (TAMBAHAN) Section Hardware/Printer --- */}
        <div>
          <h2 className="text-sm font-bold text-gray-600 uppercase mb-2 px-2">Hardware / Printer</h2>
          <div className="bg-white border border-gray-200 rounded-lg shadow p-6 space-y-4">

            {/* 1. Hubungkan Printer */}
            <div className="flex justify-between items-center">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-700">Printer Struk Bluetooth</h3>
                {printer ? (
                  <p className="text-sm text-green-600 font-medium">Terhubung: {printer.name}</p>
                ) : (
                  <p className="text-sm text-gray-500">Printer tidak terhubung.</p>
                )}
              </div>
              <button
                onClick={handleConnectPrinter}
                loading={isConnecting}
                className={`px-5 py-2 text-sm font-semibold text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 ${printer ? 'bg-gray-400 hover:bg-gray-500' : 'bg-blue-500'
                  }`}
              >
                {printer ? <ApiOutlined className="mr-1" /> : <PrinterOutlined className="mr-1" />}
                {isConnecting ? 'Menghubungkan...' : (printer ? 'Ganti Printer' : 'Hubungkan')}
              </button>
              </div>

            <hr />

            {/* 2. Test Print */}
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-700">Test Cetak</h3>
              <button
                onClick={handleTestPrint}
                disabled={!printer || isTesting}
                loading={isTesting}
                className="px-5 py-2 text-sm font-semibold text-white rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50 bg-green-500 hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {isTesting ? 'Mencetak...' : 'Test Print'}
              </button>
            </div>

            <hr />

            {/* 3. (DEV) Cari UUID (dari kode user) */}
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-700">(DEV) Cari UUID Printer</h3>
              <button
                onClick={findPrinterDetails}
                className="px-5 py-2 text-sm font-semibold text-white bg-yellow-500 rounded-md hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-opacity-50"
              >
                <FileSearchOutlined className="mr-1" />
                Cari UUID
              </button>
            </div>
          </div>
        </div>
        {/* --- (AKHIR TAMBAHAN) --- */}


      </div>

      {/* MODAL Close Session */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md mx-4 rounded-2xl shadow-2xl overflow-hidden animate-fadeIn">
            {/* Header */}
            <div className="flex justify-between items-center p-5 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800">
                Close Cashier Session
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-5">
              {/* Alert box */}
              <div className="bg-yellow-100 border border-yellow-300 text-yellow-900 text-sm p-3 rounded-lg">
                <span className="font-semibold text-gray-700">
                  Pastikan semua transaksi sudah selesai.{' '}
                </span>
                <span className="text-red-600 font-medium">
                  Anda tidak akan bisa mengubah transaksi yang sudah dicatat setelah menutup cashier session.
                </span>
              </div>

              {/* --- PERUBAHAN Tampilan Modal --- */}
              {/* Input konfirmasi nama KASIR */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tolong masukkan nama Anda{' '}
                  <span className="text-blue-600 font-medium">
                    ({namaKasirLogin})
                  </span>{' '}
                  sebagai konfirmasi
                </label>
                <input
                  type="text"
                  value={namaKonfirmasi}
                  onChange={(e) => setNamaKonfirmasi(e.target.value)}
                  placeholder="Konfirmasi nama kasir yang menutup sesi"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
              {/* --- AKHIR PERUBAHAN Tampilan Modal --- */}

              {/* Input saldo akhir */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  (Uang Tunai di Laci)
                </label>
                <div className="flex items-center border border-gray-300 rounded-lg px-3 py-2">
                  <span className="text-gray-500 text-sm mr-1">Rp.</span>
                  <input
                    type="number"
                    S value={saldoAkhir}
                    onChange={(e) => setSaldoAkhir(e.target.value)}
                    placeholder="0"
                    className="w-full text-sm focus:outline-none"
                  />
                </div>
              </div>

              {/* Waktu */}
              <div className="text-center text-sm text-gray-600 mt-4">
                Kasir ditutup pada{' '}
                <span className="font-semibold text-gray-800">
                  {new Date().toLocaleDateString('id-ID', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                  })}{' '}
                  {new Date().toLocaleTimeString('id-ID')}
                </span>
                <br />
                <span className="text-gray-400 text-xs">Waktu Server</span>
              </div>

              {/* Error */}
              {error && <p className="text-red-500 text-sm text-center">{error}</p>}

              {/* Tombol Confirm */}
              <button
                onClick={handleConfirmCloseSession}
                className="w-full mt-3 bg-blue-600 text-white py-2.5 rounded-lg font-semibold hover:bg-blue-700 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Confirm
              </button>
              </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsKasir;