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
  Divider,
} from "antd";
import { useNavigate } from "react-router-dom";
import { getAllMemberships } from "../../../services/service";

const { Title, Text } = Typography;
const { Search } = Input;

// Icons for membership categories
const categoryIcons = {
  "Open Space": <CoffeeOutlined />,
  "Space Monitor": <SafetyOutlined />,
  "Room Meeting": <UserOutlined />,
};

// Horizontal Card (Kredit Biru, Tanpa Checklist, Garis Gelap)
const HorizontalPackageCard = ({ item, navigate, categoryIcon }) => {
  // 1. Menampilkan kuota dengan teks "Credits" dan warna biru
  const creditValue = item.quota.replace(" credit", "").replace(" credits", "").trim();
  const creditText = `${creditValue} Credits`;

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
      bodyStyle={{ padding: "24px" }}
    >
      <Row gutter={[24, 16]} align="middle">
        {/* Kiri: Nama Paket dan Fitur */}
        <Col xs={24} md={16}>
          <div style={{ paddingRight: "16px" }}>
            <Space style={{ marginBottom: 8 }}>
              {/* Judul Diperbesar */}
              <Title level={3} style={{ margin: 0, lineHeight: 1.2, fontWeight: 700 }}>
                {item.name}
              </Title>
              <Tag
                color="blue"
                style={{ fontWeight: 600 }}
              >
                {categoryIcon} {creditText} {/* Kredit Biru & Teks */}
              </Tag>
            </Space>

            {/* Garis pemisah horizontal (itemin/gelap) */}
            <Divider style={{ margin: '12px 0', borderColor: '#d9d9d9' }} />

            <Row gutter={[16, 8]}>
              {item.features.slice(0, 6).map((feature, idx) => (
                <Col
                  xs={24}
                  sm={12}
                  key={idx}
                  style={{ display: "flex", alignItems: "flex-start" }}
                >
                  <Text style={{ fontSize: 13, flex: 1, color: '#595959' }}>
                    {feature} {/* Tanpa Checklist, menggunakan bullet point */}
                  </Text>
                </Col>
              ))}
            </Row>
          </div>
        </Col>

        {/* Kanan: Harga dan Tombol */}
        <Col
          xs={24}
          md={8}
          style={{
            textAlign: "center",
            // Garis pembatas vertikal (itemin/gelap)
            borderLeft: '1px solid #d9d9d9',
            paddingLeft: '24px',
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
          <div style={{ paddingLeft: "16px" }}>
            <Text type="secondary" style={{ fontSize: 14, display: "block", marginBottom: 4 }}>
              Mulai Dari
            </Text>
            {/* Harga Biru */}
            <Title level={2} style={{ margin: 0, fontWeight: 700, color: "#1890ff" }}>
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
  const [activeTab, setActiveTab] = useState("Space Monitor");
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

          const firstCategory = Object.keys(grouped)[0];
          if (firstCategory) {
            setActiveTab(firstCategory);
          }
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

  // Logika Filter: Hanya kategori dengan data yang lolos filter pencarian yang akan ditampilkan.
  const filteredMemberships = memberships
    .map((section) => ({
      ...section,
      data: section.data.filter((item) =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
      ),
    }))
    .filter((section) => section.data.length > 0); // <-- MENYARING KATEGORI KOSONG (SESUAI PERMINTAAN)

  const scrollToCategory = (category) => {
    setActiveTab(category);
    if (sectionRefs.current[category]) {
      sectionRefs.current[category].scrollIntoView({ behavior: "smooth", block: "start" });
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

      {/* Tabs Kategori */}
      <div
        style={{
          display: "flex",
          gap: "40px",
          borderBottom: "1px solid #d9d9d9", // Garis Tabs Itemin
          marginBottom: "32px",
          overflowX: 'auto',
          paddingBottom: '2px',
        }}
      >
        {filteredMemberships.map((section) => (
          <div
            key={section.title}
            onClick={() => scrollToCategory(section.title)}
            style={{
              cursor: "pointer",
              paddingBottom: "12px",
              borderBottom: activeTab === section.title ? "2px solid #1890ff" : "2px solid transparent",
              color: activeTab === section.title ? "#1890ff" : "#333",
              fontWeight: activeTab === section.title ? 600 : 400,
              display: "flex",
              alignItems: "center",
              gap: "6px",
              transition: "all 0.3s ease",
              flexShrink: 0,
            }}
          >
            <span style={{ fontSize: "18px" }}>{section.icon}</span>
            {section.title} ({section.data.length})
          </div>
        ))}
      </div>

      {/* Loading & Error */}
      {loading && <Spin tip="Memuat data membership..." style={{ display: 'block', margin: '50px 0', textAlign: 'center' }} />}
      {error && <Alert type="error" message="Gagal Memuat Data" description={error} showIcon style={{ marginBottom: 24 }} />}

      {!loading && !error && filteredMemberships.length > 0 && (
        <Space direction="vertical" size="large" style={{ width: "100%" }}>
          {/* Hanya iterasi kategori yang memiliki paket */}
          {filteredMemberships.map((section, idx) => (
            <div
              key={idx}
              ref={(el) => (sectionRefs.current[section.title] = el)}
            >
              <div style={{ marginBottom: "24px" }}>
                <Title level={3} style={{ display: "flex", alignItems: "center" }}>
                  <span style={{ marginRight: "8px", fontSize: "28px", color: "#1890ff" }}>
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

      {/* Handle kasus tidak ada data sama sekali */}
      {!loading && !error && filteredMemberships.length === 0 && searchTerm && (
        <Alert
          message="Tidak Ditemukan"
          description={`Tidak ada paket membership yang cocok dengan kata kunci "${searchTerm}" di semua kategori.`}
          type="info"
          showIcon
        />
      )}

      {!loading && !error && memberships.length === 0 && !searchTerm && (
        <Alert
          message="Tidak Ada Data"
          description="Tidak ada paket membership yang tersedia saat ini."
          type="info"
          showIcon
        />
      )}
    </div>
  );
};

export default Membership;