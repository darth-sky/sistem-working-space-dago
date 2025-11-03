// src/pages/Kasir/SettingsKasir/SettingsKasir.jsx

import React, { useState } from 'react';
import { useAuth } from '../../../providers/AuthProvider'; // pastikan path benar
import { useNavigate } from 'react-router-dom';
import { message } from 'antd';
import { findPrinterDetails } from '../../../utils/PrinterFinder'; // Import

const SettingsKasir = () => {
  const { logout, closeSession, activeSession, userProfile } = useAuth();
  const navigate = useNavigate();

  // State
  const [showModal, setShowModal] = useState(false);
  const [namaKonfirmasi, setNamaKonfirmasi] = useState('');
  const [saldoAkhir, setSaldoAkhir] = useState('');
  const [error, setError] = useState('');

  // Tombol buka modal tutup sesi
  const handleCloseSessionClick = () => {
    setError('');
    setNamaKonfirmasi('');
    setSaldoAkhir('');
    setShowModal(true);
  };

  // Tombol konfirmasi tutup sesi
  const handleConfirmCloseSession = async () => {
    if (!namaKonfirmasi || namaKonfirmasi.trim() === '') {
      setError('Nama sesi wajib diisi untuk konfirmasi.');
      return;
    }
    if (namaKonfirmasi.trim() !== (activeSession?.nama_sesi || '')) {
      setError('Nama sesi tidak sesuai. Harap ketik nama sesi dengan benar.');
      return;
    }
    if (!saldoAkhir || isNaN(parseFloat(saldoAkhir))) {
      setError('Saldo akhir wajib diisi dan harus berupa angka.');
      return;
    }

    try {
      await closeSession(parseFloat(saldoAkhir), userProfile?.detail?.nama || userProfile?.email || '');
      message.success('Sesi kasir berhasil ditutup!');
      setShowModal(false);
      navigate('/kasir/buka-sesi');
    } catch (err) {
      console.error(err);
      setError(err.message || 'Gagal menutup sesi kasir.');
    }
  };

  const handleSignOut = () => {
    logout();
  };

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
        <button
          onClick={findPrinterDetails}
          className="w-full text-left px-4 py-2 mt-2 text-sm text-gray-700 hover:bg-gray-100"
        >
          (DEV) Cari UUID Printer
        </button>

        {/* Account Section */}
        <div>
          <h2 className="text-sm font-bold text-gray-600 uppercase mb-2 px-2">Account</h2>
          <div className="bg-red-50 border border-red-200 rounded-lg shadow p-6 flex justify-between items-center">
            <h3 className="text-lg font-semibold text-red-700">Sign Out</h3>
            <button
              onClick={handleSignOut}
              className="px-5 py-2 text-sm font-semibold text-white bg-red-500 rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50"
            >
              Sign Out
            </button>
          </div>
        </div>
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

              {/* Input konfirmasi nama sesi */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tolong masukkan nama sesi{' '}
                  <span className="text-blue-600 font-medium">
                    {activeSession?.nama_sesi || 'Session'}
                  </span>{' '}
                  sebagai konfirmasi
                </label>
                <input
                  type="text"
                  value={namaKonfirmasi}
                  onChange={(e) => setNamaKonfirmasi(e.target.value)}
                  placeholder="Konfirmasi nama sesi yang akan ditutup"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              {/* Input saldo akhir */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Saldo Akhir
                </label>
                <div className="flex items-center border border-gray-300 rounded-lg px-3 py-2">
                  <span className="text-gray-500 text-sm mr-1">Rp.</span>
                  <input
                    type="number"
                    value={saldoAkhir}
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
