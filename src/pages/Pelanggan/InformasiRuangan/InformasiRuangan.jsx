// File: InformasiRuangan.jsx
import React, { useContext, useEffect, useState } from "react";
import {
  SearchOutlined,
  TeamOutlined,
  CalendarOutlined,
  ThunderboltOutlined,
  FireOutlined,
  CrownOutlined,
  HeartOutlined,
} from "@ant-design/icons";
import {
  Card,
  Button,
  Input,
  Row,
  Col,
  Typography,
  Space,
  Tabs,
  Tag,
  Badge,
  Divider,
} from "antd";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../../providers/AuthProvider";
import { formatRupiahPerJam } from "../../../utils/formatRupiah";
import { getAllRuangan } from "../../../services/service";
import { Monitor } from "lucide-react";
import { CgUser } from "react-icons/cg";
import { MdDesk, MdMeetingRoom } from "react-icons/md";

const baseUrl = import.meta.env.VITE_BASE_URL;
const { Title, Text } = Typography;
const { Search } = Input;

const InformasiRuangan = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTabKey, setActiveTabKey] = useState("");
  const [favoriteRooms, setFavoriteRooms] = useState(new Set());
  const navigate = useNavigate();
  const { userProfile } = useContext(AuthContext);
  const [rooms, setRooms] = useState([]);

  useEffect(() => {
    if (userProfile?.roles === "admin") {
      navigate("/dashboardadmin");
    } else if (userProfile?.roles === "kasir") {
      navigate("/mengelola-orderan_fb");
    }
  }, [userProfile, navigate]);

  const fetchRuangan = async () => {
    try {
      const result = await getAllRuangan();
      setRooms(result.datas || []);

      if (result.datas.length > 0) {
        setActiveTabKey(result.datas[0].nama_kategori);
      }
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchRuangan();
  }, []);

  // Toggle favorite
  const toggleFavorite = (roomId) => {
    const newFavorites = new Set(favoriteRooms);
    if (newFavorites.has(roomId)) newFavorites.delete(roomId);
    else newFavorites.add(roomId);
    setFavoriteRooms(newFavorites);
  };

  // Category icon
  const getCategoryIcon = (kategori) => {
    const lower = kategori?.toLowerCase() || "";
    if (lower.includes("monitor")) return <Monitor />;
    if (lower.includes("lesehan")) return <CgUser />;
    if (lower.includes("open space")) return <MdDesk />;
    if (lower.includes("room") || lower.includes("meeting"))
      return <MdMeetingRoom />;
    return <FireOutlined />;
  };

  // Category color (semua default merah diganti biru)
  const getCategoryColor = (kategori) => {
    const lower = kategori?.toLowerCase() || "";
    if (lower.includes("coworking")) return "#1890ff";
    if (lower.includes("meeting")) return "#1890ff";
    if (lower.includes("event")) return "#1890ff";
    if (lower.includes("premium")) return "#1890ff";
    return "#1890ff"; // default biru
  };

  // Group rooms by category
  const groupByCategory = (rooms) => {
    return rooms.reduce((groups, room) => {
      const kategori = room.nama_kategori || "Lainnya";
      if (!groups[kategori]) groups[kategori] = [];
      groups[kategori].push(room);
      return groups;
    }, {});
  };

  // Get room features
  const getRoomFeatures = (featureString) => {
    if (!featureString) return [];
    return featureString
      .split(",")
      .map((f) => f.trim())
      .slice(0, 3);
  };

  // Mock ratings
  const getRoomRating = (roomId) => {
    const ratings = [4.2, 4.5, 4.7, 4.8, 4.9, 5.0];
    return ratings[roomId % ratings.length];
  };

  // Mock booking count
  const getBookingCount = (roomId) => {
    return ((roomId * 7 + 20) % 150) + 50;
  };

  const groupedRooms = groupByCategory(rooms);

  return (
    <div style={{ backgroundColor: "white", minHeight: "100vh" }}>
      <div style={{ padding: "24px", maxWidth: "1200px", margin: "0 auto" }}>
        <div style={{ marginBottom: "24px" }}>
          <Title level={2}>Welcome to Dago</Title>
          <Text type="secondary">
            Coworking Space in North, Creative Hub & F&B untuk Skena Anak Muda
            di Singaraja
          </Text>
        </div>

        {/* Search */}
        <div style={{ marginBottom: "24px" }}>
          <Search
            placeholder={`Cari di ${activeTabKey || "Ruangan"}...`}
            allowClear
            prefix={<SearchOutlined />}
            onSearch={(value) => setSearchTerm(value)}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: "100%" }}
          />
        </div>

        {/* Tabs */}
        <Tabs
          activeKey={activeTabKey}
          onChange={(key) => {
            setActiveTabKey(key);
            setSearchTerm("");
          }}
          size="large"
          items={Object.entries(groupedRooms).map(([kategori, list]) => ({
            key: kategori,
            label: (
              <div style={{ display: "flex", alignItems: "center" }}>
                {getCategoryIcon(kategori)}
                <span style={{ marginLeft: 8 }}>
                  {kategori} ({list.length})
                </span>
              </div>
            ),

            children: (
              <Row gutter={[24, 24]} style={{ marginTop: 16 }}>
                {list
                  .filter((room) =>
                    room.nama_ruangan
                      .toLowerCase()
                      .includes(searchTerm.toLowerCase())
                  )
                  .map((room) => {
                    const rating = getRoomRating(room.id_ruangan);
                    const bookingCount = getBookingCount(room.id_ruangan);
                    const features = getRoomFeatures(room.fitur_ruangan);
                    const isFavorite = favoriteRooms.has(room.id_ruangan);

                    return (
                      <Col xs={24} sm={12} lg={8} key={room.id_ruangan}>
                        <Badge.Ribbon
                          color={bookingCount > 100 ? "#1890ff" : "blue"} // merah diganti biru
                        >
                          <Card
                            hoverable
                            style={{
                              borderRadius: 16,
                              overflow: "hidden",
                              boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
                              border: "none",
                              transition: "all 0.3s ease",
                            }}
                            cover={
                              <div style={{ position: "relative" }}>
                                <img
                                  alt={room.nama_ruangan}
                                  src={`${baseUrl}/static/${room.gambar_ruangan}`}
                                  style={{
                                    height: 200,
                                    objectFit: "cover",
                                    width: "100%",
                                  }}
                                />
                              </div>
                            }
                            actions={[
                              <Button
                                type="primary"
                                size="large"
                                block
                                style={{
                                  background: `linear-gradient(135deg, ${getCategoryColor(
                                    kategori
                                  )}, ${getCategoryColor(kategori)}dd)`,
                                  border: "none",
                                  borderRadius: 8,
                                  fontWeight: 600,
                                  height: 48,
                                }}
                                onClick={() =>
                                  navigate(`/roomdetail/${room.id_ruangan}`, {
                                    state: room,
                                  })
                                }
                              >
                                Pilih Ruangan
                              </Button>,
                            ]}
                          >
                            <Card.Meta
                              title={
                                <div
                                  style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                  }}
                                >
                                  <Text
                                    strong
                                    style={{ fontSize: 16, color: "#2c3e50" }}
                                  >
                                    {room.nama_ruangan}
                                  </Text>
                                  <Tag
                                    color={getCategoryColor(kategori)}
                                    style={{ margin: 0 }}
                                  >
                                    {kategori}
                                  </Tag>
                                </div>
                              }
                              description={
                                <Space
                                  direction="vertical"
                                  style={{ width: "100%" }}
                                  size="small"
                                >
                                  {/* Price */}
                                  <div style={{ marginBottom: 8 }}>
                                    <Text
                                      strong
                                      style={{
                                        fontSize: 20,
                                        background: `linear-gradient(135deg, ${getCategoryColor(
                                          kategori
                                        )}, ${getCategoryColor(kategori)}dd)`,
                                        WebkitBackgroundClip: "text",
                                        WebkitTextFillColor: "transparent",
                                      }}
                                    >
                                      {formatRupiahPerJam(room.harga_per_jam)}
                                    </Text>
                                  </div>

                                  {/* Description */}
                                  <Text
                                    style={{
                                      color: "#5a6c7d",
                                      lineHeight: 1.4,
                                      fontSize: 13,
                                    }}
                                    ellipsis={{ rows: 2 }}
                                  >
                                    {room.deskripsi_ruangan}
                                  </Text>
                                  <Divider style={{ margin: "8px 0" }} />
                                  {/* Features */}
                                  <div>
                                    <Text
                                      strong
                                      style={{ fontSize: 12, color: "#2c3e50" }}
                                    >
                                      ✨ Features:
                                    </Text>
                                    <div style={{ marginTop: 4 }}>
                                      {features.map((feature, index) => (
                                        <Tag
                                          key={index}
                                          size="small"
                                          style={{
                                            margin: "2px 4px 2px 0",
                                            background: "#f0f9ff",
                                            border: "1px solid #bae7ff",
                                            color: "#1890ff",
                                            fontSize: 11,
                                          }}
                                        >
                                          {feature}
                                        </Tag>
                                      ))}
                                      {room.fitur_ruangan &&
                                        room.fitur_ruangan.split(",").length >
                                          3 && (
                                          <Tag
                                            size="small"
                                            style={{
                                              margin: "2px 0",
                                              background: "#f0f9ff",
                                              border: "1px solid #bae7ff",
                                              color: "#1890ff",
                                              fontSize: 11,
                                            }}
                                          >
                                            +
                                            {room.fitur_ruangan.split(",")
                                              .length - 3}{" "}
                                            more
                                          </Tag>
                                        )}
                                    </div>
                                  </div>
                                </Space>
                              }
                            />
                          </Card>
                        </Badge.Ribbon>
                      </Col>
                    );
                  })}
                {list.filter((room) =>
                  room.nama_ruangan
                    .toLowerCase()
                    .includes(searchTerm.toLowerCase())
                ).length === 0 && (
                  <div
                    style={{
                      textAlign: "center",
                      padding: "60px 20px",
                      margin: "20px 0",
                    }}
                  >
                    <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
                    <Title level={4} style={{ color: "#8c8c8c" }}>
                      Tidak ada ruangan ditemukan
                    </Title>
                    <Text type="secondary" style={{ fontSize: 14 }}>
                      Coba kata kunci lain atau jelajahi kategori berbeda
                    </Text>
                  </div>
                )}
              </Row>
            ),
          }))}
        />
      </div>
    </div>
  );
};

export default InformasiRuangan;