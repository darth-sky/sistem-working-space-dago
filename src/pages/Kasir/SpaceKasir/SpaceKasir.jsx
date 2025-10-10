import React, { useState, useEffect } from "react";
import { Input, Button, Tag, Spin, Alert } from "antd";
// Sesuaikan path ke service dan komponen baru Anda
import { getKasirDashboardData } from "../../../services/service";
import RentalTimer from "../../../components/RentalTimer"; // <-- 1. IMPORT KOMPONEN TIMER BARU

const { Search } = Input;

const SpaceKasir = () => {
  const [status, setStatus] = useState("Active");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // State untuk semua data dinamis
  const [summary, setSummary] = useState({ todayTransaction: 0, spaceRental: 0, spaceAvailable: 0 });
  const [spaceTypes, setSpaceTypes] = useState([]);
  const [spaceUnits, setSpaceUnits] = useState([]);
  const [rentals, setRentals] = useState({ active: [], finish: [] });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const data = await getKasirDashboardData();
        setSummary(data.summary);
        setSpaceTypes(data.spaceTypes);
        setSpaceUnits(data.availableUnits);
        setRentals(data.rentals);
        setError(null);
      } catch (err) {
        setError("Gagal memuat data dari server. Silakan coba lagi.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []); // [] berarti useEffect ini hanya berjalan sekali saat komponen pertama kali dimuat

  // 2. HAPUS timeColorMap KARENA LOGIKA INI SUDAH PINDAH KE RentalTimer
  // const timeColorMap = { ... };

  // Pilih data rental yang akan ditampilkan berdasarkan state 'status'
  const displayedRentals = status === "Active" ? rentals.active : rentals.finish;

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Spin size="large" tip="Memuat Data Dasbor..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <Alert message="Error" description={error} type="error" showIcon />
      </div>
    )
  }

  return (
    <div className="p-4 space-y-4 bg-gray-50 min-h-screen">
      {/* Search bar */}
      <Search placeholder="Search" allowClear className="w-full rounded-md" />

      {/* Top Summary (tidak ada perubahan) */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-blue-600 text-white p-4 rounded-lg shadow text-center">
          <p className="text-sm">Today Transaction</p>
          <p className="text-2xl font-bold">Rp {summary.todayTransaction.toLocaleString("id-ID")}</p>
        </div>
        <div className="bg-yellow-400 text-black p-4 rounded-lg shadow text-center">
          <p className="text-sm">Space Rental</p>
          <p className="text-2xl font-bold">{summary.spaceRental}</p>
        </div>
        <div className="bg-green-500 text-white p-4 rounded-lg shadow text-center">
          <p className="text-sm">Space Available</p>
          <p className="text-2xl font-bold">{summary.spaceAvailable}</p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {/* Space Unit Type (tidak ada perubahan) */}
        <div className="col-span-1">
          <h3 className="font-bold mb-2">Space Unit Type</h3>
          <div className="space-y-2">
            {spaceTypes.map((type, index) => (
              <div
                key={index}
                className="flex items-center justify-between bg-gray-100 rounded-lg px-3 py-2 shadow"
              >
                <div className="flex items-center space-x-2">
                  <Tag color="blue">{type.total}</Tag>
                  <Tag color="green">{type.available}</Tag>
                </div>
                <span className="text-sm font-medium">{type.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Space Unit Available + Space Rental */}
        <div className="col-span-3 space-y-4">
          {/* Space Units (tidak ada perubahan) */}
          <div className="flex flex-wrap gap-2">
            {spaceUnits.map((unit, index) => (
              <div
                key={index}
                className="w-16 h-16 bg-white rounded-lg border flex items-center justify-center shadow cursor-pointer hover:bg-blue-50 p-1"
              >
                {/* Cukup gunakan kelas ini pada span */}
                <span className="font-semibold text-center text-sm">
                  {unit}
                </span>
              </div>
            ))}
          </div>

          {/* Space Rental (today) */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-bold">Space Rental (today)</h3>
              <div className="space-x-2">
                <Button
                  type={status === "Active" ? "primary" : "default"}
                  onClick={() => setStatus("Active")}
                >
                  Active
                </Button>
                <Button
                  type={status === "Finish" ? "primary" : "default"}
                  onClick={() => setStatus("Finish")}
                >
                  Finish
                </Button>
              </div>
            </div>

            {/* Card List */}
            <div className="space-y-4">
              {displayedRentals.map((rental) => (
                <div
                  key={rental.id}
                  className="flex justify-between items-center bg-white rounded-lg shadow p-4"
                >
                  {/* Kiri (tidak ada perubahan) */}
                  <div className="space-y-1">
                    <p className="font-semibold">{rental.client}</p>
                    <p className="text-sm text-gray-600">{rental.unit.toUpperCase()}</p>
                    <p className="text-xs text-gray-400">{rental.date}</p>
                    <div className="flex gap-2 mt-2">
                      <span className="px-3 py-1 text-xs border rounded-full text-blue-600 border-blue-600">
                        BOOKING
                      </span>
                      <span className="px-3 py-1 text-xs border rounded-full text-orange-500 border-orange-500">
                        WAITING
                      </span>
                    </div>
                  </div>

                  {/* Kanan */}
                  <div className="text-right space-y-2">
                    <p className="text-blue-600 font-bold">
                      Rp {rental.price.toLocaleString("id-ID")}
                    </p>

                    {/* 3. GANTI DIV LAMA DENGAN KOMPONEN BARU */}
                    {status === 'Active' ? (
                      // Jika status 'Active', tampilkan timer yang berjalan
                      <RentalTimer endTime={rental.waktu_selesai} />
                    ) : (
                      // Jika status 'Finish', tampilkan teks statis
                      <div className="flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium bg-gray-200 text-black">
                        <span>Finished</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SpaceKasir;