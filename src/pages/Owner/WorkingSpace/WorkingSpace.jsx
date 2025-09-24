import React, { useState } from "react";
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

const WorkingSpace = () => {
  const [dateRange, setDateRange] = useState([
    dayjs("2025-09-01"),
    dayjs("2025-09-08"),
  ]);

  // Working Space Total Pendapatan Data - 55% dari 150jt = 82.5jt
  const totalPendapatanData = {
    labels: ["Open Space", "Meeting Room"],
    datasets: [
      {
        data: [65, 35],
        backgroundColor: ["#4A6AFF", "#3B4FFC"],
        borderColor: ["#ffffff"],
        borderWidth: 1.5,
      },
    ],
  };

  // Space Terjual Data
  const spaceTerjualData = {
    labels: [
      "Open Space",
      "Space Monitor",
      "Lesehan",
      "Ruang Meeting",
      "Event Space",
    ],
    datasets: [
      {
        data: [143, 27, 20, 18, 2],
        backgroundColor: [
          "#4A6AFF",
          "#3B4FFC",
          "#6B7AFF",
          "#8B9AFF",
          "#ABBDFF",
        ],
        borderColor: ["#ffffff"],
        borderWidth: 1.5,
      },
    ],
  };

  // Top 5 Space Data
  const openSpaceTopData = [
    { item: "Open Space 1", qty: 45, total: "1.350.000" },
    { item: "Open Space 2", qty: 38, total: "1.140.000" },
    { item: "Open Space 3", qty: 32, total: "960.000" },
    { item: "Open Space 4", qty: 28, total: "840.000" },
    { item: "Lesehan Space", qty: 20, total: "500.000" },
    { item: "Space Monitor 1", qty: 15, total: "750.000" },
    { item: "Space Monitor 2", qty: 12, total: "600.000" },
    { item: "Ruang Meeting 03", qty: 10, total: "300.000" },
    { item: "Ruang Meeting 01", qty: 8, total: "480.000" },
    { item: "Event Space", qty: 2, total: "2.000.000" },
  ];

  const dailySellingData = {
    labels: Array.from({ length: 30 }, (_, i) => `${i + 1}`),
    datasets: [
      {
        label: "Daily Working Space Sales",
        data: [
          275000, 325000, 200000, 150000, 100000, 75000, 50000, 0, 0, 0, 0, 0,
          0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        ],
        fill: false,
        borderColor: "#4A6AFF",
        tension: 0.1,
        pointBackgroundColor: "#4A6AFF",
        pointBorderColor: "#4A6AFF",
      },
    ],
  };

  // Profit Summary Data Working Space - 6 bulan terakhir
  const profitSummaryData = {
    labels: ["Apr", "Mei", "Jun", "Jul", "Agu", "Sep"],
    datasets: [
      {
        label: "Working Space Profit",
        data: [1375000, 1210000, 1650000, 1540000, 1760000, 825000],
        backgroundColor: "#4A6AFF",
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
          callback: (value) => "Rp " + value.toLocaleString("id-ID"),
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
          <div className="flex items-center space-x-4">
            <span className="text-sm sm:text-base font-medium">OWNER</span>
            <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center">
              <span className="text-gray-600 text-sm">👤</span>
            </div>
          </div>
        </header>

        {/* Info Bar */}
        <div className="flex flex-col mb-6 p-4 rounded-lg shadow-sm bg-white border">
          {/* Bagian atas: Week Period & Pilih Tanggal */}
          <div className="flex flex-col sm:flex-row justify-between items-center mb-4">
            {/* Kiri */}
            <div className="flex items-center space-x-2 text-sm sm:text-base mb-4 sm:mb-0">
              <span className="font-medium">Week Period</span>
              <div className="flex items-center space-x-2 bg-gray-50 p-2 rounded border">
                <span className="font-semibold text-gray-700">
                  📅{" "}
                  {dateRange[0] && dateRange[1]
                    ? `${dateRange[0].format(
                        "YYYY-MM-DD"
                      )} to ${dateRange[1].format("YYYY-MM-DD")}`
                    : "Pilih tanggal"}
                </span>
              </div>
            </div>
            {/* Kanan */}
            <div className="flex items-center space-x-2 text-sm sm:text-base">
              <span>Pilih Tanggal</span>
              <ConfigProvider locale={locale}>
                <RangePicker
                  value={dateRange}
                  onChange={(dates) => setDateRange(dates)}
                  format="DD/MM/YYYY"
                  className="border-gray-300"
                />
              </ConfigProvider>
            </div>
          </div>

          {/* Bagian bawah: Navigasi kiri */}
          <div className="flex justify-start gap-3">
            <a
              href="/laporan"
              className="px-3 py-1 text-xs sm:text-sm font-medium rounded-md border border-gray-300 text-gray-600 hover:bg-gray-100"
            >
              Laporan
            </a>
            <a
              href="/FNBDashboard"
              className="px-3 py-1 text-xs sm:text-sm font-medium rounded-md border border-gray-300 text-gray-600 hover:bg-gray-100"
            >
              FNB
            </a>
            <a
              href="/WorkingSpace"
              className="px-3 py-1 text-xs sm:text-sm font-medium rounded-md border border-gray-300 bg-blue-50 text-blue-600 hover:bg-blue-100"
            >
              Working Space
            </a>
          </div>
        </div>

        {/* Dashboard Grid - Row 1: Combined Space Overview & Top 5 Popular Spaces */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 lg:gap-6 mb-6">
          {/* Combined Space Overview */}
          <div className="xl:col-span-2 bg-white p-6 rounded-lg shadow-sm">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Total Pendapatan - Kiri */}
              <div className="flex flex-col">
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">
                    Total Pendapatan Working Space
                  </h3>
                  <div className="text-2xl font-bold text-gray-900">
                    Rp 82.500.000
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    55% dari total pendapatan
                  </p>
                </div>
              </div>

              {/* Space Terjual Description - Kanan */}
              <div className="flex flex-col">
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">
                    Space Terjual
                  </h3>
                  <div className="text-lg font-semibold text-gray-800">
                    Total: 233 Bookings
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Berdasarkan popularitas space
                  </p>
                </div>
              </div>
            </div>

            {/* Space Terjual Diagram - Bawah */}
            <div className="w-full h-80 flex justify-center items-center mt-4">
              <div className="w-72 h-72">
                <Doughnut data={spaceTerjualData} options={chartOptions} />
              </div>
            </div>
          </div>

          {/* Top 5 Popular Space - Gabungan */}
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-sm font-medium text-gray-700 mb-4">
              Top 10 Popular Space
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 px-1 text-xs font-medium text-gray-600">
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

        {/* Dashboard Grid - Row 2: Daily Working Space Booking & Profit Summary */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 lg:gap-6">
          {/* Daily Working Space Booking Chart */}
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-sm font-medium text-gray-700 mb-4">
              Daily Working Space Booking (IDR) September 2025
            </h3>
            <div className="w-full h-64 sm:h-80">
              <Line data={dailySellingData} options={lineChartOptions} />
            </div>
          </div>

          {/* Working Space Profit Summary - 6 bulan terakhir */}
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