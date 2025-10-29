// src/components/layout/PrivateRoute.jsx

import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
// Impor hook 'useAuth' yang telah kita buat di AuthProvider
import { useAuth } from '../../providers/AuthProvider'; 

/**
 * Komponen ini melindungi rute.
 * 1. Menunggu loading selesai.
 * 2. Jika belum login, redirect ke /login.
 * 3. Jika sudah login tapi role tidak sesuai, redirect ke /forbidden.
 * 4. Jika semua oke, tampilkan halaman (via <Outlet />).
 */
const PrivateRoute = ({ allowedRoles }) => {
    // Ambil semua state yang kita butuhkan dari AuthProvider
    const { isLoggedIn, userProfile, loading } = useAuth();

    // 1. Cek state loading DULU
    if (loading) {
        // Tampilkan layar loading selagi AuthProvider mengambil data profile
        // Ini adalah perbaikan utamanya.
        return <div>Loading data pengguna...</div>; // Atau komponen Spinner
    }

    // 2. Jika tidak loading, cek status login
    if (!isLoggedIn) {
        // Pengguna tidak login, paksa kembali ke halaman login
        return <Navigate to="/login" replace />;
    }

    // 3. Jika sudah login, cek 'allowedRoles' (jika ada)
    if (allowedRoles && !allowedRoles.includes(userProfile.roles)) {
        // Pengguna sudah login, tapi rolenya tidak diizinkan
        return <Navigate to="/forbidden" replace />;
    }

    // 4. Jika tidak loading, sudah login, dan role diizinkan (atau tidak ada 'allowedRoles')
    // Tampilkan komponen anak (BukaSesi, TransaksiKasir, dll.)
    return <Outlet />;
};

export default PrivateRoute;