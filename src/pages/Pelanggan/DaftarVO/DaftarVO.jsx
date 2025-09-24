import React, { useContext, useState } from "react";
import {
  Form,
  Input,
  Button,
  Row,
  Col,
  Typography,
  Card,
  Select,
  DatePicker,
  Table,
} from "antd";
import {
  BankOutlined,
  AppstoreOutlined,
  HomeOutlined,
  MailOutlined,
  UserOutlined,
  TeamOutlined,
  EnvironmentOutlined,
  PhoneOutlined,
  QrcodeOutlined,
} from "@ant-design/icons";
import { useParams, useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import QRCode from "react-qr-code";

import { registerVirtualOffice } from "../../../services/service";

import { AuthContext } from "../../../providers/AuthProvider";
import { Upload, message } from "antd";
import { UploadOutlined } from "@ant-design/icons";



const { Title } = Typography;
const { Option } = Select;

const paketInfo = {
  "2": {
    nama: "Paket 6 Bulan",
    harga: "1.750.000",
    durasi: 6,
    benefit: [
      "Alamat bisnis untuk legalitas usaha",
      "Penerimaan surat & paket",
      "Free meeting room 4 jam/bulan",
      "Free working space 8 jam/bulan",
      "Nama/logo perusahaan tampil di website",
      "Free wifi member",
    ],
  },
  "3": {
    nama: "Paket 12 Bulan",
    harga: "2.950.000",
    durasi: 12,
    benefit: [
      "Alamat bisnis untuk legalitas usaha",
      "Penerimaan surat & paket",
      "Free meeting room 8 jam/bulan",
      "Free working space 12 jam/bulan",
      "Free wifi member",
    ],
  },
};

const DaftarVO = () => {
  const [form] = Form.useForm();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({});
  const [endDate, setEndDate] = useState(null);
  const [showQR, setShowQR] = useState(false);
  const [paymentDone, setPaymentDone] = useState(false);

  const { id } = useParams();
  const paket = paketInfo[id];
  const durasi = paket?.durasi;

  const navigate = useNavigate();
  const onFinishFirstStep = (values) => {
    setFormData({
      ...values,
      paketId: id,
      paketName: paket?.nama,
      harga: paket?.harga,
      benefit: paket?.benefit,
    });
    setStep(2);
  };

  const { userProfile } = useContext(AuthContext);  // ambil id_user kalau ada

  const onFinishSecondStep = async (values) => {
    const finalStart = values.startDate
      ? values.startDate.format("DD-MM-YYYY")
      : null;

    const finalEnd = values.startDate
      ? dayjs(values.startDate).add(durasi, "month").format("DD-MM-YYYY")
      : null;

    const payload = {
      id_user: userProfile?.id_user, // kalau ada user login
      id_paket_vo: parseInt(id), // dari params
      nama: formData.namaPelanggan,
      jabatan: formData.jabatan,
      nama_perusahaan_klien: formData.namaPerusahaan,
      bidang_perusahaan: formData.bidangUsaha,
      alamat_perusahaan: formData.alamatPerusahaan,
      email_perusahaan: formData.emailPerusahaan,
      alamat_domisili: formData.alamatDomisili,
      nomor_telepon: formData.nomorTelepon,
    };

    try {
      const res = await registerVirtualOffice(payload);

      if (res.message === "OK") {
        message.success("Pendaftaran Virtual Office berhasil!");
        setFormData((prev) => ({
          ...prev,
          ...values,
          startDate: finalStart,
          endDate: finalEnd,
          harga: paket?.harga,
          metodePembayaran: values.metodePembayaran,
          id_transaksi: res.id_transaksi,
        }));

        // Redirect ke dashboard
        navigate("/dashboard-pengguna");
      } else {
        message.error(res.message || "Gagal daftar Virtual Office");
      }
    } catch (error) {
      console.error("Error daftar VO:", error);
      message.error("Terjadi kesalahan server");
    }
  };

  const renderReceipt = () => {
    const columns = [
      { title: "Keterangan", dataIndex: "label", key: "label", width: "40%" },
      { title: "Detail", dataIndex: "value", key: "value" },
    ];

    const dataSource = [
      { key: 1, label: "Nama Perusahaan", value: formData.namaPerusahaan },
      { key: 2, label: "Bidang Usaha", value: formData.bidangUsaha },
      { key: 3, label: "Alamat Perusahaan", value: formData.alamatPerusahaan },
      { key: 4, label: "Email Perusahaan", value: formData.emailPerusahaan },
      { key: 5, label: "Nama Pemesan", value: formData.namaPelanggan },
      { key: 6, label: "Jabatan", value: formData.jabatan },
      { key: 7, label: "Alamat Domisili", value: formData.alamatDomisili },
      { key: 8, label: "Nomor Telepon", value: formData.nomorTelepon },
      { key: 9, label: "Paket", value: formData.paketName },
      { key: 10, label: "Harga", value: `Rp ${formData.harga}` },
      { key: 11, label: "Tanggal Mulai", value: formData.startDate },
      { key: 12, label: "Tanggal Selesai", value: formData.endDate },
      { key: 13, label: "Metode Pembayaran", value: formData.metodePembayaran },
    ];

    return (
      <>
        {!showQR && !paymentDone && (
          <>
            <Title
              level={4}
              style={{
                textAlign: "center",
                marginBottom: "24px",
                color: "#1e3a8a",
              }}
            >
              Detail Pesanan
            </Title>
            <Table
              dataSource={dataSource}
              columns={columns}
              pagination={false}
              bordered
              style={{ marginBottom: "24px" }}
              responsive
            />
            <Button
              type="primary"
              block
              style={{
                marginTop: "20px",
                borderRadius: "10px",
                backgroundColor: "#2563eb",
                fontWeight: "bold",
                height: "45px",
              }}
              onClick={() => setShowQR(true)}
            >
              Konfirmasi Pesanan
            </Button>
          </>
        )}

        {showQR && !paymentDone && (
          <div style={{ textAlign: "center" }}>
            <Title level={4} style={{ color: "#1e3a8a" }}>
              Silakan Scan QRIS untuk Melanjutkan Pembayaran
            </Title>
            <div
              style={{
                display: "inline-block",
                padding: "16px",
                background: "#fff",
                borderRadius: "12px",
                marginBottom: "16px",
              }}
            >
              <QRCode value={`Pembayaran VO - Rp ${formData.harga}`} size={200} />
            </div>
            <p style={{ marginBottom: "16px" }}>
              Gunakan aplikasi mobile banking / e-wallet untuk scan kode QR ini.
            </p>
            <Button
              type="primary"
              block
              style={{
                borderRadius: "10px",
                backgroundColor: "#16a34a",
                fontWeight: "bold",
                height: "45px",
              }}
              onClick={() => setPaymentDone(true)}
            >
              Scan Berhasil
            </Button>
          </div>
        )}

        {paymentDone && (
          <div style={{ textAlign: "center" }}>
            <Title level={4} style={{ color: "#1e3a8a" }}>
              Struk Pembayaran
            </Title>
            <div
              style={{
                background: "#f9fafb",
                padding: "24px",
                borderRadius: "12px",
                textAlign: "left",
                marginTop: "16px",
              }}
            >
              <p>
                <b>Nama Pemesan:</b> {formData.namaPelanggan}
              </p>
              <p>
                <b>Perusahaan:</b> {formData.namaPerusahaan}
              </p>
              <p>
                <b>Paket:</b> {formData.paketName}
              </p>
              <p>
                <b>Harga:</b> Rp {formData.harga}
              </p>
              <p>
                <b>Metode Pembayaran:</b> {formData.metodePembayaran}
              </p>
              <p>
                <b>Tanggal Pembayaran:</b> {dayjs().format("DD-MM-YYYY HH:mm")}
              </p>
              <p style={{ marginTop: "12px", color: "#16a34a", fontWeight: "bold" }}>
                ✅ Pembayaran Berhasil
              </p>
            </div>
          </div>
        )}
      </>
    );
  };

  const renderFirstStep = () => (
    <>
      <Title level={5} style={{ color: "#2563eb", marginTop: "12px" }}>
        Data Perusahaan
      </Title>

      <Row gutter={16}>
        <Col xs={24} sm={12}>
          <Form.Item
            name="namaPerusahaan"
            label="Nama Perusahaan"
            rules={[{ required: true, message: "Masukkan nama perusahaan" }]}
          >
            <Input
              prefix={<BankOutlined style={{ color: "#2563eb" }} />}
              placeholder="Nama Perusahaan"
            />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12}>
          <Form.Item
            name="bidangUsaha"
            label="Bidang Usaha"
            rules={[{ required: true, message: "Masukkan bidang usaha" }]}
          >
            <Input
              prefix={<AppstoreOutlined style={{ color: "#2563eb" }} />}
              placeholder="Bidang Usaha"
            />
          </Form.Item>
        </Col>
      </Row>

      <Form.Item
        name="alamatPerusahaan"
        label="Alamat Perusahaan"
        rules={[{ required: true, message: "Tambahkan alamat perusahaan" }]}
      >
        <Input
          prefix={<HomeOutlined style={{ color: "#2563eb" }} />}
          placeholder="Alamat Perusahaan"
        />
      </Form.Item>

      <Form.Item
        name="emailPerusahaan"
        label="Email Perusahaan"
        rules={[
          { type: "email", message: "Email tidak valid" },
          { required: true, message: "Masukkan email perusahaan" },
        ]}
      >
        <Input
          prefix={<MailOutlined style={{ color: "#2563eb" }} />}
          placeholder="Email Perusahaan"
        />
      </Form.Item>

      <Title level={5} style={{ color: "#2563eb", marginTop: "24px" }}>
        Data Pimpinan
      </Title>

      <Row gutter={16}>
        <Col xs={24} sm={12}>
          <Form.Item
            name="namaPelanggan"
            label="Nama Pimpinan"
            rules={[{ required: true, message: "Masukkan nama" }]}
          >
            <Input
              prefix={<UserOutlined style={{ color: "#2563eb" }} />}
              placeholder="Nama Pimpinan atau Pemilik Usaha"
            />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12}>
          <Form.Item
            name="jabatan"
            label="Jabatan"
            rules={[{ required: true, message: "Masukkan jabatan" }]}
          >
            <Input
              prefix={<TeamOutlined style={{ color: "#2563eb" }} />}
              placeholder="Jabatan"
            />
          </Form.Item>
        </Col>
      </Row>

      <Form.Item
        name="alamatDomisili"
        label="Alamat Domisili"
        rules={[{ required: true, message: "Tambahkan alamat domisili" }]}
      >
        <Input
          prefix={<EnvironmentOutlined style={{ color: "#2563eb" }} />}
          placeholder="Alamat Domisili"
        />
      </Form.Item>

      <Form.Item
        name="nomorTelepon"
        label="Nomor Telepon"
        rules={[
          { required: true, message: "Masukkan nomor telepon" },
          { pattern: /^[0-9]+$/, message: "Nomor telepon harus angka" },
        ]}
      >
        <Input
          prefix={<PhoneOutlined style={{ color: "#2563eb" }} />}
          placeholder="Nomor Telepon"
        />
      </Form.Item>

      <Form.Item
        name="dokumenPendukung"
        label="Upload Dokumen Pendukung"
        valuePropName="fileList"
        getValueFromEvent={(e) => (Array.isArray(e) ? e : e && e.fileList)}
        rules={[{ required: true, message: "Silakan upload dokumen pendukung" }]}
      >
        <Upload
          name="file"
          beforeUpload={() => false} // biar tidak auto upload, file ditahan di state form
          maxCount={1}
          accept=".pdf,.jpg,.png"
        >
          <Button icon={<UploadOutlined />}>Pilih File (PDF/JPG/PNG)</Button>
        </Upload>
      </Form.Item>


      <Form.Item>
        <Button
          type="primary"
          htmlType="submit"
          block
          style={{
            borderRadius: "10px",
            backgroundColor: "#2563eb",
            fontWeight: "bold",
            height: "45px",
          }}
        >
          Lanjut
        </Button>
      </Form.Item>
    </>
  );

  const renderSecondStep = () => (
    <>
      <Title level={5} style={{ color: "#2563eb", marginTop: "12px" }}>
        Pilih Jadwal
      </Title>

      <Form.Item
        name="startDate"
        label="Tanggal Mulai"
        rules={[{ required: true, message: "Pilih tanggal mulai" }]}
      >
        <DatePicker
          style={{ width: "100%" }}
          format="DD-MM-YYYY"
          disabledDate={(current) => current && current.valueOf() < Date.now()}
          onChange={(date) => {
            if (date && durasi) {
              const end = dayjs(date).add(durasi, "month");
              setEndDate(end);
            } else {
              setEndDate(null);
            }
          }}
        />
      </Form.Item>

      {endDate && endDate.isValid() && (
        <p style={{ marginTop: "8px", color: "#2563eb" }}>
          Tanggal Selesai Otomatis: <b>{endDate.format("DD-MM-YYYY")}</b>
        </p>
      )}

      <p style={{ marginTop: "8px", color: "#1e3a8a", fontWeight: "bold" }}>
        Harga Paket: Rp {paket?.harga}
      </p>

      <Title level={5} style={{ color: "#2563eb", marginTop: "24px" }}>
        Metode Pembayaran
      </Title>
      <Form.Item
        name="metodePembayaran"
        label="Pilih Metode Pembayaran"
        rules={[{ required: true, message: "Pilih metode pembayaran" }]}
      >
        <Select placeholder="Pilih metode pembayaran non-tunai">
          <Option value="QRIS">
            <QrcodeOutlined style={{ color: "#2563eb" }} /> QRIS
          </Option>
        </Select>
      </Form.Item>

      <Form.Item>
        <Button
          type="primary"
          htmlType="submit"
          block
          style={{
            borderRadius: "10px",
            backgroundColor: "#2563eb",
            fontWeight: "bold",
            height: "45px",
          }}
        >
          Pesan Sekarang
        </Button>
      </Form.Item>
      <Button
        block
        onClick={() => setStep(1)}
        style={{
          marginTop: "10px",
          borderRadius: "10px",
          borderColor: "#2563eb",
          color: "#2563eb",
          height: "45px",
        }}
      >
        Kembali
      </Button>
    </>
  );

  return (
    <Row justify="center" style={{ padding: "24px", minHeight: "100vh" }}>
      <Col xs={24} sm={22} md={20} lg={18} xl={14}>
        <Card
          style={{
            borderRadius: "16px",
            boxShadow: "0 6px 18px rgba(0,0,0,0.08)",
            padding: "32px",
            backgroundColor: "#ffffff",
          }}
        >
          <Title
            level={3}
            style={{
              textAlign: "center",
              marginBottom: "32px",
              color: "#1e3a8a",
            }}
          >
            Form Virtual Office
          </Title>

          {step === 1 && (
            <Form form={form} layout="vertical" onFinish={onFinishFirstStep}>
              {renderFirstStep()}
            </Form>
          )}
          {step === 2 && (
            <Form form={form} layout="vertical" onFinish={onFinishSecondStep}>
              {renderSecondStep()}
            </Form>
          )}
          {step === 3 && renderReceipt()}
        </Card>
      </Col>
    </Row>
  );
};

export default DaftarVO;