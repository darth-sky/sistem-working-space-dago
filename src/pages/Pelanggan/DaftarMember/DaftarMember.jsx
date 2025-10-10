import React, { useState, useEffect, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Card, Typography, Form, Input, Button, Spin, Alert, Space, Tag,
  Divider, Row, Col, notification, Image, Checkbox
} from "antd";
import {
  UserOutlined, MailOutlined, PhoneOutlined, ArrowLeftOutlined, StarOutlined,
  ClockCircleOutlined, DollarOutlined, GiftOutlined
} from "@ant-design/icons";
import { getMembershipPackageDetail, registerMembership } from "../../../services/service";
import { AuthContext } from "../../../providers/AuthProvider";
import { ArrowLeft } from "lucide-react";
// BARU: Import komponen modal
import PaymentConfirmationModal from "../../../components/PaymentConfirmationModal";

const { Title, Text } = Typography;

const DaftarMember = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [membership, setMembership] = useState(null);
  const [form] = Form.useForm();
  const { userProfile } = useContext(AuthContext);

  // BARU: State untuk modal pembayaran
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [transactionDetails, setTransactionDetails] = useState(null);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        setLoading(true);
        const result = await getMembershipPackageDetail(id);
        if (result.message === "OK" && result.datas && result.datas.length > 0) {
          setMembership(result.datas[0]);
        } else {
          setError("Paket tidak ditemukan");
        }
      } catch (err) {
        setError(err.message || "Terjadi kesalahan");
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [id]);

  // PERUBAHAN: handleSubmit sekarang menampilkan modal
  const handleSubmit = async (values) => {
    setSubmitting(true);
    try {
      const payload = {
        id_user: userProfile?.id_user,
        nama_guest: userProfile?.nama, // Menggunakan nama dari user profile
        no_hp: values.phone,
        id_paket_membership: membership.id_paket_membership
      };

      const result = await registerMembership(payload);

      if (result.message === "OK") {
        // Siapkan data untuk modal
        setTransactionDetails({
          id_transaksi: result.id_transaksi,
          nama_paket: membership.nama_paket,
          harga: membership.harga,
        });
        // Tampilkan modal
        setPaymentModalVisible(true);
      } else {
        throw new Error(result.error || "Pendaftaran gagal");
      }
    } catch (err) {
      notification.error({
        message: "Pendaftaran Gagal",
        description: err.message,
        placement: "topRight",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // BARU: Handler untuk tombol konfirmasi di modal
  const handlePaymentConfirm = () => {
    setPaymentModalVisible(false);
    notification.success({
      message: "Menunggu Verifikasi",
      description: "Pembayaran Anda akan segera diverifikasi oleh admin.",
      placement: "topRight",
    });
    navigate("/riwayat-transaksi");
  };

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
      <Spin size="large" tip="Memuat detail paket..." />
    </div>
  );

  // Bagian JSX (Form, Card, dll.) tetap sama, hanya menambahkan render Modal
  return (
    <div style={{ padding: "24px", maxWidth: "1000px", margin: "0 auto" }}>
      {/* ... (Semua JSX Anda dari Card, Form, dll. tetap di sini) ... */}
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-gray-200 transition-colors" aria-label="Kembali">
          <ArrowLeft size={20} className="text-gray-700" />
        </button>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Kembali</h1>
      </div>


      <Row gutter={[24, 24]}>
        <Col xs={24} lg={10}>
          {membership && (
            <Card
              style={{
                borderRadius: "12px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                height: "100%",
                border: "1px solid #e8f4ff"
              }}
              bodyStyle={{ padding: "24px" }}
            >
              <div style={{ textAlign: "center", marginBottom: "20px" }}>
                <div style={{
                  background: "linear-gradient(135deg, #1890ff 0%, #096dd9 100%)",
                  color: "white",
                  padding: "12px",
                  borderRadius: "8px",
                  marginBottom: "16px"
                }}>
                  <Title level={3} style={{ color: "white", margin: 0 }}>
                    {membership.nama_paket}
                  </Title>
                  <Title level={2} style={{ color: "white", margin: "8px 0" }}>
                    Rp {membership.harga.toLocaleString("id-ID")}
                  </Title>
                  <Text style={{ color: "rgba(255,255,255,0.8)" }}>/ {membership.durasi} hari</Text>
                </div>
              </div>

              <Divider style={{ margin: "16px 0" }}>Fitur Paket</Divider>

              <Space direction="vertical" size="middle" style={{ width: "100%" }}>
                <div style={{ display: "flex", alignItems: "center" }}>
                  <Tag color="blue" style={{ marginRight: "8px", padding: "4px 8px" }}>
                    <ClockCircleOutlined />
                  </Tag>
                  <Text><strong>Durasi:</strong> {membership.durasi} hari</Text>
                </div>

                <div style={{ display: "flex", alignItems: "center" }}>
                  <Tag color="green" style={{ marginRight: "8px", padding: "4px 8px" }}>
                    <DollarOutlined />
                  </Tag>
                  <Text><strong>Kuota/Credit:</strong> {membership.kuota} credit</Text>
                </div>

                {membership.deskripsi_benefit && (
                  <div style={{ display: "flex", alignItems: "flex-start" }}>
                    <Tag color="purple" style={{ marginRight: "8px", padding: "4px 8px" }}>
                      <StarOutlined />
                    </Tag>
                    <div>
                      <Text strong>Benefit:</Text>
                      <Text style={{ display: "block", whiteSpace: "pre-line" }}>
                        {membership.fitur_membership}
                      </Text>
                    </div>
                  </div>
                )}

              </Space>
            </Card>
          )}
        </Col>

        <Col xs={24} lg={14}>
          <Card
            style={{
              borderRadius: "12px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
              border: "1px solid #f0f0f0"
            }}
            bodyStyle={{ padding: "24px" }}
          >
            <Title level={4} style={{ marginBottom: "24px", color: "#262626" }}>
              Data Diri Member
            </Title>

            <Form
              form={form}
              layout="vertical"
              onFinish={handleSubmit}
              size="large"
            >

              <Form.Item
                label="Nomor HP"
                name="phone"
                rules={[
                  { required: true, message: "Nomor HP wajib diisi" },
                  { pattern: /^[0-9+\s()-]+$/, message: "Format nomor HP tidak valid" }
                ]}
              >
                <Input
                  prefix={<PhoneOutlined style={{ color: "#bfbfbf" }} />}
                  placeholder="Masukkan nomor HP"
                />
              </Form.Item>

              <Checkbox>
                Dengan mengklik "Daftar Sekarang", Anda menyetujui <a href="#">Syarat & Ketentuan</a> yang berlaku.
              </Checkbox>
              <Divider style={{ margin: "20px 0" }} />

              <Form.Item style={{ marginBottom: 0 }}>
                <Button
                  type="primary"
                  htmlType="submit"
                  block
                  size="large"
                  style={{
                    borderRadius: "8px",
                    height: "48px",
                    background: "linear-gradient(135deg, #1890ff 0%, #096dd9 100%)",
                    border: "none",
                    fontWeight: "bold",
                    fontSize: "16px"
                  }}
                  loading={submitting}
                >
                  Daftar Sekarang
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </Col>
      </Row>

      {/* BARU: Render komponen modal di sini */}
      <PaymentConfirmationModal
        open={paymentModalVisible}
        details={transactionDetails}
        onConfirm={handlePaymentConfirm}
        onCancel={() => setPaymentModalVisible(false)}
      />
    </div>
  );
};

export default DaftarMember;