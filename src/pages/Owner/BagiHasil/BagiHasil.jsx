import React, { useState, useEffect } from "react";
import {
  ConfigProvider,
  Table,
  Button,
  Card,
  Row,
  Col,
  Statistic,
  DatePicker,
} from "antd";
import {
  // Ikon Umum
  DownloadOutlined,
  DollarOutlined,
  TeamOutlined,
  CrownOutlined,
  LineChartOutlined, 
  PieChartOutlined,

  // Ikon untuk Pengeluaran/Income
  MinusCircleOutlined, 
  WalletOutlined, // Pengeluaran
  AccountBookOutlined, // Income
  CheckCircleOutlined, // Sukses/Hak Owner
  CloseCircleOutlined, // Pengeluaran Total

  // Ikon untuk Detail Pengeluaran
  WifiOutlined, // WIFI
  SolutionOutlined, // Gaji/Personel
  BulbOutlined, // Listrik
  ShoppingOutlined, // Belanja Office
} from "@ant-design/icons";
import dayjs from "dayjs";
import "dayjs/locale/id";
import locale from "antd/locale/id_ID";

const { RangePicker } = DatePicker;

// Format Rupiah
const formatRupiah = (amount) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);

// --- TANGGAL SAAT INI (Asumsi data dummy ada untuk Sep & Okt 2025) ---
const CURRENT_YEAR = dayjs().year();
const OCTOBER_INDEX = 9; 
const SEPTEMBER_INDEX = 8; 


// --- DATA PENGELUARAN DUMMY ---
const expensesOctober = [
  { name: "📶 WIFI", key: "WIFI", amount: 350000 },
  { name: "👨‍💼 Gaji FO & OB", key: "GAJI", amount: 5000000 },
  { name: "💡 Air & Listrik", key: "LISTRIK", amount: 1000000 },
  { name: "📎 Belanja Office", key: "OFFICE", amount: 200000 },
];

const expensesSeptember = [
  { name: "📶 WIFI", key: "WIFI", amount: 350000 },
  { name: "👨‍💼 Gaji FO & OB", key: "GAJI", amount: 4800000 }, 
  { name: "💡 Air & Listrik", key: "LISTRIK", amount: 950000 },
  { name: "📎 Belanja Office", key: "OFFICE", amount: 150000 },
];

// Data utama untuk laporan (tetap sama)
const laporanDataOctober = [
  {
    id: 1,
    tenant: "HomeBro",
    total: 1500000,
    tenantShare: 1050000,
    ownerShare: 450000,
  },
  {
    id: 2,
    tenant: "Dapoer M.S",
    total: 2000000,
    tenantShare: 1400000,
    ownerShare: 600000,
  },
  {
    id: 3,
    tenant: "Dago Creative Space (Working Space)",
    total: 3000000,
    tenantShare: 0,
    ownerShare: 3000000,
    isInternal: true,
  },
];

const laporanDataSeptember = [
  {
    id: 1,
    tenant: "HomeBro",
    total: 1800000,
    tenantShare: 1260000,
    ownerShare: 540000,
  },
  {
    id: 2,
    tenant: "Dapoer M.S",
    total: 2200000,
    tenantShare: 1540000,
    ownerShare: 660000,
  },
  {
    id: 3,
    tenant: "Dago Creative Space (Working Space)",
    total: 3000000,
    tenantShare: 0,
    ownerShare: 3000000,
    isInternal: true,
  },
];

// Data Kosong (Jika bulan yang dipilih tidak memiliki data)
const EMPTY_DATA = [];
const EMPTY_EXPENSE = [];
// ------------------------------------

// Utility function untuk mendapatkan ikon berdasarkan kunci
const getExpenseIcon = (key) => {
    switch (key) {
        case 'WIFI': return <WifiOutlined className="text-xl text-blue-500" />;
        case 'GAJI': return <SolutionOutlined className="text-xl text-orange-500" />;
        case 'LISTRIK': return <BulbOutlined className="text-xl text-yellow-500" />;
        case 'OFFICE': return <ShoppingOutlined className="text-xl text-green-500" />;
        default: return <MinusCircleOutlined className="text-xl text-gray-500" />;
    }
}

