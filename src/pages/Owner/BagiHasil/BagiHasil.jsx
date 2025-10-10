import React, { useState } from "react";
// FIX: Memastikan impor komponen Ant Design, termasuk Alert, sudah benar.
import { ConfigProvider, DatePicker, Table, Alert } from "antd";
import dayjs from "dayjs";
import "dayjs/locale/id";
import locale from "antd/locale/id_ID";

const { RangePicker } = DatePicker;

/**
 * Helper untuk menghitung bagi hasil 70-30%
 * NEW RULE: 70% Tenant / 30% Owner
 * @param {number} sales - Total penjualan tenant
 * @param {boolean} internal - True jika Dago Creative Space (100% Owner)
 * @returns {Object} {totalPenjualan, hakTenant, hakOwner}
 */
const calculateSalesSplit = (sales, internal = false) => {
  const total = sales;
  // Format ke Rupiah string tanpa simbol (hanya angka)
  const formatRp = (num) => `Rp ${num.toLocaleString("id-ID")}`;

  if (internal) {
    // Dago Creative Space (Internal/Working Space): 100% Owner, 0% Tenant
    return {
      totalPenjualan: formatRp(total),
      hakTenant: "0",
      hakOwner: formatRp(total),
    };
  }
  // NEW RULE: 70% Tenant / 30% Owner
  // Menggunakan Math.round untuk pembulatan agar totalnya pas
  const hakTenant = Math.round(total * 0.7);
  const hakOwner = total - hakTenant;

  return {
    totalPenjualan: formatRp(total),
    hakTenant: formatRp(hakTenant),
    hakOwner: formatRp(hakOwner),
  };
};

// --- DUMMY DATASETS UNTUK SIMULASI INTERAKTIF ---

// Static Input Values
const WORKING_SPACE_INCOME = 3000000; // Rp 3.0 Juta

// Data 1: Normal Sales (External Total: Rp 3.500.000)
const normalSalesData = [
  // Total External sales: 1.5M + 2.0M = 3.5M (Split 70/30)
  { key: "1", namaTenant: "HomeBro", ...calculateSalesSplit(1500000) },
  { key: "2", namaTenant: "Dapoer M.S", ...calculateSalesSplit(2000000) },
  // Dago Creative Space (Internal/Working Space): Rp 3.0M (100% Owner)
  {
    key: "3",
    namaTenant: "Dago Creative Space (Working Space)",
    ...calculateSalesSplit(WORKING_SPACE_INCOME, true),
  },
];

// Data 2: High Sales (Future Month Simulation) - External Total: Rp 4.500.000
const highSalesData = [
  // Total External sales: 2.0M + 2.5M = 4.5M (Split 70/30)
  { key: "1", namaTenant: "HomeBro", ...calculateSalesSplit(2000000) },
  { key: "2", namaTenant: "Dapoer M.S", ...calculateSalesSplit(2500000) },
  // Dago Creative Space (Internal/Working Space): Rp 3.0M (100% Owner)
  {
    key: "3",
    namaTenant: "Dago Creative Space (Working Space)",
    ...calculateSalesSplit(WORKING_SPACE_INCOME, true),
  },
];

const getBagiHasilDataByDate = (dates) => {
  if (!dates || dates.length !== 2 || !dates[1]) return normalSalesData;
  const endDate = dates[1];
  const currentMonthEnd = dayjs().endOf("month");

  // Logika Simulasi: Jika tanggal akhir berada di bulan setelah bulan ini, gunakan High Sales
  if (endDate.isAfter(currentMonthEnd)) {
    return highSalesData;
  }
  // Jika tidak (di bulan ini atau bulan sebelumnya), gunakan Normal Sales
  return normalSalesData;
};

// --- End of Data Selection Logic ---

