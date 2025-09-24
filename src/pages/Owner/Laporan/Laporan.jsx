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

const Laporan = () => {
  const [dateRange, setDateRange] = useState([
    dayjs("2025-09-01"),
    dayjs("2025-09-08"),
  ]);

  // Updated Total Pendapatan Data dengan Dago Open Space
  const totalPendapatanData = {
    labels: ["Dapoor M.S", "HomeBro", "Dago Open Space"],
    datasets: [
      {
        data: [35, 40, 25],
        backgroundColor: ["#4A6AFF", "#3B4FFC", "#6B7AFF"],
        borderColor: ["#ffffff"],
        borderWidth: 1.5,
      },
    ],
  };

  // Updated Top 5 Product Data - Dipisah per tenant
  const dapoerMSTopProductData = [
    { item: "Nasgor Ngejengit", qty: 15, total: "225.000" },
    { item: "Rice Bowls Spicy Chicken", qty: 10, total: "150.000" },
    { item: "Rice Bowls Cabe Garam", qty: 8, total: "120.000" },
    { item: "Mie Ayam Special", qty: 12, total: "108.000" },
    { item: "Bakso Malang", qty: 6, total: "90.000" },
  ];

  const homeBroTopProductData = [
    { item: "Cafe Latte", qty: 8, total: "176.000" },
    { item: "Cappucino", qty: 7, total: "154.000" },
    { item: "Americano", qty: 10, total: "140.000" },
    { item: "Matcha Latte", qty: 6, total: "102.000" },
    { item: "Espresso", qty: 9, total: "99.000" },
  ];

  const dailySellingData = {
    labels: Array.from({ length: 30 }, (_, i) => `${i + 1}`),
    datasets: [
      {
        label: "Daily Sales",
        data: [
          800000, 950000, 500000, 300000, 200000, 100000, 50000, 0, 0, 0, 0, 0,
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

  // Updated Profit Summary Data - 6 bulan terakhir
  const profitSummaryData = {
    labels: ["Apr", "Mei", "Jun", "Jul", "Agu", "Sep"],
    datasets: [
      {
        label: "Profit",
        data: [2500000, 2200000, 3000000, 2800000, 3200000, 1500000],
        backgroundColor: "#4A6AFF",
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          padding: 20,
          usePointStyle: true,
          font: {
            size: 12,
          },
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
              Laporan
            </h1>
            <p className="text-sm text-gray-600">
              Dago Creative Hub & Coffee Lab
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
              className="px-3 py-1 text-xs sm:text-sm font-medium rounded-md border border-gray-300 bg-blue-50 text-blue-600 hover:bg-blue-100"
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
              className="px-3 py-1 text-xs sm:text-sm font-medium rounded-md border border-gray-300 text-gray-600 hover:bg-gray-100"
            >
              Working Space
            </a>
          </div>
        </div>

        {/* Dashboard Grid - Row 1: Total Pendapatan & Top 5 Product Tenant */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 lg:gap-6 mb-6">
          {/* Total Pendapatan */}
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex flex-col">
              <div className="mb-4">
                <h3 className="text-sm font-medium text-gray-700 mb-2">
                  Total Pendapatan
                </h3>
                <div className="text-2xl font-bold text-gray-900">
                  Rp 150.000.000
                </div>
              </div>
              <div className="w-full h-64 flex justify-center items-center">
                <div className="w-56 h-56">
                  <Doughnut data={totalPendapatanData} options={chartOptions} />
                </div>
              </div>
            </div>
          </div>

          {/* Top 5 Product Tenant - Dapoor M.S */}
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-sm font-medium text-gray-700 mb-4">
              Top 5 Product - Dapoor M.S
            </h3>
            <div className="overflow-x-auto">
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
                        Rp {item.total}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Top 5 Product Tenant - HomeBro */}
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-sm font-medium text-gray-700 mb-4">
              Top 5 Product - HomeBro
            </h3>
            <div className="overflow-x-auto">
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
                        Rp {item.total}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Dashboard Grid - Row 2: Daily Selling & Profit Summary */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 lg:gap-6">
          {/* Daily Selling Chart */}
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-sm font-medium text-gray-700 mb-4">
              Daily Selling (IDR) September 2025
            </h3>
            <div className="w-full h-64 sm:h-80">
              <Line data={dailySellingData} options={lineChartOptions} />
            </div>
          </div>

          {/* Profit Summary - 6 bulan terakhir */}
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-sm font-medium text-gray-700 mb-4">
              Profit Summary (6 Bulan Terakhir IDR)
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

export default Laporan;