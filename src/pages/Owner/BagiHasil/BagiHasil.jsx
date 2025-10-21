import React, { useState, useEffect, useCallback } from "react";
import {
  ConfigProvider,
  Table,
  Button,
  Card,
  Row,
  Col,
  Statistic,
  DatePicker,
  message,
  Divider,
} from "antd";
import {
  DownloadOutlined,
  CrownOutlined,
  LineChartOutlined,
  WalletOutlined,
  AccountBookOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  WifiOutlined,
  SolutionOutlined,
  BulbOutlined,
  ShoppingOutlined,
  MinusCircleOutlined,
  ToolOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import "dayjs/locale/id";
import locale from "antd/locale/id_ID";
import { getExpenses, getBagiHasilReport } from "../../../services/service";

const { RangePicker } = DatePicker;

// Format Rupiah
const formatRupiah = (amount) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);

// Utility function untuk ikon pengeluaran
const getExpenseIcon = (key) => {
  const normalizedKey = key.toUpperCase();
  switch (normalizedKey) {
    case "WIFI": return <WifiOutlined className="text-xl text-blue-500" />;
    case "GAJI": return <SolutionOutlined className="text-xl text-orange-500" />;
    case "LISTRIK": return <BulbOutlined className="text-xl text-yellow-500" />;
    case "AIR": return <BulbOutlined className="text-xl text-blue-300" />;
    case "OFFICE": return <ShoppingOutlined className="text-xl text-green-500" />;
    case "MAINTENANCE": return <ToolOutlined className="text-xl text-red-500" />;
    case "KEBERSIHAN": return <ShoppingOutlined className="text-xl text-purple-500" />;
    default: return <MinusCircleOutlined className="text-xl text-gray-500" />;
  }
};

