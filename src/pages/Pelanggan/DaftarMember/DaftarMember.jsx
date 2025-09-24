import React, { useState, useEffect, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Card,
  Typography,
  Form,
  Input,
  Button,
  Spin,
  Alert,
  Space,
  Tag,
  Divider,
  Row,
  Col,
  Steps,
  notification,
  Image,
  Checkbox
} from "antd";
import {
  CheckCircleOutlined,
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  ArrowLeftOutlined,
  StarOutlined,
  ClockCircleOutlined,
  DollarOutlined,
  GiftOutlined
} from "@ant-design/icons";
import { getMembershipDetail, getMembershipPackageDetail } from "../../../services/service";
import { registerMembership } from "../../../services/service";
import { AuthContext } from "../../../providers/AuthProvider"

const { Title, Text } = Typography;
const { Step } = Steps;



const DaftarMember = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [membership, setMembership] = useState(null);
  const [form] = Form.useForm();
  const { userProfile } = useContext(AuthContext)

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        setLoading(true);
        const result = await getMembershipPackageDetail(id);
        if (result.message === "OK" && result.datas && result.datas.length > 0) {
          setMembership(result.datas[0]); // <-- ambil element pertama
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



  const handleSubmit = async (values) => {
    setSubmitting(true);
    try {
      const payload = {
        id_user: userProfile?.id_user,  // ⬅️ ambil dari AuthContext
        nama_guest: values.nama,
        no_hp: values.phone,
        id_paket_membership: membership.id_paket_membership
      };

      const result = await registerMembership(payload);

      if (result.message === "OK") {
        notification.success({
          message: "Pendaftaran Berhasil!",
          description: `Transaksi berhasil dibuat dengan ID ${result.id_transaksi}`,
          placement: "topRight",
        });
        navigate("/riwayat-transaksi");
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

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
      <Spin size="large" tip="Memuat detail paket..." />
    </div>
  );



  return (
    <div style={{ padding: "24px", maxWidth: "1000px", margin: "0 auto" }}>



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
                      <Text style={{ display: "block" }}>{membership.deskripsi_benefit}</Text>
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
    </div>
  );
};

export default DaftarMember;