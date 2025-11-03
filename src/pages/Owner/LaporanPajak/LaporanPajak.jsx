import React, { useState, useEffect, useCallback } from "react";
import {
  ConfigProvider,
  Card,
  Row,
  Col,
  Statistic,
  DatePicker,
  Button,
  Divider,
  message,
  Modal,
  Form,
  InputNumber,
  Spin, // Import Spin
} from "antd";
import {
  LineChartOutlined,
  PercentageOutlined,
  DownloadOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  CalculatorOutlined,
  WalletOutlined,
  BankOutlined,
  FileTextOutlined,
  ScheduleOutlined,
} from "@ant-design/icons";
import locale from "antd/locale/id_ID";
import dayjs from "dayjs";
import "dayjs/locale/id";

// Import service API
import { apiGetLaporanPajakData, apiSaveTaxPayment } from "../../../services/service"; // Sesuaikan path

const { RangePicker } = DatePicker;

// Fungsi formatRupiah (pastikan ini ada dan benar di utils Anda)
const formatRupiah = (amount) => {
    // Tambahkan pengecekan tipe data untuk keamanan tambahan
    const numberAmount = Number(amount);
    if (isNaN(numberAmount)) {
        console.error("formatRupiah received invalid value:", amount);
        return "Rp 0"; // Fallback value
    }
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
    }).format(numberAmount);
};


