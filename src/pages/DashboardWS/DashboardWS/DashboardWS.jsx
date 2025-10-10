import React, { useContext, useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import logo from "../../../assets/images/logo.png";
import { AuthContext } from "../../../providers/AuthProvider";
import { FaWhatsapp, FaUser } from "react-icons/fa";
import {
  Wifi,
  Coffee,
  Users,
  Clock,
  Calendar,
  CheckCircle,
  Tv,
  Ban,
} from "lucide-react";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/pagination";
import { Pagination, Autoplay } from "swiper/modules";
import { Spin, message } from "antd"; // Ditambahkan untuk loading & notifikasi

// Impor service untuk mengambil data
import { getWorkspaces } from "../../../services/service";

// Definisikan base URL untuk backend Anda
const API_URL = "http://localhost:5000";

const DashboardWS = () => {
  const navigate = useNavigate();
  const { userProfile, login } = useContext(AuthContext);

  const [activeTab, setActiveTab] = useState("Working Space");

  // State baru untuk data dinamis dan loading
  const [workspaces, setWorkspaces] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // useEffect untuk redirect berdasarkan role (tidak berubah)
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

  // useEffect untuk mengambil data working space dari API
  useEffect(() => {
    const fetchWorkspaces = async () => {
      try {
        setIsLoading(true);
        const data = await getWorkspaces();
        setWorkspaces(data || []); // Pastikan workspaces adalah array
      } catch (error) {
        message.error("Gagal memuat data working space dari server.");
      } finally {
        setIsLoading(false);
      }
    };

    // Hanya panggil API jika tab yang aktif adalah 'Working Space'
    if (activeTab === "Working Space") {
      fetchWorkspaces();
    }
  }, [activeTab]); // Dijalankan kembali jika 'activeTab' berubah

  const tabs = ["Working Space", "Virtual Offices", "Memberships", "Event Spaces"];

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Navbar (Tidak ada perubahan) */}
      <nav className="fixed top-0 left-0 w-full bg-white/90 backdrop-blur-md shadow-sm z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex justify-between items-center">
          <Link to="/" className="flex items-center gap-2">
            <img src={logo} alt="Logo" className="h-8 sm:h-9 w-auto" />
            <span className="font-bold text-lg sm:text-xl text-gray-800 tracking-tight">
              Workspace
            </span>
          </Link>
          <div className="flex gap-2 sm:gap-4 items-center">
            <button
              onClick={() => window.open("https://wa.me/62123123123", "_blank")}
              className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-medium shadow-md transition whitespace-nowrap"
            >
              <FaWhatsapp className="text-base sm:text-lg" />
              <span className="hidden sm:inline">WhatsApp</span>
            </button>
            {!userProfile ? (
              <button
                onClick={login}
                className="bg-red-500 hover:bg-red-600 text-white px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-medium shadow-md transition whitespace-nowrap"
              >
                Logout
              </button>
            ) : (
              <button
                onClick={() => navigate("/login")}
                className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-medium shadow-md transition whitespace-nowrap"
              >
                <FaUser className="text-base sm:text-lg" />
                <span className="hidden sm:inline">Login</span>
              </button>
            )}
          </div>
        </div>
      </nav>

      <main className="pt-16">
        {/* Hero (Tidak ada perubahan) */}
        <div className="relative w-full h-[50vh] sm:h-[60vh] md:h-[70vh] flex items-center justify-center">
          <img
            src="https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1600&q=80"
            alt="Coworking Hero"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/50"></div>
          <div className="relative z-10 flex flex-col items-center justify-center h-full text-center text-white px-4 sm:px-6">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold mb-4">
              Solusi Coworking & Sewa Kantor Modern
            </h1>
            <p className="text-sm sm:text-base md:text-lg max-w-3xl">
              Fleksibel, nyaman, dan mendukung produktivitas. Pilih ruang kerja
              yang sesuai kebutuhan Anda.
            </p>
          </div>
        </div>

        {/* Tabs Section */}
        <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
          <h2 className="text-2xl sm:text-3xl font-bold text-center text-gray-800 mb-8 sm:mb-12">
            Pilih Layanan Sesuai Kebutuhan Anda
          </h2>

          {/* Tabs Navigation (Tidak ada perubahan) */}
          <div className="flex justify-center mb-10">
            <div className="flex flex-wrap justify-center gap-2 sm:gap-3 p-1.5 bg-gray-100 rounded-full shadow-inner">
              {tabs.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`relative whitespace-nowrap px-4 sm:px-6 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 focus:outline-none
                  ${
                    activeTab === tab
                      ? "bg-blue-600 text-white shadow-md"
                      : "text-gray-600 hover:text-blue-600 hover:bg-gray-200"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {/* Konten sesuai Tab */}
          <div>
            {activeTab === "Working Space" && (
              <div className="space-y-6 max-w-5xl mx-auto px-4">
                {isLoading ? (
                  <div className="text-center py-10">
                    <Spin size="large" />
                    <p className="mt-4 text-gray-600">Memuat Ruang Kerja...</p>
                  </div>
                ) : workspaces.length > 0 ? (
                  workspaces.map((card, i) => (
                    <div
                      key={i}
                      className="bg-white rounded-xl border shadow-md flex flex-col md:flex-row overflow-hidden"
                    >
                      {/* Image */}
                      <div className="md:w-2/5 h-48 md:h-auto">
                        <img
                          src={`${import.meta.env.VITE_BASE_URL}/static/${card.img}`}
                          alt={card.title}
                          className="w-full h-full object-cover"
                          onError={(e) => { e.target.onerror = null; e.target.src='https://placehold.co/600x400/EEE/31343C?text=Image+Not+Found' }}
                        />
                      </div>

                      {/* Info */}
                      <div className="flex-1 p-5 flex flex-col justify-between">
                        <div>
                          <h3 className="text-xl font-bold text-gray-900 mb-2">
                            {card.title}
                          </h3>
                          <div className="flex items-center text-sm text-gray-600 gap-4 mb-3 flex-wrap">
                            <span className="flex items-center gap-1">
                              <Calendar size={14} /> Tersedia Senin - Sabtu
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock size={14} /> {card.time}
                            </span>
                            <span className="flex items-center gap-1">
                              <Users size={14} /> {card.capacity} Total Tempat
                            </span>
                          </div>
                          <p className="text-gray-600 text-sm mb-4">{card.desc}</p>
                        </div>

                        {/* Features */}
                        <div className="flex justify-around border-t border-b py-3 text-sm text-gray-700">
                          {card.features.includes("Wifi") && (
                            <div className="flex flex-col items-center"><Wifi size={20} className="text-blue-600" /><span className="text-xs mt-1">Internet</span></div>
                          )}
                          {card.features.includes("Refill Water") && (
                             <div className="flex flex-col items-center"><Coffee size={20} className="text-amber-600" /><span className="text-xs mt-1">Refill Water</span></div>
                          )}
                          {card.features.includes("AC") && (
                             <div className="flex flex-col items-center"><span className="text-lg">❄️</span><span className="text-xs mt-1">AC</span></div>
                          )}
                          {card.features.includes("TV") && (
                             <div className="flex flex-col items-center"><Tv size={20} className="text-purple-600" /><span className="text-xs mt-1">TV</span></div>
                          )}
                          <div className="flex flex-col items-center"><Ban size={20} className="text-red-600" /><span className="text-xs mt-1">No Smoking</span></div>
                        </div>

                        {/* Fasilitas */}
                        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-700">
                          {card.fasilitas?.map((fasilitas, idx) => (
                            <div key={idx} className="flex items-center gap-2">
                              <CheckCircle size={16} className="text-green-600" />
                              <span>{fasilitas}</span>
                            </div>
                          ))}
                        </div>

                        {/* Price & Action */}
                        <div className="flex items-center justify-between pt-4">
                          <div className="flex flex-col">
                            {card.price === "FREE" ? (
                              <span className="inline-block bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-semibold">FREE</span>
                            ) : (
                              <>
                                <span className="text-xs uppercase text-gray-500 tracking-wide">Start from</span>
                                <span className="text-2xl font-extrabold text-gray-900">{card.price}</span>
                              </>
                            )}
                          </div>
                          {card.title !== "Space Lesehan" ? (
                            <button
                              onClick={() => navigate("/informasi-ruangan")}
                              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-md text-sm font-semibold transition"
                            >
                              Reserve Now
                            </button>
                          ) : (
                            <p className="text-xs text-red-500 font-medium">{card.note}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                   <div className="text-center py-10 text-gray-500">
                     <p>Saat ini tidak ada ruang kerja yang tersedia.</p>
                   </div>
                )}
              </div>
            )}

            {/* Virtual Offices, Memberships, Event Spaces (Tidak ada perubahan) */}
            {["Virtual Offices", "Memberships", "Event Spaces"].includes(activeTab) && (
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center">
             {/* Swiper Image Slider */}
             <div className="relative h-64 sm:h-80 md:h-full flex items-center justify-center order-first md:order-none">
               <Swiper
                 spaceBetween={20}
                 slidesPerView={1}
                 loop={true}
                 autoplay={{ delay: 3000 }}
                 pagination={{ clickable: true }}
                 modules={[Pagination, Autoplay]}
                 className="w-full h-full rounded-xl shadow-lg"
               >
                 {activeTab === "Virtual Offices" && (
                   <>
                     <SwiperSlide>
                       <img
                         src="https://images.unsplash.com/photo-1497366754035-f200968a6e72?q=80&w=869&auto=format&fit=crop"
                         alt="Virtual Office 1"
                         className="w-full h-full object-cover rounded-lg"
                       />
                     </SwiperSlide>
                     <SwiperSlide>
                       <img
                         src="https://images.unsplash.com/photo-1497215728101-856f4ea42174?q=80&w=870&auto=format&fit=crop"
                         alt="Virtual Office 2"
                         className="w-full h-full object-cover rounded-lg"
                       />
                     </SwiperSlide>
                   </>
                 )}

                 {activeTab === "Memberships" && (
                   <>
                     <SwiperSlide>
                       <img
                         src="https://images.unsplash.com/photo-1565688842882-e0b2693d349a?q=80&w=870&auto=format&fit=crop"
                         alt="Membership 1"
                         className="w-full h-full object-cover rounded-lg"
                       />
                     </SwiperSlide>
                     <SwiperSlide>
                       <img
                         src="https://images.unsplash.com/photo-1497215728101-856f4ea42174?q=80&w=870&auto=format&fit=crop"
                         alt="Membership 2"
                         className="w-full h-full object-cover rounded-lg"
                       />
                     </SwiperSlide>
                   </>
                 )}

                 {activeTab === "Event Spaces" && (
                   <>
                     <SwiperSlide>
                       <img
                         src="https://images.unsplash.com/photo-1503428593586-e225b39bddfe?q=80&w=870&auto=format&fit=crop"
                         alt="Event Space 1"
                         className="w-full h-full object-cover rounded-lg"
                       />
                     </SwiperSlide>
                     <SwiperSlide>
                       <img
                         src="https://images.unsplash.com/photo-1503424886305-4c2b04aa3ebd?q=80&w=870&auto=format&fit=crop"
                         alt="Event Space 2"
                         className="w-full h-full object-cover rounded-lg"
                       />
                     </SwiperSlide>
                   </>
                 )}
               </Swiper>
             </div>

             {/* Text Section */}
             <div className="text-center md:text-left">
               <h3 className="text-2xl md:text-4xl font-bold text-gray-900 mb-4">
                 {activeTab === "Virtual Offices" && "Virtual Office"}
                 {activeTab === "Memberships" && "Membership Ruangan"}
                 {activeTab === "Event Spaces" && "Event Spaces"}
               </h3>
               <p className="text-gray-600 mb-4 text-base">
                 {activeTab === "Virtual Offices" &&
                   "Sewa tempat dengan alamat bisnis premium. Kelola bisnis Anda dari mana saja tanpa biaya sewa kantor fisik."}
                 {activeTab === "Memberships" &&
                   "Pilih paket membership sesuai kebutuhan ruang Anda. Akses ruangan fleksibel menggunakan kredit membership."}
                 {activeTab === "Event Spaces" &&
                   "Sewa ruang acara yang nyaman dan fleksibel untuk seminar, workshop, atau perayaan khusus."}
               </p>
               <p className="text-gray-600 mb-6 text-base">
                 {activeTab === "Virtual Offices" &&
                   "Layanan mencakup alamat resmi dan manajemen surat yang andal, ideal untuk bisnis fleksibel."}
                 {activeTab === "Memberships" &&
                   "Nikmati fasilitas modern dan lokasi strategis yang mendukung produktivitas Anda setiap saat."}
                 {activeTab === "Event Spaces" &&
                   "Dengan fasilitas modern dan lokasi strategis, acara Anda akan lebih berkesan."}
               </p>
               <Link
                 to={
                   activeTab === "Virtual Offices"
                     ? "/informasivo"
                     : activeTab === "Memberships"
                     ? "/informasiws"
                     : "/eventspaces"
                 }
                 className="text-blue-600 font-semibold hover:underline"
               >
                 Lihat Detail →
               </Link>
             </div>
           </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
};

export default DashboardWS;
