import React, { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../../providers/AuthProvider";
import {
  Card,
  Button,
  Row,
  Col,
  Typography,
  Spin,
  Alert,
  Tag,
  Table,
} from "antd";
import { CheckOutlined, CloseOutlined, StarFilled } from "@ant-design/icons";
import { getPaketVO } from "../../../services/service";

const { Title, Text } = Typography;

const VirtualOffice = () => {
  const navigate = useNavigate();
  const { userProfile } = useContext(AuthContext);

  const [loading, setLoading] = useState(true);
  const [paketVO, setPaketVO] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (userProfile?.roles === "admin") {
      navigate("/dashboardadmin");
    } else if (userProfile?.roles === "kasir") {
      navigate("/mengelola-orderan_fb");
    }
  }, [userProfile, navigate]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const result = await getPaketVO();
        if (result.message === "OK") {
          setPaketVO(result.datas);
        } else {
          setError("Gagal memuat paket");
        }
      } catch (err) {
        setError(err.message || "Terjadi kesalahan server");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <Spin
        size="large"
        tip="Memuat paket virtual office..."
        style={{ display: "block", marginTop: "100px", textAlign: "center" }}
      />
    );
  }

  if (error) {
    return (
      <Alert
        type="error"
        message="Error"
        description={error}
        style={{ marginTop: "50px" }}
      />
    );
  }

  return (
    <div style={{ padding: "40px 24px", maxWidth: "1200px", margin: "0 auto" }}>
      <Title level={2} style={{ textAlign: "center", marginBottom: "16px" }}>
        Pilih Paket Virtual Office
      </Title>
      <Text
        type="secondary"
        style={{ display: "block", textAlign: "center", marginBottom: "40px" }}
      >
        Temukan paket membership yang sesuai dengan kebutuhan dan anggaran Anda.
        Nikmati layanan premium dengan berbagai keuntungan yang bisa mendukung
        aktivitas bisnis Anda.
      </Text>


      <Row gutter={[32, 32]} justify="center">
        {paketVO.map((paket, index) => {
          const generalBenefits = paket.deskripsi_layanan
            ? paket.deskripsi_layanan.split(/\r?\n/) // Pisahkan string berdasarkan baris baru
              .map(line => line.trim()) // Hapus spasi ekstra
              .filter(line => line) // Hapus baris kosong
              .map(benefitText => ({
                key: benefitText.toLowerCase().replace(/\s/g, '-'), // Buat key unik
                benefit: benefitText,
                value: <CheckOutlined style={{ color: "green" }} />,
              }))
            : [];


          // bikin data tabel untuk setiap paket
          // 2. Susun semua data untuk tabel secara dinamis
          const tableData = [
            {
              key: "harga",
              benefit: "Harga",
              value: `Rp${paket.harga.toLocaleString("id-ID")}`,
            },
            {
              key: "durasi",
              benefit: "Durasi layanan",
              value: `${paket.durasi} hari`,
            },
            {
              key: "meeting",
              benefit: "Free Meeting Room",
              value: paket.benefit_jam_meeting_room_per_bulan
                ? `${paket.benefit_jam_meeting_room_per_bulan} jam/bulan`
                : <CloseOutlined style={{ color: "red" }} />,
            },
            {
              key: "working",
              benefit: "Free Working Space",
              value: paket.benefit_jam_working_space_per_bulan
                ? `${paket.benefit_jam_working_space_per_bulan} jam/bulan`
                : <CloseOutlined style={{ color: "red" }} />,
            },
            // Gabungkan dengan benefit umum yang sudah diproses
            ...generalBenefits,
          ];

          const columns = [
            {
              title: "Benefit",
              dataIndex: "benefit",
              key: "benefit",
              width: "60%",
            },
            {
              title: paket.nama_paket,
              dataIndex: "value",
              key: "value",
              align: "center",
            },
          ];

          return (
            <Col xs={24} md={12} key={paket.id_paket_vo}>
              <Card
                hoverable
                style={{
                  borderRadius: "16px",
                  overflow: "hidden",
                  height: "100%",
                  boxShadow: "0 6px 16px rgba(0, 0, 0, 0.12)",
                }}
                bodyStyle={{ padding: "28px" }}
              >
                {/* Judul + Harga */}
                <div style={{ textAlign: "center", marginBottom: "20px" }}>
                  <Title level={3} style={{ marginBottom: "8px" }}>
                    {paket.nama_paket}
                  </Title>
                  <Tag
                    color="blue"
                    style={{
                      fontSize: "16px",
                      padding: "6px 14px",
                      borderRadius: "24px",
                    }}
                  >
                    Mulai dari Rp {paket.harga.toLocaleString("id-ID")}
                  </Tag>
                </div>

                {/* Tabel Benefit */}
                <Table
                  columns={columns}
                  dataSource={tableData}
                  pagination={false}
                  size="middle"
                  bordered
                  style={{ marginTop: "20px" }}
                />

                {/* Tombol */}
                <div style={{ marginTop: "28px", textAlign: "center" }}>
                  <Button
                    type="primary"
                    size="large"
                    onClick={() =>
                      navigate(`/daftar-vo/${paket.id_paket_vo}`, {
                        state: { paketName: paket.nama_paket },
                      })
                    }
                    style={{
                      borderRadius: "40px",
                      width: "80%",
                      background: "linear-gradient(to right, #40a9ff, #69c0ff)",
                      border: "none",
                      fontWeight: "600",
                      padding: "10px 0",
                    }}
                  >
                    Pilih Paket
                  </Button>
                </div>
              </Card>
            </Col>
          );
        })}
      </Row>
    </div>
  );
};

export default VirtualOffice;