import React, { useState, useEffect } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import {
  FaArrowLeft,
  FaCalendarAlt,
  FaUser,
  FaClipboard,
  FaWifi,
  FaTv,
  FaSnowflake,
  FaPlug,
  FaCheckCircle,
} from "react-icons/fa";
import moment from "moment";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { formatRupiahPerJam } from "../../../utils/formatRupiah";
const baseUrl = import.meta.env.VITE_BASE_URL

// --------------------- Data ---------------------
const meetingRooms = [
  {
    id: 1,
    name: "Ruangan Meeting 01",
    price: 50000,
    description:
      "Privasi terjaga, fokus maksimal. Ruang meeting untuk tim maksimal 9 orang.",
    facilities: ["AC", "TV", "WIFI", "Stop Kontak"],
    mainImage:
      "https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=800&q=80",
    capacity: 9,
  },
  {
    id: 2,
    name: "Ruangan Meeting 02",
    price: 75000,
    description:
      "Cocok untuk rapat kecil atau brainstorming dengan tim hingga 4 orang.",
    facilities: ["AC", "TV"],
    mainImage:
      "https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=800&q=80",
    capacity: 4,
  },
  {
    id: 3,
    name: "Ruangan Meeting 03",
    price: 100000,
    description: "Ruang meeting luas dengan kapasitas hingga 8 orang.",
    facilities: ["AC", "Stop Kontak"],
    mainImage:
      "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=800&q=80",
    capacity: 8,
  },
];

const spaceMonitors = [
  {
    id: 4,
    name: "Space Monitor 1",
    price: 10000,
    description: "Monitor standar 24 inch untuk kebutuhan kerja ringan.",
    features: ["Resolusi Full HD", "HDMI Port", "Layar Anti Glare"],
    mainImage:
      "https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: 5,
    name: "Space Monitor 2",
    price: 15000,
    description:
      "Monitor 27 inch dengan kualitas gambar jernih, cocok untuk desain.",
    features: ["Resolusi 2K", "Wide Color Gamut", "Adjustable Stand"],
    mainImage:
      "https://images.unsplash.com/photo-1593642634367-d91a135587b5?auto=format&fit=crop&w=800&q=80",
  },
];

