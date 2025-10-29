import React, { useState, useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../../assets/images/logo.png";
import { loginProses } from "../../services/service";
import { AuthContext } from "../../providers/AuthProvider";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState(""); // state untuk error
  const navigate = useNavigate();

  // --- PERUBAHAN: Ambil 'loading' dari context ---
  // Kita juga butuh 'loading' untuk mencegah redirect prematur
  const { login, isLoggedIn, userProfile, loading } = useContext(AuthContext);

  useEffect(() => {
    // --- PERUBAHAN: Tambahkan cek 'loading' ---
    // Jangan lakukan apa-apa jika data profile/sesi masih dimuat
    if (loading) {
      return;
    }
    // --- AKHIR PERUBAHAN ---

    if (isLoggedIn && userProfile?.roles) { // Cek userProfile.roles ada
      const role = userProfile.roles.toLowerCase(); // normalisasi role

      if (role === "admin_dago") {
        navigate("/virtualofficeadmin", { replace: true });
      } else if (role === "kasir") {
        // --- PERUBAHAN INTI ---
        // Arahkan kasir yang sudah login ke halaman Buka Sesi.
        // Halaman BukaSesi.jsx akan menangani redirect
        // ke POS jika sesi sudah aktif.
        navigate("/kasir/buka-sesi", { replace: true });
        // --- AKHIR PERUBAHAN ---
      } else if (role === "owner") {
        navigate("/laporan", { replace: true });
      } else if (role === "admin_tenant") {
        navigate("/ordertenant", { replace: true });
      } else {
        navigate("/informasi-ruangan", { replace: true });
      }
    }
    // --- PERUBAHAN: Tambahkan 'loading' ke dependency array ---
  }, [isLoggedIn, userProfile, navigate, loading]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage(""); // reset error sebelum login baru

    const formData = new FormData();
    formData.append("email", email);
    formData.append("password", password);

    try {
      const result = await loginProses(formData);
      // Panggil 'login' dari AuthProvider.
      // Fungsi 'login' ini (yang sudah kita ubah)
      // akan otomatis mengarahkan kasir ke /kasir/buka-sesi.
      login(result.access_token);
    } catch (error) {
      console.error("Login gagal:", error);
      setErrorMessage("Email atau password salah. Silakan coba lagi.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <img
            src={logo}
            alt="Logo Dago"
            className="h-16 w-auto object-contain"
          />
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-gray-800 text-center mb-2">
          Login
        </h2>
        <p className="text-gray-500 text-center mb-6">
          Masuk untuk mengakses akun Anda
        </p>

        {/* Error Message */}
        {errorMessage && (
          <div className="bg-red-100 text-red-600 p-3 rounded-lg text-sm mb-4 text-center">
            {errorMessage}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="you@example.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              C placeholder="********"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-lg font-medium shadow-md transition duration-200"
          >
            Login
          </button>
        </form>

        {/* Link ke daftar akun */}
        <p className="text-sm text-gray-600 text-center mt-6">
          Belum punya akun?{" "}
          <button
            onClick={() => navigate("/daftar-akun")}
            className="text-blue-500 hover:underline font-medium"
          >
            Daftar Akun
          </button>
        </p>
      </div>
    </div>
  );
};

export default Login;