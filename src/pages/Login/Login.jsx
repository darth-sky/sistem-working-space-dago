// Di file: src/pages/Login/Login.jsx
import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../../assets/images/logo.png";
import { loginProses } from "../../services/service";
import { AuthContext } from "../../providers/AuthProvider";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const { login } = useContext(AuthContext);

  // Hapus useEffect (sudah benar)

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setLoading(true);

    const formData = new FormData();
    formData.append("email", email);
    formData.append("password", password);

    try {
      // 1. Dapatkan seluruh respons dari /login
      //    (result = { access_token, is_first_login, role })
      const result = await loginProses(formData); 
      
      // --- PERBAIKAN KUNCI ---
      // 2. Berikan SELURUH objek 'result' ke AuthProvider
      await login(result);
      // --- AKHIR PERBAIKAN ---
      
    } catch (error) {
      console.error("Login gagal:", error);
      setErrorMessage("Email atau password salah. Silakan coba lagi.");
      setLoading(false);
    }
  };

  return (
    // ... (Sisa JSX Anda tidak perlu diubah) ...
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
        <div className="flex justify-center mb-6">
          <img
            src={logo}
            alt="Logo Dago"
            className="h-16 w-auto object-contain"
          />
        </div>
        <h2 className="text-2xl font-bold text-gray-800 text-center mb-2">
          Login
        </h2>
        <p className="text-gray-500 text-center mb-6">
          Masuk untuk mengakses akun Anda
        </p>
        {errorMessage && (
          <div className="bg-red-100 text-red-600 p-3 rounded-lg text-sm mb-4 text-center">
            {errorMessage}
          </div>
        )}
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
              placeholder="********"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-lg font-medium shadow-md transition duration-200"
            disabled={loading}
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
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