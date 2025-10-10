import React, { useState, useMemo } from "react"; // KESALAHAN DIPERBAIKI: Mengganti "react-hook-form" menjadi "react"
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

// --- UTILITY AND DATA FUNCTIONS ---

// Fungsi bantuan untuk memformat Rupiah
const formatRupiah = (number) => {
  if (typeof number !== "number") return "";
  return new Intl.NumberFormat("id-ID").format(number);
};

// Simulasi data Daily Selling berdasarkan rentang tanggal
const generateDailySellingDataWS = (startDayjs, endDayjs) => {
  if (!startDayjs || !endDayjs) return { labels: [], data: [] };
  const days = endDayjs.diff(startDayjs, "day") + 1;
  const labels = [];
  const data = [];
  let current = startDayjs;

  for (let i = 0; i < days; i++) {
    labels.push(current.format("D")); // Day number
    // Dummy data for Working Space sales (e.g., 200k to 500k per day)
    data.push(200000 + Math.random() * 300000);
    current = current.add(1, "day");
  }
  return { labels, data };
};

// Simulasi data Profit Summary (6 bulan terakhir)
const generateProfitSummaryDataWS = (endMonth, endYear) => {
  const months = [];
  const profits = [];
  for (let i = 5; i >= 0; i--) {
    const date = dayjs(`${endYear}-${endMonth}-01`).subtract(i, "month");
    months.push(date.format("MMM"));
    // Data dummy profit WS per bulan (misalnya 1M hingga 2.5M)
    const profit = 1000000 + Math.random() * 1500000;
    profits.push(profit);
  }
  return { labels: months, data: profits };
};

