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

const { RangePicker } = DatePicker;

// Fungsi untuk memformat angka menjadi Rupiah (IDR)
const formatRupiah = (amount) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);

// --- DATA DUMMY INTERNAL (Untuk simulasi frontend) ---
const DUMMY_REPORT_DATA = [
    { id: 1, id_mitra: "MTR001", total: 50000000 },
    { id: 2, id_mitra: "MTR002", total: 35000000 },
    { id: 3, id_mitra: "MTR003", total: 15000000 },
];
const DUMMY_EXPENSE_DATA = [
    { id: 101, kategori: "Gaji Karyawan", jumlah: 15000000, tanggal: dayjs().subtract(15, 'day').format('YYYY-MM-DD') },
    { id: 102, kategori: "Sewa Tempat", jumlah: 5000000, tanggal: dayjs().subtract(10, 'day').format('YYYY-MM-DD') },
    { id: 103, kategori: "ATK & Logistik", jumlah: 1500000, tanggal: dayjs().subtract(5, 'day').format('YYYY-MM-DD') },
];

const LaporanPajak = () => {
  const [dateRange, setDateRange] = useState([
    dayjs().startOf("month"),
    dayjs().endOf("month"),
  ]);
  const [laporanData, setLaporanData] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false); 
  // paidAmount: Jumlah yang sudah dibayar (simulasi), paymentDate: Tanggal pembayaran (simulasi)
  const [taxPayment, setTaxPayment] = useState({ 
      paidAmount: 9500000, // Dummy: sudah bayar sebagian
      paymentDate: dayjs().subtract(15, 'day'), 
  }); 
  const [form] = Form.useForm(); 

  // === Pengaturan untuk import pustaka XLSX (untuk export Excel) ===
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

  // === Fungsi Pengambilan Data Utama (MENGGUNAKAN DATA DUMMY) ===
  const fetchData = useCallback(async () => {
    if (!dateRange || dateRange.length < 2) return;

    setLoading(true);
    // Simulasi loading 
    await new Promise(resolve => setTimeout(resolve, 800));

    // Gunakan data statis internal
    setLaporanData(DUMMY_REPORT_DATA);
    setExpenses(DUMMY_EXPENSE_DATA);
    
    // Simulasikan fetching status pembayaran
    const dummyTaxStatus = {
        paidAmount: 9500000, 
        paymentDate: dayjs().subtract(15, 'day'),
    };

    setTaxPayment({
        paidAmount: dummyTaxStatus.paidAmount,
        paymentDate: dummyTaxStatus.paymentDate,
    });
    
    // Set initial values form
    form.setFieldsValue({
        paidAmount: dummyTaxStatus.paidAmount,
        paymentDate: dummyTaxStatus.paymentDate,
    });


    message.success(`Tampilan Data Berhasil Dimuat (Dummy Data)`);
    setLoading(false);
  }, [dateRange, form]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // === Hitungan utama Laba/Rugi ===
  const totalPendapatanKotor = laporanData.reduce((s, i) => s + (i.total || 0), 0);
  const totalPengeluaran = expenses.reduce((s, i) => s + (i.jumlah || 0), 0);
  
  const revenueBersih = totalPendapatanKotor;
  const persentasePajak = 0.10; // PPh Final 10%
  const pajakFinal10Persen = revenueBersih * persentasePajak; 
  const labaKotorSetelahPajak = revenueBersih - pajakFinal10Persen; 
  const labaOperasionalBersih = labaKotorSetelahPajak - totalPengeluaran;
  const labaBersihAkhir = labaOperasionalBersih; 
  
  const persentaseMarginBersih = totalPendapatanKotor === 0 ? 0 : (labaBersihAkhir / totalPendapatanKotor) * 100;
  
  // === Status Pembayaran Pajak ===
  const isTaxPaid = taxPayment.paidAmount >= pajakFinal10Persen && pajakFinal10Persen > 0;
  const taxDeficit = Math.max(0, pajakFinal10Persen - taxPayment.paidAmount);

  // === Fungsi Export Excel ===
  const exportExcel = () => {
    if (typeof window.XLSX === "undefined") {
        message.error("Pustaka XLSX belum siap. Tunggu sebentar.");
        return;
    }

    const startDate = dateRange[0].format("DD MMM YYYY");
    const endDate = dateRange[1].format("DD MMM YYYY");

    const wsData = [
        ["LAPORAN LABA/RUGI & PAJAK"],
        [`Periode: ${startDate} - ${endDate}`],
        [],
        ["METRIK", "JUMLAH"],
        ["Pendapatan Kotor", totalPendapatanKotor],
        ["(-) Pajak Final 10% (Omzet)", pajakFinal10Persen],
        ["Laba Kotor Setelah Pajak", labaKotorSetelahPajak],
        ["(-) Total Pengeluaran Operasional", totalPengeluaran],
        ["LABA BERSIH AKHIR", labaBersihAkhir],
        ["Margin Laba Bersih (%)", persentaseMarginBersih.toFixed(2)],
        [],
        ["STATUS PAJAK"],
        ["Pajak Yang Harus Dibayar", pajakFinal10Persen],
        ["Jumlah Sudah Dibayar", taxPayment.paidAmount],
        ["Tanggal Pembayaran", taxPayment.paymentDate ? taxPayment.paymentDate.format("DD-MM-YYYY") : "Belum Dibayar"],
        ["Status", isTaxPaid ? "LUNAS" : "BELUM LUNAS"],
    ];

    const ws = window.XLSX.utils.aoa_to_sheet(wsData);
    ws["!cols"] = [{ wch: 40 }, { wch: 25 }];
    const wb = window.XLSX.utils.book_new();
    window.XLSX.utils.book_append_sheet(wb, ws, "Laba_Rugi_Pajak");
    window.XLSX.writeFile(
        wb,
        `Laporan Laba Rugi DCH (${startDate} - ${endDate}).xlsx`
    );
  };
  
  // === FUNGSI SUBMIT FORM PEMBAYARAN PAJAK (SIMULASI) ===
  const handleTaxPaymentSubmit = async (values) => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulasi proses simpan

    // Update state lokal (SIMULASI BERHASIL)
    setTaxPayment({
         paidAmount: values.paidAmount,
         paymentDate: values.paymentDate,
    });

    message.success("Pembayaran pajak berhasil dicatat secara lokal!");
    setIsModalOpen(false);
    setLoading(false);
  };


  // === Render Komponen ===
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
                  <span className="font-semibold text-blue-600">
                    {dateRange[0].format("D MMM YYYY")} - {dateRange[1].format("D MMM YYYY")}
                  </span>
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
          {/* Bagian 1: Ringkasan Laba Rugi Baris demi Baris */}
          <Divider orientation="left" className="!mt-0">
            Perhitungan Laba Rugi
          </Divider>
          <Row gutter={[16, 16]}>
            {/* 1. Pendapatan Kotor */}
            <Col xs={24} md={12} lg={6}>
              <Card className="shadow-md border-l-4 border-blue-500 rounded-xl">
                <Statistic
                  title="1. Pendapatan Kotor (Omzet)"
                  prefix={<LineChartOutlined />}
                  value={totalPendapatanKotor}
                  formatter={(val) => formatRupiah(val)}
                  valueStyle={{ color: "#1677ff", fontWeight: "bold" }}
                  loading={loading}
                />
              </Card>
            </Col>

            {/* 2. Pajak Final 10% */}
            <Col xs={24} md={12} lg={6}>
              <Card className="shadow-md border-l-4 border-orange-500 rounded-xl">
                <Statistic
                  title="2. (-) Potongan Pajak Final (10% Omzet)"
                  prefix={<PercentageOutlined />}
                  value={pajakFinal10Persen}
                  formatter={(val) => formatRupiah(val)}
                  valueStyle={{ color: "#fa8c16", fontWeight: "bold" }}
                  loading={loading}
                />
              </Card>
            </Col>
            
            {/* 3. Total Pengeluaran */}
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

            {/* 4. Laba Bersih Akhir */}
            <Col xs={24} md={12} lg={6}>
              <Card className="shadow-2xl border-l-4 border-purple-600 rounded-xl bg-purple-50">
                <Statistic
                  title="4. LABA BERSIH AKHIR"
                  prefix={<BankOutlined />}
                  value={labaBersihAkhir}
                  formatter={(val) => formatRupiah(val)}
                  valueStyle={{
                    color: labaBersihAkhir >= 0 ? "#3f8600" : "#cf1322",
                    fontWeight: "bolder",
                    fontSize: "28px"
                  }}
                  loading={loading}
                />
              </Card>
            </Col>
          </Row>

          <Divider orientation="left">Status Pembayaran Pajak</Divider>
          
          <Row gutter={[16, 16]}>
              {/* Kolom Status Pajak */}
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
              
              {/* Kolom Jumlah Pajak yang Dibutuhkan */}
              <Col xs={24} md={12} lg={8}>
                  <Card className="shadow-md border-l-4 border-blue-400 rounded-xl">
                      <Statistic
                          title="Pajak yang Wajib Dibayarkan"
                          prefix={<PercentageOutlined />}
                          value={pajakFinal10Persen}
                          formatter={(val) => formatRupiah(val)}
                          valueStyle={{ color: "#1890ff", fontWeight: "bold" }}
                          loading={loading}
                      />
                  </Card>
              </Col>

              {/* Kolom Aksi / Defisit */}
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
                              // Isi form dengan nilai default/nilai lama sebelum modal dibuka
                              form.setFieldsValue({
                                  paidAmount: taxPayment.paidAmount > 0 ? taxPayment.paidAmount : pajakFinal10Persen,
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
                  Perhitungan mengasumsikan penggunaan **PPh Final 10%** dari Omzet Bruto. Catat pembayaran Anda di kolom di atas untuk melacak status "LUNAS".
              </p>
          </Card>
        </Card>
        
        {/* === Modal Pencatatan Pembayaran Pajak === */}
        <Modal
            title="Catat Pembayaran PPh Final 10%"
            open={isModalOpen}
            onCancel={() => setIsModalOpen(false)}
            footer={null}
        >
            <p className="mb-4">
                Pajak wajib yang perlu dibayarkan untuk periode ini adalah: 
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
                        Simpan Catatan Pembayaran (Frontend Only)
                    </Button>
                </Form.Item>
            </Form>
        </Modal>
      </div>
    </ConfigProvider>
  );
};

export default LaporanPajak;