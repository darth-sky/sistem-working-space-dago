// File: DetailEventSpaces.jsx
import React, { useEffect, useState, useContext } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  Typography,
  Button,
  Carousel,
  Row,
  Col,
  Space,
  Divider,
  message,
  Modal,
  Spin,
} from "antd";
import { LeftOutlined, RightOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import moment from "moment";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { formatRupiah } from "../../../utils/formatRupiah";
import { getEventSpaceById, createBooking } from "../../../services/service";
import { AuthContext } from "../../../providers/AuthProvider";
import FeatureList from "../../../components/FeatureList";

const { Title, Text, Paragraph } = Typography;

const DetailEventSpaces = () => {
  const { state } = useLocation();
  const { id } = useParams();
  const navigate = useNavigate();
  const { userProfile } = useContext(AuthContext);

  const [roomData, setRoomData] = useState(state);
  const [loading, setLoading] = useState(!state);
  const [modalVisible, setModalVisible] = useState(false);
  const [bookingData, setBookingData] = useState(null);
  const [submitting, setSubmitting] = useState(false); // Loading untuk submit

  // State booking
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedStartTime, setSelectedStartTime] = useState(null);
  const [selectedEndTime, setSelectedEndTime] = useState(null);
  const [duration, setDuration] = useState(0);
  const [description, setDescription] = useState("");

  const today = new Date();
  const todayHour = today.getHours();

  // Ambil data dari API jika state kosong
  useEffect(() => {
    if (!roomData) {
      const fetchRoomData = async () => {
        setLoading(true);
        try {
          const data = await getEventSpaceById(id);
          setRoomData(data);
        } catch (error) {
          message.error(
            "Gagal memuat data event space. Anda akan diarahkan kembali."
          );
          setTimeout(() => navigate("/event-spaces"), 2000);
        } finally {
          setLoading(false);
        }
      };
      fetchRoomData();
    }
  }, [id, roomData, navigate]);

  // Hitung durasi
  useEffect(() => {
    if (selectedStartTime !== null && selectedEndTime !== null) {
      setDuration(selectedEndTime - selectedStartTime);
    } else {
      setDuration(0);
    }
  }, [selectedStartTime, selectedEndTime]);

  const calculateTotalPrice = () => {
    const hourlyRate = Number(roomData?.harga_paket) || 0;
    return hourlyRate * duration;
  };

  const timeSlots = Array.from({ length: 15 }, (_, i) => 8 + i); // 08:00 - 22:00

  // Submit booking
  const handleBooking = async () => {
    if (!selectedStartTime || !selectedEndTime) {
      message.warning("Silakan pilih jam mulai dan jam selesai terlebih dahulu.");
      return;
    }

    const finalBookingData = {
      id_event_space: roomData.id_event_space,
      id_user: userProfile?.id_user || null,
      tanggal_event: dayjs(selectedDate).format("YYYY-MM-DD"),
      waktu_mulai: dayjs(selectedDate)
        .hour(selectedStartTime)
        .minute(0)
        .second(0)
        .format("YYYY-MM-DD HH:mm:ss"),
      waktu_selesai: dayjs(selectedDate)
        .hour(selectedEndTime)
        .minute(0)
        .second(0)
        .format("YYYY-MM-DD HH:mm:ss"),
      total_harga_final: calculateTotalPrice(),
      nama_pemesan: userProfile?.name || "Guest",
      deskripsi_event: description,
    };

    try {
      setSubmitting(true);
      const result = await createBooking(finalBookingData);
      setBookingData(finalBookingData);
      setModalVisible(true);
      message.success("Booking berhasil dikirim!");
      console.log("Booking result:", result);
    } catch (error) {
      message.error("Gagal menyimpan booking ke database");
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  // Komponen navigasi Carousel
  const CustomPrevArrow = ({ onClick }) => (
    <Button
      shape="circle"
      icon={<LeftOutlined />}
      onClick={onClick}
      style={{
        position: "absolute",
        left: 10,
        top: "50%",
        zIndex: 1,
        background: "rgba(255,255,255,0.7)",
      }}
    />
  );
  const CustomNextArrow = ({ onClick }) => (
    <Button
      shape="circle"
      icon={<RightOutlined />}
      onClick={onClick}
      style={{
        position: "absolute",
        right: 10,
        top: "50%",
        zIndex: 1,
        background: "rgba(255,255,255,0.7)",
      }}
    />
  );

  if (loading || !roomData) {
    return (
      <Spin size="large" style={{ display: "block", margin: "100px auto" }} />
    );
  }

  const images = [`http://localhost:5000/static/${roomData.gambar_ruangan}`];

  return (
    <div style={{ background: "#fff" }}>
      {/* HERO */}
      <div style={{ padding: "60px 5%" }}>
        <Row gutter={[48, 48]} align="middle">
          <Col xs={24} md={12}>
            <Space direction="vertical" size="large" style={{ width: "100%" }}>
              <div>
                <Text type="secondary" style={{ fontSize: 14 }}>
                  PAKET SEWA
                </Text>
                <Title level={1} style={{ marginTop: 8 }}>
                  {roomData.nama_event_space}
                </Title>
              </div>
              <Paragraph style={{ fontSize: 16, lineHeight: 1.8 }}>
                {roomData.deskripsi_event_space}
              </Paragraph>
              <div>
                <Text style={{ fontSize: 14, color: "#555" }}>Harga / Jam</Text>
                <Title
                  level={3}
                  style={{ margin: "8px 0", color: "#111" }}
                >{`${formatRupiah(roomData.harga_paket)}`}</Title>
              </div>
              <FeatureList
                featureString={roomData.fitur_ruangan}
                separator="#"
              />
            </Space>
          </Col>
          <Col xs={24} md={12}>
            <Carousel
              autoplay
              arrows
              prevArrow={<CustomPrevArrow />}
              nextArrow={<CustomNextArrow />}
              style={{ borderRadius: 12, overflow: "hidden" }}
            >
              {images.map((img, i) => (
                <div key={i}>
                  <img
                    src={img}
                    alt={`${roomData.nama_event_space} ${i + 1}`}
                    style={{
                      width: "100%",
                      height: "400px",
                      objectFit: "cover",
                    }}
                  />
                </div>
              ))}
            </Carousel>
          </Col>
        </Row>
      </div>

      {/* FORM BOOKING */}
      <Divider />
      <div
        style={{
          padding: "40px 5%",
          background: "#fafafa",
          minHeight: "500px",
        }}
      >
        <Title level={3} style={{ textAlign: "center", marginBottom: 24 }}>
          Form Pemesanan
        </Title>

        <div
          style={{
            maxWidth: 800,
            margin: "0 auto",
            background: "#fff",
            padding: "40px",
            borderRadius: 12,
            boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
          }}
        >
          {/* Date Picker */}
          <div className="mb-6">
            <h4 className="font-semibold mb-3">Pilih Tanggal</h4>
            <DayPicker
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && setSelectedDate(date)}
              disabled={{ before: today }}
              className="mx-auto"
            />
          </div>

          {/* Start Time */}
          <div className="mb-6">
            <h4 className="font-semibold mb-2">Pilih Jam Mulai</h4>
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
              {timeSlots.map((hour) => {
                const isPastTime =
                  moment(selectedDate).isSame(moment(), "day") &&
                  hour <= todayHour;
                return (
                  <button
                    key={hour}
                    onClick={() => {
                      setSelectedStartTime(hour);
                      setSelectedEndTime(null);
                    }}
                    disabled={isPastTime}
                    className={`p-2 text-xs rounded-lg font-medium transition-all duration-200 ${
                      isPastTime
                        ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                        : selectedStartTime === hour
                        ? "bg-blue-600 text-white shadow-lg"
                        : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                    }`}
                  >
                    {`${String(hour).padStart(2, "0")}:00`}
                  </button>
                );
              })}
            </div>
          </div>

          {/* End Time */}
          {selectedStartTime !== null && (
            <div className="mb-6">
              <h4 className="font-semibold mb-2">Pilih Jam Selesai</h4>
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                {timeSlots.map((hour) => {
                  const isInvalidTime = hour <= selectedStartTime;
                  return (
                    <button
                      key={hour}
                      onClick={() => setSelectedEndTime(hour)}
                      disabled={isInvalidTime}
                      className={`p-2 text-xs rounded-lg font-medium transition-all duration-200 ${
                        isInvalidTime
                          ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                          : selectedEndTime === hour
                          ? "bg-blue-600 text-white shadow-lg"
                          : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                      }`}
                    >
                      {`${String(hour).padStart(2, "0")}:00`}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Duration & Total */}
          <div className="flex justify-between bg-gray-100 p-4 rounded-xl mb-6">
            <span className="font-semibold">Durasi</span>
            <span className="font-bold">{duration} jam</span>
          </div>

          <div className="flex justify-between bg-gray-100 p-4 rounded-xl mb-6">
            <span className="font-semibold">Total Harga</span>
            <span className="font-bold text-blue-600">
              {formatRupiah(calculateTotalPrice())}
            </span>
          </div>

          {/* Description */}
          <div className="mb-6">
            <label className="font-medium mb-2 block">
              Deskripsi Singkat Event
            </label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Contoh: Acara workshop digital marketing untuk 50 peserta."
              className="w-full border rounded-lg p-3"
            />
          </div>

          {/* Button */}
          <Button
            type="primary"
            block
            size="large"
            disabled={!selectedStartTime || !selectedEndTime || submitting}
            loading={submitting}
            onClick={handleBooking}
          >
            Kirim Permintaan Booking
          </Button>
        </div>
      </div>

      {/* MODAL */}
      <Modal
        open={modalVisible}
        title="Ringkasan Permintaan Booking"
        onCancel={() => setModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setModalVisible(false)}>
            Tutup
          </Button>,
          <Button
            key="riwayat"
            type="primary"
            onClick={() => navigate("/riwayat-transaksi")}
          >
            Lihat Riwayat
          </Button>,
        ]}
      >
        {bookingData && (
          <div style={{ lineHeight: 1.8 }}>
            <p>
              <strong>Nama Pemesan:</strong> {bookingData.nama_pemesan}
            </p>
            <p>
              <strong>Ruangan:</strong> {roomData.nama_event_space}
            </p>
            <p>
              <strong>Mulai:</strong>{" "}
              {dayjs(bookingData.waktu_mulai).format(
                "dddd, D MMMM YYYY HH:mm"
              )}
            </p>
            <p>
              <strong>Selesai:</strong>{" "}
              {dayjs(bookingData.waktu_selesai).format(
                "dddd, D MMMM YYYY HH:mm"
              )}
            </p>
            <p>
              <strong>Deskripsi:</strong> {bookingData.deskripsi_event}
            </p>
            <Divider />
            <p>
              <strong>Total Harga:</strong>{" "}
              <strong style={{ color: "#4f46e5" }}>
                {formatRupiah(bookingData.total_harga_final)}
              </strong>
            </p>
            <br />
            <Text type="secondary">
              Tim kami akan segera menghubungi Anda untuk konfirmasi
              selanjutnya.
            </Text>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default DetailEventSpaces;
