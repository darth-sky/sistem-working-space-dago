import React, { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../../../assets/images/logo.png";
import { AuthContext } from "../../../providers/AuthProvider";
import { Link } from "react-router-dom";
import { FaWhatsapp, FaUser } from "react-icons/fa";

// Import Swiper
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination, Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

const DashboardWS = () => {
  const navigate = useNavigate();
  const { userProfile, login } = useContext(AuthContext);

  const [activeTab, setActiveTab] = useState("Working Space");

  // Redirect sesuai role user setelah login
  useEffect(() => {
    if (!userProfile) return;

    if (userProfile.roles === "admin") {
      navigate("/dashboardadmin", { replace: true });
    } else if (userProfile.roles === "kasir") {
      navigate("/mengelola-orderan_fb", { replace: true });
    } else if (userProfile.roles === "user") {
      navigate("/dashboard-pengguna", { replace: true });
    }
  }, [userProfile, navigate]);

  // Data Cards per kategori
  const cardsData = [
    {
      category: "Working Space",
      title: "Space Monitor",
      desc: "Space dengan monitor yang dapat digunakan",
      img: "https://images.unsplash.com/photo-1590650046871-92c887180603?auto=format&fit=crop&w=600&q=80",
      actions: [{ text: "Reserve now", type: "primary" }],
    },
    {
      category: "Working Space",
      title: "Space Lesehan",
      desc: "Space lesehan dengan dudukan bantal dan meja.",
      img: "https://images.unsplash.com/photo-1587614382346-4ec70e388b28?auto=format&fit=crop&w=600&q=80",
      actions: [{ text: "Reserve now", type: "primary" }],
    },
    {
      category: "Working Space",
      title: "Open Space",
      desc: "Ruang kerja fleksibel untuk produktivitas maksimal.",
      img: "https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=600&q=80",
      actions: [{ text: "Reserve now", type: "primary" }],
    },
    {
      category: "Working Space",
      title: "Room Meeting",
      desc: "Ruang meeting luas dengan kapasitas hingga 8 orang.",
      img: "https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=600&q=80",
      actions: [{ text: "Reserve now", type: "primary" }],
    },
  ];

  // Filter card sesuai tab
  const filteredCards = cardsData.filter((card) => card.category === activeTab);

  const tabs = ["Working Space", "Virtual Offices", "Memberships", "Event Spaces"];

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 w-full bg-white/90 backdrop-blur-md shadow-sm z-50 transition">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <img src={logo} alt="Logo" className="h-9" />
            <span className="font-bold text-xl text-gray-800 tracking-tight">Workspace</span>
          </div>

          <div className="flex gap-2 sm:gap-4 items-center">
            <button
              onClick={() => window.open("https://wa.me/62123123123", "_blank")}
              className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-3 md:px-4 py-2 rounded-full text-sm md:text-base font-medium shadow-md transition"
            >
              <FaWhatsapp className="text-lg" /> WhatsApp
            </button>

            {!userProfile ? (
              <button
                onClick={login}
                className="bg-red-500 hover:bg-red-600 text-white px-3 md:px-4 py-2 rounded-full text-sm md:text-base font-medium shadow-md transition"
              >
                Logout
              </button>
            ) : (
              <button
                onClick={() => navigate("/login")}
                className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-3 md:px-4 py-2 rounded-full text-sm md:text-base font-medium shadow-md transition"
              >
                <FaUser className="text-lg" />
                Login
              </button>

            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative w-full h-[80vh] mb-12 pt-16">
        <img
          src="https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1600&q=80"
          alt="Coworking Hero"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/50"></div>
        <div className="relative z-10 flex flex-col items-center justify-center h-full text-center text-white px-6">
          <h1 className="text-4xl md:text-6xl font-bold mb-4">
            Solusi Coworking & Sewa Kantor Modern
          </h1>
          <p className="text-lg md:text-xl max-w-2xl mb-6">
            Fleksibel, nyaman, dan mendukung produktivitas. Pilih ruang kerja
            yang sesuai kebutuhan Anda.
          </p>
        </div>
      </div>

      {/* Tabs Navigation */}
      <section className="max-w-7xl mx-auto px-6 pb-16 flex-1">
        {/* Tabs */}
        <h1 className="text-2xl md:text-3xl font-bold text-center text-gray-800 mb-8">
          Pilih Layanan Yang Sesuai Dengan Pilihan Anda
        </h1>

        <div className="flex justify-center mb-10">
          <div className="flex gap-6 bg-gray-100 rounded-full px-6 py-3 shadow-inner">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`relative px-20 py-4 rounded-full text-lg font-semibold transition-all duration-300
          ${activeTab === tab
                    ? "bg-blue-600 text-white shadow-xl"
                    : "text-gray-600 hover:text-blue-600 hover:bg-blue-100"
                  }`}
              >
                {tab}
                {/* Indikator bawah untuk tab aktif */}
                {activeTab === tab && (
                  <span className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-20 h-1 bg-white rounded-full shadow"></span>
                )}
              </button>
            ))}
          </div>
        </div>



        {/* Konten sesuai Tab */}
        {activeTab === "Working Space" && (
          <div>
            {/* Judul di atas kartu */}
            <h2 className="text-2xl md:text-2xl font-bold text-gray-800  mb-3">
              Tempat Kerja Yang Sesuai Dengan Keinginan Anda
            </h2>

            {/* Grid kartu */}
            <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-6">
              {filteredCards.map((card, i) => (
                <div
                  key={i}
                  className="max-w-sm mx-auto bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden"
                >
                  {/* Image */}
                  <div className="aspect-[4/3] overflow-hidden">
                    <img
                      src={card.img}
                      alt={card.title}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Content */}
                  <div className="p-6">
                    {/* Title */}
                    <h3 className="text-xl font-semibold text-gray-900 mb-3">
                      {card.title}
                    </h3>

                    {/* Description */}
                    <p className="text-gray-600 text-sm leading-relaxed mb-4">
                      {card.desc}
                    </p>

                    {/* Features */}
                    <div className="space-y-2 mb-6">
                      {card.features?.map((feature, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <feature.icon className="w-4 h-4 text-gray-500" />
                          <span className="text-sm text-gray-600">{feature.text}</span>
                        </div>
                      ))}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3">
                      {card.actions.map((btn, index) =>
                        btn.type === "primary" ? (
                          <button
                            key={index}
                            onClick={() => navigate("/informasi-ruangan")}
                            className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2.5 rounded-full text-sm font-medium transition-colors"
                          >
                            {btn.text}
                          </button>
                        ) : (
                          <button
                            key={index}
                            onClick={() => navigate("/informasi-ruangan")}
                            className="flex-1 text-blue-500 hover:text-blue-600 px-4 py-2.5 rounded-full text-sm font-medium border border-blue-200 hover:border-blue-300 transition-colors"
                          >
                            {btn.text}
                          </button>
                        )
                      )}

                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}


        {activeTab === "Virtual Offices" && (
          <div className="max-w-7xl mx-auto px-6 py-16 grid md:grid-cols-2 gap-12 items-center">
            {/* Left: Images */}
            <div className="relative flex justify-center">
              <div className="absolute top-0 left-12 w-64 h-40 rounded-lg overflow-hidden shadow-lg">
                <img
                  src="https://images.unsplash.com/photo-1497366754035-f200968a6e72?q=80&w=869&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                  alt="office"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="relative top-20 w-72 h-56 rounded-lg overflow-hidden shadow-lg">
                <img
                  src="https://images.unsplash.com/photo-1497215728101-856f4ea42174?q=80&w=870&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                  alt="person working"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* Right: Text Content */}
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                Virtual Office <br />
              </h2>
              <p className="text-gray-600 mb-6">
                Sewa tempat dengan alamat bisnis premium di Dago Hub and Coffee Lab. Kelola bisnis Anda dari mana saja tanpa biaya sewa kantor fisik.
              </p>
              <p className="text-gray-600 mb-6">
                Layanan kami mencakup alamat resmi dan manajemen surat yang andal, ideal untuk bisnis kecil hingga menengah yang menghargai fleksibilitas dan efisiensi.
              </p>
              <Link
                to="/informasivo"
                className="text-blue-500 font-medium hover:underline"
              >
                Lihat Detail &gt;
              </Link>
            </div>
          </div>
        )}
        {activeTab === "Memberships" && (
          <div className="max-w-7xl mx-auto px-6 py-16 grid md:grid-cols-2 gap-12 items-center">
            {/* Left: Images */}
            <div className="relative flex justify-center">
              <div className="absolute top-0 left-12 w-64 h-40 rounded-lg overflow-hidden shadow-lg">
                <img
                  src="https://images.unsplash.com/photo-1565688842882-e0b2693d349a?q=80&w=870&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                  alt="office"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="relative top-20 w-72 h-56 rounded-lg overflow-hidden shadow-lg">
                <img
                  src="https://images.unsplash.com/photo-1497366754035-f200968a6e72?q=80&w=869&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                  alt="person working"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* Right: Text Content */}
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                Membership Ruangan <br />
              </h2>
              <p className="text-gray-600 mb-6">
                Pilih paket membership sesuai kebutuhan ruang Anda di Dago Hub and Coffee Lab. Akses ruangan tanpa perlu membayar, melalui penggunaan kredit membership.
              </p>
              <Link
                to="/informasiws"
                className="text-blue-500 font-medium hover:underline"
              >
                Lihat Detail &gt;
              </Link>
            </div>

          </div>
        )}
        {activeTab === "Event Spaces" && (
          <div className="max-w-7xl mx-auto px-6 py-16 grid md:grid-cols-2 gap-12 items-center">
            {/* Left: Images */}
            <div className="relative flex justify-center">
              <div className="absolute top-0 left-12 w-64 h-40 rounded-lg overflow-hidden shadow-lg">
                <img
                  src="https://images.unsplash.com/photo-1497366754035-f200968a6e72?q=80&w=869&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                  alt="event space"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="relative top-20 w-72 h-56 rounded-lg overflow-hidden shadow-lg">
                <img
                  src="https://images.unsplash.com/photo-1497215728101-856f4ea42174?q=80&w=870&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                  alt="people in event"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* Right: Text Content */}
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                Event Spaces <br />
              </h2>
              <p className="text-gray-600 mb-6">
                Sewa ruang acara yang nyaman dan fleksibel untuk berbagai kebutuhan —
                mulai dari seminar, workshop, rapat tim, hingga perayaan khusus.
              </p>
              <p className="text-gray-600 mb-6">
                Dengan fasilitas modern, lokasi strategis, dan suasana yang mendukung,
                event space kami siap menjadikan acara Anda lebih berkesan dan lancar.
              </p>
              <Link
                to="/eventspaces"
                className="text-blue-500 font-medium hover:underline"
              >
                Lihat Detail &gt;
              </Link>
            </div>
          </div>
        )}

      </section>


    </div>
  );
};

export default DashboardWS;
