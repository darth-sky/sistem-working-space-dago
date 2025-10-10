// Ganti seluruh isi file Anda dengan kode di bawah ini.

import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../../providers/AuthProvider";
import { Card, Badge, Button, Modal, Spin, message, Tabs, Input } from 'antd';
import { 
  EyeOutlined, CheckCircleOutlined, CloseCircleOutlined, ArrowLeftOutlined,
  CalendarOutlined, EnvironmentOutlined, TeamOutlined, ClockCircleOutlined,
  PhoneOutlined, MailOutlined, DollarOutlined
} from '@ant-design/icons';
import { getAllEventBookings, approveEventBooking, rejectEventBooking } from '../../../services/service';

const { TextArea } = Input;

// --- PERUBAHAN 1: Komponen `CardListView` dikeluarkan ---
const CardListView = ({ bookings, selectedTab, setSelectedTab, handleCardClick }) => (
  <div className="p-6 bg-gray-50 min-h-screen">
    <div className="mb-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Manajemen Booking Event</h1>
      <p className="text-gray-600">Kelola persetujuan booking untuk event space.</p>
    </div>
    <Card className="shadow-md mb-6">
      <Tabs 
        activeKey={selectedTab} 
        onChange={setSelectedTab}
        items={[
          { key: 'pending', label: `Menunggu Persetujuan (${bookings.pending.length})` },
          { key: 'approved', label: `Disetujui (${bookings.approved.length})` },
          { key: 'rejected', label: `Ditolak (${bookings.rejected.length})` }
        ]}
      />
    </Card>
    <div className="flex flex-col gap-4">
      {bookings[selectedTab].map((event) => (
        <Card 
          key={event.id}
          className="shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer hover:border-blue-400"
          onClick={() => handleCardClick(event)}
        >
          <div className="mb-4">
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-lg font-semibold text-gray-900 truncate flex-1 pr-2">{event.eventName}</h3>
              <Badge status={getStatusColor(event.status)} text={getStatusText(event.status)} />
            </div>
            <p className="text-sm text-gray-500">ID: {event.id}</p>
          </div>
          <div className="space-y-2 mb-4">
            <div className="flex items-center text-sm text-gray-600"><TeamOutlined className="mr-2" /><span className="truncate">{event.customerName}</span></div>
            <div className="flex items-center text-sm text-gray-600"><EnvironmentOutlined className="mr-2" /><span className="truncate">{event.spaceName}</span></div>
            <div className="flex items-center text-sm text-gray-600"><CalendarOutlined className="mr-2" /><span>{new Date(event.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}</span></div>
            <div className="flex items-center text-sm text-gray-600"><DollarOutlined className="mr-2" /><span className="font-semibold text-green-600">{formatPrice(event.price)}</span></div>
          </div>
          <div className="border-t pt-4">
            <Button type="primary" block icon={<EyeOutlined />} onClick={(e) => { e.stopPropagation(); handleCardClick(event); }}>Lihat Detail</Button>
          </div>
        </Card>
      ))}
    </div>
    {bookings[selectedTab].length === 0 && (
      <Card className="shadow-md text-center py-12">
        <div className="text-gray-400 mb-4"><CalendarOutlined style={{ fontSize: '48px' }} /></div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Tidak Ada Data</h3>
        <p className="text-gray-600">Belum ada booking pada kategori ini.</p>
      </Card>
    )}
  </div>
);

// --- PERUBAHAN 2: Komponen `DetailView` dikeluarkan ---
const DetailView = ({ 
  selectedEvent, 
  handleBackToList, 
  setRejectModalVisible, 
  handleApprove, 
  rejectModalVisible, 
  handleReject, 
  rejectReason, 
  setRejectReason 
}) => (
  <div className="p-6 bg-gray-50 min-h-screen">
    <div className="mb-6">
      <Button icon={<ArrowLeftOutlined />} onClick={handleBackToList} type="text" className="text-gray-600 hover:text-gray-900 mb-4">Kembali</Button>
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{selectedEvent?.eventName}</h1>
          <p className="text-gray-600 mt-2">ID: {selectedEvent?.id}</p>
        </div>
        <Badge status={getStatusColor(selectedEvent?.status)} text={getStatusText(selectedEvent?.status)} className="text-base" />
      </div>
    </div>
    <Card className="shadow-md">
      <div className="grid md:grid-cols-3 gap-8 mb-6">
        <div>
          <h3 className="text-lg font-semibold mb-4 border-b pb-2">Informasi Customer</h3>
          <div className="space-y-3">
            <div><p className="text-sm text-gray-500">Nama</p><p className="font-medium">{selectedEvent?.customerName}</p></div>
            <div className="flex items-center text-gray-600"><PhoneOutlined className="mr-2" /><span>{selectedEvent?.phone}</span></div>
            <div className="flex items-center text-gray-600"><MailOutlined className="mr-2" /><span>{selectedEvent?.email}</span></div>
          </div>
        </div>
        <div>
          <h3 className="text-lg font-semibold mb-4 border-b pb-2">Detail Event</h3>
          <div className="space-y-3">
            <div className="flex items-center text-gray-600"><EnvironmentOutlined className="mr-2" /><span>{selectedEvent?.spaceName}</span></div>
            <div className="flex items-center text-gray-600"><CalendarOutlined className="mr-2" /><span>{new Date(selectedEvent?.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}</span></div>
            <div className="flex items-center text-gray-600"><ClockCircleOutlined className="mr-2" /><span>{selectedEvent?.time} ({selectedEvent?.duration} jam)</span></div>
            <div className="flex items-center text-gray-600"><TeamOutlined className="mr-2" /><span>{selectedEvent?.guests} orang</span></div>
          </div>
        </div>
        <div>
          <h3 className="text-lg font-semibold mb-4 border-b pb-2">Informasi Lainnya</h3>
          <div className="space-y-3">
            <div><p className="text-sm text-gray-500">Total Biaya</p><div className="flex items-center text-green-600 font-semibold text-xl"><DollarOutlined className="mr-1" />{formatPrice(selectedEvent?.price)}</div></div>
            <div><p className="text-sm text-gray-500">Waktu Submit</p><p>{new Date(selectedEvent?.submittedAt).toLocaleString('id-ID')}</p></div>
          </div>
        </div>
      </div>
      {selectedEvent?.description && (<div className="mb-6 p-4 bg-gray-50 rounded-lg"><h4 className="font-semibold mb-3">Deskripsi Event</h4><p className="text-gray-700 leading-relaxed">{selectedEvent?.description}</p></div>)}
      {selectedEvent?.requirements && (<div className="mb-6"><h4 className="font-semibold mb-3">Kebutuhan Fasilitas</h4><p className="text-gray-700 leading-relaxed">{selectedEvent?.requirements}</p></div>)}
      {selectedEvent?.rejectionReason && (<div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg"><h4 className="font-semibold text-red-900 mb-2">Alasan Penolakan</h4><p className="text-red-700">{selectedEvent?.rejectionReason}</p></div>)}
      {selectedEvent?.status === 'Baru' && (
        <div className="border-t pt-6"><div className="flex justify-end space-x-4">
          <Button danger size="large" icon={<CloseCircleOutlined />} onClick={() => setRejectModalVisible(true)}>Tolak Event</Button>
          <Button type="primary" size="large" icon={<CheckCircleOutlined />} onClick={() => handleApprove(selectedEvent?.id)}>Setujui Event</Button>
        </div></div>
      )}
    </Card>
    <Modal title="Tolak Event Space" open={rejectModalVisible} onOk={handleReject} onCancel={() => {setRejectModalVisible(false); setRejectReason('');}} okText="Tolak" cancelText="Batal" okButtonProps={{ danger: true }}>
      <p className="mb-4">Anda yakin ingin menolak event <strong>{selectedEvent?.eventName}</strong>?</p>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Alasan Penolakan *</label>
        <TextArea rows={4} value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="Masukkan alasan penolakan..." />
      </div>
    </Modal>
  </div>
);

// --- Fungsi helper diletakkan di luar agar bisa diakses oleh semua komponen ---
const formatPrice = (price) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(price || 0);
const getStatusColor = (status) => {
  switch (status) {
    case 'Baru': return 'warning';
    case 'Confirmed': case 'Selesai': return 'success';
    case 'Dibatalkan': return 'error';
    default: return 'default';
  }
};
const getStatusText = (status) => {
  switch (status) {
    case 'Baru': return 'Menunggu Persetujuan';
    case 'Confirmed': return 'Disetujui';
    case 'Selesai': return 'Selesai';
    case 'Dibatalkan': return 'Ditolak';
    default: return status;
  }
};


// --- PERUBAHAN 3: Komponen utama sekarang hanya berisi state dan logika ---
const EventSpacesAdmin = () => {
  const navigate = useNavigate();
  const { userProfile } = useContext(AuthContext);

  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState({ pending: [], approved: [], rejected: [] });
  const [refresh, setRefresh] = useState(0);
  const [selectedTab, setSelectedTab] = useState('pending');
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    if (userProfile && userProfile.roles !== "admin_dago") {
      message.error("Anda tidak memiliki akses ke halaman ini.");
      navigate("/");
    }
  }, [userProfile, navigate]);

  useEffect(() => {
    const fetchBookings = async () => {
      setLoading(true);
      try {
        const data = await getAllEventBookings();
        setBookings(data);
      } catch (error) {
        message.error(error.message || 'Gagal memuat data event.');
      } finally {
        setLoading(false);
      }
    };
    fetchBookings();
  }, [refresh]);

  const handleApprove = async (eventId) => {
    try {
      await approveEventBooking(eventId);
      message.success(`Event ${eventId} telah disetujui!`);
      setShowDetail(false);
      setSelectedEvent(null);
      setRefresh(prev => prev + 1);
    } catch (error) {
      message.error(error.message || 'Gagal menyetujui event.');
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      message.error('Mohon isi alasan penolakan');
      return;
    }
    try {
      await rejectEventBooking(selectedEvent?.id, rejectReason);
      message.success(`Event ${selectedEvent?.id} telah ditolak.`);
      setRejectModalVisible(false);
      setRejectReason('');
      setShowDetail(false);
      setSelectedEvent(null);
      setRefresh(prev => prev + 1);
    } catch (error) {
      message.error(error.message || 'Gagal menolak event.');
    }
  };

  const handleCardClick = (event) => {
    setSelectedEvent(event);
    setShowDetail(true);
  };

  const handleBackToList = () => {
    setShowDetail(false);
    setSelectedEvent(null);
  };

  if (loading) {
    return <div className="flex justify-center items-center h-screen"><Spin size="large" /></div>;
  }

  // --- PERUBAHAN 4: Render komponen anak dan teruskan props ---
  if (showDetail) {
    return (
      <DetailView 
        selectedEvent={selectedEvent}
        handleBackToList={handleBackToList}
        setRejectModalVisible={setRejectModalVisible}
        handleApprove={handleApprove}
        rejectModalVisible={rejectModalVisible}
        handleReject={handleReject}
        rejectReason={rejectReason}
        setRejectReason={setRejectReason}
      />
    );
  }

  return (
    <CardListView 
      bookings={bookings}
      selectedTab={selectedTab}
      setSelectedTab={setSelectedTab}
      handleCardClick={handleCardClick}
    />
  );
};

export default EventSpacesAdmin;

