import React, { useEffect, useState, useContext } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  Typography,
  Button,
  Carousel,
  Row,
  Col,
  Divider,
  message,
  Modal,
  Spin,
  Form,
  Input,
  InputNumber,
  Alert,
  Card,
  TimePicker,
} from "antd";
import {
  LeftOutlined,
  RightOutlined,
  UserOutlined,
  CalendarOutlined,
  // Ikon-ikon lain diimpor, tetapi tidak ada yang spesifik untuk fasilitas
} from "@ant-design/icons";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { AuthContext } from "../../../providers/AuthProvider";
import { jwtStorage } from "../../../utils/jwtStorage";
import moment from "moment";

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

// --- Konstanta dan Fungsi Backend ---
const API_BASE_URL = import.meta.env.VITE_BASE_URL;

// Definisikan Batasan Jam Operasional
const OPENING_HOUR = 8; // Jam 08:00
const CLOSING_HOUR = 22; // Jam 22:00
const MIN_DURATION_HOURS = 6; // Minimum sewa 6 jam

// Fetch detail ruang
const getEventSpaceById = async (id) => {
  const res = await fetch(`${API_BASE_URL}/api/v1/event-spaces/${id}`);
  if (!res.ok) throw new Error("Gagal memuat data ruangan.");
  return res.json();
};

