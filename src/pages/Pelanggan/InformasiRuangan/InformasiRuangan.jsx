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
// Menggunakan icon yang lebih sederhana untuk info header agar lebih ringkas
import { Calendar, Clock, Monitor, CheckCircle, Wifi, Coffee, Snowflake, XCircle } from "lucide-react"; 
import { CgUser } from "react-icons/cg";
import { MdDesk, MdMeetingRoom } from "react-icons/md";


const baseUrl = import.meta.env.VITE_BASE_URL;
const { Title, Text } = Typography;
const { Search } = Input;

// === KOMPONEN JADWAL HARI INI ===
const JadwalHariIni = ({ jadwalTerisi, isMobile }) => {
  const jamOperasional = Array.from({ length: 14 }, (_, i) => 8 + i); // 8, 9, ..., 21
  const currentHour = new Date().getHours();
  const terisi = jadwalTerisi || []; 

  return (
    <div style={{ marginTop: isMobile ? '8px' : '10px', marginBottom: isMobile ? '8px' : '10px' }}>
      <Text type="secondary" style={{ fontSize: isMobile ? 10 : 12, display: 'block', marginBottom: '6px', fontWeight: 'bold' }}>
        Jam Tersedia Hari Ini:
      </Text>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
        {jamOperasional.map(jam => {
          const isBooked = terisi.includes(jam);
          const isPast = jam < currentHour;
          
          const timeText = `${String(jam).padStart(2, '0')}`;

          const isUnavailable = isBooked || isPast;
          
          const statusClass = isUnavailable
            ? "bg-gray-200 text-gray-500" // Hanya abu-abu
            : "bg-green-100 text-green-700 font-bold"; 

          let tooltipTitle = `${timeText}:00 - ${String(jam + 1).padStart(2, '0')}:00`;
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
                className={`py-1 px-2 text-xs rounded ${statusClass}`}
                style={{ minWidth: '30px', cursor: 'default' }}
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


// === KOMPONEN FITUR UTAMA (MAIN ICONS) ===
const MainFeatures = ({ features, isMobile }) => {
  const iconSize = isMobile ? 18 : 22;
  const labelSize = isMobile ? 9 : 11;
  const mainFeatureIcons = [
    { key: "internet", icon: <Wifi size={iconSize} color="#1890ff" />, label: "Internet" },
    { key: "air minum", icon: <Coffee size={iconSize} color="#ffaa00" />, label: "Refill Water" },
    { key: "ac", icon: <Snowflake size={iconSize} color="#00aaff" />, label: "AC" },
    { key: "rokok", icon: <XCircle size={iconSize} color="#ff4d4f" />, label: "No Smoking", isNegative: true }, 
  ];

  const featuresLower = features?.toLowerCase() || "";
  
  return (
    <div 
      style={{ 
        display: 'flex', 
        justifyContent: 'space-around', 
        padding: isMobile ? '8px 0' : '8px 0', 
        gap: '4px',
        margin: isMobile ? '8px 0' : '12px 0', 
        borderTop: '1px solid #f0f0f0',
        borderBottom: '1px solid #f0f0f0',
      }}
    >
      {mainFeatureIcons.map(f => {
        let opacityValue = 1; 

        if (f.isNegative) {
            // Khusus No Smoking: Buram jika boleh merokok (fitur mengandung 'rokok')
            const isSmokingAllowed = featuresLower.includes('rokok');
            opacityValue = isSmokingAllowed ? 0.4 : 1; 
        }

        return (
          <div 
            key={f.key} 
            style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              gap: '4px',
              opacity: opacityValue, // Menggunakan logika opacity yang direvisi
              flexBasis: '25%',
            }}
          >
            {f.icon}
            <Text type="secondary" style={{ fontSize: labelSize, textAlign: 'center' }}>
              {f.label}
            </Text>
          </div>
        )
      })}
    </div>
  );
}

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
      console. error(error);
    }
  };

  useEffect(() => {
    fetchRuangan();
  }, []);

  const getCategoryIcon = (kategori) => {
    const iconSize = isMobile ? 18 : 16;
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

  const getAllRoomFeatures = (featureString) => {
    if (!featureString) return [];
    // Batasi maksimum 6 fitur yang akan ditampilkan di checklist
    return featureString.split(/\r?\n|,/).map((f) => f.trim()).filter(Boolean);
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
                    ? `${kategori.split(" ")[0]} (${list.length})` 
                    : `${kategori} (${list.length})`}
                </span>
              </div>
            ),

            children: (
              <Row gutter={[0, isMobile ? 16 : 24]} style={{ marginTop: 16 }}>
                {list
                  .filter((room) => room.nama_ruangan.toLowerCase().includes(searchTerm.toLowerCase()))
                  .map((room) => {
                    const allFeaturesList = getAllRoomFeatures(room.fitur_ruangan);
                    // Ambil 6 fitur teratas untuk ditampilkan di checklist (maksimum)
                    const featuresList = allFeaturesList.slice(0, 6); 
                    
                    const minPrice = room.paket_harga && room.paket_harga.length > 0
                      ? Math.min(...room.paket_harga.map(p => p.harga_paket))
                      : null;
                    
                    const jamOperasionalText = room.jam_operasional || "Senin - Sabtu | 08:00 - 22:00"; 
                    const [hari, jam] = jamOperasionalText.split('|').map(s => s.trim());
                    
                    // Simulasi data jam terisi
                    const jamTerisiSimulasi = room.nama_ruangan.includes("Meeting") ? [9, 10, 15] : [11, 14, 16]; 

                    return (
                      <Col span={24} key={room.id_ruangan}>
                        <Card
                          hoverable
                          style={{
                            borderRadius: 16,
                            overflow: "hidden",
                            border: "1px solid #f0f0f0",
                            display: "flex", 
                            flexDirection: isMobile ? "column" : "row", 
                            minHeight: isMobile ? 'auto' : 240, 
                          }}
                          bodyStyle={{
                            padding: "0", 
                            flexGrow: 1,
                          }}
                        >
                          <Row style={{ width: '100%', margin: 0, flexWrap: isMobile ? 'wrap' : 'nowrap' }}>
                            {/* KOLOM KIRI: FOTO */}
                            <Col xs={24} md={9} style={{ padding: 0 }}> 
                              <img
                                alt={room.nama_ruangan}
                                src={`${baseUrl}/static/${room.gambar_ruangan}`}
                                style={{ 
                                  height: isMobile ? 180 : '100%', 
                                  width: "100%", 
                                  objectFit: "cover",
                                  borderRadius: isMobile 
                                    ? '16px 16px 0 0' 
                                    : '16px 0 0 16px' 
                                }}
                                onError={(e) => { e.target.onerror = null; e.target.src='https://placehold.co/600x400/EEE/31343C?text=Image+Not+Found' }}
                              />
                            </Col>

                            {/* KOLOM KANAN: DETAIL RUANGAN */}
                            <Col xs={24} md={15} style={{ 
                              padding: isMobile ? "12px" : "16px 20px", 
                              display: 'flex', 
                              flexDirection: 'column',
                              justifyContent: 'space-between',
                            }}>
                              {/* Konten Atas: Nama, Kategori, Info Header, Main Icons, Fasilitas Detail, Jadwal */}
                              <div>
                                {/* Nama dan Kategori */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: isMobile ? '4px' : '6px' }}>
                                  <Title 
                                    level={isMobile ? 5 : 4} 
                                    style={{ 
                                        marginTop: 0, 
                                        marginBottom: 0, 
                                        lineHeight: 1.2, 
                                        fontSize: isMobile ? '16px' : '20px',
                                        fontWeight: 'bold' // <--- DI-BOLD
                                    }}
                                  >
                                    {room.nama_ruangan}
                                  </Title>
                                  <Tag color={getCategoryColor()} style={{ fontSize: isMobile ? 10 : 12, padding: isMobile ? '2px 6px' : '3px 8px' }}>
                                    {kategori}
                                  </Tag>
                                </div>

                                {/* Info Header (Waktu, Kapasitas) */}
                                <Space size={isMobile ? 4 : 8} style={{ color: '#595959', marginBottom: isMobile ? '6px' : '8px', flexWrap: 'wrap' }}>
                                  <Text type="secondary" style={{ fontSize: isMobile ? 11 : 13, display: 'flex', alignItems: 'center' }}>
                                    <Calendar size={13} style={{ marginRight: 4 }} /> {hari}
                                  </Text> 
                                  <Text>|</Text>
                                  <Text type="secondary" style={{ fontSize: isMobile ? 11 : 13, display: 'flex', alignItems: 'center' }}>
                                    <Clock size={13} style={{ marginRight: 4 }} /> {jam}
                                  </Text>
                                  <Text>|</Text>
                                  <Text type="secondary" style={{ fontSize: isMobile ? 11 : 13, display: 'flex', alignItems: 'center' }}>
                                    <CgUser size={13} style={{ marginRight: 4 }} /> <strong>{room.kapasitas}</strong> Total Kapasitas
                                  </Text>
                                </Space>
                                
                                {/* Main Features (Icons) */}
                                <MainFeatures features={room.fitur_ruangan} isMobile={isMobile} />

                                {/* Checklist Features (Fasilitas Detail) */}
                                <div style={{ 
                                    display: 'grid', 
                                    gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', 
                                    gap: isMobile ? '4px 10px' : '6px 12px', 
                                    marginTop: isMobile ? '8px' : '10px',
                                    marginBottom: isMobile ? '8px' : '10px',
                                }}> 
                                  {featuresList.map((feature, index) => ( 
                                    <div key={index} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                      <CheckCircle size={isMobile ? 14 : 16} color="#52c41a" />
                                      <span style={{ fontSize: isMobile ? 12 : 13 }}>{feature}</span> 
                                    </div>
                                  ))}
                                </div>
                                
                                {/* JADWAL HARI INI DITARUH DI SINI */}
                                <JadwalHariIni jadwalTerisi={room.jadwal_hari_ini || []} isMobile={isMobile} />

                              </div>
                              
                              {/* Konten Bawah: Harga dan Tombol (Horizontal) */}
                              <div 
                                style={{ 
                                  paddingTop: isMobile ? "10px" : "12px", 
                                  borderTop: "1px solid #f0f0f0", 
                                  display: "flex", 
                                  justifyContent: "space-between", 
                                  alignItems: "center",
                                  marginTop: isMobile ? '10px' : '12px', 
                                }}
                              >
                                <div style={{ lineHeight: 1 }}>
                                  <Text type="secondary" style={{ fontSize: isMobile ? 10 : 12, display: 'block', marginBottom: '2px', textTransform: 'uppercase' }}>
                                    Start from
                                  </Text>
                                  <Text
                                    strong
                                    style={{ fontSize: isMobile ? 22 : 26, color: '#000' }} 
                                  >
                                    {minPrice !== null ? formatRupiah(minPrice) : 'Harga belum diatur'}
                                  </Text>
                                  <Text 
                                    type="secondary" 
                                    style={{ 
                                        fontSize: isMobile ? 10 : 12, 
                                        display: 'block', 
                                        fontWeight: 'bold' // <--- DI-BOLD
                                    }}
                                  >
                                  </Text>
                                </div>

                                <Button
                                  type="primary"
                                  size={isMobile ? "middle" : "large"} 
                                  style={{
                                    background: getCategoryColor(),
                                    border: "none",
                                    height: isMobile ? 38 : 46, 
                                    width: isMobile ? '110px' : '140px',
                                    fontSize: isMobile ? 13 : 15,
                                    borderRadius: 8, 
                                  }}
                                  onClick={() =>
                                    navigate(`/roomdetail/${room.id_ruangan}`, { state: room })
                                  }
                                >
                                  Reserve Now
                                </Button>
                              </div>
                            </Col>
                          </Row>
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