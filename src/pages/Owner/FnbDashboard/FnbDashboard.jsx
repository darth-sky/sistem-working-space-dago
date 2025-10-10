import React, { useState, useEffect, useMemo } from "react";
// Import ChartJS dan komponen
import { Line, Bar, Doughnut } from "react-chartjs-2";
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

// Import Ant Design components dan dayjs setup
import { ConfigProvider, DatePicker } from "antd";
import dayjs from "dayjs";
import "dayjs/locale/id";
import locale from "antd/locale/id_ID";

// Mengatur locale dayjs secara global agar konsisten
dayjs.locale("id");

// Register Chart.js elements
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

// --- UTILITY DAN DATA FUNCTIONS ---

// Fungsi bantuan untuk memformat Rupiah
const formatRupiah = (number) => {
  if (number === null || number === undefined || isNaN(number)) return "0";
  // Memastikan input adalah angka utuh sebelum diformat
  return new Intl.NumberFormat("id-ID").format(Math.round(number));
};

// Fungsi untuk menghitung jumlah hari
const calculateDays = (startDayjs, endDayjs) => {
  if (!startDayjs || !endDayjs) return 0;
  return endDayjs.diff(startDayjs, "day") + 1;
};

// Simulasi data Daily Selling berdasarkan RENTANG TANGGAL YANG DIPILIH
const generateDailySellingData = (startDayjs, endDayjs) => {
  if (!startDayjs || !endDayjs) return { labels: [], data: [] };

  const labels = [];
  const data = [];
  let currentDate = startDayjs.clone();

  // Loop dari tanggal awal hingga tanggal akhir
  while (
    currentDate.isSame(endDayjs, "day") ||
    currentDate.isBefore(endDayjs, "day")
  ) {
    // Label: Tampilkan tanggal saja (ex: 1, 2, 3...)
    labels.push(currentDate.format("D"));

    // Data generation logic (using day of month for unique data points)
    const dayOfMonth = currentDate.date();

    let sales;
    // Data simulasi dibuat bervariasi berdasarkan hari dalam bulan
    if (dayOfMonth <= 8) sales = 500000 + Math.random() * 150000;
    else if (dayOfMonth <= 15) sales = 400000 + Math.random() * 100000;
    else if (dayOfMonth <= 22) sales = 300000 + Math.random() * 80000;
    else sales = 80000 + Math.random() * 80000;

    data.push(sales);

    currentDate = currentDate.add(1, "day");
  }
  return { labels, data };
};

// Simulasi data Profit Summary (6 bulan terakhir)
const generateProfitSummaryData = (endMonth, endYear) => {
  const months = [];
  const profits = [];
  for (let i = 5; i >= 0; i--) {
    const date = dayjs(`${endYear}-${endMonth}-01`).subtract(i, "month");
    months.push(date.format("MMM"));
    const profit = 1000000 + Math.random() * 1500000;
    profits.push(profit);
  }
  return { labels: months, data: profits };
};

// Simulasi data Dine-in vs Take Away (Menampilkan JUMLAH TRANSAKSI)
const generateOrderTypeData = (startDayjs, endDayjs) => {
  const days = calculateDays(startDayjs, endDayjs);
  const dateSeed = startDayjs.date();

  // Total pesanan berdasarkan jumlah hari, rata-rata 50-60 pesanan/hari
  let totalBaseOrders = days * (55 + Math.random() * 10);

  // Asumsi: Take Away 55%, Dine-in 45%
  let dineInCount = totalBaseOrders * 0.45;
  let takeAwayCount = totalBaseOrders * 0.55;

  // Tambahkan variasi acak (dalam bentuk integer)
  const variation = Math.round(
    Math.random() * 20 * (dateSeed % 2 === 0 ? 1 : -1)
  );

  dineInCount = Math.round(dineInCount + variation);
  takeAwayCount = Math.round(takeAwayCount - variation);

  return {
    labels: ["Dine-in", "Take Away"],
    data: [dineInCount, takeAwayCount],
  };
};

