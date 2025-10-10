import React, { useState, useEffect, useRef } from "react";
import {
  SearchOutlined,
  CoffeeOutlined,
  SafetyOutlined,
  UserOutlined,
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
import { getAllMemberships } from "../../../services/service";

const { Title, Text } = Typography;
const { Search } = Input;

const categoryIcons = {
  "Open Space": <CoffeeOutlined />,
  "Space Monitor": <SafetyOutlined />,
  "Room Meeting": <UserOutlined />,
};

// Horizontal Card
const HorizontalPackageCard = ({ item, navigate, categoryIcon }) => {
  const creditValue = item.quota.replace(" credit", "").replace(" credits", "").trim();
  return (
    <Card
      key={item.id}
      hoverable
      style={{
        marginBottom: 24,
        borderRadius: "12px",
        overflow: "hidden",
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
      }}
      bodyStyle={{ padding: 0 }}
    >
      <Row gutter={[0, 16]} align="middle">
        <Col xs={24} md={8}>
          <div style={{ height: "100%", minHeight: 200, position: "relative" }}>
            <Tag
              color="blue"
              style={{
                position: "absolute",
                top: 12,
                left: 12,
                fontWeight: 600,
                zIndex: 10,
              }}
            >
              {categoryIcon} {creditValue} Credits
            </Tag>
            <img
              alt={item.name}
              src={item.image}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          </div>
        </Col>
        <Col xs={24} md={16}>
          <div style={{ padding: "24px" }}>
            <Row gutter={[16, 16]}>
              <Col xs={24} md={14}>
                <Title level={4} style={{ margin: "0 0 4px 0", lineHeight: 1.2 }}>
                  {item.name}
                </Title>
                <Row gutter={[16, 8]}>
                  {item.features.slice(0, 6).map((feature, idx) => (
                    <Col
                      xs={24}
                      sm={12}
                      key={idx}
                      style={{ display: "flex", alignItems: "flex-start" }}
                    >
                      <Text style={{ fontSize: 13, flex: 1 }}>{feature}</Text>
                    </Col>
                  ))}
                </Row>
              </Col>
              <Col
                xs={24}
                md={10}
                style={{
                  textAlign: "right",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                }}
              >
                <Title level={3} style={{ margin: 0, fontWeight: 700, color: "#ff7a45" }}>
                  {item.price}
                </Title>
                <Text
                  type="secondary"
                  style={{ fontSize: 14, display: "block", marginBottom: 16 }}
                >
                  {item.period}
                </Text>
                <Button
                  type="primary"
                  onClick={() => navigate(`/daftar-member/${item.id}`)}
                  style={{ width: "100%", height: 40, fontWeight: 600 }}
                >
                  Pilih Plan
                </Button>

              </Col>
            </Row>
          </div>
        </Col>
      </Row>
    </Card>
  );
};

const Membership = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [memberships, setMemberships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("Space Monitor"); // default tab
  const navigate = useNavigate();
  const sectionRefs = useRef({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const result = await getAllMemberships();
        if (result.message === "OK") {
          const grouped = result.datas.reduce((acc, item) => {
            if (!acc[item.nama_kategori]) {
              acc[item.nama_kategori] = {
                title: item.nama_kategori,
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
              image:
                "https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=600&q=80",
              features: item.fitur_membership
                ? item.fitur_membership.split(/\r?\n/).filter((f) => f.trim() !== "")
                : ["Fitur standar belum tersedia"],
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

  const filteredMemberships = memberships
    .map((section) => ({
      ...section,
      data: section.data.filter((item) =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
      ),
    }))
    .filter((section) => section.data.length > 0);

  const scrollToCategory = (category) => {
    setActiveTab(category);
    if (sectionRefs.current[category]) {
      sectionRefs.current[category].scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div style={{ padding: "24px", maxWidth: "1200px", margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: "24px" }}>
        <Title level={2} style={{ marginBottom: 8 }}>
          Pilih Paket Membership Anda
        </Title>
        <Text type="secondary" style={{ fontSize: 14, lineHeight: 1.5 }}>
          Dapatkan akses eksklusif dan fasilitas lengkap untuk produktivitas maksimal di Dago.
        </Text>
      </div>

      {/* Search */}
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

      {/* Tabs dengan underline */}
      <div
        style={{
          display: "flex",
          gap: "40px",
          borderBottom: "1px solid #eee",
          marginBottom: "32px",
        }}
      >
        {filteredMemberships.map((section) => (
          <div
            key={section.title}
            onClick={() => scrollToCategory(section.title)}
            style={{
              cursor: "pointer",
              paddingBottom: "12px",
              borderBottom: activeTab === section.title ? "2px solid #3b82f6" : "2px solid transparent",
              color: activeTab === section.title ? "#3b82f6" : "#333",
              fontWeight: activeTab === section.title ? 600 : 400,
              display: "flex",
              alignItems: "center",
              gap: "6px",
              transition: "all 0.3s ease",
            }}
          >
            <span style={{ fontSize: "18px" }}>{section.icon}</span>
            {section.title} ({section.data.length})
          </div>
        ))}
      </div>

      {/* Loading & Error */}
      {loading && <Spin tip="Memuat data membership..." />}
      {error && <Alert type="error" message={error} />}

      {!loading && !error && (
        <Space direction="vertical" size="large" style={{ width: "100%" }}>
          {filteredMemberships.map((section, idx) => (
            <div
              key={idx}
              ref={(el) => (sectionRefs.current[section.title] = el)}
            >
              <div style={{ marginBottom: "24px" }}>
                <Title level={3} style={{ display: "flex", alignItems: "center" }}>
                  <span style={{ marginRight: "8px", fontSize: "28px", color: "#ff7a45" }}>
                    {section.icon}
                  </span>
                  {section.title}
                </Title>
              </div>

              <div style={{ marginBottom: "40px" }}>
                {section.data.map((item, i) => (
                  <HorizontalPackageCard
                    key={i}
                    item={item}
                    navigate={navigate}
                    categoryIcon={section.icon}
                  />
                ))}
              </div>
            </div>
          ))}
        </Space>
      )}
    </div>
  );
};

export default Membership;