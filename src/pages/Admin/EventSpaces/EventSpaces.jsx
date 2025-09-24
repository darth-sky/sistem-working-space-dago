import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../../providers/AuthProvider";
import { Card, Badge, Button, Modal, Descriptions, Tag, message, Tabs } from 'antd';
import { 
  EyeOutlined, 
  CheckCircleOutlined, 
  CloseCircleOutlined,
  ArrowLeftOutlined,
  CalendarOutlined,
  EnvironmentOutlined,
  TeamOutlined,
  ClockCircleOutlined,
  PhoneOutlined,
  MailOutlined,
  DollarOutlined
} from '@ant-design/icons';

const { TabPane } = Tabs;

const EventSpacesAdmin = () => {
  const navigate = useNavigate();
  const { userProfile } = useContext(AuthContext);
  const [selectedTab, setSelectedTab] = useState('pending');
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    if (userProfile.roles !== "admin_dago") {
      navigate("/");
    }
  }, [userProfile, navigate]);

  // Sample data untuk event space requests
  const eventRequests = {
    pending: [
      {
        id: 'ES001',
        customerName: 'Andi Wijaya',
        eventName: 'Workshop Digital Marketing',
        spaceName: 'Meeting Room Alpha',
        date: '2024-10-25',
        time: '09:00 - 17:00',
        duration: '8 jam',
        guests: 25,
        price: 2500000,
        phone: '+62 812-3456-7890',
        email: 'andi@example.com',
        description: 'Workshop tentang strategi digital marketing untuk UMKM. Membutuhkan ruang dengan proyektor dan sound system.',
        requirements: ['Proyektor', 'Sound System', 'WiFi', 'AC', 'Catering untuk 25 orang'],
        submittedAt: '2024-09-15 14:30',
        status: 'pending'
      },
      {
        id: 'ES002',
        customerName: 'Sarah Putri',
        eventName: 'Birthday Party',
        spaceName: 'Garden Hall',
        date: '2024-10-28',
        time: '18:00 - 22:00',
        duration: '4 jam',
        guests: 50,
        price: 4000000,
        phone: '+62 821-9876-5432',
        email: 'sarah@example.com',
        description: 'Pesta ulang tahun ke-25 dengan tema garden party. Dekorasi akan dibawa sendiri.',
        requirements: ['Sound System', 'Lighting', 'Tables & Chairs', 'Catering Area'],
        submittedAt: '2024-09-16 10:15',
        status: 'pending'
      },
      {
        id: 'ES003',
        customerName: 'PT Maju Bersama',
        eventName: 'Company Gathering',
        spaceName: 'Grand Ballroom',
        date: '2024-11-05',
        time: '08:00 - 16:00',
        duration: '8 jam',
        guests: 150,
        price: 12000000,
        phone: '+62 811-2233-4455',
        email: 'hr@majubersama.com',
        description: 'Acara gathering tahunan perusahaan dengan agenda presentasi, games, dan makan siang bersama.',
        requirements: ['Stage', 'Sound System', 'Proyektor', 'Catering untuk 150 orang', 'Dekorasi'],
        submittedAt: '2024-09-17 09:45',
        status: 'pending'
      }
    ],
    approved: [
      {
        id: 'ES004',
        customerName: 'Lisa Maharani',
        eventName: 'Wedding Reception',
        spaceName: 'Crystal Hall',
        date: '2024-10-20',
        time: '17:00 - 23:00',
        duration: '6 jam',
        guests: 200,
        price: 18000000,
        phone: '+62 813-5566-7788',
        email: 'lisa@example.com',
        status: 'approved',
        approvedAt: '2024-09-14 16:20'
      }
    ],
    rejected: [
      {
        id: 'ES005',
        customerName: 'Budi Santoso',
        eventName: 'Music Concert',
        spaceName: 'Main Hall',
        date: '2024-10-22',
        time: '19:00 - 23:00',
        duration: '4 jam',
        guests: 300,
        price: 15000000,
        phone: '+62 814-9988-7766',
        email: 'budi@example.com',
        status: 'rejected',
        rejectedAt: '2024-09-13 11:30',
        rejectionReason: 'Tanggal sudah terboking oleh event lain'
      }
    ]
  };

  const handleApprove = (eventId) => {
    message.success(`Event ${eventId} telah disetujui!`);
    setShowDetail(false);
    setSelectedEvent(null);
  };

  const handleReject = () => {
    if (!rejectReason.trim()) {
      message.error('Mohon isi alasan penolakan');
      return;
    }
    message.success(`Event ${selectedEvent?.id} telah ditolak`);
    setRejectModalVisible(false);
    setRejectReason('');
    setShowDetail(false);
    setSelectedEvent(null);
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR'
    }).format(price);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'approved': return 'success';
      case 'rejected': return 'error';
      default: return 'default';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending': return 'Menunggu Persetujuan';
      case 'approved': return 'Disetujui';
      case 'rejected': return 'Ditolak';
      default: return status;
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

  // Card List View
  const CardListView = () => (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Event Space Approval</h1>
        <p className="text-gray-600">Kelola persetujuan booking event space</p>
      </div>

      <Card className="shadow-md mb-6">
        <Tabs 
          activeKey={selectedTab} 
          onChange={setSelectedTab}
          items={[
            {
              key: 'pending',
              label: `Menunggu Persetujuan (${eventRequests.pending.length})`,
            },
            {
              key: 'approved', 
              label: `Disetujui (${eventRequests.approved.length})`,
            },
            {
              key: 'rejected',
              label: `Ditolak (${eventRequests.rejected.length})`,
            }
          ]}
        />
      </Card>

      <div className="flex flex-col gap-4">
        {eventRequests[selectedTab].map((event) => (
          <Card 
            key={event.id}
            className="shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer hover:border-blue-400"
            onClick={() => handleCardClick(event)}
          >
            <div className="mb-4">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-lg font-semibold text-gray-900 truncate flex-1 pr-2">
                  {event.eventName}
                </h3>
                <Badge 
                  status={getStatusColor(event.status)} 
                  text={getStatusText(event.status)}
                />
              </div>
              <p className="text-sm text-gray-500">{event.id}</p>
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex items-center text-sm text-gray-600">
                <TeamOutlined className="mr-2" />
                <span className="truncate">{event.customerName}</span>
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <EnvironmentOutlined className="mr-2" />
                <span className="truncate">{event.spaceName}</span>
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <CalendarOutlined className="mr-2" />
                <span>{event.date}</span>
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <DollarOutlined className="mr-2" />
                <span className="font-semibold text-green-600">{formatPrice(event.price)}</span>
              </div>
            </div>

            <div className="border-t pt-4">
              <Button 
                type="primary" 
                block 
                icon={<EyeOutlined />}
                onClick={(e) => {
                  e.stopPropagation();
                  handleCardClick(event);
                }}
              >
                Lihat Detail
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {eventRequests[selectedTab].length === 0 && (
        <Card className="shadow-md text-center py-12">
          <div className="text-gray-400 mb-4">
            <CalendarOutlined style={{ fontSize: '48px' }} />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Tidak ada event</h3>
          <p className="text-gray-600">Belum ada event space yang {getStatusText(selectedTab).toLowerCase()}</p>
        </Card>
      )}
    </div>
  );

  // Detail View
  const DetailView = () => (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-6">
        <div className="flex items-center space-x-4 mb-4">
          <Button 
            icon={<ArrowLeftOutlined />}
            onClick={handleBackToList}
            type="text"
            className="text-gray-600 hover:text-gray-900"
          >
            Kembali
          </Button>
        </div>
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{selectedEvent?.eventName}</h1>
            <p className="text-gray-600 mt-2">ID: {selectedEvent?.id}</p>
          </div>
          <Badge 
            status={getStatusColor(selectedEvent?.status)} 
            text={getStatusText(selectedEvent?.status)}
            className="text-base"
          />
        </div>
      </div>

      <Card className="shadow-md">
        <div className="grid md:grid-cols-3 gap-8 mb-6">
          {/* Customer Info */}
          <div>
            <h3 className="text-lg font-semibold mb-4 border-b pb-2">Informasi Customer</h3>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">Nama</p>
                <p className="font-medium">{selectedEvent?.customerName}</p>
              </div>
              <div className="flex items-center text-gray-600">
                <PhoneOutlined className="mr-2" />
                <span>{selectedEvent?.phone}</span>
              </div>
              <div className="flex items-center text-gray-600">
                <MailOutlined className="mr-2" />
                <span>{selectedEvent?.email}</span>
              </div>
            </div>
          </div>

          {/* Event Details */}
          <div>
            <h3 className="text-lg font-semibold mb-4 border-b pb-2">Detail Event</h3>
            <div className="space-y-3">
              <div className="flex items-center text-gray-600">
                <EnvironmentOutlined className="mr-2" />
                <span>{selectedEvent?.spaceName}</span>
              </div>
              <div className="flex items-center text-gray-600">
                <CalendarOutlined className="mr-2" />
                <span>{selectedEvent?.date}</span>
              </div>
              <div className="flex items-center text-gray-600">
                <ClockCircleOutlined className="mr-2" />
                <span>{selectedEvent?.time} ({selectedEvent?.duration})</span>
              </div>
              <div className="flex items-center text-gray-600">
                <TeamOutlined className="mr-2" />
                <span>{selectedEvent?.guests} orang</span>
              </div>
            </div>
          </div>

          {/* Price & Status */}
          <div>
            <h3 className="text-lg font-semibold mb-4 border-b pb-2">Informasi Lainnya</h3>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">Total Biaya</p>
                <div className="flex items-center text-green-600 font-semibold text-xl">
                  <DollarOutlined className="mr-1" />
                  {formatPrice(selectedEvent?.price)}
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-500">Waktu Submit</p>
                <p>{selectedEvent?.submittedAt}</p>
              </div>
              {selectedEvent?.approvedAt && (
                <div>
                  <p className="text-sm text-gray-500">Waktu Disetujui</p>
                  <p>{selectedEvent?.approvedAt}</p>
                </div>
              )}
              {selectedEvent?.rejectedAt && (
                <div>
                  <p className="text-sm text-gray-500">Waktu Ditolak</p>
                  <p>{selectedEvent?.rejectedAt}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Description */}
        {selectedEvent?.description && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-semibold mb-3">Deskripsi Event</h4>
            <p className="text-gray-700 leading-relaxed">{selectedEvent?.description}</p>
          </div>
        )}

        {/* Requirements */}
        {selectedEvent?.requirements && (
          <div className="mb-6">
            <h4 className="font-semibold mb-3">Kebutuhan Fasilitas</h4>
            <div className="flex flex-wrap gap-2">
              {selectedEvent?.requirements.map((req, index) => (
                <Tag key={index} color="blue">{req}</Tag>
              ))}
            </div>
          </div>
        )}

        {/* Rejection Reason */}
        {selectedEvent?.rejectionReason && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <h4 className="font-semibold text-red-900 mb-2">Alasan Penolakan</h4>
            <p className="text-red-700">{selectedEvent?.rejectionReason}</p>
          </div>
        )}

        {/* Action Buttons */}
        {selectedEvent?.status === 'pending' && (
          <div className="border-t pt-6">
            <div className="flex justify-end space-x-4">
              <Button 
                danger
                size="large"
                icon={<CloseCircleOutlined />}
                onClick={() => setRejectModalVisible(true)}
              >
                Tolak Event
              </Button>
              <Button 
                type="primary"
                size="large"
                icon={<CheckCircleOutlined />}
                onClick={() => handleApprove(selectedEvent?.id)}
              >
                Setujui Event
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Reject Modal */}
      <Modal
        title="Tolak Event Space"
        open={rejectModalVisible}
        onOk={handleReject}
        onCancel={() => {
          setRejectModalVisible(false);
          setRejectReason('');
        }}
        okText="Tolak"
        cancelText="Batal"
        okButtonProps={{ danger: true }}
      >
        <p className="mb-4">Anda yakin ingin menolak event <strong>{selectedEvent?.eventName}</strong>?</p>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Alasan Penolakan *
          </label>
          <textarea
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            rows={4}
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Masukkan alasan penolakan..."
          />
        </div>
      </Modal>
    </div>
  );

  return showDetail ? <DetailView /> : <CardListView />;
};

export default EventSpacesAdmin;