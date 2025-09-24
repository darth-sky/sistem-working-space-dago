import React, { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../../providers/AuthProvider";
import { Card, Button, Row, Col, Typography, Tag, Space, List, Spin, Alert } from "antd";
import { CheckCircleFilled, StarFilled } from "@ant-design/icons";
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
    return <Spin size="large" tip="Memuat paket virtual office..." style={{ display: "block", marginTop: "100px", textAlign: "center" }} />;
  }

  if (error) {
    return <Alert type="error" message="Error" description={error} style={{ marginTop: "50px" }} />;
  }

  return (
    <div style={{ padding: "24px", maxWidth: "1200px", margin: "0 auto" }}>
      <Title level={2} style={{ textAlign: "center", marginBottom: "16px" }}>
        Pilih Paket Virtual Office
      </Title>
      <Text type="secondary" style={{ display: "block", textAlign: "center", marginBottom: "40px" }}>
        Temukan paket membership yang sesuai dengan kebutuhan dan anggaran Anda.
      </Text>

      <Row gutter={[24, 24]} justify="center">
        {paketVO.map((paket, index) => (
          <Col xs={24} sm={16} md={12} lg={10} xl={8} key={paket.id_paket_vo}>
            <Card
              hoverable
              style={{
                borderRadius: "16px",
                overflow: "hidden",
                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
              }}

            >
              <Card.Meta
                title={
                  <div style={{ textAlign: "center" }}>
                    <Title level={4} style={{ marginBottom: "4px" }}>
                      {paket.nama_paket}
                    </Title>
                    <Title level={2} style={{ color: "#1890ff", margin: "0" }}>
                      Rp {paket.harga.toLocaleString("id-ID")}
                    </Title>
                  </div>
                }
                description={
                  <Space direction="vertical" style={{ width: "100%", textAlign: "center" }}>
                    <Text type="secondary" style={{ marginTop: "8px" }}>
                      {paket.deskripsi_layanan}
                    </Text>
                    <List
                      size="small"
                      dataSource={[
                        `Durasi: ${paket.durasi} hari`,
                        `${paket.benefit_jam_meeting_room_per_bulan} jam Meeting Room/bulan`,
                        `${paket.benefit_jam_working_space_per_bulan} jam Working Space/bulan`,
                      ]}
                      renderItem={(item) => (
                        <List.Item>
                          <CheckCircleFilled style={{ color: "#52c41a", marginRight: "8px" }} />
                          <Text>{item}</Text>
                        </List.Item>
                      )}
                      style={{ marginTop: "16px", border: "none" }}
                    />
                  </Space>
                }
              />
              <div style={{ marginTop: "24px", textAlign: "center" }}>
                <Button
                  type="primary"
                  size="large"
                  onClick={() =>
                    navigate(`/detail-paket/${paket.id_paket_vo}`, {
                      state: { paketName: paket.nama_paket },
                    })
                  }
                  style={{
                    borderRadius: "50px",
                    width: "100%",
                    background: "linear-gradient(to right, #40a9ff, #69c0ff)",
                    border: "none",
                    boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
                  }}
                >
                  Pilih Paket
                </Button>
              </div>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
};

export default VirtualOffice;
