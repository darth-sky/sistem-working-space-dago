import React, { useState, useEffect } from "react";
import {
  SearchOutlined,
  CheckCircleFilled,
  StarFilled,
  CoffeeOutlined,
  SafetyOutlined,
  UserOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import {
  Card,
  Button,
  Input,
  Row,
  Col,
  Typography,
  Space,
  Tag,
  Spin,
  Alert,
} from "antd";
import { useNavigate } from "react-router-dom";
import { getAllMemberships } from "../../../services/service"; // service yang sudah dibuat

const { Title, Text } = Typography;
const { Search } = Input;

// Mapping kategori ruangan → ikon
const categoryIcons = {
  "Open Space": <CoffeeOutlined />,
  "Space Monitor": <SafetyOutlined />,
  "Room Meeting": <UserOutlined />,
  "Meeting Room": <ClockCircleOutlined />,
};

const Membership = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [memberships, setMemberships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Fetch data dari backend
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const result = await getAllMemberships();
        if (result.message === "OK") {
          // Grouping berdasarkan kategori
          const grouped = result.datas.reduce((acc, item) => {
            if (!acc[item.nama_kategori]) {
              acc[item.nama_kategori] = {
                title: item.nama_kategori + " Membership",
                subtitle: `Paket untuk kategori ${item.nama_kategori}`,
                icon: categoryIcons[item.nama_kategori] || <CoffeeOutlined />,
                data: [],
              };
            }
            acc[item.nama_kategori].data.push({
              id: item.id_paket_membership,
              name: item.nama_paket,
              price: `Rp ${item.harga.toLocaleString("id-ID")}`,
              period: `/ ${item.durasi} hari`,
              quota: `${item.kuota} credit`,
              popular: item.kuota >= 45, // contoh rule: paket dengan kuota >= 45 dianggap populer
              image:
                "https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=600&q=80",
              features: item.deskripsi_benefit
                ? item.deskripsi_benefit.split(";")
                : ["Akses 24/7", "WiFi", "Coffee & Tea"],
            });
            return acc;
          }, {});
          setMemberships(Object.values(grouped));
        } else {
          setError(result.error || "Gagal memuat data");
        }
      } catch (err) {
        setError(err.message || "Terjadi kesalahan");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Filter berdasarkan search
  const filteredMemberships = memberships
    .map((section) => ({
      ...section,
      data: section.data.filter((item) =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
      ),
    }))
    .filter((section) => section.data.length > 0);

  return (
    <div style={{ padding: "24px", maxWidth: "1200px", margin: "0 auto" }}>
      <div style={{ marginBottom: "24px" }}>
        <Title level={2}>Pilih Paket Membership Anda</Title>
        <Text type="secondary">
          Dapatkan akses eksklusif dan fasilitas lengkap untuk produktivitas
          maksimal di Dago.
        </Text>
      </div>

      <div style={{ marginBottom: "24px" }}>
        <Search
          placeholder="Cari paket membership..."
          allowClear
          prefix={<SearchOutlined />}
          onSearch={(value) => setSearchTerm(value)}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ width: "100%" }}
        />
      </div>

      {loading && <Spin tip="Memuat data membership..." />}
      {error && <Alert type="error" message={error} />}
      {!loading && !error && (
        <Space direction="vertical" size="large" style={{ width: "100%" }}>
          {filteredMemberships.map((section, idx) => (
            <div key={idx}>
              <div style={{ marginBottom: "24px" }}>
                <Title
                  level={5}
                  style={{ display: "flex", alignItems: "center" }}
                >
                  <span style={{ marginRight: "8px", fontSize: "24px" }}>
                    {section.icon}
                  </span>
                  {section.title}
                </Title>
                <Text type="secondary">{section.subtitle}</Text>
              </div>
              <Row gutter={[24, 24]}>
                {section.data.map((item, i) => (
                  <Col xs={24} md={8} key={i}>
                    <Card
                      hoverable
                      cover={
                        <div style={{ position: "relative" }}>
                          <img
                            alt={item.name}
                            src={item.image}
                            style={{
                              width: "100%",
                              height: 180,
                              objectFit: "cover",
                            }}
                          />
                          {item.popular && (
                            <div
                              style={{
                                position: "absolute",
                                top: 16,
                                left: 16,
                              }}
                            >
                              <Tag icon={<StarFilled />} color="gold">
                                Paling Populer
                              </Tag>
                            </div>
                          )}
                        </div>
                      }
                    >
                      <Card.Meta
                        title={
                          <div style={{ textAlign: "center" }}>{item.name}</div>
                        }
                        description={
                          <div style={{ textAlign: "center" }}>
                            <Title
                              level={3}
                              style={{ margin: "0 0 8px 0" }}
                            >
                              {item.price}
                              <Text
                                style={{ fontSize: "16px" }}
                                type="secondary"
                              >
                                {item.period}
                              </Text>
                            </Title>
                            <Tag color="green">{item.quota}</Tag>
                            <ul
                              style={{
                                padding: "0 0 0 20px",
                                margin: "16px 0 0 0",
                                textAlign: "left",
                                listStyle: "none",
                              }}
                            >
                              {item.features.map((feature, idx) => (
                                <li key={idx} style={{ marginBottom: "8px" }}>
                                  <CheckCircleFilled
                                    style={{
                                      color: "#1890ff",
                                      marginRight: "8px",
                                    }}
                                  />
                                  <Text>{feature}</Text>
                                </li>
                              ))}
                            </ul>
                          </div>
                        }
                      />
                      <div style={{ marginTop: "24px" }}>
                        <Button
                          type={item.popular ? "primary" : "default"}
                          onClick={() => navigate(`/daftar-member/${item.id}`)}
                          style={{ width: "100%" }}
                        >
                          {item.popular ? "Pilih Plan Terbaik" : "Pilih Plan"}
                        </Button>
                      </div>
                    </Card>
                  </Col>
                ))}
              </Row>
            </div>
          ))}
        </Space>
      )}
    </div>
  );
};

export default Membership;