// --------------------- Component ---------------------
const RoomDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();

  // Ambil data room/monitor
  const room =
    location.state ||
    meetingRooms.find((r) => r.id === Number(id)) ||
    spaceMonitors.find((m) => m.id === Number(id));

  if (!room) {
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <p className="text-gray-600">Ruangan/Monitor tidak ditemukan</p>
      </div>
    );
  }

  console.log({roomnya: room});
  console.log(meetingRooms);
  console.log(spaceMonitors);
  console.log(location.state);
  
  
  

  // --------------------- State Booking ---------------------
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedStartTime, setSelectedStartTime] = useState(null);
  const [selectedEndTime, setSelectedEndTime] = useState(null);
  const [name, setName] = useState("");
  const [purpose, setPurpose] = useState("");
  const [duration, setDuration] = useState(0);
  const [openBilling, setOpenBilling] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);

  const today = new Date();
  const todayHour = today.getHours();

  // Update durasi saat jam mulai/selesai berubah
  useEffect(() => {
    if (selectedStartTime !== null && selectedEndTime !== null) {
      setDuration(selectedEndTime - selectedStartTime);
    } else {
      setDuration(0);
    }
  }, [selectedStartTime, selectedEndTime]);

  // --------------------- Hitung Harga ---------------------
  const calculateTotalPrice = () => {
    const hourlyRate = Number(room.harga_per_jam) || 0;
    const dur = Number(duration) || 0;

    console.log(hourlyRate);
    console.log(dur);
    
    return hourlyRate * dur;
  };

  // --------------------- Time Slots ---------------------
  const timeSlots = Array.from({ length: 15 }, (_, i) => 8 + i); // 08:00 - 22:00

  // --------------------- Render ---------------------
  return (
    <div className="min-h-screen bg-gray-100 flex justify-center py-8 px-4">
      <div className="w-full max-w-5xl space-y-8">
        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-lg p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center space-x-3 mb-6">
            <button
              onClick={() => navigate(-1)}
              className="text-gray-700 hover:text-blue-600"
            >
              <FaArrowLeft size={20} />
            </button>
            <h2 className="text-lg md:text-xl font-semibold text-gray-800">
              {room.name}
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Section: Image & Info */}
            <div>
              <div className="w-full h-[300px] sm:h-[400px] rounded-xl overflow-hidden mb-4">
                <img
                  src={`${baseUrl}/static/${room.gambar_ruangan}`}
                  alt={room.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="space-y-4">
                <p className="text-gray-600">{room.description_ruangan}</p>
                <p className="text-blue-600 font-semibold">
                  {formatRupiahPerJam(room.harga_per_jam)}
                </p>

                {/* Facilities or Features */}
                <div className="grid grid-cols-2 gap-4 text-gray-700">
                  {(room.facilities || room.features || []).map((f, i) => {
                    let icon = <FaCheckCircle />;
                    if (f === "WIFI") icon = <FaWifi />;
                    else if (f === "TV") icon = <FaTv />;
                    else if (f === "AC") icon = <FaSnowflake />;
                    else if (f === "Stop Kontak") icon = <FaPlug />;
                    return (
                      <span key={i} className="flex items-center space-x-2">
                        {icon}
                        <span>{f}</span>
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right Section: Booking */}
            <div className="space-y-6">
              <h4 className="font-semibold mb-3">Pilih Tanggal Booking</h4>
              {/* Date Picker */}
              <div className="bg-white p-4 rounded-xl shadow-lg">
                <DayPicker
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  disabled={{ before: today }}
                  className="mx-auto"
                />
              </div>

              {showCalendar && (
                <div className="bg-white p-4 rounded-xl shadow-lg">
                  <DayPicker
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => date && setSelectedDate(date)}
                    disabled={{ before: today }}
                    className="mx-auto"
                  />
                </div>
              )}

              {/* Start Time */}
              <div>
                <h4 className="font-semibold mb-2">Pilih Jam Mulai</h4>
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                  {timeSlots.map((hour) => {
                    const isPastTime =
                      moment(selectedDate).isSame(moment(), "day") &&
                      hour <= todayHour;
                    return (
                      <button
                        key={hour}
                        onClick={() => {
                          setSelectedStartTime(hour);
                          setSelectedEndTime(null);
                        }}
                        disabled={isPastTime}
                        className={`p-2 text-xs rounded-lg font-medium transition-all duration-200 ${
                          isPastTime
                            ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                            : selectedStartTime === hour
                            ? "bg-blue-600 text-white shadow-lg"
                            : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                        }`}
                      >
                        {`${String(hour).padStart(2, "0")}:00`}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* End Time */}
              {selectedStartTime !== null && (
                <div>
                  <h4 className="font-semibold mb-2">Pilih Jam Selesai</h4>
                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                    {timeSlots.map((hour) => {
                      const isInvalidTime = hour <= selectedStartTime;
                      return (
                        <button
                          key={hour}
                          onClick={() => setSelectedEndTime(hour)}
                          disabled={isInvalidTime}
                          className={`p-2 text-xs rounded-lg font-medium transition-all duration-200 ${
                            isInvalidTime
                              ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                              : selectedEndTime === hour
                              ? "bg-blue-600 text-white shadow-lg"
                              : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                          }`}
                        >
                          {`${String(hour).padStart(2, "0")}:00`}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Duration */}
              <div className="flex items-center justify-between bg-gray-100 p-4 rounded-xl shadow-sm">
                <span className="font-semibold">Durasi</span>
                <span className="w-8 text-center font-bold">{duration}h</span>
              </div>

              {/* User Info */}
              <div className="space-y-4">
                <div>
                  <label className="flex items-center space-x-2 text-gray-600 font-medium mb-1">
                    <FaClipboard />
                    <span>Keperluan</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Masukkan keperluan (opsional)"
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value)}
                    className="p-3 rounded-xl border w-full focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Booking Button */}
              <button
                onClick={() => setOpenBilling(true)}
                disabled={
                  !selectedDate || !selectedStartTime || !selectedEndTime 
                }
                className={`w-full font-semibold py-3 rounded-xl shadow transition ${
                  !selectedDate || !selectedStartTime || !selectedEndTime 
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-blue-600 text-white hover:bg-blue-700"
                }`}
              >
                Place Booking
              </button>
            </div>
          </div>
        </div>

        {/* Billing Popup */}
        {openBilling && (
          <div
            className="fixed inset-0 z-50 flex justify-center items-center backdrop-blur-sm"
            onClick={() => setOpenBilling(false)}
          >
            <div
              className="bg-white rounded-2xl p-6 w-full max-w-sm mx-auto shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-center text-lg font-bold mb-4">
                Ringkasan Pemesanan
              </h2>
              <div className="space-y-3 mb-4">
                <div className="flex justify-between items-center">
                  <span className="font-semibold">Nama:</span>
                  <span>{name}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-semibold">Keperluan:</span>
                  <span>{purpose || "-"}</span>
                </div>
                <hr className="my-2 border-gray-200" />
                <div className="flex justify-between items-center">
                  <span className="font-semibold">Durasi:</span>
                  <span>{duration} jam</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-semibold">Harga / jam:</span>
                  <span>{formatRupiahPerJam(room.harga_per_jam)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-semibold">Total:</span>
                  <span className="font-bold text-blue-600">
                    Rp{calculateTotalPrice().toLocaleString()}
                  </span>
                </div>
              </div>
              <button
                onClick={() =>
                  navigate(`/payment/${room.id}`, {
                    state: {
                      room,
                      selectedDate,
                      selectedStartTime,
                      selectedEndTime,
                      duration,
                      name,
                      purpose,
                      total: calculateTotalPrice(),
                    },
                  })
                }
                className="w-full mt-4 py-3 bg-blue-600 text-white rounded-xl font-semibold"
              >
                Lanjutkan ke Pembayaran
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RoomDetail;