const BagiHasil = () => {
  dayjs.locale("id");
  const today = dayjs();

  const [dateRange, setDateRange] = useState([today.startOf("month"), today.endOf("month")]);
  const [laporanData, setLaporanData] = useState([]);
  const [expenseData, setExpenseData] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const scriptId = 'xlsx-script';
    if (document.getElementById(scriptId)) return; 

    const script = document.createElement('script');
    script.id = scriptId;
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js";
    script.async = true;
    document.body.appendChild(script);

    return () => {
      const existingScript = document.getElementById(scriptId);
      if (existingScript) {
        document.body.removeChild(existingScript);
      }
    }
  }, []);


  const fetchAllReportData = useCallback(async () => {
    if (!dateRange || dateRange.length < 2) {
      message.warning("Silakan pilih periode laporan yang valid.");
      return;
    }

    setLoading(true);
    const startDate = dateRange[0].format('YYYY-MM-DD');
    const endDate = dateRange[1].format('YYYY-MM-DD');

    try {
      const [laporanResult, expensesResult] = await Promise.all([
        getBagiHasilReport(startDate, endDate),
        getExpenses(startDate, endDate),
      ]);

      setLaporanData(laporanResult);

      const groupedExpenses = expensesResult.reduce((acc, item) => {
        const key = item.kategori.toUpperCase();
        if (!acc[key]) {
          acc[key] = {
            name: `📊 ${item.kategori.charAt(0).toUpperCase() + item.kategori.slice(1)}`,
            key: key,
            amount: 0,
          };
        }
        acc[key].amount += item.jumlah;
        return acc;
      }, {});
      setExpenseData(Object.values(groupedExpenses));

    } catch (error) {
      message.error(error.message || "Gagal memuat data laporan dari server.");
      setLaporanData([]);
      setExpenseData([]);
    } finally {
      setLoading(false);
    }
  }, [dateRange]);
  
  useEffect(() => {
    fetchAllReportData();
  }, [fetchAllReportData]);

  const totalPenjualanKotor = laporanData.reduce((sum, item) => sum + item.total, 0);
  const totalHakTenant = laporanData.reduce((sum, item) => sum + item.tenantShare, 0);
  const totalHakOwner = laporanData.reduce((sum, item) => sum + item.ownerShare, 0);
  const totalPengeluaran = expenseData.reduce((sum, item) => sum + item.amount, 0);
  const labaBersih = totalHakOwner - totalPengeluaran;

  // ---[IMPLEMENTASI BARU] Fungsi untuk mengunduh laporan detail per tenant ---
  const downloadReport = async (tenant) => {
    if (typeof window.XLSX === 'undefined') {
        message.error("Pustaka export (XLSX) belum siap. Mohon coba lagi sesaat.");
        return;
    }
    const loadingMessage = message.loading(`Mengambil data detail untuk ${tenant.tenant}...`, 0);

    try {
        const startDate = dateRange[0].format('YYYY-MM-DD');
        const endDate = dateRange[1].format('YYYY-MM-DD');
        
        // 1. Panggil API baru untuk mendapatkan data rinci
        const detailData = await getBagiHasilReportDetail(tenant.id, startDate, endDate);

        if (detailData.length === 0) {
            message.info(`Tidak ada data transaksi untuk ${tenant.tenant} pada periode ini.`);
            return;
        }

        // 2. Olah data untuk dikelompokkan per tanggal
        const groupedByDate = detailData.reduce((acc, item) => {
            const date = dayjs(item.tanggal).format('YYYY-MM-DD');
            if (!acc[date]) {
                acc[date] = [];
            }
            acc[date].push(item);
            return acc;
        }, {});

        // 3. Siapkan data untuk di-render ke Excel
        const dataForSheet = [];
        const grandTotal = tenant.total;
        const tenantShare = tenant.tenantShare;

        // Header Summary
        dataForSheet.push([`SUMMARY TRANSAKSI PENJUALAN ${tenant.tenant.toUpperCase()}`]);
        dataForSheet.push([`PERIODE ${dayjs(startDate).format('D')} - ${dayjs(endDate).format('D MMMM YYYY')}`]);
        dataForSheet.push([]);
        dataForSheet.push(['Grand Total Penjualan', grandTotal]);
        dataForSheet.push(['Shared 70%', tenantShare]);
        // Anda bisa menambahkan 'Kekurangan' atau 'Total Transfer' jika ada logikanya
        dataForSheet.push([]);
        
        // Detail Transaksi Header
        dataForSheet.push(['Tanggal', 'Product', 'Jumlah Qty', 'Total Penjualan (Nett)']);
        
        // Detail Transaksi Body (dengan pengelompokan tanggal)
        Object.keys(groupedByDate).sort().forEach(date => {
            const items = groupedByDate[date];
            items.forEach((item, index) => {
                dataForSheet.push([
                    index === 0 ? dayjs(date).format('YYYY-MM-DD') : '', // Tampilkan tanggal hanya di baris pertama
                    item.nama_produk,
                    item.jumlah,
                    item.total_harga
                ]);
            });
        });
        
        // 4. Buat dan Unduh file Excel
        const ws = window.XLSX.utils.aoa_to_sheet(dataForSheet, {
            cellStyles: true
        });
        ws['!cols'] = [{ wch: 25 }, { wch: 30 }, { wch: 15 }, { wch: 25 }];
        const wb = window.XLSX.utils.book_new();
        window.XLSX.utils.book_append_sheet(wb, ws, tenant.tenant);
        
        const filename = `${tenant.tenant} Report (${dayjs(startDate).format('DD-MM-YY')} to ${dayjs(endDate).format('DD-MM-YY')}).xlsx`;
        window.XLSX.writeFile(wb, filename);

        message.success(`Laporan untuk ${tenant.tenant} berhasil diekspor!`);

    } catch (error) {
        console.error("Error downloading tenant report:", error);
        message.error(`Gagal mengunduh laporan untuk ${tenant.tenant}.`);
    } finally {
        loadingMessage();
    }
  };

  const exportAll = () => {
    if (typeof window.XLSX === 'undefined') {
      message.error("Pustaka export (XLSX) belum siap. Mohon coba lagi sesaat.");
      return;
    }
    
    if (loading || laporanData.length === 0) {
      message.info("Data sedang dimuat atau tidak tersedia untuk diekspor.");
      return;
    }

    const startDate = dateRange[0].format('DD MMMM YYYY');
    const endDate = dateRange[1].format('DD MMMM YYYY');
    const filename = `Laporan Keuangan Dago (${startDate} - ${endDate}).xlsx`;

    const dataForSheet = [];

    dataForSheet.push(['Laporan Keuangan Dago Creative Hub']);
    dataForSheet.push([`Periode: ${startDate} s/d ${endDate}`]);
    dataForSheet.push([]); 

    dataForSheet.push(['RINGKASAN UTAMA']);
    dataForSheet.push(['Total Pendapatan Kotor', totalPenjualanKotor]);
    dataForSheet.push(['Total Pengeluaran', totalPengeluaran]);
    dataForSheet.push(['LABA BERSIH (PROFIT)', labaBersih]);
    dataForSheet.push([]); 

    dataForSheet.push(['RINCIAN PENDAPATAN']);
    const pendapatanHeaders = ['Nama Tenant', 'Total Pendapatan', 'Hak Tenant (70%)', 'Hak Owner (30% atau 100%)'];
    dataForSheet.push(pendapatanHeaders);
    laporanData.forEach(item => {
      dataForSheet.push([item.tenant, item.total, item.tenantShare, item.ownerShare]);
    });
    dataForSheet.push(['TOTAL', totalPenjualanKotor, totalHakTenant, totalHakOwner]);
    dataForSheet.push([]); 

    dataForSheet.push(['RINCIAN PENGELUARAN']);
    const pengeluaranHeaders = ['Kategori Pengeluaran', 'Jumlah'];
    dataForSheet.push(pengeluaranHeaders);
    expenseData.forEach(item => {
        dataForSheet.push([item.name.replace("📊 ", ""), item.amount]);
    });
    dataForSheet.push(['TOTAL PENGELUARAN', totalPengeluaran]);

    const ws = window.XLSX.utils.aoa_to_sheet(dataForSheet);

    ws['!cols'] = [ { wch: 40 }, { wch: 20 }, { wch: 20 }, { wch: 25 }, ];

    const wb = window.XLSX.utils.book_new();
    window.XLSX.utils.book_append_sheet(wb, ws, 'Laporan Keuangan');
    window.XLSX.writeFile(wb, filename);

    message.success("Laporan berhasil diekspor!");
  };

  const columns = [
    { title: "Nama Tenant", dataIndex: "tenant", key: "tenant", render: (text, record) => (<span className={record.isInternal ? "font-semibold text-purple-600" : "font-medium"}>{text}</span>), },
    { title: "Total Pendapatan", dataIndex: "total", key: "total", render: (amount) => <span className="font-semibold text-gray-800">{formatRupiah(amount)}</span>, align: "right", },
    { title: "Hak Tenant (70%)", dataIndex: "tenantShare", key: "tenantShare", render: (amount) => <span className="font-semibold text-green-600">{formatRupiah(amount)}</span>, align: "right", },
    { title: "Hak Owner", dataIndex: "ownerShare", key: "ownerShare", render: (amount) => <span className="font-semibold text-purple-600">{formatRupiah(amount)}</span>, align: "right", },
    { title: "Aksi", key: "aksi", width: 120, fixed: "right", render: (_, record) => ( !record.isInternal && (<Button type="primary" icon={<DownloadOutlined />} onClick={() => downloadReport(record)} size="small">Unduh Rincian</Button>) ), align: "center", },
  ];

  return (
    <ConfigProvider locale={locale}>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="p-4 sm:p-6 lg:p-8">
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border-t-4 border-blue-500">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-1">
                  Laporan Bagi Hasil & Profit Dashboard
                </h1>
                <p className="text-gray-600 font-medium">Dago Creative Hub & Coffee Lab</p>
                <div className="mt-2 inline-flex items-center px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">
                  <CrownOutlined className="mr-2" />
                  Welcome, Owner
                </div>
              </div>
              <div className="flex flex-col items-start sm:items-end gap-2">
                <label className="text-sm font-medium text-gray-600">Pilih Periode:</label>
                <RangePicker value={dateRange} onChange={setDateRange} format="DD MMMM YYYY" className="shadow-sm" size="large" allowClear={false} />
              </div>
            </div>
          </div>

          <Row gutter={[16, 16]} className="mb-6">
            <Col xs={24} sm={12} lg={8}>
                <Card className="shadow-lg hover:shadow-xl transition-all duration-300 border-l-4 border-blue-500 rounded-xl">
                    <Statistic title={<span className="text-gray-600 font-semibold">Total Penjualan Kotor</span>} value={totalPenjualanKotor} formatter={(value) => formatRupiah(value)} prefix={<div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-2"><LineChartOutlined className="text-2xl text-blue-600" /></div>} valueStyle={{ color: "#1677ff", fontWeight: "bold", fontSize: "1.75rem" }} loading={loading} />
                    <div className="mt-2 text-xs text-gray-500">Total pendapatan semua tenant & internal</div>
                </Card>
            </Col>
            <Col xs={24} sm={12} lg={8}>
                <Card className="shadow-lg hover:shadow-xl transition-all duration-300 border-l-4 border-green-500 rounded-xl">
                    <Statistic title={<span className="text-gray-600 font-semibold">Total Hak Tenant</span>} value={totalHakTenant} formatter={(value) => formatRupiah(value)} prefix={<div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-2"><WalletOutlined className="text-2xl text-green-600" /></div>} valueStyle={{ color: "#52c41a", fontWeight: "bold", fontSize: "1.75rem" }} loading={loading} />
                    <div className="mt-2 text-xs text-gray-500">Total bagian yang dibayarkan ke tenant</div>
                </Card>
            </Col>
            <Col xs={24} sm={12} lg={8}>
                <Card className="shadow-lg hover:shadow-xl transition-all duration-300 border-l-4 border-purple-500 rounded-xl">
                    <Statistic title={<span className="text-gray-600 font-semibold">Total Hak Owner (Pendapatan)</span>} value={totalHakOwner} formatter={(value) => formatRupiah(value)} prefix={<div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-2"><AccountBookOutlined className="text-2xl text-purple-600" /></div>} valueStyle={{ color: "#722ed1", fontWeight: "bold", fontSize: "1.75rem" }} loading={loading} />
                    <div className="mt-2 text-xs text-gray-500">Pendapatan kotor sebelum pengeluaran</div>
                </Card>
            </Col>
          </Row>

          <Card className="shadow-lg rounded-xl mb-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 p-2">
                <h2 className="text-xl font-bold text-gray-800">Rincian Pendapatan per Tenant</h2>
                <Button icon={<DownloadOutlined />} onClick={exportAll}>Export Semua (Ringkasan)</Button>
            </div>
            <Table loading={loading} columns={columns} dataSource={laporanData} rowKey="id" pagination={false} scroll={{ x: 800 }} className="custom-owner-table" summary={() => (
                <Table.Summary>
                    <Table.Summary.Row className="bg-gradient-to-r from-blue-50 to-purple-50 font-bold">
                        <Table.Summary.Cell index={0} className="font-bold text-gray-800">TOTAL</Table.Summary.Cell>
                        <Table.Summary.Cell index={1} align="right"><span className="font-bold text-blue-600 text-base">{formatRupiah(totalPenjualanKotor)}</span></Table.Summary.Cell>
                        <Table.Summary.Cell index={2} align="right"><span className="font-bold text-green-600 text-base">{formatRupiah(totalHakTenant)}</span></Table.Summary.Cell>
                        <Table.Summary.Cell index={3} align="right"><span className="font-bold text-purple-600 text-base">{formatRupiah(totalHakOwner)}</span></Table.Summary.Cell>
                        <Table.Summary.Cell index={4} />
                    </Table.Summary.Row>
                </Table.Summary>
                )}
            />
          </Card>

          <Row gutter={[24, 24]}>
            <Col xs={24} lg={12}>
                <Card className="shadow-lg rounded-xl h-full" loading={loading}>
                    <h2 className="text-xl font-bold text-gray-800 mb-4">Pengeluaran Operasional</h2>
                        <div className="space-y-3">
                            {expenseData.length > 0 ? expenseData.map((expense, index) => (
                                <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                    <span className="text-sm text-gray-600 flex items-center gap-3">
                                        {getExpenseIcon(expense.key)}
                                        <span>{expense.name.replace("📊 ", "")}</span>
                                    </span>
                                    <span className="text-base font-semibold text-gray-800">
                                        {formatRupiah(expense.amount)}
                                    </span>
                                </div>
                            )) : <div className="text-center text-gray-500 p-4">Tidak ada data pengeluaran.</div>}
                            <Divider />
                            <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                                <span className="text-base font-bold text-red-600">TOTAL PENGELUARAN</span>
                                <span className="text-lg font-bold text-red-600">
                                    {formatRupiah(totalPengeluaran)}
                                </span>
                            </div>
                        </div>
                </Card>
            </Col>

            <Col xs={24} lg={12}>
              <Card className="shadow-lg rounded-xl mt-6 lg:mt-0 border-t-4 border-green-500 h-full" loading={loading}>
                <h2 className="text-xl font-bold text-gray-800 mb-4">Ringkasan Profitabilitas (Laba Bersih)</h2>
                <div className="space-y-4">
                  <Row justify="space-between" align="middle">
                    <Col><span className="text-gray-600 font-medium">Total Hak Owner</span></Col>
                    <Col><span className="font-semibold text-purple-600 text-lg">{formatRupiah(totalHakOwner)}</span></Col>
                  </Row>
                  <Row justify="space-between" align="middle">
                    <Col><span className="text-gray-600 font-medium">Total Pengeluaran Bulanan</span></Col>
                    <Col><span className="font-semibold text-red-500 text-lg">({formatRupiah(totalPengeluaran)})</span></Col>
                  </Row>
                  <Divider className="my-2" />
                  <div className="text-center mt-4">
                    <Statistic title={<span className="text-lg font-bold text-gray-700">LABA BERSIH</span>} value={labaBersih} formatter={(value) => formatRupiah(value)} valueStyle={{ color: labaBersih >= 0 ? '#3f8600' : '#cf1322', fontWeight: 'bold', fontSize: '2rem', }} prefix={labaBersih >= 0 ? <CheckCircleOutlined /> : <CloseCircleOutlined />} />
                  </div>
                </div>
              </Card>
            </Col>
          </Row>

        </div>
      </div>
      <style>{`
        .custom-owner-table .ant-table-thead > tr > th { background-color: #f0f5ff; color: #1677ff; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
        .ant-statistic-title { font-size: 1rem !important; margin-bottom: 8px !important; }
        .ant-statistic-content { font-size: 2rem !important; }
        .ant-card:hover { transform: translateY(-4px); box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05); }
      `}</style>
    </ConfigProvider>
  );
};

export default BagiHasil;
