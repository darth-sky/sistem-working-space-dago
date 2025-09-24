import React, { useContext, useEffect, useState } from "react";
import { SearchOutlined } from "@ant-design/icons";
import { Card, Button, Input, Row, Col, Typography, Space, Divider, Spin } from "antd";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../../providers/AuthProvider";
import { formatRupiah } from "../../../utils/formatRupiah";
import FeatureList from "../../../components/FeatureList";
import { getEventSpaces } from "../../../services/service";

const { Title, Text } = Typography;
const { Search } = Input;

const EventSpacesPelanggan = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [eventSpaces, setEventSpaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { userProfile } = useContext(AuthContext);

  useEffect(() => {
    if (userProfile?.roles === "admin") {
      navigate("/dashboardadmin");
    } else if (userProfile?.roles === "kasir") {
      navigate("/mengelola-orderan_fb");
    }
  }, [userProfile, navigate]);

  // Ambil data dari backend
  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getEventSpaces();
        setEventSpaces(data);
      } catch (err) {
        console.error("Error ambil event spaces:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return <Spin size="large" style={{ display: "block", margin: "100px auto" }} />;
  }

  return (
    <div style={{ padding: "24px", maxWidth: "1200px", margin: "0 auto" }}>
      {/* Hero */}
      <div style={{
        marginBottom: "32px",
        background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
        padding: "32px",
        borderRadius: "16px",
        textAlign: "center"
      }}>
        <Title level={1} style={{ margin: 0, color: "#2c3e50" }}>
          🎯 Event Spaces
        </Title>
        <Text style={{ fontSize: "16px", color: "#5a6c7d", display: "block", marginTop: "8px" }}>
          Temukan ruang acara terbaik untuk setiap momen spesialmu di Dago Creative Hub
        </Text>
      </div>

      {/* Search */}
      <div style={{ marginBottom: "32px" }}>
        <Search
          placeholder="🔍 Cari Event Space yang sempurna..."
          allowClear
          size="large"
          prefix={<SearchOutlined style={{ color: "#1890ff" }} />}
          onSearch={(value) => setSearchTerm(value)}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ width: "100%", borderRadius: "8px" }}
        />
      </div>

      {/* List */}
      <Row gutter={[24, 24]} style={{ marginTop: "16px" }}>
        {eventSpaces
          .filter((space) =>
            // Menggunakan kolom yang benar: nama_event_space
            space.nama_event_space.toLowerCase().includes(searchTerm.toLowerCase())
          )
          .map((space) => (
            // Menggunakan kolom yang benar: id_event_space
            <Col xs={24} sm={12} lg={8} key={space.id_event_space}>
              <Card
                hoverable
                style={{ borderRadius: "16px", overflow: "hidden", border: "none" }}
                cover={
                  <img
                    // Menggunakan kolom yang benar: nama_event_space
                    alt={space.nama_event_space}
                    src={`http://localhost:5000/static/${space.gambar_ruangan}`}
                    style={{ height: 220, objectFit: "cover", width: "100%" }}
                  />
                }
                actions={[
                  <Button
                    type="primary"
                    size="large"
                    // 👇 UBAH DI SINI: Gunakan URL dinamis dengan ID
                    onClick={() => navigate(`/detail-event-spaces/${space.id_event_space}`, { state: space })}
                  >
                    🚀 Pilih Ruangan
                  </Button>,
                ]}
              >
                <Card.Meta
                  // Menggunakan kolom yang benar: nama_event_space
                  title={<Text strong style={{ fontSize: "18px" }}>{space.nama_event_space}</Text>}
                  description={
                    <Space direction="vertical" style={{ width: "100%" }} size="small">
                      <div>
                        <Text strong style={{ fontSize: "20px", color: "#1890ff" }}>
                          {/* Menggunakan kolom yang benar: harga_paket */}
                          {formatRupiah(space.harga_paket)}
                        </Text>
                        {/* Mengubah teks dari "/ jam" menjadi "/ paket" */}
                        <Text type="secondary"> / paket</Text>
                      </div>
                      {/* Menggunakan kolom yang benar: deskripsi_event_space */}
                      <Text>{space.deskripsi_event_space}</Text>
                      <Divider style={{ margin: "12px 0" }} />
                      <FeatureList featureString={space.fitur_ruangan} />
                    </Space>
                  }
                />
              </Card>
            </Col>
          ))}
      </Row>
    </div>
  );
};

export default EventSpacesPelanggan;