const BagiHasil = () => {
  dayjs.locale("id"); // Set locale to Indonesian
  const today = dayjs();
  // Inisialisasi: Tanggal 1 awal bulan hingga tanggal hari ini
  const [dateRange, setDateRange] = useState([today.startOf("month"), today]);

  // State untuk Cost per bulan (Bisa diatur Owner)
  const [monthlyCost, setMonthlyCost] = useState({
    wifi: 350000,
    gajiFoOb: 5000000,
    airListrik: 1000000,
    belanjaOffice: 200000,
  });


  const handleCostChange = (key, value) => {
    // Menghilangkan semua karakter non-digit kecuali tanda koma/titik untuk memisahkan ribuan (lalu dihilangkan)
    const numericValue = parseInt(value.replace(/[^\d]/g, ""), 10) || 0;
    setMonthlyCost((prev) => ({
      ...prev,
      [key]: numericValue,
    }));
  };

  // Data yang akan ditampilkan, bergantung pada dateRange (interaktif)
  const bagiHasilData = getBagiHasilDataByDate(dateRange);

  // Fungsi utilitas untuk membersihkan dan mengkonversi nilai mata uang ke integer
  const cleanAndConvert = (currencyString) => {
    // Menghilangkan 'Rp', spasi, titik (pemisah ribuan), dan koma
    const value = parseInt(currencyString.replace(/[^\d]/g, ""));
    return isNaN(value) ? 0 : value;
  };

  /**
   * Format angka menjadi string Rupiah (misal: Rp 10.000.000)
   * @param {number} amount
   */
  const formatCurrency = (amount) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);

  // --- MONTHLY (PER BULAN) BASE INCOME & COST CALCULATIONS ---
  // Simulasi untuk YTD (Asumsi 10 bulan berjalan)
  const YTD_MONTHS = 10;

  // --- Step 1: Calculate Totals from Table Data ---
  const totalPenjualanGross = bagiHasilData.reduce((sum, item) => {
    return sum + cleanAndConvert(item.totalPenjualan);
  }, 0); // Either 6.5M or 7.5M

  // Split data into Internal (Working Space) and External (Tenant Sales)
  const workingSpaceItem = bagiHasilData.find((t) =>
    t.namaTenant.includes("Working Space")
  );
  const externalTenantItems = bagiHasilData.filter(
    (t) => !t.namaTenant.includes("Working Space")
  );

  // Calculate External Tenant Sales Total
  const externalTenantSales = externalTenantItems.reduce((sum, item) => {
    return sum + cleanAndConvert(item.totalPenjualan);
  }, 0);

  // Calculate Owner's 30% cut from external sales
  const ownerShare30Monthly = externalTenantItems.reduce((sum, item) => {
    return sum + cleanAndConvert(item.hakOwner);
  }, 0);

  // Calculate Tenant's 70% cut from external sales
  const tenantShare70Monthly = externalTenantItems.reduce((sum, item) => {
    return sum + cleanAndConvert(item.hakTenant);
  }, 0);

  // Working Space Income (100% Owner)
  const workingSpaceMonthly = cleanAndConvert(
    workingSpaceItem?.hakOwner || "0"
  );

  // Total Hak Owner (Gross Income) - Dago Creative Hub's Total Revenue
  const totalHakOwner = workingSpaceMonthly + ownerShare30Monthly;

  // Total cost per month (from adjustable state)
  const totalMonthlyCost = Object.values(monthlyCost).reduce(
    (a, b) => a + b,
    0
  );

  // Monthly Net Profit: Owner's Gross Income - Total Monthly Cost
  const monthlyNetProfit = totalHakOwner - totalMonthlyCost;

  // --- Monthly Lists for display (Simplified as requested) ---
  const monthlyIncomeList = [
    { label: "1. Working Space (100% Owner)", amount: workingSpaceMonthly },
    {
      label: "    Tenant Sale (Total Pendapatan Tenant)",
      amount: externalTenantSales,
    },
    { label: "    Hak Tenant (70% ke Tenant)", amount: tenantShare70Monthly },
    { label: "2. Hak Owner (30% dari Tenant)", amount: ownerShare30Monthly },
    {
      label: "TOTAL HAK OWNER (GROSS INCOME)",
      amount: totalHakOwner,
      icon: "✅",
      isTotal: true,
      color: "text-purple-600",
    },
  ];

  const monthlyCostList = [
    { label: "WIFI", key: "wifi", amount: monthlyCost.wifi, icon: "📶" },
    {
      label: "Gaji FO & OB",
      key: "gajiFoOb",
      amount: monthlyCost.gajiFoOb,
      icon: "👨‍💼",
    },
    {
      label: "Air & Listrik",
      key: "airListrik",
      amount: monthlyCost.airListrik,
      icon: "💡",
    },
    {
      label: "Belanja Office",
      key: "belanjaOffice",
      amount: monthlyCost.belanjaOffice,
      icon: "📎",
    },
    {
      label: "TOTAL MONTHLY COST",
      key: "total",
      amount: totalMonthlyCost,
      icon: "❌",
      isTotal: true,
      color: "text-red-600",
    },
  ];

  // --- YTD CALCULATIONS (SIMULASI) ---
  const totalYtdCost = totalMonthlyCost * YTD_MONTHS;
  const ytdOwnerGrossIncome = totalHakOwner * YTD_MONTHS;
  const ytdNetProfit = ytdOwnerGrossIncome - totalYtdCost;

  // YTD Lists for display
  const ytdIncomeList = [
    {
      label: "Working Space (100% Owner)",
      amount: workingSpaceMonthly * YTD_MONTHS,
    },
    {
      label: "Hak Tenant (70% ke Tenant)",
      amount: tenantShare70Monthly * YTD_MONTHS,
    },
    {
      label: "Hak Owner (30% dari Tenant)",
      amount: ownerShare30Monthly * YTD_MONTHS,
    },
    {
      label: "TOTAL HAK OWNER (YTD)",
      amount: ytdOwnerGrossIncome,
      icon: "✅",
      isTotal: true,
      color: "text-purple-600",
    },
  ];

  const ytdCostList = [
    { label: "WIFI", amount: monthlyCost.wifi * YTD_MONTHS, icon: "📶" },
    {
      label: "Gaji FO & OB",
      amount: monthlyCost.gajiFoOb * YTD_MONTHS,
      icon: "👨‍💼",
    },
    {
      label: "Air & Listrik",
      amount: monthlyCost.airListrik * YTD_MONTHS,
      icon: "💡",
    },
    {
      label: "Belanja Office",
      amount: monthlyCost.belanjaOffice * YTD_MONTHS,
      icon: "📎",
    },
    {
      label: "TOTAL YTD COST (Estimasi)",
      amount: totalYtdCost,
      icon: "❌",
      isTotal: true,
      color: "text-red-600",
    },
  ];
  // -----------------------------------------------------

  // Fungsi export per tenant
  const handleExport = (tenant) => {
    const data = `
Nama Tenant: ${tenant.namaTenant}
Total Pendapatan Tenant: ${tenant.totalPenjualan}
Hak Tenant (70%): ${tenant.hakTenant}
Hak Owner (30%): ${tenant.hakOwner}
    `;

    const blob = new Blob([data], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    // Mengganti spasi dengan underscore untuk nama file
    const safeName = tenant.namaTenant.replace(/\s+/g, "_").toLowerCase();
    link.download = `${safeName}_bagi_hasil.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Kolom Tabel
  const columns = [
    { title: "Nama Tenant", dataIndex: "namaTenant", key: "namaTenant" },
    {
      title: "Total Pendapatan Tenant",
      dataIndex: "totalPenjualan",
      key: "totalPenjualan",
    },
    { title: "Hak Tenant (70%)", dataIndex: "hakTenant", key: "hakTenant" },
    { title: "Hak Owner (30%)", dataIndex: "hakOwner", key: "hakOwner" },
    {
      title: "Aksi",
      key: "aksi",
      render: (_, record) => (
        <button
          onClick={() => handleExport(record)}
          className="px-3 py-1 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded-full transition duration-150 shadow-md hover:shadow-lg"
        >
          Unduh
        </button>
      ),
    },
  ];

  // Komponen Input Kustom untuk Biaya (Dibuat lebih minimalis dan jelas untuk diedit)
  const CostInput = ({ label, value, onChange, isTotal, icon, keyId }) => (
    <div
      className={`flex justify-between items-center p-3 rounded-lg transition duration-200 ${
        isTotal
          ? "bg-red-100 font-bold border-l-4 border-red-500" // Adjusted for new container style
          : "bg-white border border-gray-200 hover:shadow-sm"
      }`}
    >
      <span
        className={`text-sm ${
          isTotal ? "text-red-700" : "text-gray-700"
        } flex items-center`}
      >
        <span className="mr-2">{icon}</span>
        {label}
      </span>
      <div className="flex items-center">
        <span
          className={`text-sm font-semibold ${
            isTotal ? "text-red-700" : "text-gray-500"
          }`}
        >
          Rp
        </span>
        {isTotal ? (
          <span
            className={`text-base font-semibold ml-1 ${
              isTotal ? "text-red-700" : "text-gray-800"
            }`}
          >
            {formatCurrency(value).replace("Rp", "").trim()}
          </span>
        ) : (
          <input
            type="text"
            // Tampilkan nilai yang diformat dari state (numeric value)
            value={value.toLocaleString("id-ID")}
            onChange={(e) => onChange(keyId, e.target.value)}
            placeholder="0"
            className="w-28 sm:w-32 text-right bg-white outline-none focus:border-blue-500 transition ml-1 p-1 rounded-md text-base font-semibold text-gray-800 border-b border-gray-200 hover:border-gray-400 focus:ring-1 focus:ring-blue-300"
            inputMode="numeric"
          />
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 sm:p-6 lg:p-8 min-h-screen">
          {/* Header */}
          <header className="flex justify-between items-center mb-6 lg:mb-8 bg-white p-4 rounded-xl shadow-md">
            <div>
              <h1 className="text-lg sm:text-2xl font-bold text-gray-800">
                Laporan Bagi Hasil & Profit Dashboard
              </h1>
              <p className="text-sm text-gray-600">
                Dago Creative Hub & Coffee Lab
              </p>
            </div>
          </header>
          {/* Info Bar & Date Picker */}
          <div className="flex flex-col sm:flex-row justify-between items-center mb-6 p-4 rounded-xl shadow-sm bg-white border border-gray-100">
            <p></p>
            <div className="flex items-center space-x-2 text-sm sm:text-base">
              <span>Pilih Tanggal:</span>
              <ConfigProvider locale={locale}>
                <RangePicker
                  value={dateRange}
                  onChange={(dates) => {
                    setDateRange(dates);
                  }}
                  format="DD/MM/YYYY"
                  className="rounded-lg border-gray-300 shadow-sm"
                  // Membatasi tanggal akhir agar tidak lebih dari hari ini
                  disabledDate={(current) =>
                    current && current.isAfter(today, "day")
                  }
                />
              </ConfigProvider>
            </div>
          </div>

         
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6 mb-8">
            {/* Card 1: Total Penjualan */}
            <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-blue-500 hover:shadow-lg transition">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">
                    Total Penjualan Kotor
                  </h3>
                  <div className="text-2xl font-extrabold text-blue-600">
                    {formatCurrency(totalPenjualanGross)}
                  </div>
                </div>
                <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 text-xl">📈</span>
                </div>
              </div>
            </div>

            {/* Card 2: Total Hak Tenant (70%) */}
            <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-green-500 hover:shadow-lg transition">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">
                    Total Hak Tenant (70%)
                  </h3>
                  <div className="text-2xl font-extrabold text-green-600">
                    {formatCurrency(tenantShare70Monthly)}
                  </div>
                </div>
                <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center">
                  <span className="text-green-600 text-xl">👤</span>
                </div>
              </div>
            </div>

            {/* Card 3: Hak Owner (Gross Income) */}
            <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-purple-500 hover:shadow-lg transition">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">
                    Total Hak Owner
                  </h3>
                  <div className="text-2xl font-extrabold text-purple-600">
                    {formatCurrency(totalHakOwner)}
                  </div>
                </div>
                <div className="w-12 h-12 bg-purple-50 rounded-full flex items-center justify-center">
                  <span className="text-purple-600 text-xl">👑</span>
                </div>
              </div>
            </div>
          </div>

          {/* Detail Table */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden mb-8 border border-gray-100">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-800">
                Pembagian Hasil Per Tenant
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Rasio 70% Tenant / 30% Owner.
              </p>
            </div>

            <div className="overflow-x-auto">
              <Table
                dataSource={bagiHasilData}
                columns={columns}
                pagination={false}
                className="custom-table"
                // FIX: Membungkus Table.Summary.Row dengan Table.Summary untuk mematuhi struktur React.
                summary={() => (
                  <Table.Summary>
                    <Table.Summary.Row className="bg-gray-50 font-semibold">
                      <Table.Summary.Cell
                        index={0}
                        className="font-bold text-gray-800"
                      >
                        Total
                      </Table.Summary.Cell>
                      <Table.Summary.Cell
                        index={1}
                        className="font-bold text-blue-600"
                      >
                        {formatCurrency(totalPenjualanGross)}
                      </Table.Summary.Cell>
                      <Table.Summary.Cell
                        index={2}
                        className="font-bold text-green-600"
                      >
                        {formatCurrency(tenantShare70Monthly)}
                      </Table.Summary.Cell>
                      <Table.Summary.Cell
                        index={3}
                        className="font-bold text-purple-600"
                      >
                        {formatCurrency(
                          ownerShare30Monthly + workingSpaceMonthly
                        )}
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={4} />
                    </Table.Summary.Row>
                  </Table.Summary>
                )}
              />
            </div>
          </div>

          {/* Overview Income and Cost (Monthly & YTD) */}
          <div className="mb-10">
            <h2 className="text-xl font-bold text-gray-800 mb-6">
              Ringkasan Laba (Profit)
            </h2>
            {/* Section 1: MONTHLY OVERVIEW - Dalam SATU KOTAK */}
            <h3 className="text-lg font-semibold text-gray-700 mb-4 border-b pb-2">
              1. Laporan Per Bulan
            </h3>
            <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
              {" "}
              {/* Kotak Pembungkus */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* MONTHLY INCOME (Sesuai Permintaan) */}
                <div className="p-4 rounded-xl bg-green-50/50 border border-green-200">
                  <h4 className="text-base font-bold text-gray-700 mb-4 flex items-center space-x-2 border-b pb-2">
                    <span className="text-2xl text-green-600">💰</span>
                    <span>INCOME</span>
                  </h4>
                  <div className="space-y-3">
                    {monthlyIncomeList.map((item, index) => (
                      <div
                        key={index}
                        className={`flex justify-between items-center p-3 rounded-lg ${
                          item.isTotal
                            ? "bg-purple-100 font-bold border-l-4 border-purple-500"
                            : "bg-white"
                        } ${item.label.startsWith("  ") ? "ml-6" : ""}`}
                      >
                        <span
                          className={`text-sm ${
                            item.isTotal ? item.color : "text-gray-600"
                          }`}
                        >
                          {item.icon} {item.label}
                        </span>
                        <span
                          className={`text-base font-semibold ${
                            item.isTotal ? item.color : "text-gray-800"
                          }`}
                        >
                          {formatCurrency(item.amount)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* MONTHLY COST - Kustomisasi Owner */}
                <div className="p-4 rounded-xl bg-red-50/50 border border-red-200">
                  <h4 className="text-base font-bold text-gray-700 mb-4 flex items-center space-x-2 border-b pb-2">
                    <span className="text-2xl text-red-600">💸</span>
                    <span>COST PER BULAN</span>
                  </h4>
                  <div className="space-y-3">
                    {monthlyCostList.slice(0, 4).map((item, index) => (
                      <CostInput
                        key={index}
                        keyId={item.key} // Pass the key for the handler
                        label={item.label}
                        value={item.amount}
                        icon={item.icon}
                        onChange={handleCostChange}
                        isTotal={false}
                      />
                    ))}
                    {/* Total Cost is displayed read-only */}
                    <div className="mt-4">
                      <CostInput
                        label={monthlyCostList[4].label}
                        value={monthlyCostList[4].amount}
                        icon={monthlyCostList[4].icon}
                        isTotal={true}
                      />
                    </div>
                  </div>
                </div>
              </div>
              {/* Monthly Net Profit Card (Di dalam Kotak Pembungkus) */}
              <div className="mt-6 p-4 bg-blue-500 text-white rounded-xl shadow-xl flex justify-between items-center transform transition duration-300 hover:scale-[1.01]">
                <h4 className="text-lg font-bold">TOTAL</h4>
                <div className="text-2xl font-extrabold">
                  {formatCurrency(monthlyNetProfit)}
                </div>
              </div>
            </div>{" "}
            {/* Penutup Kotak Pembungkus Bulanan */}
            {/* Separator */}
            <div className="my-10 border-t-2 border-dashed border-gray-300"></div>
            {/* Section 2: YTD OVERVIEW - Dalam SATU KOTAK */}
            <h3 className="text-lg font-semibold text-gray-700 mb-4 border-b pb-2">
              2. Laporan YTD (Year To Date: {YTD_MONTHS} Bulan Estimasi)
            </h3>
            <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
              {" "}
              {/* Kotak Pembungkus */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* YTD INCOME */}
                <div className="p-4 rounded-xl bg-green-50/50 border border-green-200">
                  <h4 className="text-base font-bold text-gray-700 mb-4 flex items-center space-x-2 border-b pb-2">
                    <span className="text-2xl text-green-600">💰</span>
                    <span>YTD INCOME</span>
                  </h4>
                  <div className="space-y-3">
                    {ytdIncomeList.map((item, index) => (
                      <div
                        key={index}
                        className={`flex justify-between items-center p-3 rounded-lg ${
                          item.isTotal
                            ? "bg-purple-100 font-bold border-l-4 border-purple-500"
                            : "bg-white"
                        }`}
                      >
                        <span
                          className={`text-sm ${
                            item.isTotal ? item.color : "text-gray-600"
                          }`}
                        >
                          {item.icon} {item.label}
                        </span>
                        <span
                          className={`text-base font-semibold ${
                            item.isTotal ? item.color : "text-gray-800"
                          }`}
                        >
                          {formatCurrency(item.amount)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* YTD COST */}
                <div className="p-4 rounded-xl bg-red-50/50 border border-red-200">
                  <h4 className="text-base font-bold text-gray-700 mb-4 flex items-center space-x-2 border-b pb-2">
                    <span className="text-2xl text-red-600">💸</span>
                    <span>YTD COST</span>
                  </h4>

                  <div className="space-y-3">
                    {ytdCostList.map((item, index) => (
                      <div
                        key={index}
                        className={`flex justify-between items-center p-3 rounded-lg ${
                          item.isTotal
                            ? "bg-red-100 font-bold border-l-4 border-red-500"
                            : "bg-white"
                        }`}
                      >
                        <span
                          className={`text-sm ${
                            item.isTotal ? item.color : "text-gray-600"
                          }`}
                        >
                          {item.icon} {item.label}
                        </span>
                        <span
                          className={`text-base font-semibold ${
                            item.isTotal ? item.color : "text-gray-800"
                          }`}
                        >
                          {formatCurrency(item.amount)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              {/* YTD Net Profit Card (Di dalam Kotak Pembungkus) */}
              <div className="mt-6 p-6 bg-blue-600 text-white rounded-xl shadow-2xl flex justify-between items-center transform transition duration-300 hover:scale-[1.01]">
                <h4 className="text-xl font-bold">
                  LABA BERSIH YTD ({YTD_MONTHS} BULAN)
                </h4>
                <div className="text-3xl font-extrabold">
                  {formatCurrency(ytdNetProfit)}
                </div>
              </div>
            </div>{" "}
            {/* Penutup Kotak Pembungkus YTD */}
          </div>

          {/* Spacer */}
          <div className="h-8"></div>
        </div>
      </div>

      {/* Styles for Antd Table */}
      <style>{`
        .custom-table .ant-table-thead > tr > th {
          background-color: #f8fafc; /* Tailwind gray-50 */
          border-bottom: 2px solid #e2e8f0;
          font-weight: 700;
          color: #4b5563; /* Tailwind gray-700 */
        }
        .custom-table .ant-table-tbody > tr > td {
          border-bottom: 1px solid #f1f5f9;
        }
        .custom-table .ant-table-tbody > tr:hover > td {
          background-color: #f8fafc;
        }
        .custom-table .ant-table-summary > tr > td {
          border-top: 3px solid #e2e8f0;
        }
        .ant-table-summary td {
          padding: 12px 16px !important;
        }
        body {
          overflow-x: hidden;
        }
        .ant-table-wrapper {
          max-width: 100%;
          border-radius: 12px;
        }
        /* Hide antd date range picker divider icon for minimalist look */
        .ant-picker-separator {
          color: #9ca3af;
        }
      `}</style>
    </div>
  );
};

export default BagiHasil;
