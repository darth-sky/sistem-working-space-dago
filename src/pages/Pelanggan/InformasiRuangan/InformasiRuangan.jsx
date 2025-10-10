// File: InformasiRuangan.jsx
import React, { useContext, useEffect, useState } from "react";
import {
  SearchOutlined,
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
  Divider,
  Tooltip,
} from "antd";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../../providers/AuthProvider";
import { formatRupiahPerJam, formatRupiah } from "../../../utils/formatRupiah";
import { getAllRuangan } from "../../../services/service";
import { Monitor, CheckCircle } from "lucide-react";
import { CgUser } from "react-icons/cg";
import { MdDesk, MdMeetingRoom } from "react-icons/md";


const baseUrl = import.meta.env.VITE_BASE_URL;
const { Title, Text } = Typography;
const { Search } = Input;

// === KOMPONEN BARU UNTUK VISUALISASI JADWAL ===
// === GANTI KOMPONEN INI DENGAN VERSI YANG SUDAH DIPERBARUI ===
const JadwalHariIni = ({ jadwalTerisi }) => {
  const jamOperasional = Array.from({ length: 14 }, (_, i) => 8 + i); // 8, 9, ..., 21

  // === PERUBAHAN 1: Ambil jam saat ini ===
  const currentHour = new Date().getHours();

  return (
    <div style={{ marginTop: '12px' }}>
      <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: '8px' }}>
        Ketersediaan Hari Ini:
      </Text>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(45px, 1fr))', gap: '6px' }}>
        {jamOperasional.map(jam => {
          const isBooked = jadwalTerisi.includes(jam);
          // === PERUBAHAN 2: Cek apakah jam sudah lewat ===
          const isPast = jam < currentHour;

          const timeText = `${String(jam).padStart(2, '0')}:00`;

          // Tentukan style berdasarkan status (lewat ATAU sudah dibooking)
          const isUnavailable = isBooked || isPast;
          const statusClass = isUnavailable
            ? "bg-gray-300 text-gray-500" // Style untuk jam tidak tersedia
            : "bg-gray-100 text-gray-800"; // Style untuk jam tersedia

          // Tentukan isi tooltip berdasarkan status
          let tooltipTitle = `${timeText} - ${String(jam + 1).padStart(2, '0')}:00`;
          if (isBooked) {
            tooltipTitle += ' (Terisi)';
          } else if (isPast) {
            tooltipTitle += ' (Telah Lewat)';
          } else {
            tooltipTitle += ' (Tersedia)';
          }

          return (
            <Tooltip key={jam} title={tooltipTitle}>
              <div
                className={`py-2 px-1 text-xs rounded-lg font-medium text-center ${statusClass}`}
              >
                {timeText}
              </div>
            </Tooltip>
          );
        })}
      </div>
    </div>
  );
};

