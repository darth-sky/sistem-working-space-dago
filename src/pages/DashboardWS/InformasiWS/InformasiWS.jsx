import React from "react";
import {
  CheckCircle,
  Star,
  ArrowRight,
  Wifi,
  Coffee,
  Users,
  Shield,
  Clock,
  MapPin,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

// Data Membership dengan gambar dan fitur
const memberships = [
  {
    title: "Open Space Membership",
    subtitle: "Ruang kerja fleksibel untuk produktivitas maksimal",
    icon: <Coffee className="h-6 w-6" />,
    data: [
      {
        name: "Basic",
        price: "Rp 250.000",
        period: "/ bulan",
        quota: "25 credit",
        popular: false,
        image:
          "https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=600&q=80",
        features: [
          "Akses 24/7",
          "High-Speed WiFi",
          "Area Lounge",
          "Basic Support",
          "Coffee & Tea",
        ],
      },
      {
        name: "Standard",
        price: "Rp 400.000",
        period: "/ bulan",
        quota: "45 credit",
        popular: true,
        image:
          "https://images.unsplash.com/photo-1587614382346-4ec70e388b28?auto=format&fit=crop&w=600&q=80",
        features: [
          "Akses 24/7",
          "Premium WiFi",
          "Area Lounge",
          "Priority Support",
          "Coffee & Tea",
          "Meeting Room 2 jam/bulan",
        ],
      },
      {
        name: "Premium",
        price: "Rp 550.000",
        period: "/ bulan",
        quota: "70 credit",
        popular: false,
        image:
          "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=600&q=80",
        features: [
          "Akses 24/7",
          "Premium WiFi",
          "Area Lounge",
          "Priority Support",
          "Coffee & Tea",
          "Meeting Room 5 jam/bulan",
          "Dedicated Desk",
        ],
      },
    ],
  },
  {
    title: "Space Monitor Membership",
    subtitle: "Workstation lengkap dengan monitor dan peralatan kerja",
    icon: <Shield className="h-6 w-6" />,
    data: [
      {
        name: "Basic",
        price: "Rp 350.000",
        period: "/ bulan",
        quota: "30 credit",
        popular: false,
        image:
          "https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=600&q=80",
        features: [
          "Monitor 24 inch",
          "Keyboard & Mouse",
          "Premium WiFi",
          "Storage Locker",
          "Coffee & Tea",
        ],
      },
      {
        name: "Standard",
        price: "Rp 550.000",
        period: "/ bulan",
        quota: "50 credit",
        popular: true,
        image:
          "https://images.unsplash.com/photo-1587614382346-4ec70e388b28?auto=format&fit=crop&w=600&q=80",
        features: [
          "Monitor 27 inch",
          "Mechanical Keyboard & Mouse",
          "Premium WiFi",
          "Storage Locker",
          "Coffee & Tea",
          "Webcam HD",
        ],
      },
      {
        name: "Premium",
        price: "Rp 750.000",
        period: "/ bulan",
        quota: "75 credit",
        popular: false,
        image:
          "https://images.unsplash.com/photo-1590650046871-92c887180603?auto=format&fit=crop&w=600&q=80",
        features: [
          "Dual Monitor 27 inch",
          "Gaming Keyboard & Mouse",
          "Premium WiFi",
          "Storage Locker",
          "Coffee & Tea",
          "Webcam 4K",
          "Premium Headset",
        ],
      },
    ],
  },
  {
    title: "Meeting Room Kecil Membership",
    subtitle: "Ruang meeting intim untuk diskusi produktif",
    icon: <Users className="h-6 w-6" />,
    data: [
      {
        name: "Basic",
        price: "Rp 500.000",
        period: "/ bulan",
        quota: "40 credit",
        popular: false,
        image:
          "https://images.unsplash.com/photo-1604014237744-df0a0d1fb0fd?auto=format&fit=crop&w=600&q=80",
        features: [
          "Kapasitas 4 orang",
          "TV 43 inch",
          "Whiteboard",
          "AC & WiFi",
          "Coffee Service",
        ],
      },
      {
        name: "Standard",
        price: "Rp 750.000",
        period: "/ bulan",
        quota: "60 credit",
        popular: true,
        image:
          "https://images.unsplash.com/photo-1529333166437-7750a6dd5a70?auto=format&fit=crop&w=600&q=80",
        features: [
          "Kapasitas 4 orang",
          "TV 50 inch",
          "Smart Whiteboard",
          "AC & WiFi",
          "Coffee Service",
          "Conference Camera",
        ],
      },
      {
        name: "Premium",
        price: "Rp 1.000.000",
        period: "/ bulan",
        quota: "90 credit",
        popular: false,
        image:
          "https://images.unsplash.com/photo-1600566752355-35792bedcfea?auto=format&fit=crop&w=600&q=80",
        features: [
          "Kapasitas 4 orang",
          "TV 55 inch",
          "Smart Whiteboard",
          "AC & WiFi",
          "Premium Coffee",
          "Conference System",
          "Catering Service",
        ],
      },
    ],
  },
  {
    title: "Meeting Room Besar Membership",
    subtitle: "Ruang meeting luas untuk presentasi dan workshop",
    icon: <Clock className="h-6 w-6" />,
    data: [
      {
        name: "Basic",
        price: "Rp 700.000",
        period: "/ bulan",
        quota: "45 credit",
        popular: false,
        image:
          "https://images.unsplash.com/photo-1570129477492-45c003edd2be?auto=format&fit=crop&w=600&q=80",
        features: [
          "Kapasitas 8 orang",
          "Projector HD",
          "Sound System",
          "AC & WiFi",
          "Refreshment",
        ],
      },
      {
        name: "Standard",
        price: "Rp 1.000.000",
        period: "/ bulan",
        quota: "70 credit",
        popular: true,
        image:
          "https://images.unsplash.com/photo-1570129477492-45c003edd2be?auto=format&fit=crop&w=600&q=80",
        features: [
          "Kapasitas 8 orang",
          "Projector 4K",
          "Premium Sound",
          "AC & WiFi",
          "Refreshment",
          "Video Conference",
        ],
      },
      {
        name: "Premium",
        price: "Rp 1.300.000",
        period: "/ bulan",
        quota: "100 credit",
        popular: false,
        image:
          "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=600&q=80",
        features: [
          "Kapasitas 8 orang",
          "Projector 4K",
          "Premium Sound",
          "AC & WiFi",
          "Premium Catering",
          "Video Conference Pro",
          "Dedicated Support",
        ],
      },
    ],
  },
];

const InformasiWS = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-16 text-center">
          <div className="inline-flex items-center bg-blue-50 text-blue-600 px-4 py-2 rounded-full text-sm font-medium mb-8">
            <MapPin className="h-4 w-4 mr-2" />
            Premium Workspace Solutions
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Pilih <span className="text-blue-600">Workspace</span> yang Tepat
            untuk Tim Anda
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-12 leading-relaxed">
            Maksimalkan produktivitas tim dengan workspace yang fleksibel dan
            modern. Kami menyediakan solusi lengkap untuk kebutuhan kerja masa
            kini.
          </p>
        </div>
      </div>

      {/* Statistics */}
      <div className="bg-white py-16 border-b border-gray-200">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-blue-600 mb-2">25+</div>
              <div className="text-gray-600">Lokasi</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-blue-600 mb-2">5000+</div>
              <div className="text-gray-600">Member Aktif</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-blue-600 mb-2">24/7</div>
              <div className="text-gray-600">Akses</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-blue-600 mb-2">99%</div>
              <div className="text-gray-600">Uptime</div>
            </div>
          </div>
        </div>
      </div>

      {/* Membership Plans */}
      <div className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Paket Membership
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Dari hot desk hingga private office, temukan workspace yang sesuai
            dengan kebutuhan dan budget Anda
          </p>
        </div>

        <div className="space-y-20">
          {memberships.map((section, idx) => (
            <div key={idx}>
              {/* Section Header */}
              <div className="mb-12">
                <div className="flex items-center mb-4">
                  <div className="flex items-center justify-center w-12 h-12 bg-blue-100 text-blue-600 rounded-xl mr-4">
                    {section.icon}
                  </div>
                  <div>
                    <h3 className="text-2xl md:text-3xl font-bold text-gray-900">
                      {section.title}
                    </h3>
                    <p className="text-gray-600 mt-1">{section.subtitle}</p>
                  </div>
                </div>
              </div>

              {/* Plans Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {section.data.map((item, i) => (
                  <div
                    key={i}
                    className={`relative bg-white rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-2 ${
                      item.popular
                        ? "ring-2 ring-blue-500 shadow-xl scale-105"
                        : "shadow-lg hover:shadow-xl"
                    }`}
                  >
                    {/* Popular Badge */}
                    {item.popular && (
                      <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
                        <div className="bg-blue-600 text-white px-6 py-2 rounded-full text-sm font-semibold shadow-lg flex items-center">
                          <Star className="h-4 w-4 mr-1" />
                          Paling Populer
                        </div>
                      </div>
                    )}

                    {/* Image */}
                    <div className="relative h-48 overflow-hidden">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                    </div>

                    {/* Content */}
                    <div className="p-8">
                      {/* Plan Info */}
                      <div className="text-center mb-6">
                        <h4 className="text-2xl font-bold text-gray-900 mb-2">
                          {item.name}
                        </h4>
                        <div className="flex items-baseline justify-center mb-4">
                          <span className="text-4xl font-bold text-gray-900">
                            {item.price}
                          </span>
                          <span className="text-gray-600 ml-1">
                            {item.period}
                          </span>
                        </div>
                        <div className="inline-flex items-center bg-green-50 text-green-600 px-4 py-2 rounded-full">
                          <CheckCircle className="h-4 w-4 mr-2" />
                          <span className="font-medium">{item.quota}</span>
                        </div>
                      </div>

                      {/* Features */}
                      <div className="space-y-3 mb-8">
                        {item.features.map((feature, idx) => (
                          <div key={idx} className="flex items-center">
                            <CheckCircle className="h-5 w-5 text-blue-500 mr-3 flex-shrink-0" />
                            <span className="text-gray-600">{feature}</span>
                          </div>
                        ))}
                      </div>

                      {/* CTA Button */}
                      <button
                        onClick={() => navigate("/login")}
                        className={`w-full py-4 px-6 rounded-xl font-semibold transition-all duration-300 ${
                          item.popular
                            ? "bg-blue-600 text-white hover:bg-blue-700 shadow-lg"
                            : "bg-gray-100 text-gray-900 hover:bg-gray-200"
                        }`}
                      >
                        {item.popular ? "Pilih Plan Terbaik" : "Pilih Plan"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* CTA Section */}
        <div className="text-center mt-20">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-12 text-white">
            <h3 className="text-3xl font-bold mb-4">Siap untuk Bergabung?</h3>
            <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
              Bergabunglah dengan lebih dari 1000+ pengguna yang telah
              mempercayai workspace kami
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => navigate("/daftar-akun")}
                className="bg-white text-slate-700 font-bold py-4 px-8 rounded-lg hover:bg-gray-50 transition duration-300"
              >
                Daftar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InformasiWS;
