import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../../../assets/images/logo.png";
import { register } from "../../../services/service";

const DaftarAkun = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    const formData = new FormData();
    e.preventDefault();

    if (password !== confirmPassword) {
      alert("Password tidak sama!");
      return;
    }

    formData.append("nama", name);
    formData.append("email", email);
    formData.append("password", password);

    try {
      const result = await register(formData);
      console.log(result.status);

      if (result.status === 201) {
        alert(`Akun berhasil dibuat untuk ${name}`);
        navigate("/login");
      } else {
        alert("Gagal mendaftar: " + (result.data?.message || "Unknown error"));
      }
    } catch (error) {
      console.error(error);
      alert("Terjadi error saat mendaftar");
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
          Daftar Akun
        </h2>
        <p className="text-gray-500 text-center mb-6">
          Buat akun baru untuk mulai menggunakan layanan
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nama Lengkap
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 border rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Nama lengkap"
              required
            />
          </div>

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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Konfirmasi Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-3 border rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="********"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-green-500 hover:bg-green-600 text-white py-3 rounded-lg font-medium shadow-md transition duration-200"
          >
            Daftar
          </button>
        </form>

        {/* Link ke login */}
        <p className="text-sm text-gray-600 text-center mt-6">
          Sudah punya akun?{" "}
          <button
            onClick={() => navigate("/login")}
            className="text-blue-500 hover:underline font-medium"
          >
            Login
          </button>
        </p>
      </div>
    </div>
  );
};

export default DaftarAkun;