// Hook sederhana untuk deteksi ukuran layar
const useWindowSize = () => {
  const [size, setSize] = useState([window.innerWidth, window.innerHeight]);
  useEffect(() => {
    const handleResize = () => setSize([window.innerWidth, window.innerHeight]);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  return size;
};

const InformasiRuangan = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTabKey, setActiveTabKey] = useState("");
  const navigate = useNavigate();
  const { userProfile } = useContext(AuthContext);
  const [rooms, setRooms] = useState([]);

  const [width] = useWindowSize();
  const isMobile = width < 768;

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
      const availableRooms = result.datas || [];
      setRooms(availableRooms);

      if (availableRooms.length > 0) {
        const firstCategory = Object.keys(groupByCategory(availableRooms))[0];
        setActiveTabKey(firstCategory);
      }
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchRuangan();
  }, []);

  const getCategoryIcon = (kategori) => {
    const iconSize = isMobile ? 20 : 16;
    const lower = kategori?.toLowerCase() || "";

    if (lower.includes("monitor")) return <Monitor size={iconSize} />;
    if (lower.includes("lesehan")) return <CgUser size={iconSize} />;
    if (lower.includes("open space")) return <MdDesk size={iconSize} />;
    if (lower.includes("room") || lower.includes("meeting"))
      return <MdMeetingRoom size={iconSize} />;
    return null;
  };

  const getCategoryColor = () => "#1890ff";

  const groupByCategory = (rooms) => {
    return rooms.reduce((groups, room) => {
      const kategori = room.nama_kategori || "Lainnya";
      if (!groups[kategori]) groups[kategori] = [];
      groups[kategori].push(room);
      return groups;
    }, {});
  };

  const getRoomFeatures = (featureString) => {
    if (!featureString) return [];
    return featureString.split(",").map((f) => f.trim()).slice(0, 3);
  };

  const groupedRooms = groupByCategory(rooms);

  return (
    <div style={{ minHeight: "100vh" }}>
      <div style={{ padding: isMobile ? "16px" : "24px", maxWidth: "1200px", margin: "0 auto" }}>
        <div style={{ marginBottom: "24px", textAlign: isMobile ? 'center' : 'left' }}>
          <Title level={isMobile ? 3 : 2}>Pilih Ruangan</Title>
          <Text type="secondary">
            Temukan ruang kerja yang sempurna untuk produktivitas Anda.
          </Text>
        </div>

        <div style={{ marginBottom: "24px" }}>
          <Search
            placeholder={`Cari nama ruangan...`}
            allowClear
            size="large"
            onSearch={(value) => setSearchTerm(value)}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <Tabs
          activeKey={activeTabKey}
          onChange={(key) => {
            setActiveTabKey(key);
            setSearchTerm("");
          }}
          size={isMobile ? "default" : "large"}
          type="line"
          items={Object.entries(groupedRooms).map(([kategori, list]) => ({
            key: kategori,
            label: (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  minWidth: isMobile ? "auto" : "100px",
                  height: "40px",
                  padding: isMobile ? "0 6px" : "0 12px",
                  gap: 6,
                }}
              >
                {getCategoryIcon(kategori)}
                <span
                  style={{
                    fontSize: isMobile ? 12 : 14,
                    whiteSpace: "nowrap",
                  }}
                >
                  {isMobile
                    ? `${kategori.split(" ")[0]} (${list.length})` // ambil kata pertama aja di mobile
                    : `${kategori} (${list.length})`}
                </span>
              </div>
            ),

            children: (
              <Row gutter={[isMobile ? 16 : 24, isMobile ? 16 : 24]} style={{ marginTop: 16 }}>
                {list
                  .filter((room) => room.nama_ruangan.toLowerCase().includes(searchTerm.toLowerCase()))
                  .map((room) => {
                    const features = getRoomFeatures(room.fitur_ruangan);
                    return (
                      // Ganti baris <Col ...> di dalam file InformasiRuangan.jsx

                      <Col xs={24} sm={24} md={12} lg={12} xl={8} key={room.id_ruangan} style={{ display: 'flex' }}>
                        {/* === PERUBAHAN UTAMA DI SINI === */}
                        <Card
                          hoverable
                          style={{
                            borderRadius: 16,
                            overflow: "hidden",
                            border: "none",
                            width: "100%",
                            display: "flex",
                            flexDirection: "column",
                          }}
                          cover={
                            <img
                              alt={room.nama_ruangan}
                              src={`${baseUrl}/static/${room.gambar_ruangan}`}
                              style={{ height: 180, objectFit: "cover", width: "100%" }}
                            />
                          }
                          bodyStyle={{
                            padding: "16px",
                            flexGrow: 1,
                            display: "flex",
                            flexDirection: "column",
                          }}
                        >
                          <div style={{ flexGrow: 1 }}>
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
                                    ellipsis
                                  >
                                    {room.nama_ruangan}
                                  </Text>
                                  <Tag color={getCategoryColor()}>{kategori}</Tag>
                                </div>
                              }
                              description={
                                <Space
                                  direction="vertical"
                                  style={{ width: "100%", marginTop: "8px" }}
                                  size="small"
                                >
                                  {/* === PERUBAHAN TAMPILAN HARGA DIMULAI DI SINI === */}
                                  {room.paket_harga && room.paket_harga.length > 0 ? (
                                    <>
                                      <Text type="secondary" style={{ fontSize: 12, lineHeight: 1 }}>
                                        Mulai dari
                                      </Text>
                                      <Text
                                        strong
                                        style={{ fontSize: 20, color: getCategoryColor(), lineHeight: 1.2 }}
                                      >
                                        {/* Cari harga termurah dari array paket_harga */}
                                        {formatRupiah(Math.min(...room.paket_harga.map(p => p.harga_paket)))}
                                      </Text>
                                    </>
                                  ) : (
                                    <Text
                                      strong
                                      style={{ fontSize: 16, color: "#8c8c8c" }}
                                    >
                                      Harga belum diatur
                                    </Text>
                                  )}
                                  {/* === PERUBAHAN TAMPILAN HARGA SELESAI DI SINI === */}

                                  {/* Info tambahan */}
                                  <div>
                                    <Text type="secondary">Kapasitas: </Text>
                                    <Text strong>{room.kapasitas} orang</Text>
                                  </div>

                                  {/* === SISIPKAN KOMPONEN JADWAL DI SINI === */}
                                  <JadwalHariIni jadwalTerisi={room.jadwal_hari_ini || []} />

                                  {/* Divider */}
                                  <Divider style={{ margin: "12px 0" }} />
                                  {/* Fitur */}
                                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                                    {room.fitur_ruangan &&
                                      room.fitur_ruangan
                                        .split(/\r?\n|,/)
                                        .map((f) => f.trim())
                                        .filter(Boolean)
                                        .map((feature, index) => (
                                          <div key={index} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                            <CheckCircle size={16} color="#1890ff" />
                                            <span>{feature}</span>
                                          </div>
                                        ))}
                                  </div>

                                </Space>
                              }
                            />
                          </div>

                          {/* Tombol di bawah */}
                          <Button
                            type="primary"
                            size="large"
                            block
                            style={{
                              background: getCategoryColor(),
                              border: "none",
                              height: 44,
                              marginTop: "16px",
                            }}
                            onClick={() =>
                              navigate(`/roomdetail/${room.id_ruangan}`, { state: room })
                            }
                          >
                            Pilih Ruangan
                          </Button>
                        </Card>

                      </Col>
                    );
                  })}
                {list.filter((room) => room.nama_ruangan.toLowerCase().includes(searchTerm.toLowerCase())).length === 0 && (
                  <Col span={24}>
                    <div style={{ textAlign: "center", padding: "40px 20px" }}>
                      <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
                      <Title level={4} style={{ color: "#8c8c8c" }}>
                        Tidak ada ruangan ditemukan
                      </Title>
                      <Text type="secondary">Coba kata kunci lain atau jelajahi kategori berbeda</Text>
                    </div>
                  </Col>
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