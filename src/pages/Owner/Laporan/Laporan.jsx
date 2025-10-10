import React, { useState, useEffect } from "react";
import { Doughnut, Bar, Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
} from "chart.js";

import { ConfigProvider, DatePicker } from "antd";
import dayjs from "dayjs";
import "dayjs/locale/id";
import locale from "antd/locale/id_ID";

import {
  getTotalPendapatan,
  getTopFNB,
  getTopWorking,
  getDailySelling,
  getProfitSummary,
} from "../../../services/service";

// Setting global locale
dayjs.locale("id");

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement
);

const { RangePicker } = DatePicker;

// Helper format Rupiah
const formatRupiah = (number) => {
  // Pastikan number adalah tipe Number/numeric, karena terkadang bisa berupa string (dari DB)
  if (typeof number === 'string') {
    number = Number(number);
  }
  if (isNaN(number)) return '0';
  return new Intl.NumberFormat("id-ID").format(number);
};

const Laporan = () => {
  const [dateRange, setDateRange] = useState([
    dayjs().startOf("month"),
    dayjs().endOf("month"),
  ]);

  const endDate = dateRange[1];
  const currentMonth = endDate.month() + 1;
  const currentYear = endDate.year();

  // State untuk semua data
  const [totalPendapatanData, setTotalPendapatanData] = useState(null);
  const [top10FNBData, setTop10FNBData] = useState([]);
  const [top5WorkingSpaceData, setTop5WorkingSpaceData] = useState([]);
  const [dailySellingChartData, setDailySellingChartData] = useState(null);
  const [profitSummaryChartData, setProfitSummaryChartData] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      // Ambil respons penuh dari service
      const pendapatan_res = await getTotalPendapatan();
      const fnb_res = await getTopFNB();
      const ws_res = await getTopWorking();
      const daily_res = await getDailySelling(currentMonth, currentYear);
      const profit_res = await getProfitSummary();

      // KOREKSI UTAMA: Ekstrak array data dari kunci 'datas' pada objek respons.
      // Jika respons null/undefined, gunakan array kosong [].
      let pendapatan = pendapatan_res?.datas || [];
      const fnb = fnb_res?.datas || [];
      const ws = ws_res?.datas || [];
      const daily = daily_res?.datas || [];
      const profit = profit_res?.datas || [];

      // KOREKSI: Konversi string total menjadi Number di semua data pendapatan
      pendapatan = pendapatan.map(p => ({
          ...p,
          total: Number(p.total) // Konversi ke Number sebelum diolah
      }));

      // Format pendapatan untuk Doughnut
      // Sekarang reduce akan berfungsi sebagai penjumlahan, bukan konkatenasi.
      const total = pendapatan.reduce((sum, p) => sum + p.total, 0);
      
      setTotalPendapatanData({
        labels: pendapatan.map((p) => p.kategori),
        datasets: [
          {
            data: pendapatan.map((p) => p.total),
            backgroundColor: ["#E57373", "#81C784", "#4A6AFF", "#FFB74D", "#4DD0E1"], // Tambahkan warna untuk 5 kategori
            borderColor: ["#ffffff"],
            borderWidth: 1.5,
          },
        ],
        total,
      });

      // KOREKSI: Konversi total fnb dan ws ke number
      setTop10FNBData(fnb.map(item => ({...item, total: Number(item.total), qty: Number(item.qty)})));
      setTop5WorkingSpaceData(ws.map(item => ({...item, total: Number(item.total), qty: Number(item.qty)})));
      
      // KOREKSI: Konversi total daily ke number
      setDailySellingChartData({
        labels: daily.map((d) => d.day),
        datasets: [
          {
            label: "Daily Sales",
            data: daily.map((d) => Number(d.total)),
            borderColor: "#4A6AFF",
            fill: false,
            tension: 0.1,
          },
        ],
      });

      // KOREKSI: Konversi total profit ke number
      setProfitSummaryChartData({
        labels: profit.map((p) => p.bulan),
        datasets: [
          {
            label: "Profit",
            data: profit.map((p) => Number(p.total)),
            backgroundColor: "#4A6AFF",
          },
        ],
      });
    };

    fetchData();
  }, [currentMonth, currentYear]);

  // Chart options
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          padding: 20,
          usePointStyle: true,
          font: { size: 12 },
        },
      },
    },
  };

  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { 
          callback: (value) => "Rp " + formatRupiah(value),
          maxTicksLimit: 8 // Batasi jumlah ticks agar tidak terlalu padat
        },
      },
    },
  };

  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          // Callback untuk format Rupiah singkat (jutaan/milyaran)
          callback: (value) => {
             if (value >= 1000000000) return 'Rp ' + (value / 1000000000).toFixed(1) + 'M';
             if (value >= 1000000) return 'Rp ' + (value / 1000000).toFixed(1) + 'Jt';
             return 'Rp ' + formatRupiah(value);
          },
        },
      },
    },
  };

  return (
    <ConfigProvider locale={locale}>
      <div className="flex flex-col h-screen bg-gray-100 font-sans">
        <div className="flex-1 flex flex-col p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {/* Header */}
          <header className="flex justify-between items-center mb-6 lg:mb-8 bg-white p-4 rounded-lg shadow-sm">
            <div>
              <h1 className="text-lg sm:text-2xl font-semibold text-gray-800">
                Laporan
              </h1>
              <p className="text-sm text-gray-600">
                Dago Creative Hub & Coffee Lab
              </p>
            </div>
          </header>

          {/* Info Bar */}
          <div className="flex flex-col mb-6 p-4 rounded-lg shadow-sm bg-white border">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
              <div className="flex justify-start gap-3">
                <a
                  href="/laporan"
                  className="px-3 py-1 text-xs sm:text-sm font-medium rounded-md border border-gray-300 bg-blue-50 text-blue-600 hover:bg-blue-100"
                >
                  Laporan
                </a>
                <a
                  href="/fnbdashboard"
                  className="px-3 py-1 text-xs sm:text-sm font-medium rounded-md border border-gray-300 text-gray-600 hover:bg-gray-100"
                >
                  FNB
                </a>
                <a
                  href="/workingspace"
                  className="px-3 py-1 text-xs sm:text-sm font-medium rounded-md border border-gray-300 text-gray-600 hover:bg-gray-100"
                >
                  Working Space
                </a>
              </div>

              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-700 hidden sm:inline">
                  Pilih Tanggal:
                </span>
                <RangePicker
                  value={dateRange}
                  onChange={setDateRange}
                  format="DD-MM-YYYY"
                  size="default"
                  locale={locale}
                  className="w-48 sm:w-64"
                />
              </div>
            </div>
          </div>

          {/* Dashboard Grid - Row 1 */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 lg:gap-6 mb-6">
            {/* Total Pendapatan */}
            <div className="bg-white p-6 rounded-lg shadow-sm">
              {totalPendapatanData && (
                <>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">
                    Total Pendapatan
                  </h3>
                  <div className="text-2xl font-bold text-gray-900 mb-4">
                    Rp {formatRupiah(totalPendapatanData.total)}
                  </div>
                  <div className="w-full h-64 flex justify-center items-center">
                    <div className="w-56 h-56">
                      <Doughnut
                        data={totalPendapatanData}
                        options={chartOptions}
                      />
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Top 10 FNB */}
            <div className="bg-white p-6 rounded-lg shadow-sm col-span-1">
              <h3 className="text-sm font-medium text-gray-700 mb-4">
                Top 10 Product - FNB
              </h3>
              <div className="overflow-x-auto h-full">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-2 px-1 text-xs font-medium text-gray-600">
                        Item
                      </th>
                      <th className="text-center py-2 px-1 text-xs font-medium text-gray-600">
                        Qty
                      </th>
                      <th className="text-right py-2 px-1 text-xs font-medium text-gray-600">
                        Total (Rp)
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {top10FNBData.map((item, index) => (
                      <tr
                        key={index}
                        className="border-b border-gray-100 hover:bg-gray-50"
                      >
                        <td className="py-2 px-1 text-xs">{item.item}</td>
                        <td className="py-2 px-1 text-xs text-center">
                          {formatRupiah(item.qty)}
                        </td>
                        <td className="py-2 px-1 text-xs text-right font-semibold">
                          Rp {formatRupiah(item.total)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Top 5 Working Space */}
            <div className="bg-white p-6 rounded-lg shadow-sm col-span-1">
              <h3 className="text-sm font-medium text-gray-700 mb-4">
                Top 5 Product - Working Space
              </h3>
              <div className="overflow-x-auto h-full">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-2 px-1 text-xs font-medium text-gray-600">
                        Item
                      </th>
                      <th className="text-center py-2 px-1 text-xs font-medium text-gray-600">
                        Qty
                      </th>
                      <th className="text-right py-2 px-1 text-xs font-medium text-gray-600">
                        Total (Rp)
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {top5WorkingSpaceData.map((item, index) => (
                      <tr
                        key={index}
                        className="border-b border-gray-100 hover:bg-gray-50"
                      >
                        <td className="py-2 px-1 text-xs">{item.item}</td>
                        <td className="py-2 px-1 text-xs text-center">
                          {formatRupiah(item.qty)}
                        </td>
                        <td className="py-2 px-1 text-xs text-right font-semibold">
                          Rp {formatRupiah(item.total)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Dashboard Grid - Row 2 */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 lg:gap-6">
            {/* Daily Selling */}
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-sm font-medium text-gray-700 mb-4">
                Daily Selling (IDR) {dayjs(endDate).format("MMMM YYYY")}
              </h3>
              <div className="w-full h-64 sm:h-80">
                {dailySellingChartData && (
                  <Line
                    data={dailySellingChartData}
                    options={lineChartOptions}
                  />
                )}
              </div>
            </div>

            {/* Profit Summary */}
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-sm font-medium text-gray-700 mb-4">
                Profit Summary (6 Bulan Terakhir IDR)
              </h3>
              <div className="w-full h-64 sm:h-80">
                {profitSummaryChartData && (
                  <Bar
                    data={profitSummaryChartData}
                    options={barChartOptions}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </ConfigProvider>
  );
};

export default Laporan;