// Simulasi data Tunai vs Non Tunai (Menampilkan JUMLAH TRANSAKSI)
const generatePaymentTypeData = (startDayjs, endDayjs) => {
  const days = calculateDays(startDayjs, endDayjs);
  const dateSeed = endDayjs.date();

  // Total pembayaran, diasumsikan hampir sama dengan total pesanan
  let totalBasePayments = days * (57 + Math.random() * 5);

  // Asumsi: Non Tunai 75%, Tunai 25%
  let cashCount = totalBasePayments * 0.25;
  let nonCashCount = totalBasePayments * 0.75;

  // Tambahkan variasi acak (dalam bentuk integer)
  const variation = Math.round(
    Math.random() * 10 * (dateSeed % 3 === 0 ? 1 : -1)
  );

  cashCount = Math.round(cashCount + variation);
  nonCashCount = Math.round(nonCashCount - variation);

  // Pastikan count tidak negatif
  if (cashCount < 0) cashCount = 0;
  if (nonCashCount < 0) nonCashCount = 0;

  return {
    labels: ["Tunai", "Non Tunai"],
    data: [cashCount, nonCashCount],
  };
};

const FnBDashboard = () => {
  // --- STATE INITIALIZATION ---
  const [dateRange, setDateRange] = useState([
    dayjs().startOf("month"), // Default: Awal bulan saat ini
    dayjs(), // Default: Hari ini
  ]);

  // Digunakan untuk Profit Summary (6 bulan terakhir)
  const endDate = dateRange[1];
  const currentMonth = endDate.month() + 1;
  const currentYear = endDate.year();

  const [dailyTarget, setDailyTarget] = useState(1000000);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [tempTarget, setTempTarget] = useState("1000000");

  const [totalDays, setTotalDays] = useState(
    calculateDays(dateRange[0], dateRange[1])
  );
  const [totalTarget, setTotalTarget] = useState(dailyTarget * totalDays);

  useEffect(() => {
    const days = calculateDays(dateRange[0], dateRange[1]);
    setTotalDays(days);
    setTotalTarget(dailyTarget * days);
  }, [dateRange, dailyTarget]);

  // Data penjualan Statis (untuk Target Progress Bar)
  const homeBroSales = 1500000;
  const dapoerMSSales = 2000000;
  const totalSales = homeBroSales + dapoerMSSales;

  const homeBroPercentage = ((homeBroSales / totalTarget) * 100).toFixed(1);
  const dapoerMSPercentage = ((dapoerMSSales / totalTarget) * 100).toFixed(1);
  const totalPercentage = ((totalSales / totalTarget) * 100).toFixed(1);

  const showModal = () => {
    setTempTarget(dailyTarget.toString());
    setIsModalVisible(true);
  };

  const handleOk = () => {
    const newTarget = parseInt(tempTarget.replace(/\D/g, ""), 10);
    if (newTarget && newTarget > 0) {
      setDailyTarget(newTarget);
    }
    setIsModalVisible(false);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
  };

  const formatCurrency = formatRupiah;

  // Top 5 Product Data (Statis)
  const dapoerMSTopProductData = [
    { item: "DMS_Nasi Goreng Ngejengit", qty: 15, total: 225000 },
    { item: "DMS_Rice Bowls Spicy Chicken", qty: 10, total: 150000 },
    { item: "DMS_Rice Bowls Cabe Garam", qty: 8, total: 120000 },
    { item: "DMS_Mie Kuah", qty: 12, total: 108000 },
    { item: "DMS_Rice Bowls Sambal Matah", qty: 6, total: 90000 },
  ];

  const homeBroTopProductData = [
    { item: "HB_Cafe Latte", qty: 8, total: 176000 },
    { item: "HB_Cappuccino", qty: 7, total: 154000 },
    { item: "HB_Americano", qty: 10, total: 140000 },
    { item: "HB_Matcha", qty: 6, total: 102000 },
    { item: "HB_HomeBro's Special", qty: 9, total: 99000 },
  ];

  // --- CHART DATA GENERATION ---

  // Data untuk Daily Selling (Line Chart) - SEKARANG DINAMIS BERDASARKAN DATE RANGE
  const { labels: dailyLabels, data: dailyData } = useMemo(
    () => generateDailySellingData(dateRange[0], dateRange[1]),
    [dateRange]
  );
  const dailySellingChartData = {
    labels: dailyLabels,
    datasets: [
      {
        label: "Daily Sales (FNB)",
        data: dailyData,
        fill: false,
        borderColor: "#4A6AFF",
        tension: 0.1,
        pointBackgroundColor: "#E57373",
        pointBorderColor: "#E57373",
      },
    ],
  };

  // Data untuk Profit Summary (Bar Chart)
  const { labels: profitLabels, data: profitData } = useMemo(
    () => generateProfitSummaryData(currentMonth, currentYear),
    [currentMonth, currentYear]
  );
  const profitSummaryChartData = {
    labels: profitLabels,
    datasets: [
      {
        label: "Profit (FNB)",
        data: profitData,
        backgroundColor: "#4A6AFF",
      },
    ],
  };

  // Data untuk Diagram Pemesanan (Doughnut Chart - COUNT)
  const orderTypeDataMemo = useMemo(
    () => generateOrderTypeData(dateRange[0], dateRange[1]),
    [dateRange]
  );
  const orderTypeChartData = {
    labels: orderTypeDataMemo.labels,
    datasets: [
      {
        label: "Jumlah Transaksi", // Label diubah ke Jumlah Transaksi
        data: orderTypeDataMemo.data,
        backgroundColor: ["#10B981", "#F59E0B"], // Green & Yellow
        hoverOffset: 10,
        borderColor: "white",
        borderWidth: 2,
      },
    ],
  };

  // Data untuk Diagram Payment (Doughnut Chart - COUNT)
  const paymentTypeDataMemo = useMemo(
    () => generatePaymentTypeData(dateRange[0], dateRange[1]),
    [dateRange]
  );
  const paymentTypeChartData = {
    labels: paymentTypeDataMemo.labels,
    datasets: [
      {
        label: "Jumlah Transaksi", // Label diubah ke Jumlah Transaksi
        data: paymentTypeDataMemo.data,
        backgroundColor: ["#EF4444", "#3B82F6"], // Red & Blue
        hoverOffset: 10,
        borderColor: "white",
        borderWidth: 2,
      },
    ],
  };

  // --- CHART OPTIONS ---

  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: {},
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value) => "Rp " + formatRupiah(value),
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
          callback: (value) => "Rp " + (value / 1000000).toFixed(1) + "M",
        },
      },
    },
  };

  // Opsi untuk Doughnut Chart (Diubah untuk menampilkan COUNT/JUMLAH)
  const doughnutChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: "70%", // Efek Doughnut
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          padding: 15,
          usePointStyle: true,
          font: { size: 12 },
          // Custom legend callback untuk menampilkan JUMLAH TRANSAKSI dan Persentase
          filter: (legendItem, data) => {
            const value = data.datasets[0].data[legendItem.index];
            const total = data.datasets[0].data.reduce((sum, v) => sum + v, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            // Menampilkan Jumlah Transaksi (Count) dan Persentase
            legendItem.text = `${legendItem.text} (${formatRupiah(
              value
            )} Transaksi) - ${percentage}%`;
            return true;
          },
        },
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const label = context.label || "";
            const value = context.parsed;
            const data = context.dataset.data;
            const total = data.reduce((sum, v) => sum + v, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            // Menampilkan Label, Count, dan Persentase
            return `${label}: ${formatRupiah(
              value
            )} Transaksi (${percentage}%)`;
          },
        },
      },
    },
  };

  // --- RENDER COMPONENT (TATA LETAK BARU) ---
  return (
    <ConfigProvider locale={locale}>
      <div className="flex flex-col h-screen bg-gray-100 font-sans">
        <div className="flex-1 flex flex-col p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {/* Header */}
          <header className="flex justify-between items-center mb-6 lg:mb-8 bg-white p-4 rounded-lg shadow-sm">
            <div>
              <h1 className="text-lg sm:text-2xl font-semibold text-gray-800">
                F&B Dashboard
              </h1>
              <p className="text-sm text-gray-600">
                Dago Creative Hub & Coffee Lab - Food & Beverage
              </p>
            </div>
          </header>

          {/* Info Bar (Menggunakan Ant Design RangePicker) */}
          <div className="flex flex-col mb-6 p-4 rounded-lg shadow-sm bg-white border">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
              <div className="flex justify-start gap-3">
                <a
                  href="/laporan"
                  className="px-3 py-1 text-xs sm:text-sm font-medium rounded-md border border-gray-300 text-gray-600 hover:bg-gray-100"
                >
                  Laporan
                </a>
                <a
                  href="/fnb"
                  className="px-3 py-1 text-xs sm:text-sm font-medium rounded-md border border-gray-300 bg-blue-50 text-blue-600 hover:bg-blue-100"
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
                {/* RANGEPICKER ANTD DENGAN dayjs yang sudah diatur ke locale ID */}
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

          {/* 1. Target Penjualan FNB Section (URUTAN PERTAMA) */}
          <div className="mb-6 p-6 rounded-lg shadow-sm bg-white border">
            <div className="mb-6 flex justify-between items-center">
              <h3 className="text-xl font-semibold text-gray-800">
                Target Penjualan F&B
              </h3>
              <button
                onClick={showModal}
                className="text-gray-600 hover:text-gray-800 p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Edit Target Harian"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                </svg>
              </button>
            </div>

            {/* Progress Bar */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">
                  Target Penjualan Gabungan ({totalDays} Hari)
                </span>
                <span className="text-sm font-semibold text-gray-800">
                  IDR {formatCurrency(totalSales)} / IDR{" "}
                  {formatCurrency(totalTarget)}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-8 relative overflow-hidden">
                <div className="absolute inset-0 flex">
                  <div
                    className="bg-red-500 h-full flex items-center justify-center"
                    style={{ width: `${homeBroPercentage}%` }}
                  >
                    <span className="text-white text-xs font-bold">
                      {homeBroPercentage}%
                    </span>
                  </div>
                  <div
                    className="bg-green-500 h-full flex items-center justify-center"
                    style={{ width: `${dapoerMSPercentage}%` }}
                  >
                    <span className="text-white text-xs font-bold">
                      {dapoerMSPercentage}%
                    </span>
                  </div>
                </div>
                <div className="absolute inset-0 flex items-center justify-end pr-3">
                  <span className="text-white text-sm font-bold drop-shadow-md">
                    {totalPercentage}%
                  </span>
                </div>
              </div>

              <div className="flex justify-center gap-6 mt-2">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span className="text-xs text-gray-600">
                    HomeBro (Rp {formatCurrency(homeBroSales)})
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-xs text-gray-600">
                    DapoerMS (Rp {formatCurrency(dapoerMSSales)})
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 2. Row 1: Diagram Pemesanan & Payment (COUNT) - UKURAN LEBIH KECIL */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 lg:gap-6 mb-6">
            {/* Diagram Pemesanan (Dine-in vs Take Away) */}
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-sm font-medium text-gray-700 mb-4 text-center">
                Diagram Pemesanan (Dine-in vs Take Away)
              </h3>
              {/* Container Height Dikecilkan: h-56 sm:h-72 */}
              <div className="w-full h-50 sm:h-50 flex justify-center items-center">
                <Doughnut
                  data={orderTypeChartData}
                  options={doughnutChartOptions}
                />
              </div>
            </div>

            {/* Diagram Payment (Tunai vs Non Tunai) */}
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-sm font-medium text-gray-700 mb-4 text-center">
                Diagram Payment (Tunai vs Non Tunai)
              </h3>
              {/* Container Height Dikecilkan: h-56 sm:h-72 */}
              <div className="w-full h-50 sm:h-50 flex justify-center items-center">
                <Doughnut
                  data={paymentTypeChartData}
                  options={doughnutChartOptions}
                />
              </div>
            </div>
          </div>

          {/* 3. Row 2: Top 5 Product Tenant Dapoer dan Homebro (Tables) */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 lg:gap-6 mb-6">
            {/* Top 5 Product DapoerMS */}
            <div className="bg-white p-6 rounded-lg shadow-sm col-span-1">
              <h3 className="text-sm font-medium text-gray-700 mb-4">
                Top 5 Product - Dapoer M.S (Berdasarkan Total Rp)
              </h3>
              <div className="overflow-x-auto h-full">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-2 px-1 text-xs font-medium text-gray-600 sticky top-0 bg-white">
                        Item
                      </th>
                      <th className="text-center py-2 px-1 text-xs font-medium text-gray-600 sticky top-0 bg-white">
                        Qty
                      </th>
                      <th className="text-right py-2 px-1 text-xs font-medium text-gray-600 sticky top-0 bg-white">
                        Total (Rp)
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {dapoerMSTopProductData.map((item, index) => (
                      <tr
                        key={index}
                        className="border-b border-gray-100 hover:bg-gray-50"
                      >
                        <td className="py-2 px-1 text-xs">{item.item}</td>
                        <td className="py-2 px-1 text-xs text-center font-medium">
                          {item.qty}
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

            {/* Top 5 Product HomeBro */}
            <div className="bg-white p-6 rounded-lg shadow-sm col-span-1">
              <h3 className="text-sm font-medium text-gray-700 mb-4">
                Top 5 Product - HomeBro (Berdasarkan Total Rp)
              </h3>
              <div className="overflow-x-auto h-full">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-2 px-1 text-xs font-medium text-gray-600 sticky top-0 bg-white">
                        Item
                      </th>
                      <th className="text-center py-2 px-1 text-xs font-medium text-gray-600 sticky top-0 bg-white">
                        Qty
                      </th>
                      <th className="text-right py-2 px-1 text-xs font-medium text-gray-600 sticky top-0 bg-white">
                        Total (Rp)
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {homeBroTopProductData.map((item, index) => (
                      <tr
                        key={index}
                        className="border-b border-gray-100 hover:bg-gray-50"
                      >
                        <td className="py-2 px-1 text-xs">{item.item}</td>
                        <td className="py-2 px-1 text-xs text-center font-medium">
                          {item.qty}
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

          {/* 4. Row 3: Daily Selling & Profit Summary (Interactive Charts) */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 lg:gap-6 mb-6">
            {/* Daily Selling Chart */}
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-sm font-medium text-gray-700 mb-4">
                {/* Judul sekarang menampilkan rentang tanggal yang dipilih */}
                Daily Selling (IDR) {dateRange[0]?.format("D MMM YYYY")} -{" "}
                {dateRange[1]?.format("D MMM YYYY")}
              </h3>
              <div className="w-full h-64 sm:h-80">
                <Line data={dailySellingChartData} options={lineChartOptions} />
              </div>
            </div>

            {/* Profit Summary - 6 bulan terakhir */}
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-sm font-medium text-gray-700 mb-4">
                Profit Summary (6 Bulan Terakhir IDR)
              </h3>
              <div className="w-full h-64 sm:h-80">
                <Bar data={profitSummaryChartData} options={barChartOptions} />
              </div>
            </div>
          </div>
        </div>

        {/* Modal for Target Edit */}
        {isModalVisible && (
          // Overlay
          <div className="fixed inset-0 bg-black bg-opacity-50 z-40">
            <div
              className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1-2 
                bg-white p-6 rounded-lg shadow-2xl w-full max-w-sm z-50"
            >
              <h4 className="text-lg font-bold mb-4">Edit Target Harian</h4>

              <label className="block text-sm font-medium text-gray-700 mb-2">
                Target Harian (IDR)
              </label>
              <input
                type="text"
                value={formatRupiah(tempTarget)}
                onChange={(e) => {
                  const rawValue = e.target.value.replace(/\D/g, "");
                  setTempTarget(rawValue);
                }}
                className="w-full p-2 border border-gray-300 rounded-md text-right mb-4"
                placeholder="Contoh: 1000000"
              />
              <label className="block text-sm font-medium text-gray-500 mb-2">
                Taget hairan akan di atur serentak berdasarkan jumlah hari.
                <p>
                  Contoh: {totalDays} hari, maka target = {totalDays} x{" "}
                  {formatCurrency(dailyTarget)} = {formatCurrency(totalTarget)}
                </p>
              </label>

              <div className="flex justify-end gap-3 mt-4">
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 text-sm font-medium rounded-md border border-gray-300 text-gray-700 hover:bg-gray-100"
                >
                  Batal
                </button>
                <button
                  onClick={handleOk}
                  className="px-4 py-2 text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  Simpan
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ConfigProvider>
  );
};

export default FnBDashboard;
