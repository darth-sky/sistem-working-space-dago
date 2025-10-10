import React, { useContext, useState, useMemo } from "react";
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
  Upload,
  message,
  Divider,
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
  UploadOutlined,
} from "@ant-design/icons";
import { useParams, useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import QRCode from "react-qr-code";

import { registerVirtualOffice } from "../../../services/service";

import { AuthContext } from "../../../providers/AuthProvider";

const { Title, Text } = Typography;
const { Option } = Select;

// --- DUMMY DATA PAKET ---
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

  const [paymentProof, setPaymentProof] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { id } = useParams();
  const paket = useMemo(() => paketInfo[id], [id]);
  const durasi = paket?.durasi;

  const navigate = useNavigate();
  const { userProfile } = useContext(AuthContext);

  // --- STEP 1 ---
  const onFinishFirstStep = (values) => {
    const fileList = values.dokumenPendukung;
    setFormData({
      ...values,
      dokumenPendukung: fileList,
      paketId: id,
      paketName: paket?.nama,
    });
    setStep(2);
  };

  // --- STEP 2 ---
  const onFinishSecondStep = (values) => {
    const finalStart = values.startDate
      ? values.startDate.format("DD-MM-YYYY")
      : null;

    const end = finalStart
      ? dayjs(finalStart, "DD-MM-YYYY")
          .add(durasi, "month")
          .subtract(1, "day")
          .format("DD-MM-YYYY")
      : null;

    setFormData((prev) => ({
      ...prev,
      ...values,
      startDate: finalStart,
      endDate: end,
    }));
    setStep(3);
  };

  // --- UPLOAD BUKTI PEMBAYARAN ---
  const handlePaymentProofChange = (info) => {
    let fileList = [...info.fileList];
    fileList = fileList.slice(-1);
    if (fileList.length > 0) {
      setPaymentProof(fileList[0].originFileObj);
    } else {
      setPaymentProof(null);
    }
    return fileList;
  };

  // --- FINAL SUBMISSION ---
  const submitFinalBooking = async () => {
    if (!paymentProof) {
      message.error("Silakan upload bukti pembayaran terlebih dahulu.");
      return;
    }

    setIsSubmitting(true);

    const dataPayload = new FormData();
    dataPayload.append("bukti_pembayaran", paymentProof);

    const docFile = formData.dokumenPendukung[0]?.originFileObj;
    if (docFile) {
      dataPayload.append("dokumenPendukung", docFile);
    } else {
      message.error("Dokumen pendukung hilang. Silakan kembali ke step 1.");
      setIsSubmitting(false);
      return;
    }

    dataPayload.append("id_user", userProfile?.id_user || "");
    dataPayload.append("id_paket_vo", id);
    dataPayload.append("nama", formData.namaPelanggan);
    dataPayload.append("jabatan", formData.jabatan);
    dataPayload.append("nama_perusahaan_klien", formData.namaPerusahaan);
    dataPayload.append("bidang_perusahaan", formData.bidangUsaha);
    dataPayload.append("alamat_perusahaan", formData.alamatPerusahaan);
    dataPayload.append("email_perusahaan", formData.emailPerusahaan);
    dataPayload.append("alamat_domisili", formData.alamatDomisili);
    dataPayload.append("nomor_telepon", formData.nomorTelepon);

    const finalStart = dayjs(formData.startDate, "DD-MM-YYYY").format(
      "YYYY-MM-DD"
    );
    dataPayload.append("tanggal_mulai", finalStart);

    try {
      const res = await registerVirtualOffice(dataPayload);

      if (res.message === "OK") {
        message.success(
          "Pendaftaran VO dan Bukti Pembayaran berhasil dikirim! Menunggu konfirmasi admin."
        );
        navigate("/riwayat-transaksi");
      } else {
        message.error(res.message || "Gagal daftar Virtual Office");
      }
    } catch (error) {
      console.error("Error daftar VO:", error);
      message.error("Terjadi kesalahan server saat submit final.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- STEP 3 (PEMBAYARAN) ---
  const renderPaymentStep = () => {
    const columns = [
      { title: "Keterangan", dataIndex: "label", key: "label", width: "40%" },
      { title: "Detail", dataIndex: "value", key: "value" },
    ];

    const dataSource = [
      { key: 1, label: "Nama Perusahaan", value: formData.namaPerusahaan },
      { key: 9, label: "Paket", value: paket?.nama },
      { key: 10, label: "Harga Paket", value: `Rp ${paket?.harga}` },
      { key: 11, label: "Tanggal Mulai", value: formData.startDate },
      { key: 12, label: "Tanggal Selesai", value: formData.endDate },
      { key: 13, label: "Metode Pembayaran", value: formData.metodePembayaran },
    ];

    return (
      <div style={{ textAlign: "center" }}>
        <Title
          level={3}
          style={{
            color: "#1e3a8a",
            marginBottom: "24px",
            fontWeight: "bold",
          }}
        >
          Ringkasan Order & Pembayaran
        </Title>

        {/* QRIS */}
        <Card style={{ marginBottom: "24px", border: "2px solid #2563eb" }}>
          <Title level={4} style={{ color: "#1e3a8a" }}>
            Scan QRIS untuk Pembayaran
          </Title>
          <div
            style={{
              display: "inline-block",
              padding: "16px",
              background: "#fff",
              borderRadius: "12px",
              boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
            }}
          >
            <QRCode value={`Pembayaran VO - Rp ${paket?.harga}`} size={200} />
          </div>
          <p style={{ marginTop: "16px", fontWeight: "bold" }}>
            Total Pembayaran:{" "}
            <Text type="success" style={{ fontSize: "1.2em" }}>
              Rp {paket?.harga}
            </Text>
          </p>
        </Card>

        {/* DETAIL ORDER */}
        <Divider orientation="left" style={{ borderColor: "#2563eb" }}>
          Detail Order
        </Divider>
        <Table
          dataSource={dataSource}
          columns={columns}
          pagination={false}
          bordered
          size="small"
          style={{ marginBottom: "24px" }}
          responsive
        />

        {/* UPLOAD BUKTI */}
        <Divider orientation="left" style={{ borderColor: "#16a34a" }}>
          Upload Bukti Pembayaran
        </Divider>
        <Form.Item
          name="buktiPembayaran"
          rules={[{ required: true, message: "Bukti pembayaran wajib diupload" }]}
          valuePropName="fileList"
          getValueFromEvent={handlePaymentProofChange}
        >
          <Upload
            name="file"
            beforeUpload={() => false}
            maxCount={1}
            accept="image/png,image/jpeg"
            listType="picture"
            style={{ width: "100%" }}
          >
            <Button
              icon={<UploadOutlined />}
              style={{
                width: "100%",
                height: 40,
                color: "#16a34a",
                borderColor: "#16a34a",
              }}
            >
              Pilih Bukti Transfer/Bayar (JPG/PNG)
            </Button>
          </Upload>
        </Form.Item>

        {/* FINAL SUBMIT */}
        <Button
          type="primary"
          block
          style={{
            marginTop: "10px",
            borderRadius: "10px",
            backgroundColor: "#2563eb",
            fontWeight: "bold",
            height: "45px",
          }}
          onClick={submitFinalBooking}
          loading={isSubmitting}
          disabled={!paymentProof || isSubmitting}
        >
          Cek Status Pembayaran
        </Button>
      </div>
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
        label="Upload Dokumen Pendukung (KTP/Akta Perusahaan)"
        valuePropName="fileList"
        getValueFromEvent={(e) => (Array.isArray(e) ? e : e && e.fileList)}
        rules={[
          { required: true, message: "Silakan upload dokumen pendukung" },
        ]}
      >
        <Upload
          name="file"
          beforeUpload={() => false}
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
          disabledDate={(current) =>
            current &&
            current.valueOf() <
              dayjs().subtract(1, "day").endOf("day").valueOf()
          }
          onChange={(date) => {
            if (date && durasi) {
              const end = dayjs(date).add(durasi, "month").subtract(1, "day");
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

      {/* Harga langsung dari paket */}
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
          {step === 3 && renderPaymentStep()}
        </Card>
      </Col>
    </Row>
  );
};

export default DaftarVO;