const WorkingSpace = () => {
  // Mengatur rentang tanggal default ke awal bulan hingga hari ini
  const [dateRange, setDateRange] = useState([
    dayjs().startOf("month"),
    dayjs(),
  ]);

  const formatCurrency = formatRupiah;

  // --- Dynamic Data Generation using useMemo ---
  const endDate = dateRange[1];
  const currentMonth = endDate ? endDate.month() + 1 : dayjs().month() + 1;
  const currentYear = endDate ? endDate.year() : dayjs().year();
  const totalWorkingSpaceRevenue = 3000000; // Total pendapatan dummy

  // 1. Daily Selling Data (Dynamic based on selected range)
  const { labels: dailyLabels, data: dailyData } = useMemo(
    () => generateDailySellingDataWS(dateRange[0], dateRange[1]),
    [dateRange]
  );

  const dailySellingData = {
    labels: dailyLabels,
    datasets: [
      {
        label: "Daily Working Space Sales",
        data: dailyData,
        fill: false,
        borderColor: "#4A6AFF",
        tension: 0.1,
        pointBackgroundColor: "#4A6AFF",
        pointBorderColor: "#4A6AFF",
      },
    ],
  };

  // 2. Profit Summary Data (Dynamic based on selected month/year end date)
  const { labels: profitLabels, data: profitData } = useMemo(
    () => generateProfitSummaryDataWS(currentMonth, currentYear),
    [currentMonth, currentYear]
  );

  const profitSummaryData = {
    labels: profitLabels,
    datasets: [
      {
        label: "Working Space Profit",
        data: profitData,
        backgroundColor: "#4A6AFF",
      },
    ],
  };

  // 3. Top 10 Space Data Update & Sorting
  let rawOpenSpaceTopData = [
    { item: "Open Space 1", qty: 45, total: 1350000 },
    { item: "Open Space 2", qty: 38, total: 1140000 },
    { item: "Open Space 3", qty: 32, total: 960000 },
    { item: "Open Space 4", qty: 28, total: 840000 },
    { item: "Space Monitor 1", qty: 15, total: 750000 },
    { item: "Space Monitor 2", qty: 12, total: 600000 },
    { item: "Ruang Meeting 03", qty: 10, total: 300000 },
    { item: "Ruang Meeting 01", qty: 8, total: 480000 },
    { item: "Event Space", qty: 2, total: 2000000 },
    { item: "Ruang Meeting 02", qty: 4, total: 240000 },
    { item: "Space Monitor 9", qty: 20, total: 1000000 },
    { item: "Lesehan 1", qty: 25, total: 500000 },
  ];

  // Sorting berdasarkan jumlah booking (qty) secara descending
  const openSpaceTopData = useMemo(() => {
    return rawOpenSpaceTopData
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 10) // Ambil hanya Top 10
      .map((item) => ({
        ...item,
        total: formatCurrency(item.total), // Format Rupiah untuk tampilan
      }));
  }, []);

  // Menghitung Total Bookings
  const totalBookings = rawOpenSpaceTopData.reduce(
    (sum, item) => sum + item.qty,
    0
  );

  // 4. Space Terjual Data (Doughnut)
  const spaceCategories = rawOpenSpaceTopData.reduce((acc, item) => {
    let category;
    if (item.item.includes("Open Space")) category = "Open Space";
    else if (item.item.includes("Space Monitor")) category = "Space Monitor";
    else if (item.item.includes("Ruang Meeting")) category = "Ruang Meeting";
    else if (item.item.includes("Lesehan")) category = "Lesehan";
    else if (item.item.includes("Event Space")) category = "Event Space";
    else category = "Lain-lain";

    acc[category] = (acc[category] || 0) + item.qty;
    return acc;
  }, {});

  const spaceTerjualDataChart = {
    labels: Object.keys(spaceCategories),
    datasets: [
      {
        data: Object.values(spaceCategories),
        backgroundColor: [
          "#4A6AFF", // Biru Tua (Open Space)
          "#3B4FFC", // Biru Lebih Tua (Space Monitor)
          "#6B7AFF", // Biru Sedang (Ruang Meeting)
          "#8B9AFF", // Biru Muda (Lesehan)
          "#ABBDFF", // Biru Sangat Muda (Event Space)
        ],
        borderColor: ["#ffffff"],
        borderWidth: 1.5,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "right",
        labels: {
          padding: 15,
          usePointStyle: true,
          font: {
            size: 11,
          },
          boxWidth: 12,
        },
      },
    },
    elements: {
      arc: {
        borderWidth: 3,
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
          callback: (value) => "Rp " + formatCurrency(value),
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

  return (
    <div className="flex flex-col h-screen bg-gray-100 font-sans">
      {/* Main Content */}
      <div className="flex-1 flex flex-col p-4 sm:p-6 lg:p-8 overflow-y-auto">
        {/* Header */}
        <header className="flex justify-between items-center mb-6 lg:mb-8 bg-white p-4 rounded-lg shadow-sm">
          <div>
            <h1 className="text-lg sm:text-2xl font-semibold text-gray-800">
              Working Space Dashboard
            </h1>
            <p className="text-sm text-gray-600">
              Dago Creative Hub & Coffee Lab - Working Space
            </p>
          </div>
        </header>

        {/* Info Bar */}
        <div className="flex flex-col mb-6 p-4 rounded-lg shadow-sm bg-white border">
          <div className="flex flex-col sm:flex-row justify-between items-center">
            {/* Kiri */}
            <div className="flex justify-start gap-3">
              <a
                href="/laporan"
                className="px-3 py-1 text-xs sm:text-sm font-medium rounded-md border border-gray-300 text-gray-600 hover:bg-gray-100"
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
                className="px-3 py-1 text-xs sm:text-sm font-medium rounded-md border border-gray-300 bg-blue-50 text-blue-600 hover:bg-blue-100"
              >
                Working Space
              </a>
            </div>

            {/* Kanan */}
            <div className="flex items-center space-x-2 text-sm sm:text-base mt-3 sm:mt-0">
              <span className="text-gray-700 hidden sm:inline">
                Pilih Tanggal:
              </span>
              <ConfigProvider locale={locale}>
                <RangePicker
                  value={dateRange}
                  onChange={setDateRange}
                  format="DD-MM-YYYY"
                  className="border-gray-300 w-full sm:w-auto"
                />
              </ConfigProvider>
            </div>
          </div>
        </div>

        {/* Dashboard Grid - Row 1: Popular Space (LEFT) and Total Revenue (RIGHT) */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 lg:gap-6 mb-6">
          {/* 1. Combined Space Overview - Total Pendapatan and Space Terjual Chart - KANAN */}
          <div className="xl:col-span-2 bg-white p-6 rounded-lg shadow-sm">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Total Pendapatan - Kiri */}
              <div className="flex flex-col">
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">
                    Total Pendapatan Working Space
                  </h3>
                  <div className="text-2xl font-bold text-gray-900">
                    Rp {formatCurrency(totalWorkingSpaceRevenue)}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Pendapatan dari semua jenis space pada periode ini
                  </p>
                </div>
              </div>

              {/* Space Terjual Description - Kanan */}
              <div className="flex flex-col">
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">
                    Total Bookings
                  </h3>
                  <div className="text-lg font-semibold text-gray-800">
                    Total: {totalBookings} Bookings
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Berdasarkan popularitas space
                  </p>
                </div>
              </div>
            </div>

            {/* Space Terjual Diagram - Bawah */}
            <div className="w-full h-[350px] flex justify-center items-center mt-4">
              <div className="w-full max-w-sm h-full">
                <Doughnut data={spaceTerjualDataChart} options={chartOptions} />
              </div>
            </div>
          </div>

          {/* 2. Top 10 Popular Space - KIRI */}
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-sm font-medium text-gray-700 mb-2">
              Top 10 Popular Space
            </h3>
            <div className="overflow-x-auto h-[400px]">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 px-1 text-xs font-medium text-gray-600 sticky top-0 bg-white">
                      Space Name
                    </th>
                    <th className="text-center py-2 px-1 text-xs font-medium text-gray-600">
                      Bookings
                    </th>
                    <th className="text-right py-2 px-1 text-xs font-medium text-gray-600">
                      Total (Rp)
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {openSpaceTopData.map((item, index) => (
                    <tr
                      key={index}
                      className="border-b border-gray-100 hover:bg-gray-50"
                    >
                      <td className="py-2 px-1 text-xs">{item.item}</td>
                      <td className="py-2 px-1 text-xs text-center font-medium">
                        {item.qty}
                      </td>
                      <td className="py-2 px-1 text-xs text-right font-semibold">
                        Rp {item.total}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Dashboard Grid - Row 2: Daily Working Space Booking (LEFT) & Profit Summary (RIGHT) */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 lg:gap-6">
          {/* 3. Daily Working Space Booking Chart (Dynamic) - KIRI */}
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-sm font-medium text-gray-700 mb-4">
              Daily Working Space Booking (IDR){" "}
              {dayjs(endDate).format("MMMM YYYY")}
            </h3>
            <div className="w-full h-64 sm:h-80">
              <Line data={dailySellingData} options={lineChartOptions} />
            </div>
          </div>

          {/* 4. Working Space Profit Summary - 6 bulan terakhir (Dynamic) - KANAN */}
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-sm font-medium text-gray-700 mb-4">
              Working Space Profit Summary (6 Bulan Terakhir IDR)
            </h3>
            <div className="w-full h-64 sm:h-80">
              <Bar data={profitSummaryData} options={barChartOptions} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkingSpace;