const LaporanPajak = () => {
  const [dateRange, setDateRange] = useState([
    dayjs().startOf("month"),
    dayjs().endOf("month"),
  ]);

  // State untuk data dari API
  const [pendapatanFnb, setPendapatanFnb] = useState(0); // Pendapatan F&B untuk pajak
  // const [pendapatanKotorTotal, setPendapatanKotorTotal] = useState(0); // Opsional: jika butuh total semua
  const [expenses, setExpenses] = useState([]);
  const [taxPayment, setTaxPayment] = useState({ paidAmount: 0, paymentDate: null });

  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();

  // useEffect untuk script XLSX (tetap sama)
  useEffect(() => {
    const scriptId = "xlsx-script";
    if (document.getElementById(scriptId)) return;

    const script = document.createElement("script");
    script.id = scriptId;
    script.src =
      "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js";
    script.async = true;
    document.body.appendChild(script);

    return () => {
      const existingScript = document.getElementById(scriptId);
      if (existingScript) document.body.removeChild(existingScript);
    };
  }, []);

  // Fungsi Pengambilan Data Utama (dari API)
  const fetchData = useCallback(async () => {
    if (!dateRange || dateRange.length < 2) return;

    setLoading(true);
    message.loading({ content: 'Memuat data laporan...', key: 'fetchData', duration: 0 }); // duration 0 agar tidak hilang otomatis

    try {
      const startDate = dateRange[0].format("YYYY-MM-DD");
      const endDate = dateRange[1].format("YYYY-MM-DD");

      const response = await apiGetLaporanPajakData(startDate, endDate);

      // Update state dengan data dari API
      setPendapatanFnb(response.total_pendapatan_fnb || 0);
      // Jika backend mengirim total pendapatan semua:
      // setPendapatanKotorTotal(response.total_pendapatan_kotor_all || 0);
      setExpenses(response.pengeluaran_list || []);

      const apiTaxPayment = response.tax_payment_status || {}; // Default object kosong
      const fetchedPaymentDate = apiTaxPayment.paymentDate ? dayjs(apiTaxPayment.paymentDate) : null;
      setTaxPayment({
        paidAmount: apiTaxPayment.paidAmount || 0,
        paymentDate: fetchedPaymentDate,
      });

      form.setFieldsValue({
        paidAmount: apiTaxPayment.paidAmount || 0,
        paymentDate: fetchedPaymentDate || dayjs(),
      });

      message.success({ content: 'Data laporan berhasil dimuat!', key: 'fetchData', duration: 2 });

    } catch (error) {
      console.error("Gagal fetch data laporan:", error);
      message.error({ content: `Gagal memuat data: ${error.message}`, key: 'fetchData', duration: 4 });
      setPendapatanFnb(0);
      // setPendapatanKotorTotal(0);
      setExpenses([]);
      setTaxPayment({ paidAmount: 0, paymentDate: null });
      form.resetFields();
    } finally {
      setLoading(false);
    }
  }, [dateRange, form]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);


  // Hitungan utama Laba/Rugi & Pajak
  const totalPengeluaran = expenses.reduce((s, i) => s + (i.jumlah || 0), 0);
  const revenueUntukPajak = pendapatanFnb; // Gunakan F&B untuk pajak
  const persentasePajak = 0.10;
  const pajakFinal10Persen = revenueUntukPajak * persentasePajak;

  // Asumsi Laba/Rugi juga dihitung HANYA dari F&B
  // Jika ingin dari total omzet, ganti revenueUntukPajak dengan pendapatanKotorTotal (jika ada)
  const labaKotorSetelahPajak = revenueUntukPajak - pajakFinal10Persen;
  const labaOperasionalBersih = labaKotorSetelahPajak - totalPengeluaran;
  const labaBersihAkhir = labaOperasionalBersih;
  const persentaseMarginBersih = revenueUntukPajak === 0 ? 0 : (labaBersihAkhir / revenueUntukPajak) * 100;

  // Status Pembayaran Pajak
  const isTaxPaid = taxPayment.paidAmount >= pajakFinal10Persen && pajakFinal10Persen > 0;
  const taxDeficit = Math.max(0, pajakFinal10Persen - taxPayment.paidAmount);

  // Fungsi Export Excel
  const exportExcel = () => {
    if (typeof window.XLSX === "undefined") {
      message.error("Pustaka XLSX belum siap. Tunggu sebentar.");
      return;
    }

    const startDate = dateRange[0].format("DD MMM YYYY");
    const endDate = dateRange[1].format("DD MMM YYYY");

    // Sesuaikan judul/label di Excel jika perhitungan hanya F&B
    const wsData = [
      ["LAPORAN LABA/RUGI (F&B) & PAJAK"],
      [`Periode: ${startDate} - ${endDate}`],
      [],
      ["METRIK", "JUMLAH"],
      ["Pendapatan Kotor (F&B)", revenueUntukPajak],
      ["(-) Pajak Final 10% (Omzet F&B)", pajakFinal10Persen],
      ["Laba Kotor F&B Setelah Pajak", labaKotorSetelahPajak],
      ["(-) Total Pengeluaran Operasional", totalPengeluaran],
      ["LABA BERSIH AKHIR (F&B vs Ops)", labaBersihAkhir], // Nama bisa disesuaikan
      ["Margin Laba Bersih (%)", persentaseMarginBersih.toFixed(2)],
      [],
      ["STATUS PAJAK (F&B)"],
      ["Pajak Yang Harus Dibayar", pajakFinal10Persen],
      ["Jumlah Sudah Dibayar", taxPayment.paidAmount],
      ["Tanggal Pembayaran", taxPayment.paymentDate ? taxPayment.paymentDate.format("DD-MM-YYYY") : "Belum Dibayar"],
      ["Status", isTaxPaid ? "LUNAS" : "BELUM LUNAS"],
    ];

    const ws = window.XLSX.utils.aoa_to_sheet(wsData);
    ws["!cols"] = [{ wch: 40 }, { wch: 25 }];
    const wb = window.XLSX.utils.book_new();
    window.XLSX.utils.book_append_sheet(wb, ws, "Laba_Rugi_Pajak_FnB");
    window.XLSX.writeFile(
      wb,
      `Laporan Laba Rugi FnB DCH (${startDate} - ${endDate}).xlsx`
    );
  };

  // Fungsi Submit Form Pembayaran Pajak (panggil API)
  const handleTaxPaymentSubmit = async (values) => {
    setLoading(true);
    message.loading({ content: 'Menyimpan data pembayaran...', key: 'saveTax', duration: 0 });

    try {
      const paymentData = {
        startDate: dateRange[0].format("YYYY-MM-DD"),
        endDate: dateRange[1].format("YYYY-MM-DD"),
        paidAmount: values.paidAmount,
        paymentDate: values.paymentDate, // objek dayjs
      };

      await apiSaveTaxPayment(paymentData);

      // Update state lokal SETELAH berhasil simpan
      setTaxPayment({
        paidAmount: values.paidAmount,
        paymentDate: values.paymentDate,
      });

      message.success({ content: 'Pembayaran pajak berhasil dicatat!', key: 'saveTax', duration: 2 });
      setIsModalOpen(false);

    } catch (error) {
      console.error("Gagal simpan pembayaran pajak:", error);
      message.error({ content: `Gagal menyimpan: ${error.message}`, key: 'saveTax', duration: 4 });
    } finally {
      setLoading(false);
    }
  };


  // Render Komponen
  return (
    <ConfigProvider locale={locale}>
      <div className="p-6 bg-gradient-to-br from-gray-50 to-blue-50 min-h-screen">
        <Card
          className="shadow-xl rounded-2xl border-t-4 border-blue-600 mb-6"
          title={
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
              <div>
                <h2 className="text-3xl font-extrabold text-gray-800">
                  Laporan Laba/Rugi & Pajak 🧾
                </h2>
                <p className="text-gray-500 mt-1">
                  Dago Creative Hub — Periode:{" "}
                  {dateRange && dateRange.length === 2 && (
                    <span className="font-semibold text-blue-600">
                      {dateRange[0].format("D MMM YYYY")} - {dateRange[1].format("D MMM YYYY")}
                    </span>
                  )}
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 mt-3 sm:mt-0">
                <RangePicker
                  value={dateRange}
                  onChange={setDateRange}
                  format="DD MMM YYYY"
                  allowClear={false}
                  size="large"
                  disabled={loading}
                />
                <Button
                  type="primary"
                  icon={<DownloadOutlined />}
                  onClick={exportExcel}
                  size="large"
                  disabled={loading || typeof window.XLSX === "undefined"}
                >
                  Export Laba Rugi
                </Button>
              </div>
            </div>
          }
        >
          {/* Spin overlay saat loading */}
          {loading && (
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.7)', zIndex: 10, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <Spin size="large" />
            </div>
          )}

          {/* Pastikan properti 'loading' pada <Statistic> diteruskan */}
          <Divider orientation="left" className="!mt-0"> Perhitungan Laba Rugi (F&B)</Divider>
          <Row gutter={[16, 16]}>
            <Col xs={24} md={12} lg={6}>
              <Card className="shadow-md border-l-4 border-blue-500 rounded-xl">
                <Statistic
                  title="1. Pendapatan Kotor (F&B)"
                  prefix={<LineChartOutlined />}
                  value={pendapatanFnb} // <-- Gunakan pendapatan F&B
                  formatter={(val) => formatRupiah(val)}
                  valueStyle={{ color: "#1677ff", fontWeight: "bold" }}
                  loading={loading}
                />
              </Card>
            </Col>
            <Col xs={24} md={12} lg={6}>
              <Card className="shadow-md border-l-4 border-orange-500 rounded-xl">
                <Statistic
                  title="2. (-) Pajak Final (10% Omzet F&B)" // <-- Sesuaikan judul
                  prefix={<PercentageOutlined />}
                  value={pajakFinal10Persen} // <-- Pajak dari F&B
                  formatter={(val) => formatRupiah(val)}
                  valueStyle={{ color: "#fa8c16", fontWeight: "bold" }}
                  loading={loading}
                />
              </Card>
            </Col>
            <Col xs={24} md={12} lg={6}>
              <Card className="shadow-md border-l-4 border-red-500 rounded-xl">
                <Statistic
                  title="3. (-) Total Pengeluaran Operasional"
                  prefix={<WalletOutlined />}
                  value={totalPengeluaran}
                  formatter={(val) => formatRupiah(val)}
                  valueStyle={{ color: "#ff4d4f", fontWeight: "bold" }}
                  loading={loading}
                />
              </Card>
            </Col>
            <Col xs={24} md={12} lg={6}>
              <Card className="shadow-2xl border-l-4 border-purple-600 rounded-xl bg-purple-50">
                <Statistic
                  title="4. LABA BERSIH AKHIR (F&B vs Ops)" // <-- Sesuaikan judul
                  prefix={<BankOutlined />}
                  value={labaBersihAkhir} // <-- Laba dari F&B - Ops
                  formatter={(val) => formatRupiah(val)}
                  valueStyle={{ color: labaBersihAkhir >= 0 ? "#3f8600" : "#cf1322", fontWeight: "bolder", fontSize: "28px" }}
                  loading={loading}
                />
              </Card>
            </Col>
          </Row>

          <Divider orientation="left">Status Pembayaran Pajak (F&B)</Divider>
          <Row gutter={[16, 16]}>
            <Col xs={24} md={12} lg={8}>
              <Card className={`shadow-md rounded-xl ${isTaxPaid ? 'border-l-4 border-green-600' : 'border-l-4 border-red-600'}`}>
                <Statistic
                  title="Status PPh Final 10% (Telah Dibayar)"
                  prefix={isTaxPaid ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
                  value={isTaxPaid ? "LUNAS" : "BELUM LUNAS"}
                  valueStyle={{ color: isTaxPaid ? "#3f8600" : "#cf1322", fontWeight: "bold" }}
                  suffix={taxPayment.paymentDate ? ` (${taxPayment.paymentDate.format("DD MMM YYYY")})` : ''}
                  loading={loading}
                />
              </Card>
            </Col>
            <Col xs={24} md={12} lg={8}>
              <Card className="shadow-md border-l-4 border-blue-400 rounded-xl">
                <Statistic
                  title="Pajak F&B yang Wajib Dibayarkan" // <-- Sesuaikan judul
                  prefix={<PercentageOutlined />}
                  value={pajakFinal10Persen} // <-- Pajak dari F&B
                  formatter={(val) => formatRupiah(val)}
                  valueStyle={{ color: "#1890ff", fontWeight: "bold" }}
                  loading={loading}
                />
              </Card>
            </Col>
            <Col xs={24} md={12} lg={8}>
              <Card className="shadow-md border-l-4 border-yellow-500 rounded-xl">
                <Statistic
                  title={taxPayment.paidAmount > 0 ? "Jumlah Sudah Dibayar" : "Kekurangan Pembayaran"}
                  prefix={<CalculatorOutlined />}
                  value={taxPayment.paidAmount > 0 ? taxPayment.paidAmount : taxDeficit}
                  formatter={(val) => formatRupiah(val)}
                  valueStyle={{ color: isTaxPaid ? "#3f8600" : "#ffc069", fontWeight: "bold" }}
                  loading={loading}
                />
                <Button
                  type="dashed"
                  icon={<ScheduleOutlined />}
                  onClick={() => {
                    form.setFieldsValue({
                      paidAmount: taxPayment.paidAmount > 0 ? taxPayment.paidAmount : pajakFinal10Persen, // Pre-fill dengan jumlah pajak jika belum bayar
                      paymentDate: taxPayment.paymentDate || dayjs(),
                    });
                    setIsModalOpen(true);
                  }}
                  className="mt-3 w-full"
                  disabled={loading}
                >
                  {taxPayment.paidAmount > 0 ? "Edit Catatan Pembayaran" : "Catat Pembayaran Pajak"}
                </Button>
              </Card>
            </Col>
          </Row>

          <Card className="mt-6 border-dashed border-gray-300 bg-gray-50">
            <p className="text-sm text-gray-600">
              <FileTextOutlined className="mr-2 text-blue-500" />
              Perhitungan mengasumsikan penggunaan **PPh Final 10%** dari Omzet Bruto **F&B**. Catat pembayaran Anda di kolom di atas untuk melacak status "LUNAS".
            </p>
          </Card>
        </Card>

        {/* Modal Pencatatan Pembayaran Pajak */}
        <Modal
          title="Catat Pembayaran PPh Final 10% (F&B)" // <-- Sesuaikan judul
          open={isModalOpen}
          onCancel={() => setIsModalOpen(false)}
          footer={null} // Footer di-handle oleh tombol di dalam Form
        >
          <p className="mb-4">
            Pajak F&B wajib yang perlu dibayarkan untuk periode ini adalah:
            <span className="font-bold text-blue-600 ml-1">{formatRupiah(pajakFinal10Persen)}</span>.
          </p>
          <Form
            form={form}
            layout="vertical"
            onFinish={handleTaxPaymentSubmit}
          >
            <Form.Item
              name="paidAmount"
              label="Jumlah Pajak yang Dibayarkan (IDR)"
              rules={[{ required: true, message: 'Masukkan jumlah pembayaran' }]}
            >
              <InputNumber
                min={0}
                style={{ width: '100%' }}
                formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                parser={(value) => value.replace(/\$\s?|(,*)/g, '')}
                size="large"
              />
            </Form.Item>
            <Form.Item
              name="paymentDate"
              label="Tanggal Pembayaran Pajak"
              rules={[{ required: true, message: 'Pilih tanggal pembayaran' }]}
            >
              <DatePicker
                style={{ width: '100%' }}
                format="DD MMMM YYYY"
                size="large"
              />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" loading={loading} block size="large">
                Simpan Catatan Pembayaran
              </Button>
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </ConfigProvider>
  );
};

export default LaporanPajak; // Pastikan nama export sesuai nama file/komponen