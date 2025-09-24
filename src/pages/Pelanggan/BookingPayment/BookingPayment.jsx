import React, { useEffect, useContext } from "react";
import { useParams, useNavigate, useLocation, Link } from "react-router-dom";
import moment from "moment";
import { AuthContext } from "../../../providers/AuthProvider";
import { postTransaksiRuangan } from "../../../services/service";

const BookingPayment = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { userProfile } = useContext(AuthContext);

  const {
    room,
    selectedDate,
    selectedStartTime,
    selectedEndTime,
    duration,
    name,
    purpose,
  } = location.state || {};

  useEffect(() => {
    if (!location.state) navigate("/"); // redirect jika tidak ada data
  }, [location.state, navigate]);

  if (!location.state) return null;

  const calculateTotalPrice = () => {
    return room.harga_per_jam * duration;
  };

  const formattedDate = moment(selectedDate).format("DD MMMM YYYY");
  const formattedStartTime = selectedStartTime || "-";
  const formattedEndTime = selectedEndTime || "-";

  console.log(selectedDate);
  console.log(selectedStartTime);

  const handleInputTransaksi = async () => {
    try {
      const startDateTime = moment(selectedDate)
        .set("hour", selectedStartTime)
        .set("minute", 0)
        .format("YYYY-MM-DD HH:mm:ss");

      const endDateTime = moment(selectedDate)
        .set("hour", selectedEndTime)
        .set("minute", 0)
        .format("YYYY-MM-DD HH:mm:ss");

      const res = await postTransaksiRuangan(
        userProfile?.id_user || 1, // ambil dari context (fallback 1)
        room.id_ruangan, // id ruangan
        startDateTime,
        endDateTime,
        "qris", // metode pembayaran
        calculateTotalPrice(), // total harga
        name
      );

      console.log("Transaksi sukses:", res);

      // bisa redirect atau kasih notifikasi sukses
      navigate("/riwayat-transaksi", {
        state: {
          transaksi: res,
        },
      });
    } catch (error) {
      console.error("Gagal input transaksi:", error);
      alert("Transaksi gagal, coba lagi.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center items-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 max-w-lg w-full">
        {/* Header */}
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Scan QR Code
          </h2>
          <p className="text-gray-600 text-sm mb-8 leading-relaxed">
            Gunakan aplikasi e-wallet untuk <br /> scan dan bayar dengan QRIS
          </p>

          {/* QR Code */}
          <div className="flex justify-center mb-8">
            <div className="w-56 h-56 bg-white p-4 rounded-xl shadow-lg border flex items-center justify-center">
              <span className="text-gray-500 text-sm">QR Code Placeholder</span>
            </div>
          </div>
        </div>

        {/* Booking Details */}
        <div className="bg-gray-50 p-6 rounded-xl space-y-4">
          <h3 className="font-bold text-lg mb-2 text-center">
            Detail Pemesanan
          </h3>
          <div className="flex justify-between items-center text-gray-700">
            <span className="font-medium">Ruangan</span>
            <span className="font-semibold">{room.name}</span>
          </div>
          <div className="flex justify-between items-center text-gray-700">
            <span className="font-medium">Tanggal</span>
            <span className="font-semibold">{formattedDate}</span>
          </div>
          <div className="flex justify-between items-center text-gray-700">
            <span className="font-medium">Waktu</span>
            <span className="font-semibold">
              {formattedStartTime} - {formattedEndTime}
            </span>
          </div>
          <div className="flex justify-between items-center text-gray-700">
            <span className="font-medium">Durasi</span>
            <span className="font-semibold">{duration} jam</span>
          </div>
          <div className="flex justify-between items-center text-gray-700">
            <span className="font-medium">Nama</span>
            <span className="font-semibold">{name}</span>
          </div>
          <div className="flex justify-between items-center text-gray-700">
            <span className="font-medium">Keperluan</span>
            <span className="font-semibold">{purpose || "-"}</span>
          </div>

          <hr className="my-2 border-gray-200" />
          <div className="flex justify-between font-semibold text-xl text-gray-900">
            <span>Total Bayar</span>
            <span>Rp{calculateTotalPrice().toLocaleString()}</span>
          </div>
        </div>

        {/* Buttons */}
        <div className="grid grid-cols-2 gap-4 mt-6">
          <button
            onClick={() => navigate(-1)}
            className="w-full bg-red-500 hover:bg-red-600 text-white py-3 rounded-full font-semibold shadow-md transition"
          >
            Batal
          </button>
          <Link
            to="/riwayat-transaksi"
            state={{
              name,
              roomName: room.nama_ruangan,
              totalPrice: calculateTotalPrice(),
              date: formattedDate,
              startTime: formattedStartTime,
              endTime: formattedEndTime,
            }}
          >
            <button onClick={handleInputTransaksi} className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-full font-semibold shadow-md transition">
              Cek Status
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default BookingPayment;
