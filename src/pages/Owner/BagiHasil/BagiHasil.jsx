import React, { useState } from "react";
import { ConfigProvider, DatePicker, Table } from "antd";
import dayjs from "dayjs";
import "dayjs/locale/id";
import locale from "antd/locale/id_ID";

const { RangePicker } = DatePicker;

const BagiHasil = () => {
  const [dateRange, setDateRange] = useState([
    dayjs("2025-09-01"),
    dayjs("2025-09-08"),
  ]);

  const bagiHasilData = [
    {
      key: "1",
      namaTenant: "HomeBro",
      totalPenjualan: "Rp 150.000.000",
      hakTenant: "Rp 105.000.000",
      hakOwner: "Rp 45.000.000",
    },
    {
      key: "2",
      namaTenant: "Dapoor M.S",
      totalPenjualan: "Rp 100.000.000",
      hakTenant: "Rp 70.000.000",
      hakOwner: "Rp 30.000.000",
    },
    {
      key: "3",
      namaTenant: "Dago Creative Space",
      totalPenjualan: "Rp 75.000.000",
      hakTenant: "0",
      hakOwner: "Rp 75.000.000",
    },
  ];

  // Fungsi export per tenant
  const handleExport = (tenant) => {
    const data = `
Nama Tenant: ${tenant.namaTenant}
Total Penjualan: ${tenant.totalPenjualan}
Hak Tenant: ${tenant.hakTenant}
Hak Owner: ${tenant.hakOwner}
    `;

    const blob = new Blob([data], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${tenant.namaTenant}_bagi_hasil.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const columns = [
    { title: "Nama Tenant", dataIndex: "namaTenant", key: "namaTenant" },
    { title: "Total Penjualan", dataIndex: "totalPenjualan", key: "totalPenjualan" },
    { title: "Hak Tenant (70%)", dataIndex: "hakTenant", key: "hakTenant" },
    { title: "Hak Owner (30%)", dataIndex: "hakOwner", key: "hakOwner" },
    {
      title: "Aksi",
      key: "aksi",
      render: (_, record) => (
        <button
          onClick={() => handleExport(record)}
          className="px-3 py-1 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded"
        >
          Unduh
        </button>
      ),
    },
  ];

  // Hitung total
  const totalPenjualan = bagiHasilData.reduce((sum, item) => {
    const value = parseInt(item.totalPenjualan.replace(/[^\d]/g, ""));
    return sum + value;
  }, 0);

  const totalHakOwner = bagiHasilData.reduce((sum, item) => {
    const value = parseInt(item.hakOwner.replace(/[^\d]/g, ""));
    return sum + value;
  }, 0);

  const totalHakTenant = bagiHasilData.reduce((sum, item) => {
    const value = parseInt(item.hakTenant.replace(/[^\d]/g, ""));
    return sum + value;
  }, 0);

  const formatCurrency = (amount) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);

  return (
    <div className="min-h-screen bg-gray-100 font-sans">
      {/* Main Content tanpa sidebar */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 sm:p-6 lg:p-8 min-h-screen">
          {/* Header */}
          <header className="flex justify-between items-center mb-6 lg:mb-8 bg-white p-4 rounded-lg shadow-sm">
            <div>
              <h1 className="text-lg sm:text-2xl font-semibold text-gray-800">
                Bagi Hasil
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
          <div className="flex flex-col sm:flex-row justify-between items-center mb-6 p-4 rounded-lg shadow-sm bg-white border">
            <div className="flex items-center space-x-2 text-sm sm:text-base mb-4 sm:mb-0">
              <span className="font-medium">Week Period</span>
              <div className="flex items-center space-x-2 bg-gray-50 p-2 rounded border">
                <span className="font-semibold text-gray-700">
                  📅 {dateRange[0] && dateRange[1]
                    ? `${dateRange[0].format("YYYY-MM-DD")} to ${dateRange[1].format("YYYY-MM-DD")}`
                    : "Pilih tanggal"}
                </span>
              </div>
            </div>

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

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6 mb-6">
            <div className="md:col-span-3">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Summary Sharing
              </h2>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-blue-500">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">
                    Total Penjualan
                  </h3>
                  <div className="text-2xl font-bold text-blue-600">
                    {formatCurrency(totalPenjualan)}
                  </div>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 text-xl">💰</span>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-green-500">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">
                    Hak Tenant (70%)
                  </h3>
                  <div className="text-2xl font-bold text-green-600">
                    {formatCurrency(totalHakTenant)}
                  </div>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-600 text-xl">🏪</span>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-purple-500">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">
                    Hak Owner (30%)
                  </h3>
                  <div className="text-2xl font-bold text-purple-600">
                    {formatCurrency(totalHakOwner)}
                  </div>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <span className="text-purple-600 text-xl">👑</span>
                </div>
              </div>
            </div>
          </div>

          {/* Detail Table */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-6">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800">
                Pembagian Hasil Per Tenant
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Detail pembagian hasil penjualan untuk setiap tenant dengan rasio 70-30%
              </p>
            </div>

            <div className="overflow-x-auto">
              <Table
                dataSource={bagiHasilData}
                columns={columns}
                pagination={false}
                className="custom-table"
                summary={() => (
                  <Table.Summary.Row className="bg-gray-50 font-semibold">
                    <Table.Summary.Cell className="font-bold text-gray-800">
                      Total
                    </Table.Summary.Cell>
                    <Table.Summary.Cell className="font-bold text-blue-600">
                      {formatCurrency(totalPenjualan)}
                    </Table.Summary.Cell>
                    <Table.Summary.Cell className="font-bold text-green-600">
                      {formatCurrency(totalHakTenant)}
                    </Table.Summary.Cell>
                    <Table.Summary.Cell className="font-bold text-purple-600">
                      {formatCurrency(totalHakOwner)}
                    </Table.Summary.Cell>
                    <Table.Summary.Cell />
                  </Table.Summary.Row>
                )}
              />
            </div>
          </div>

          {/* Info */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg mb-8">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <span className="text-blue-500 text-lg">ℹ️</span>
              </div>
              <div>
                <h4 className="text-sm font-medium text-blue-800 mb-1">
                  Informasi Pembagian Hasil
                </h4>
                <p className="text-sm text-blue-700">
                  Sistem bagi hasil menggunakan rasio <strong>70% untuk tenant</strong> dan <strong>30% untuk owner</strong> berdasarkan total penjualan masing-masing tenant dalam periode yang dipilih.
                </p>
              </div>
            </div>
          </div>

          {/* Spacer */}
          <div className="h-8"></div>
        </div>
      </div>

      {/* Styles */}
      <style jsx global>{`
        .custom-table .ant-table-thead > tr > th {
          background-color: #f8fafc;
          border-bottom: 2px solid #e2e8f0;
          font-weight: 600;
          color: #374151;
        }
        .custom-table .ant-table-tbody > tr > td {
          border-bottom: 1px solid #f1f5f9;
        }
        .custom-table .ant-table-tbody > tr:hover > td {
          background-color: #f8fafc;
        }
        .custom-table .ant-table-summary > tr > td {
          border-top: 2px solid #e2e8f0;
        }
        body {
          overflow-x: hidden;
        }
        .ant-table-wrapper {
          max-width: 100%;
        }
      `}</style>
    </div>
  );
};

export default BagiHasil;