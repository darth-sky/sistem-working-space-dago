import React, { useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../../providers/AuthProvider";
import {
  MapPin,
  Mail,
  Building2,
  Scale,
  Wifi,
  BadgeInfo,
} from "lucide-react";

// Data Paket Virtual Office
const virtualOfficePackages = [
  {
    id: 6,
    name: "Paket 6 Bulan",
    price: "Rp1.750.000",
    benefits: [
      { name: "Alamat bisnis untuk legalitas usaha", included: true },
      { name: "Penerimaan surat & paket", included: true },
      { name: "Free meeting room (4 jam/bulan)", included: true },
      { name: "Free working space (8 jam/bulan)", included: true },
      { name: "Nama/logo perusahaan tampil di website", included: true },
      { name: "Free WiFi member", included: true },
    ],
    image:
      "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: 12,
    name: "Paket 12 Bulan",
    price: "Rp2.990.000",
    benefits: [
      { name: "Alamat bisnis untuk legalitas usaha", included: true },
      { name: "Penerimaan surat & paket", included: true },
      { name: "Free meeting room (8 jam/bulan)", included: true },
      { name: "Free working space (12 jam/bulan)", included: true },
      { name: "Nama/logo perusahaan tampil di website", included: false },
      { name: "Free WiFi member", included: true },
    ],
    image:
      "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=800&q=80",
  },
];

// Fitur utama Virtual Office
const features = [
  {
    icon: <MapPin className="w-8 h-8 text-blue-500" />,
    title: "Alamat Bisnis",
    desc: "Anda dapat menjalankan bisnis secara efisien tanpa perlu menyewa ruang kantor",
  },
  {
    icon: <Mail className="w-8 h-8 text-blue-500" />,
    title: "Layanan Surat dan Dokumen",
    desc: "Kami akan mengurus surat dan dokumen Anda",
  },
  {
    icon: <Building2 className="w-8 h-8 text-blue-500" />,
    title: "Dago Credits",
    desc: "Anda dapat menggunakannya untuk memesan meja coworking atau ruang meeting",
  },
  {
    icon: <Scale className="w-8 h-8 text-blue-500" />,
    title: "Legal",
    desc: "Termasuk surat domisili bangunan, salinan IMB, dan salinan PBB. Kami juga menawarkan layanan legal tambahan",
  },
  {
    icon: <Wifi className="w-8 h-8 text-blue-500" />,
    title: "Free WIFI Member",
    desc: "Kerja nyaman dengan jaringan aman",
  },
  {
    icon: <BadgeInfo className="w-8 h-8 text-blue-500" />,
    title: "Nama & Logo Ditampilkan",
    desc: "Nama/logo perusahaan akan tampil di website dago creative hub",
  },
];

const VirtualOffice = () => {
  const navigate = useNavigate();
  const { userProfile } = useContext(AuthContext);

  useEffect(() => {
    if (userProfile?.roles === "admin") {
      navigate("/dashboardadmin");
    } else if (userProfile?.roles === "kasir") {
      navigate("/mengelola-orderan_fb");
    }
  }, [userProfile, navigate]);

  return (
    <div className="bg-purple-50 min-h-screen">
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-6 py-16 grid md:grid-cols-2 gap-12 items-center">
        {/* Left Content */}
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Virtual Office
          </h1>
          <p className="uppercase text-sm tracking-wide text-purple-600 mb-6">
            Paket Virtual Office
          </p>
          <p className="text-gray-700 text-lg leading-relaxed mb-6">
            Sewa virtual office dan alamat bisnis di Indonesia untuk perusahaan
            Anda. Bekerja dan kembangkan bisnis Anda di mana saja dengan Virtual
            Office kami. Nikmati alamat bisnis premium tanpa biaya sewa kantor.
            Layanan kami mencakup alamat utama dan manajemen surat yang andal,
            ideal untuk bisnis kecil hingga menengah yang menghargai fleksibilitas
            dan efisiensi.
          </p>
          <button
            onClick={() => navigate("/login")}
            className="px-6 py-3 rounded-full border border-gray-900 text-gray-900 font-medium hover:bg-gray-900 hover:text-white transition"
          >
            Mulai Keanggotaan
          </button>
        </div>

        {/* Right Image */}
        <div className="rounded-2xl overflow-hidden shadow-lg">
          <img
            src="https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1600&q=80"
            alt="Virtual Office"
            className="w-full h-full object-cover"
          />
        </div>
      </div>

      {/* Fitur Utama Section */}
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-800 mb-4">Fitur Utama</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Dapatkan semua kebutuhan bisnis Anda dengan layanan virtual office terlengkap
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border border-gray-100 hover:border-blue-200"
            >
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 p-3 bg-blue-50 rounded-lg">
                  {feature.icon}
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {feature.desc}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Paket Virtual Office */}
      <div className="max-w-7xl mx-auto px-6 py-16">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">
          Pilih Paket Virtual Office
        </h2>
        <div className="grid gap-8 sm:grid-cols-1 lg:grid-cols-2 justify-center max-w-6xl mx-auto">
          {virtualOfficePackages.map((paket) => (
            <div
              key={paket.id}
              className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-6 text-center">
                <h3 className="text-2xl font-bold mb-2">{paket.name}</h3>
                <p className="text-xl font-semibold">{paket.price}</p>
              </div>

              {/* Benefit List */}
              <div className="p-6 bg-gray-50">
                <ul className="space-y-3">
                  {paket.benefits.map((benefit, i) => (
                    <li
                      key={i}
                      className="flex items-center justify-between text-sm text-gray-700"
                    >
                      <span>{benefit.name}</span>
                      {benefit.included ? (
                        <svg
                          className="w-5 h-5 text-green-500"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      ) : (
                        <svg
                          className="w-5 h-5 text-red-400"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Price and CTA */}
              <div className="p-6 bg-gray-50 border-t">
                <div className="text-center mb-4">
                  <p className="text-xs text-gray-500 mb-1">Mulai dari</p>
                  <p className="text-2xl font-bold text-gray-800">
                    {paket.price}
                  </p>
                </div>
                <button
                  onClick={() =>
                    navigate(`/login/`, {
                      state: { paketName: paket.name },
                    })
                  }
                  className="w-full bg-gray-800 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center gap-2"
                >
                  Daftar
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 8l4 4m0 0l-4 4m4-4H3"
                    />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default VirtualOffice;