const BagiHasil = () => {
  dayjs.locale("id");
  const today = dayjs();
  const [dateRange, setDateRange] = useState([today.startOf("month"), today]);
  const [laporanData, setLaporanData] = useState(laporanDataOctober);
  const [expenseData, setExpenseData] = useState(expensesOctober);

  // Calculate totals
  const totalPenjualanKotor = laporanData.reduce((sum, item) => sum + item.total, 0);
  const totalHakTenant = laporanData.reduce((sum, item) => sum + item.tenantShare, 0);
  const totalHakOwner = laporanData.reduce((sum, item) => sum + item.ownerShare, 0);
  const totalPengeluaran = expenseData.reduce((sum, item) => sum + item.amount, 0);
  const labaBersih = totalHakOwner - totalPengeluaran;

  // Update data based on date range
  useEffect(() => {
    if (dateRange && dateRange[1]) {
      const endMonth = dateRange[1].month();
      const endYear = dateRange[1].year();

      if (endYear !== CURRENT_YEAR) {
         setLaporanData(EMPTY_DATA);
         setExpenseData(EMPTY_EXPENSE);
      } else if (endMonth === SEPTEMBER_INDEX) { 
        setLaporanData(laporanDataSeptember);
        setExpenseData(expensesSeptember);
      } else if (endMonth === OCTOBER_INDEX) { 
        setLaporanData(laporanDataOctober);
        setExpenseData(expensesOctober);
      } else {
        setLaporanData(EMPTY_DATA);
        setExpenseData(EMPTY_EXPENSE);
      }
    }
  }, [dateRange]);


  // ... (Fungsi downloadReport dan exportAll tidak berubah) ...
  const downloadReport = (tenant) => {
    const data = `
LAPORAN BAGI HASIL
==================
Nama Tenant: ${tenant.tenant}
Periode: ${dateRange[0].format("DD/MM/YYYY")} - ${dateRange[1].format("DD/MM/YYYY")}

Total Pendapatan Tenant: ${formatRupiah(tenant.total)}
Hak Tenant (70%): ${formatRupiah(tenant.tenantShare)}
Hak Owner (30%): ${formatRupiah(tenant.ownerShare)}

Dago Creative Hub & Coffee Lab
    `;

    const blob = new Blob([data], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `laporan_${tenant.tenant.replace(/\s+/g, "_")}_${dateRange[0].format("YYYYMMDD")}-${dateRange[1].format("YYYYMMDD")}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportAll = () => {
    const header = `LAPORAN BAGI HASIL - SEMUA TENANT\nPeriode: ${dateRange[0].format("DD/MM/YYYY")} - ${dateRange[1].format("DD/MM/YYYY")}\n\n`;
    const content = laporanData
      .map((tenant) => {
        return `
Nama Tenant: ${tenant.tenant}
Total Pendapatan: ${formatRupiah(tenant.total)}
Hak Tenant (70%): ${formatRupiah(tenant.tenantShare)}
Hak Owner (30%): ${formatRupiah(tenant.ownerShare)}
----------------------------`;
      })
      .join("\n");

    const footer = `\n\nRINGKASAN TOTAL:\nTotal Penjualan Kotor: ${formatRupiah(totalPenjualanKotor)}\nTotal Hak Tenant: ${formatRupiah(totalHakTenant)}\nTotal Hak Owner: ${formatRupiah(totalHakOwner)}\n\nTOTAL PENGELUARAN BULANAN: ${formatRupiah(totalPengeluaran)}\nLABA BERSIH: ${formatRupiah(labaBersih)}`;

    const blob = new Blob([header + content + footer], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `laporan_semua_tenant_${dateRange[0].format("YYYYMMDD")}-${dateRange[1].format("YYYYMMDD")}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // ... (columns tidak berubah) ...
  const columns = [
    {
      title: "Nama Tenant",
      dataIndex: "tenant",
      key: "tenant",
      render: (text, record) => (
        <span className={record.isInternal ? "font-semibold text-purple-600" : "font-medium"}>
          {text}
        </span>
      ),
    },
    {
      title: "Total Pendapatan Tenant",
      dataIndex: "total",
      key: "total",
      render: (amount) => (
        <span className="font-semibold text-gray-800">{formatRupiah(amount)}</span>
      ),
      align: "right",
    },
    {
      title: "Hak Tenant (70%)",
      dataIndex: "tenantShare",
      key: "tenantShare",
      render: (amount) => (
        <span className="font-semibold text-green-600">{formatRupiah(amount)}</span>
      ),
      align: "right",
    },
    {
      title: "Hak Owner (30%)",
      dataIndex: "ownerShare",
      key: "ownerShare",
      render: (amount) => (
        <span className="font-semibold text-purple-600">{formatRupiah(amount)}</span>
      ),
      align: "right",
    },
    {
      title: "Aksi",
      key: "aksi",
      width: 120,
      fixed: "right",
      render: (_, record) => (
        <Button
          type="primary"
          icon={<DownloadOutlined />}
          onClick={() => downloadReport(record)}
          size="small"
        >
          Unduh
        </Button>
      ),
      align: "center",
    },
  ];


  return (
    <ConfigProvider locale={locale}>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="p-4 sm:p-6 lg:p-8">
          {/* Header Section */}
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border-t-4 border-blue-500">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-1">
                  Laporan Bagi Hasil & Profit Dashboard
                </h1>
                <p className="text-gray-600 font-medium">
                  Dago Creative Hub & Coffee Lab
                </p>
                <div className="mt-2 inline-flex items-center px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">
                  <CrownOutlined className="mr-2" />
                  Welcome, Owner
                </div>
              </div>
              <div className="flex flex-col items-start sm:items-end gap-2">
                <label className="text-sm font-medium text-gray-600">Pilih Periode:</label>
                <RangePicker
                  value={dateRange}
                  onChange={(dates) => setDateRange(dates)}
                  format="MMMM YYYY"
                  className="shadow-sm"
                  size="large"
                  picker="month" 
                />
              </div>
            </div>
          </div>

          {/* Summary Cards */}
          <Row gutter={[16, 16]} className="mb-6">
            <Col xs={24} sm={12} lg={8}>
              <Card className="shadow-lg hover:shadow-xl transition-all duration-300 border-l-4 border-blue-500 rounded-xl">
                <Statistic
                  title={
                    <span className="text-gray-600 font-semibold">
                      Total Penjualan Kotor
                    </span>
                  }
                  value={totalPenjualanKotor}
                  precision={0}
                  formatter={(value) => formatRupiah(value)}
                  prefix={
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-2">
                      <LineChartOutlined className="text-2xl text-blue-600" />
                    </div>
                  }
                  valueStyle={{ color: "#1677ff", fontWeight: "bold", fontSize: "1.75rem" }}
                />
                <div className="mt-2 text-xs text-gray-500">
                  Total pendapatan semua tenant
                </div>
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={8}>
              <Card className="shadow-lg hover:shadow-xl transition-all duration-300 border-l-4 border-green-500 rounded-xl">
                <Statistic
                  title={
                    <span className="text-gray-600 font-semibold">
                      Total Hak Tenant (70%)
                    </span>
                  }
                  value={totalHakTenant}
                  precision={0}
                  formatter={(value) => formatRupiah(value)}
                  prefix={
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-2">
                      <TeamOutlined className="text-2xl text-green-600" />
                    </div>
                  }
                  valueStyle={{ color: "#52c41a", fontWeight: "bold", fontSize: "1.75rem" }}
                />
                <div className="mt-2 text-xs text-gray-500">
                  Bagian yang diterima tenant
                </div>
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={8}>
              <Card className="shadow-lg hover:shadow-xl transition-all duration-300 border-l-4 border-purple-500 rounded-xl">
                <Statistic
                  title={
                    <span className="text-gray-600 font-semibold">
                      Total Hak Owner (30%)
                    </span>
                  }
                  value={totalHakOwner}
                  precision={0}
                  formatter={(value) => formatRupiah(value)}
                  prefix={
                    <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-2">
                      <CrownOutlined className="text-2xl text-purple-600" />
                    </div>
                  }
                  valueStyle={{ color: "#722ed1", fontWeight: "bold", fontSize: "1.75rem" }}
                />
                <div className="mt-2 text-xs text-gray-500">
                  Pendapatan untuk owner
                </div>
              </Card>
            </Col>
          </Row>

          {/* Percentage Breakdown */}
          <Card className="shadow-lg rounded-xl mb-6 bg-gradient-to-r from-purple-50 to-blue-50">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center shadow-md">
                  <PieChartOutlined className="text-2xl text-purple-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-800">Komposisi Bagi Hasil</h3>
                  <p className="text-sm text-gray-600">Periode yang dipilih</p>
                </div>
              </div>
              <div className="flex gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {totalPenjualanKotor > 0 ? ((totalHakTenant / totalPenjualanKotor) * 100).toFixed(1) : 0}%
                  </div>
                  <div className="text-xs text-gray-600 font-medium">Hak Tenant</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {totalPenjualanKotor > 0 ? ((totalHakOwner / totalPenjualanKotor) * 100).toFixed(1) : 0}%
                  </div>
                  <div className="text-xs text-gray-600 font-medium">Hak Owner</div>
                </div>
              </div>
            </div>
          </Card>

          {/* Table Section */}
          <Card className="shadow-lg rounded-xl">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div>
                <h3 className="text-xl font-bold text-gray-800 mb-1">
                  Pembagian Hasil Per Tenant
                </h3>
                <p className="text-sm text-gray-600">
                  Rasio 70% Tenant / 30% Owner
                </p>
              </div>
              <Button
                type="primary"
                icon={<DownloadOutlined />}
                onClick={exportAll}
                size="large"
                className="bg-gradient-to-r from-blue-600 to-blue-700 shadow-md"
              >
                Export Semua Laporan
              </Button>
            </div>

            <Table
              columns={columns}
              dataSource={laporanData}
              rowKey="id"
              pagination={false}
              scroll={{ x: 800 }}
              className="custom-owner-table"
              summary={() => (
                <Table.Summary>
                  <Table.Summary.Row className="bg-gradient-to-r from-blue-50 to-purple-50 font-bold">
                    <Table.Summary.Cell index={0} className="font-bold text-gray-800">
                      TOTAL
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={1} align="right">
                      <span className="font-bold text-blue-600 text-base">
                        {formatRupiah(totalPenjualanKotor)}
                      </span>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={2} align="right">
                      <span className="font-bold text-green-600 text-base">
                        {formatRupiah(totalHakTenant)}
                      </span>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={3} align="right">
                      <span className="font-bold text-purple-600 text-base">
                        {formatRupiah(totalHakOwner)}
                      </span>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={4} />
                  </Table.Summary.Row>
                </Table.Summary>
              )}
            />
          </Card>

          {/* Monthly Expenses Section (Semua Ikon Diganti) */}
          <Card className="shadow-lg rounded-xl mt-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">
              Ringkasan Pengeluaran Bulanan
              <span className="ml-2 text-base text-gray-500">
                ({dateRange[1]?.format("MMMM YYYY")})
              </span>
            </h3>
            <Row gutter={[16, 16]}>
              <Col xs={24} lg={12}>
                <div className="bg-gradient-to-br from-slate-50 to-slate-100 p-6 rounded-xl border border-slate-200">
                  <h4 className="text-base font-bold text-gray-700 mb-4 flex items-center gap-2">
                    {/* ICON: Pengeluaran (WalletOutlined) */}
                    <WalletOutlined className="text-2xl text-amber-600" />
                    <span>PENGELUARAN BULANAN</span>
                  </h4>
                  <div className="space-y-3">
                    {/* Menggunakan expenseData dinamis dan getExpenseIcon */}
                    {expenseData.map((expense, index) => (
                      <div key={index} className="flex justify-between items-center p-3 bg-white rounded-lg">
                        <span className="text-sm text-gray-600 flex items-center gap-3">
                          {/* ICON: Detail Pengeluaran */}
                          {getExpenseIcon(expense.key)}
                          <span>{expense.name.split(' ').slice(1).join(' ')}</span>
                        </span>
                        <span className="text-base font-semibold text-gray-800">
                          {formatRupiah(expense.amount)}
                        </span>
                      </div>
                    ))}
                    
                    {/* Total Pengeluaran */}
                    <div className="flex justify-between items-center p-3 bg-amber-100 rounded-lg border-l-4 border-amber-500 mt-4">
                      <span className="text-sm font-bold text-amber-700 flex items-center gap-2">
                        {/* ICON: Total Pengeluaran (CloseCircleOutlined atau MinusCircleOutlined) */}
                        <CloseCircleOutlined className="text-lg" /> TOTAL PENGELUARAN
                      </span>
                      <span className="text-lg font-bold text-amber-700">
                        {formatRupiah(totalPengeluaran)}
                      </span>
                    </div>
                  </div>
                </div>
              </Col>
              <Col xs={24} lg={12}>
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-xl border border-green-200">
                  <h4 className="text-base font-bold text-gray-700 mb-4 flex items-center gap-2">
                    {/* ICON: Ringkasan Income (AccountBookOutlined) */}
                    <AccountBookOutlined className="text-2xl text-green-600" />
                    <span>RINGKASAN INCOME</span>
                  </h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                      <span className="text-sm text-gray-600">
                        Working Space (100% Owner)
                      </span>
                      <span className="text-base font-semibold text-gray-800">
                        {formatRupiah(laporanData.find(d => d.isInternal)?.total || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                      <span className="text-sm text-gray-600">
                        Hak Owner dari Tenant (30%)
                      </span>
                      <span className="text-base font-semibold text-gray-800">
                        {formatRupiah(totalHakOwner - (laporanData.find(d => d.isInternal)?.total || 0))}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-purple-100 rounded-lg border-l-4 border-purple-500">
                      <span className="text-sm font-bold text-purple-700 flex items-center gap-2">
                        {/* ICON: Total Hak Owner (CheckCircleOutlined) */}
                        <CheckCircleOutlined className="text-lg" /> TOTAL HAK OWNER
                      </span>
                      <span className="text-lg font-bold text-purple-700">
                        {formatRupiah(totalHakOwner)}
                      </span>
                    </div>
                  </div>
                </div>
              </Col>
            </Row>

            {/* Net Profit Card */}
            <div className={`mt-6 p-6 rounded-xl shadow-xl ${labaBersih >= 0 
                ? 'bg-gradient-to-r from-blue-600 to-blue-700' 
                : 'bg-gradient-to-r from-amber-600 to-amber-700' 
              } text-white`}>
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="text-lg font-bold mb-1">LABA BERSIH BULANAN</h4>
                  <p className={`${labaBersih >= 0 ? 'text-blue-100' : 'text-amber-100'} text-sm`}>
                    Total Hak Owner - Total Pengeluaran
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-extrabold">
                    {formatRupiah(labaBersih)}
                  </div>
                  <div className={`text-xs mt-1 ${labaBersih >= 0 ? 'text-blue-100' : 'text-amber-100'}`}>
                    {labaBersih >= 0 ? "Profit Bersih ✓" : "Rugi Bersih ✗"}
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Info Footer */}
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
            <div className="flex items-start gap-3">
              <DollarOutlined className="text-blue-600 text-xl mt-1" />
              <div>
                <h4 className="font-semibold text-gray-800 mb-1">Informasi Bagi Hasil</h4>
                <p className="text-sm text-gray-600 leading-relaxed">
                  • Tenant eksternal mendapat 70% dari penjualan mereka, Owner mendapat 30%
                  <br />
                  • Dago Creative Space (Working Space) adalah internal, 100% untuk Owner
                  <br />
                  • **Pengeluaran bulanan akan disesuaikan secara otomatis saat Anda mengubah periode di atas.**
                  <br />
                  • Pengeluaran bulanan bersifat *read-only* dan dikelola oleh Admin
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .custom-owner-table .ant-table-thead > tr > th {
          background: linear-gradient(to right, #f8fafc, #f1f5f9);
          font-weight: 700;
          color: #1e293b;
          border-bottom: 2px solid #e2e8f0;
        }
        .custom-owner-table .ant-table-tbody > tr:hover > td {
          background-color: #f8fafc;
        }
        .custom-owner-table .ant-table-summary {
          background: linear-gradient(to right, #eff6ff, #f5f3ff);
          border-top: 3px solid #cbd5e1;
        }
        .border-l-4 {
          border-left-width: 4px;
        }
        .border-blue-500 {
          border-left-color: #1677ff;
        }
        .border-green-500 {
          border-left-color: #52c41a;
        }
        .border-purple-500 {
          border-left-color: #722ed1;
        }
        .border-amber-500 {
          border-left-color: #faad14; /* Warna Amber Ant Design */
        }
        .bg-amber-100 {
            background-color: #fffbe6; /* Warna Amber 100 Ant Design */
        }
        .text-amber-700 {
            color: #d46b08; /* Warna Amber 700 Ant Design */
        }
        .bg-gradient-to-r.from-amber-600 {
            background-image: linear-gradient(to right, #faad14, #d46b08); /* Gradient Amber/Orange untuk Loss */
        }
        .text-amber-100 {
            color: #ffc53d;
        }
        .text-amber-600 {
            color: #fa8c16; /* Warna Amber 600 untuk ikon utama pengeluaran */
        }
        .text-blue-500 {
            color: #40a9ff;
        }
        .text-orange-500 {
            color: #faad14;
        }
        .text-yellow-500 {
            color: #ffc53d;
        }
        .text-green-500 {
            color: #73d13c;
        }
        .ant-statistic-title {
          margin-bottom: 8px;
        }
      `}</style>
    </ConfigProvider>
  );
};

export default BagiHasil;