// Create booking
const createBooking = async (data, token) => {
  const res = await fetch(`${API_BASE_URL}/api/v1/eventspaces/bookingEvent`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  const text = await res.text();
  let result = {};
  try {
    result = JSON.parse(text);
  } catch (e) {
    throw new Error(`Response bukan JSON: ${text}`);
  }
  if (!res.ok) throw new Error(result.message || "Gagal menyimpan booking.");
  return { ...result, data };
};

// --- Komponen Utama ---

const DetailEventSpaces = () => {
  const { state } = useLocation();
  const { id } = useParams();
  const navigate = useNavigate();
  const { userProfile } = useContext(AuthContext);

  const [roomData, setRoomData] = useState(state);
  const [loading, setLoading] = useState(!state);
  const [modalVisible, setModalVisible] = useState(false);
  const [bookingData, setBookingData] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);

  const [form] = Form.useForm();
  // Gunakan useWatch untuk memantau Jam Mulai
  const startTimeMoment = Form.useWatch("waktu_mulai", form); 

  // --- Efek dan Handler ---
  useEffect(() => {
    if (!roomData) {
      setLoading(true);
      getEventSpaceById(id)
        .then(setRoomData)
        .catch(() => {
          message.error("Gagal memuat data. Redirecting...");
          setTimeout(() => navigate("/event-spaces"), 2000);
        })
        .finally(() => setLoading(false));
    }
  }, [id, roomData, navigate]);

  const handleDateSelect = (date) => {
    setSelectedDate(date);
    // Ini penting agar Form.Item 'tanggal_display' ter-trigger validasi
    form.setFieldsValue({ tanggal_display: date ? date.toLocaleDateString() : '' });
    form.validateFields(['tanggal_display']);
  };

  const formatDateTimeSQL = (momentObject) => {
    return momentObject ? momentObject.format("HH:mm:ss") : null;
  };

  const handleSubmit = async (values) => {
    if (!selectedDate) return message.error("Tanggal booking belum dipilih!");
    if (!userProfile?.id_user)
      return message.error("Anda harus login untuk mengajukan booking.");

    const finalData = {
      id_user: userProfile.id_user,
      id_event_space: roomData.id_event_space,
      tanggal_event: selectedDate.toISOString().split("T")[0],
      waktu_mulai: formatDateTimeSQL(values.waktu_mulai),
      waktu_selesai: formatDateTimeSQL(values.waktu_selesai),
      nama_acara: values.nama_acara,
      deskripsi: values.deskripsi,
      jumlah_peserta: values.jumlah_peserta,
      kebutuhan_tambahan: values.kebutuhan_tambahan || "-",
      email_customer: userProfile.user_logged,
    };

    try {
      setSubmitting(true);
      const token = await jwtStorage.retrieveToken();
      const result = await createBooking(finalData, token);

      setBookingData({
        ...finalData,
        booking_id: result?.data?.booking_id || "-",
        nama_ruangan: roomData.nama_event_space,
      });
      setModalVisible(true);
      message.success("Booking berhasil! Notifikasi email admin terkirim.");
    } catch (err) {
      console.error("❌ Error saat submit booking:", err);
      message.error(err.message || "Gagal menyimpan booking.");

      setBookingData({
        ...finalData,
        booking_id: "-",
        nama_ruangan: roomData.nama_event_space,
      });
      setModalVisible(true);
    } finally {
      setSubmitting(false);
    }
  };

  // --- Logic TimePicker Jam Mulai (Jam Buka: 8, Jam Tutup: 22) ---
  const disabledHours = () => {
    let hoursToDisable = [];

    // 1. Batasi di luar jam operasional (sebelum 8 dan mulai dari 22)
    for (let i = 0; i < OPENING_HOUR; i++) {
      hoursToDisable.push(i);
    }
    // Hanya bisa memilih hingga jam 21:00 (agar ada waktu 1 jam ke 22:00)
    for (let i = CLOSING_HOUR; i <= 23; i++) { 
      hoursToDisable.push(i);
    }

    // 2. Batasi jam yang sudah lewat (hanya jika tanggalnya hari ini)
    if (selectedDate && moment(selectedDate).isSame(moment(), 'day')) {
      const currentHour = moment().hour();
      // Disable jam yang sama atau sebelumnya
      for (let i = 0; i <= currentHour; i++) {
        if (!hoursToDisable.includes(i)) {
          hoursToDisable.push(i);
        }
      }
    }
    
    return hoursToDisable.sort((a, b) => a - b);
  };

  // --- Logic TimePicker Jam Selesai (Diperbarui) ---
  const disabledEndHours = () => {
    let hoursToDisable = [];

    // 1. Batasi di luar jam operasional (sebelum 8 dan mulai dari 23)
    for (let i = 0; i < OPENING_HOUR; i++) {
      hoursToDisable.push(i);
    }
    for (let i = CLOSING_HOUR + 1; i <= 23; i++) {
      hoursToDisable.push(i);
    }
    
    // 2. Tambahkan batasan jam yang sudah lewat (jika hari ini)
    if (selectedDate && moment(selectedDate).isSame(moment(), 'day')) {
      const currentHour = moment().hour();
      for (let i = 0; i < currentHour; i++) {
         if (!hoursToDisable.includes(i)) {
          hoursToDisable.push(i);
        }
      }
    }

    // 3. BATASAN BARU: Disable hours before the start time
    if (startTimeMoment) {
        const startHour = startTimeMoment.hour();
        // Disable semua jam dari jam buka (8) hingga satu jam sebelum jam mulai yang dipilih
        for (let i = OPENING_HOUR; i < startHour; i++) {
            if (!hoursToDisable.includes(i)) {
                hoursToDisable.push(i);
            }
        }
    }

    return hoursToDisable.sort((a, b) => a - b);
  };

  // --- Logic Fasilitas ---
  const getFeatures = (featureString) => {
    if (!featureString) return [];
    // Membagi string berdasarkan baris baru (\n), lalu menghapus spasi di awal/akhir setiap baris
    return featureString.split('\n').map(feature => feature.trim()).filter(feature => feature.length > 0);
  };
  
  const facilities = getFeatures(roomData?.fitur_ruangan);

  if (loading || !roomData)
    return (
      <Spin size="large" style={{ display: "block", margin: "100px auto" }} />
    );

  // 💡 LOGIKA GALERI GAMBAR
  const mainImage = `${import.meta.env.VITE_BASE_URL}/static/${roomData.gambar_ruangan}`;
  
  let images = [mainImage];
  
  // Asumsi: Jika ada array galeri_gambar di roomData, gunakan itu.
  if (roomData.galeri_gambar && Array.isArray(roomData.galeri_gambar) && roomData.galeri_gambar.length > 0) {
      images = roomData.galeri_gambar.map(imgName => 
          `${import.meta.env.VITE_BASE_URL}/static/${imgName}`
      );
  } else if (images.length === 1) {
      // Jika hanya ada satu gambar, duplikasi 3 kali agar Carousel tidak kosong
      images = [mainImage, mainImage, mainImage];
  }


  return (
    <div style={{ background: "#f0f2f5", padding: 24, minHeight: "100vh" }}>
      <Row justify="center">
        <Col xs={24} sm={24} md={22} lg={20} xl={18}>
          <Card
            style={{
              borderRadius: 16,
              boxShadow: "0 6px 20px rgba(0,0,0,0.1)",
              padding: 0,
            }}
            bodyStyle={{ padding: 0 }}
          >
            <Row gutter={[0, 0]}>
              {/* KOLOM KIRI: GALERI GAMBAR DAN DETAIL RUANGAN */}
              <Col 
                xs={24} 
                lg={12} 
                style={{ 
                    backgroundColor: '#e6f7ff', 
                    padding: 32, 
                    borderTopLeftRadius: 16, 
                    // Terapkan border-radius hanya jika di desktop
                    borderBottomLeftRadius: window.innerWidth >= 992 ? 16 : 0, 
                    ...(window.innerWidth < 992 && { borderTopRightRadius: 16 })
                }}
              >
                <Title level={2} style={{ color: '#0056b3', marginBottom: 24, textAlign: 'center' }}>
                  {roomData.nama_event_space}
                </Title>
                
                {/* Carousel Galeri Gambar */}
                <Carousel
                  autoplay
                  arrows
                  dotPosition="bottom"
                  prevArrow={<LeftOutlined style={{ color: 'white', fontSize: '24px' }} />}
                  nextArrow={<RightOutlined style={{ color: 'white', fontSize: '24px' }} />}
                  style={{ 
                      borderRadius: 12, 
                      overflow: 'hidden', 
                      marginBottom: 24, 
                      boxShadow: '0 4px 10px rgba(0,0,0,0.2)' 
                    }}
                >
                  {images.map((src, i) => (
                    <div key={i}>
                      <img
                        src={src}
                        alt={`Event ${i}`}
                        style={{
                          width: "100%",
                          height: 350, 
                          objectFit: "cover",
                        }}
                      />
                    </div>
                  ))}
                </Carousel>

                <Title level={5} style={{ color: '#0056b3' }}>Deskripsi Ruangan:</Title>
                {/* PERUBAHAN 1: Rata kanan kiri (Justify) */}
                <Paragraph style={{ color: '#595959', textAlign: 'justify' }}>{roomData.deskripsi_event_space}</Paragraph>
                <Divider style={{ borderColor: '#a6d9ff' }} />
                <Text strong style={{ color: '#0056b3', display: 'block', marginBottom: 8 }}>✨ Kapasitas Maksimal: {roomData.kapasitas} orang</Text>
                <Text strong style={{ color: '#0056b3', display: 'block' }}>✨ Fasilitas:</Text>
                
                {/* PERUBAHAN 2: Menampilkan fasilitas dengan enter (pemisah baris) TANPA ICON */}
                <ul style={{ paddingLeft: 20, marginTop: 8 }}> {/* Menggunakan padding default untuk bullet point */}
                    {facilities.map((feature, index) => (
                        // Menggunakan list-style: disc (default)
                        <li key={index} style={{ marginBottom: 4, color: '#595959' }}>
                            {feature}
                        </li>
                    ))}
                </ul>
              </Col>

              {/* KOLOM KANAN: FORM BOOKING */}
              <Col xs={24} lg={12} style={{ padding: 32 }}>
                <Title level={3} style={{ marginBottom: 24, color: '#0056b3', textAlign: 'center' }}>
                  Formulir Pengajuan Booking
                </Title>
                <Form form={form} layout="vertical" onFinish={handleSubmit}>
                  <Row gutter={16}>
                    <Col xs={24} sm={12}>
                      <Form.Item
                        name="nama_acara"
                        label="Nama Acara"
                        rules={[{ required: true, message: "Nama acara wajib diisi" }]}
                      >
                        <Input 
                            placeholder="Contoh: Rapat Tahunan" 
                            prefix={<UserOutlined style={{ color: '#1890ff' }} />}
                        />
                      </Form.Item>
                    </Col>
                    <Col xs={24} sm={12}>
                      <Form.Item
                        name="jumlah_peserta"
                        label={`Jumlah Peserta (Maks: ${roomData.kapasitas})`}
                        rules={[
                          { required: true, message: "Jumlah peserta wajib diisi" },
                          { type: "number", min: 1, message: "Peserta minimal 1" },
                          { type: "number", max: roomData.kapasitas, message: `Peserta maksimal ${roomData.kapasitas}` },
                        ]}
                      >
                        <InputNumber
                          min={1}
                          max={roomData.kapasitas}
                          style={{ width: "100%" }}
                          placeholder="Jumlah peserta"
                          // Hapus prefix dari InputNumber karena AntD membuatnya terlihat aneh.
                        />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Form.Item
                    name="deskripsi"
                    label="Deskripsi Acara"
                    rules={[{ required: true, message: "Deskripsi acara wajib diisi" }]}
                  >
                    <TextArea
                      rows={3}
                      maxLength={200}
                      placeholder="Deskripsi singkat acara (maks. 200 karakter)"
                    />
                  </Form.Item>

                  <Form.Item name="kebutuhan_tambahan" label="Kebutuhan Tambahan (Opsional)">
                    <TextArea rows={2} maxLength={200} placeholder="Contoh: Proyektor tambahan, catering, dll." />
                  </Form.Item>

                  <Divider orientation="left">Pilih Tanggal & Waktu (08:00 - 22:00, Min. {MIN_DURATION_HOURS} Jam)</Divider>

                  {/* Input Tampilan Tanggal */}
                  <Form.Item
                      name="tanggal_display"
                      label="Tanggal Event"
                      rules={[
                        { required: true, message: "Silakan pilih tanggal booking" },
                      ]}
                  >
                    <Input
                        readOnly
                        placeholder="Pilih Tanggal"
                        value={selectedDate ? selectedDate.toLocaleDateString("id-ID", { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : ''}
                        suffix={<CalendarOutlined style={{ color: '#1890ff' }} />}
                        onClick={() => { /* Open custom date picker modal if needed, here we just show the calendar below */ }}
                        style={{ cursor: 'pointer' }}
                    />
                  </Form.Item>
                  
                  {/* DayPicker/Kalender */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "center",
                      backgroundColor: 'white',
                      border: selectedDate ? "2px solid #1890ff" : "1px solid #d9d9d9",
                      borderRadius: 12,
                      padding: 10,
                      marginBottom: 24
                    }}
                  >
                    <DayPicker
                      mode="single"
                      selected={selectedDate}
                      onSelect={handleDateSelect}
                      disabled={{ before: new Date() }}
                      styles={{
                        caption: { color: '#0056b3' },
                        head_row: { color: '#1890ff' },
                      }}
                    />
                  </div>
                  
                  <Row gutter={16}>
                    <Col xs={24} sm={12}>
                      <Form.Item
                        name="waktu_mulai"
                        label="Jam Mulai"
                        rules={[{ required: true, message: "Pilih Jam Mulai" }]}
                      >
                        <TimePicker
                          format="HH:00"
                          minuteStep={60}
                          placeholder="Pilih Jam Mulai"
                          style={{ width: "100%" }}
                          disabledHours={disabledHours}
                          hideDisabledOptions={true}
                          allowClear={false}
                          use12Hours={false}
                        />
                      </Form.Item>
                    </Col>
                    <Col xs={24} sm={12}>
                      <Form.Item
                        name="waktu_selesai"
                        label="Jam Selesai"
                        dependencies={['waktu_mulai']} // Ditambahkan kembali untuk memicu validasi
                        rules={[
                          { required: true, message: "Pilih Jam Selesai" },
                          ({ getFieldValue }) => ({
                            validator(_, value) {
                              if (!value || !startTimeMoment) {
                                return Promise.resolve();
                              }

                              // 1. Durasi Minimal 6 Jam
                              const minEndTime = startTimeMoment.clone().add(MIN_DURATION_HOURS, 'hours');
                              if (value.isBefore(minEndTime)) {
                                const minTimeDisplay = minEndTime.format('HH:00');
                                return Promise.reject(new Error(`Durasi sewa minimal ${MIN_DURATION_HOURS} jam (sampai jam ${minTimeDisplay})`));
                              }

                              // 2. Tidak boleh lewat dari jam 22:00
                              const closingHour = CLOSING_HOUR;
                              if (value.hour() > closingHour || (value.hour() === closingHour && value.minute() > 0)) {
                                return Promise.reject(new Error(`Jam Selesai tidak boleh melebihi jam ${CLOSING_HOUR}:00`));
                              }
                              
                              return Promise.resolve();
                            },
                          }),
                        ]}
                      >
                        <TimePicker
                          format="HH:00"
                          minuteStep={60}
                          placeholder="Pilih Jam Selesai"
                          style={{ width: "100%" }}
                          disabledHours={disabledEndHours}
                          hideDisabledOptions={true}
                          disabled={!startTimeMoment} // Kembali didisable jika Jam Mulai belum diisi
                          allowClear={false}
                          use12Hours={false}
                        />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Alert
                    message="Persetujuan Admin"
                    description="Pengajuan Anda akan dikirim otomatis ke admin. Status booking akan diperbarui setelah ditinjau."
                    type="info"
                    showIcon
                    style={{ borderRadius: 8, marginBottom: 24, backgroundColor: '#e6f7ff', borderColor: '#1890ff' }}
                  />

                  <Form.Item>
                    <Button
                      type="primary"
                      htmlType="submit"
                      loading={submitting}
                      block
                      size="large"
                      style={{ height: 50, borderRadius: 10, fontSize: '16px', fontWeight: 'bold' }}
                    >
                      KIRIM PENGAJUAN BOOKING
                    </Button>
                  </Form.Item>
                </Form>
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>

      {/* Modal Ringkasan Booking */}
      <Modal
        title={<Title level={4} style={{ color: '#0056b3' }}>✅ Ringkasan Pengajuan Booking</Title>}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setModalVisible(false)}>
            Tutup
          </Button>,
          <Button
            key="riwayat"
            type="primary"
            onClick={() => {
                setModalVisible(false);
                navigate("/riwayat-transaksi");
            }}
          >
            Lihat Riwayat Booking
          </Button>,
        ]}
      >
        {bookingData && (
          <Card bordered={true} style={{ background: '#f5f5f5', borderRadius: 8 }}>
            <Title level={5} style={{ color: '#0056b3' }}>Pengajuan Terkirim!</Title>
            <Divider style={{ margin: '10px 0' }} />
            <Row gutter={[16, 8]}>
                <Col span={24}>
                    <Text strong>ID Booking:</Text> <Text copyable>{bookingData.booking_id}</Text>
                </Col>
                <Col span={24}>
                    <Text strong>Ruangan:</Text> {bookingData.nama_ruangan}
                </Col>
                <Col span={24}>
                    <Text strong>Nama Acara:</Text> {bookingData.nama_acara}
                </Col>
                <Col span={24}>
                    <Text strong>Tanggal:</Text>{" "}
                    {new Date(
                      bookingData.tanggal_event + "T00:00:00"
                    ).toLocaleDateString("id-ID", {
                      weekday: "long", year: "numeric", month: "long", day: "numeric",
                    })}
                </Col>
                <Col span={24}>
                    <Text strong>Jam:</Text> {bookingData.waktu_mulai.substring(0, 5)} -{" "}
                    {bookingData.waktu_selesai.substring(0, 5)}
                </Col>
                <Col span={24}>
                    <Text strong>Peserta:</Text> {bookingData.jumlah_peserta}
                </Col>
                <Col span={24}>
                    <Text strong>Kebutuhan Tambahan:</Text>{" "}
                    {bookingData.kebutuhan_tambahan}
                </Col>
            </Row>
          </Card>
        )}
      </Modal>
    </div>
  );
};

export default DetailEventSpaces;