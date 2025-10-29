import React from "react";
import { MapPin } from "lucide-react";
import { FaInstagram } from "react-icons/fa";

const Footer = () => {
  return (
    <footer className="bg-white border-t border-gray-200 py-12 text-center">
      <div className="flex flex-col items-center space-y-6 max-w-2xl mx-auto px-4">
        <h2 className="text-2xl font-bold text-gray-800">
          Temukan Ruang Kerja Terbaikmu <span className="inline-block"></span>
        </h2>

        <p className="text-gray-600 text-sm sm:text-base leading-relaxed">
          Dago Creative Hub hadir untuk mendukung produktivitas, kolaborasi, dan
          kreativitasmu. Dari meeting santai hingga proyek besar — kami punya
          ruang yang cocok untuk setiap ide hebatmu.
        </p>

        {/* Lokasi & Instagram - sejajar */}
        <div className="flex flex-wrap justify-center gap-4 mt-4">
          <a
            href="https://maps.app.goo.gl/8BBT7ANUzscVDSJo8"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center bg-blue-50 text-blue-600 px-5 py-2 rounded-full font-medium hover:bg-blue-100 hover:-translate-y-0.5 transition-all"
          >
            <MapPin className="mr-2" size={18} />
            Workspace Location – Dago Creative Hub
          </a>

          <a
            href="https://www.instagram.com/dagocreativehub?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw=="
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center bg-pink-50 text-pink-600 px-5 py-2 rounded-full font-medium hover:bg-pink-100 hover:-translate-y-0.5 transition-all"
          >
            <FaInstagram className="mr-2" />
            @dagocreativehub
          </a>
        </div>

        {/* Copyright */}
        <p className="text-gray-500 text-sm pt-4 border-t border-gray-100 w-full max-w-xs">
          © {new Date().getFullYear()} Dago Creative Hub. Semua hak dilindungi.
        </p>
      </div>
    </footer>
  );
};

export default Footer;