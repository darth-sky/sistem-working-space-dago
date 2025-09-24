import React, { useState } from "react";
import {
  Table,
  Button,
  Input,
  Select,
  Modal,
  Space,
  Typography,
  Card,
  Row,
  Col,
  Pagination,
  Switch,
  message,
  Badge,
  Tooltip,
  Tag
} from "antd";
import {
  CalendarOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  ReloadOutlined,
  FilterOutlined,
  DownloadOutlined,
  UploadOutlined,
  SettingOutlined,
  UserOutlined,
  ShopOutlined,
  AppstoreOutlined,
  DatabaseOutlined,
  HomeOutlined,
  AccountBookOutlined,
  TeamOutlined,
  CrownOutlined,
  GiftOutlined,
  TagOutlined
} from "@ant-design/icons";

const { Title, Text } = Typography;
const { Option } = Select;

const MasterData = () => {
  const [activeTab, setActiveTab] = useState("User");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchText, setSearchText] = useState("");
  const [dataSources, setDataSources] = useState({
    User: [
      { id: 1, No: 1, Name: "pemilikwarung", Email: "pemilikwarung@gmail.com", Username: "pemilikwarung", Password: "••••••••", CreatedAt: "1 year ago", UpdatedAt: "1 year ago", isActive: true },
      { id: 2, No: 2, Name: "Admin", Email: "daring.kecil@gmail.com", Username: "admin", Password: "••••••••", CreatedAt: "1 year ago", UpdatedAt: "1 year ago", isActive: true }
    ],
    Merchant: [
      { id: 1, No: 1, Merchant: "Dago Creative Space", KitchenName: "", PrinterName: "", TypeOfMerchant: "", CreatedAt: "8 months ago", UpdatedAt: "5 months ago", isActive: true },
      { id: 2, No: 2, Merchant: "HomeBro", Owner: "Ani", KitchenName: "", PrinterName: "", TypeOfMerchant: "", CreatedAt: "8 months ago", UpdatedAt: "5 months ago", isActive: true },
      { id: 3, No: 3, Merchant: "Dapoer M.S", Owner: "Ani", KitchenName: "", PrinterName: "", TypeOfMerchant: "", CreatedAt: "8 months ago", UpdatedAt: "5 months ago", isActive: true }
    ],
    "Product Category": [
      { id: 1, No: 1, Category: "Space Monitor", AllMerchant: "Dago creative Space", COA: "4-11 Pendapatan Sewa", TotalProduk: "4", CreatedAt: "8 months ago", UpdatedAt: "7 months ago" },
      { id: 2, No: 2, Category: "Salads & Sides", AllMerchant: "HomeBro", COA: "4-12 Pendapatan Sewa", TotalProduk: "5", CreatedAt: "8 months ago", UpdatedAt: "7 months ago" },
      { id: 3, No: 3, Category: "Hearty Bites", AllMerchant: "HomeBro", COA: "4-12 Pendapatan Sewa", TotalProduk: "6", CreatedAt: "8 months ago", UpdatedAt: "7 months ago" }
    ],
    Product: [
      { id: 1, No: 1, Product: "Coffee Frappe", AllCategory: "Non-Coffee Beverages", Hpp: "25.000,00", Price: "25.000,00", AllMerchant: "HomeBro", AllStatus: "Available", isActive: true },
      { id: 2, No: 2, Product: "Space Monitor (3jam)", AllCategory: "Space Monitor", Hpp: "40.000,00", Price: "40.000,00", AllMerchant: "Dago Creative Space", AllStatus: "Available", isActive: true },
      { id: 3, No: 3, Product: "Space Monitor (6jam)", AllCategory: "Space Monitor", Hpp: "60.000,00", Price: "60.000,00", AllMerchant: "Dago Creative Space", AllStatus: "Available", isActive: true },
      { id: 4, No: 4, Product: "Space Monitor (8jam)", AllCategory: "Space Monitor", Hpp: "80.000,00", Price: "80.000,00", AllMerchant: "Dago Creative Space", AllStatus: "Available", isActive: true },
      { id: 5, No: 5, Product: "Space Lesehan", AllCategory: "Space Lesehan", Hpp: "25.000,00", Price: "25.000,00", AllMerchant: "Dago Creative Space", AllStatus: "Available", isActive: true },
    ],
    "Space Unit": [
      { id: 1, No: 1, SpaceName: "OS7", AllCategory: "Open Space", Desc: "Open Space 7", CreatedAt: "1 year ago", UpdatedAt: "10 months ago", isActive: true },
      { id: 2, No: 2, SpaceName: "OS8", AllCategory: "Open Space", Desc: "Open Space 8", CreatedAt: "1 year ago", UpdatedAt: "10 months ago", isActive: true },
      { id: 3, No: 3, SpaceName: "OS9", AllCategory: "Open Space", Desc: "Open Space 9", CreatedAt: "1 year ago", UpdatedAt: "10 months ago", isActive: true },
    ],
    COA: [
      { id: 1, No: 1, Code: "1-1", Name: "Aset Lancar", Desc: "Aset Lancar", CreatedAt: "2 years ago", UpdatedAt: "1 year ago" },
      { id: 2, No: 2, Code: "1-11", Name: "Kas", Desc: "Kas", CreatedAt: "2 years ago", UpdatedAt: "1 year ago" },
      { id: 3, No: 3, Code: "1-1101", Name: "Kas Kecil", Desc: "Kas Kecil", CreatedAt: "2 years ago", UpdatedAt: "1 year ago" },
      { id: 4, No: 4, Code: "1-1102", Name: "Kas Besar", Desc: "Kas Besar", CreatedAt: "2 years ago", UpdatedAt: "1 year ago" },
    ],
    "Client Virtual Office": [
      { id: 1, No: 1, NamaPerusahaan: "PT Maju Jaya", BidangUsaha: "Konsultan IT", EmailPerusahaan: "admin@majujaya.com", NamaPendaftar: "Andi", Jabatan: "Direktur", AlamatDomisili: "Jl.Gatot Subroto N0.5", NomorTelepon: "081234567890", CreatedAt: "1 year ago", UpdatedAt: "1 year ago" },
      { id: 2, No: 2, NamaPerusahaan: "PT Chana Manufacture", BidangUsaha: "Farmasi", EmailPerusahaan: "admin@mxxxxx.com", NamaPendaftar: "Cazle", Jabatan: "Dokter Umum", AlamatDomisili: "Jl.Gatot Subroto N0.5", NomorTelepon: "081234567890", CreatedAt: "1 year ago", UpdatedAt: "1 year ago" }
    ],
    "Virtual Office": [
      { id: 1, No: 1, PaketVO: "Paket Virtual 6 Bulan", Desc: "Virtual Office adalah solusi cerdas untuk anda yang akan mulai merintis bisnis dan belum memiliki kantor...", Fasilitas: "Alamat BIsnis, free 3 jam meeting room, max 2x...", Harga: "1.750.000", CreatedAt: "1 year ago", UpdatedAt: "6 months ago", isActive: true }
    ],
    "Paket Membership": [
      { id: 1, No: 1, Ruangan: "Open Space", Paket: "Basic", Harga: "250.000", Kuota: "25 Credit", isActive: true },
      { id: 2, No: 2, Ruangan: "Open Space", Paket: "Standard", Harga: "400.000", Kuota: "45 Credit", isActive: true },
      { id: 3, No: 3, Ruangan: "Open Space", Paket: "Premium", Harga: "400.000", Kuota: "75 Credit", isActive: true },
      { id: 4, No: 4, Ruangan: "Space Monitor", Paket: "Basic", Harga: "350.000", Kuota: "30 Credit", isActive: true },
      { id: 5, No: 5, Ruangan: "Space Monitor", Paket: "Standard", Harga: "550.000", Kuota: "50 Credit", isActive: true },
    ],
    Promo: [
      { id: 1, No: 1, KodePromo: "FLASH50", Desc: "Flash diskon besar besaran", NilaiDiskon: "50%", EndDate: "2025-01-31", TanggalMulai: "2025-01-01", TanggalSelesai: "2025-01-31", isActive: true }
    ]
  });

  // Tab configuration with icons and colors
  const tabs = [
    { key: "User", label: "User", icon: UserOutlined, color: "#3b82f6" },
    { key: "Merchant", label: "Merchant", icon: ShopOutlined, color: "#10b981" },
    { key: "Product Category", label: "Product Category", icon: AppstoreOutlined, color: "#8b5cf6" },
    { key: "Product", label: "Product", icon: DatabaseOutlined, color: "#f59e0b" },
    { key: "Space Unit", label: "Space Unit", icon: HomeOutlined, color: "#ef4444" },
    { key: "COA", label: "COA", icon: AccountBookOutlined, color: "#06b6d4" },
    { key: "Client Virtual Office", label: "Client Virtual Office", icon: TeamOutlined, color: "#84cc16" },
    { key: "Virtual Office", label: "Virtual Office", icon: CrownOutlined, color: "#f97316" },
    { key: "Paket Membership", label: "Paket Membership", icon: GiftOutlined, color: "#ec4899" },
    { key: "Promo", label: "Promo", icon: TagOutlined, color: "#22c55e" }
  ];

  // Get current data and filter by search
  const currentData = (dataSources[activeTab] || []).filter(item => {
    if (!searchText) return true;
    return Object.values(item).some(value => 
      String(value).toLowerCase().includes(searchText.toLowerCase())
    );
  });

  // Modal state
  const [modalType, setModalType] = useState(null);
  const [selectedRow, setSelectedRow] = useState(null);
  const [formData, setFormData] = useState({});

  // Open modal
  const openModal = (type, row = null) => {
    setModalType(type);
    setSelectedRow(row);
    setFormData(row || {});
  };

  // Close modal
  const closeModal = () => {
    setModalType(null);
    setSelectedRow(null);
    setFormData({});
  };

  // Handle form change
  const handleChange = (key, value) => {
    setFormData({ ...formData, [key]: value });
  };

  // Save Add/Edit
  const handleSave = () => {
    if (modalType === "add") {
      const newItem = {
        ...formData,
        id: Date.now(),
        No: currentData.length + 1,
        CreatedAt: "just now",
        UpdatedAt: "just now"
      };
      setDataSources({
        ...dataSources,
        [activeTab]: [...dataSources[activeTab], newItem]
      });
      message.success("Data berhasil ditambahkan");
    } else if (modalType === "edit") {
      setDataSources({
        ...dataSources,
        [activeTab]: dataSources[activeTab].map((item) =>
          item.id === selectedRow.id ? { ...item, ...formData, UpdatedAt: "just now" } : item
        )
      });
      message.success("Data berhasil diupdate");
    }
    closeModal();
  };

  // Delete (removed functionality)
  // const handleDelete = () => {
  //   setDataSources({
  //     ...dataSources,
  //     [activeTab]: dataSources[activeTab].filter((item) => item.id !== selectedRow.id)
  //   });
  //   message.success("Data berhasil dihapus");
  //   closeModal();
  // };

  // Generate Account untuk COA
  const handleGenerateAccount = () => {
    message.success("Akun berhasil digenerate");
  };

  // Get active tab configuration
  const activeTabConfig = tabs.find(tab => tab.key === activeTab);

  const getColumns = () => {
    if (currentData.length === 0) return [];

    const dataColumns = Object.keys(currentData[0])
      .filter(key => key !== "id" && key !== "isActive")
      .map((key, index) => ({
        title: (
          <span className="text-sm font-semibold text-gray-700">
            {key}
          </span>
        ),
        dataIndex: key,
        key: key,
        className: "text-sm",
        render: (text, record) => {
          // Special rendering for certain fields
          if (key === 'AllStatus' || key === 'Status') {
            return (
              <Tag color={text === 'Available' ? 'green' : 'red'}>
                {text}
              </Tag>
            );
          }
          if (key === 'Email') {
            return <Text copyable>{text}</Text>;
          }
          if (key === 'Price' || key === 'Harga' || key === 'Hpp') {
            return <Text className="font-mono">Rp {text}</Text>;
          }
          if (key === 'NilaiDiskon') {
            return <Tag color="orange">{text}</Tag>;
          }
          return <span className="text-gray-700">{text}</span>;
        }
      }));

    const actionColumn = {
      title: (
        <div className="text-center">
          <SettingOutlined className="text-gray-600" />
        </div>
      ),
      key: "actions",
      width: 120,
      align: "center",
      render: (_, record) => (
        <Space size={4}>
          {/* COA hanya punya tombol Generate Account */}
          {activeTab === "COA" && (
            <Tooltip title="Generate Account">
              <Button
                type="primary"
                size="small"
                icon={<ReloadOutlined />}
                onClick={handleGenerateAccount}
                className="bg-green-500 border-green-500 hover:bg-green-600 hover:border-green-600 shadow-md"
                style={{ width: '32px', height: '32px' }}
              />
            </Tooltip>
          )}

          {/* Switch untuk tab yang mendukung status aktif/nonaktif */}
          {["User", "Merchant", "Product", "Virtual Office", "Paket Membership", "Promo"].includes(activeTab) && (
            <Tooltip title={record.isActive ? 'Aktif' : 'Nonaktif'}>
              <Switch
                checked={record.isActive ?? true}
                onChange={(checked) => {
                  setDataSources({
                    ...dataSources,
                    [activeTab]: dataSources[activeTab].map((item) =>
                      item.id === record.id ? { ...item, isActive: checked } : item
                    )
                  });
                  message.success(`Status berhasil diubah menjadi ${checked ? 'Aktif' : 'Nonaktif'}`);
                }}
                size="small"
              />
            </Tooltip>
          )}

          {/* Edit button untuk semua tab kecuali COA */}
          {activeTab !== "COA" && (
            <Tooltip title="Edit">
              <Button
                type="primary"
                size="small"
                icon={<EditOutlined />}
                onClick={() => openModal("edit", record)}
                className="bg-yellow-500 border-yellow-500 hover:bg-yellow-600 hover:border-yellow-600 shadow-md"
                style={{ width: '32px', height: '32px' }}
              />
            </Tooltip>
          )}


        </Space>
      )
    };

    return [...dataColumns, actionColumn];
  };

  // Cek apakah tab saat ini mendukung penambahan data
  const canAddData = () => {
    return !["COA"].includes(activeTab);
  };

  // Paginated data
  const paginatedData = currentData.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      {/* Modern Header */}
      <div className="bg-white/80 backdrop-blur-lg border-b border-gray-200/50 shadow-sm">
        <div className="px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div>
                <Title level={3} className="!mb-1 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Master Data POS
                </Title>
                <Text className="text-gray-500">Kelola semua data master sistem POS</Text>
              </div>
              <div className="flex items-center gap-3 px-4 py-2 bg-gray-50/80 rounded-xl border border-gray-200/50">
                <CalendarOutlined className="text-blue-500" />
                <Text className="text-sm font-medium text-gray-600">
                  2025-09-01 to 2025-09-03
                </Text>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Badge count={currentData.length} showZero color="#3b82f6">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <DatabaseOutlined className="text-blue-600 text-lg" />
                </div>
              </Badge>
              <Text className="text-sm text-gray-400">Dashboard</Text>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-8">
        <Card
          className="shadow-xl border-0 rounded-2xl overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(248,250,252,0.9) 100%)',
            backdropFilter: 'blur(20px)'
          }}
          bodyStyle={{ padding: 0 }}
        >
          {/* Modern Tabs */}
          <div className="border-b border-gray-200/50 bg-white/50">
            <div className="px-8 py-4">
              <div className="flex gap-2 overflow-x-auto">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.key;
                  return (
                    <Button
                      key={tab.key}
                      type="text"
                      onClick={() => setActiveTab(tab.key)}
                      className={`
                        min-w-fit px-4 py-2 h-10 rounded-lg font-medium transition-all duration-300
                        ${isActive 
                          ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg transform scale-105' 
                          : 'text-gray-600 hover:bg-gray-100/80 hover:text-gray-800'
                        }
                      `}
                      icon={<Icon className={isActive ? 'text-white' : 'text-gray-500'} />}
                    >
                      {tab.label}
                    </Button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Content Area */}
          <div className="p-8">
            {/* Action Bar */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 px-4 py-2 bg-gray-50/80 rounded-xl">
                  <Text className="text-sm text-gray-600">Show</Text>
                  <Select
                    value={pageSize}
                    onChange={(value) => setPageSize(value)}
                    size="small"
                    className="min-w-[70px]"
                  >
                    <Option value={10}>10</Option>
                    <Option value={25}>25</Option>
                    <Option value={50}>50</Option>
                  </Select>
                  <Text className="text-sm text-gray-600">entries</Text>
                </div>
                
                <Badge count={currentData.length} color={activeTabConfig?.color || '#3b82f6'}>
                  <div className="flex items-center gap-2 px-4 py-2 bg-gray-50/80 rounded-xl">
                    {activeTabConfig && <activeTabConfig.icon className="text-gray-600" />}
                    <Text className="text-sm font-medium text-gray-700">{activeTab}</Text>
                  </div>
                </Badge>
              </div>

              <div className="flex items-center gap-3">
                {canAddData() && (
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => openModal("add")}
                    className="bg-gradient-to-r from-green-500 to-emerald-600 border-0 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
                  >
                    Add New
                  </Button>
                )}
                
                <Input
                  placeholder="Search data..."
                  prefix={<SearchOutlined className="text-gray-400" />}
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  className="w-64 shadow-md hover:shadow-lg transition-shadow duration-300"
                  allowClear
                />
              </div>
            </div>

            {/* Modern Table */}
            <div className="rounded-xl overflow-hidden shadow-lg border border-gray-200/50">
              <Table
                columns={getColumns()}
                dataSource={paginatedData}
                pagination={false}
                size="middle"
                rowKey="id"
                className="modern-table"
                rowClassName={(_, index) => 
                  `transition-all duration-200 hover:bg-blue-50/50 ${index % 2 === 0 ? 'bg-gray-50/30' : 'bg-white'}`
                }
                scroll={{ x: 1000 }}
              />
            </div>

            {/* Modern Pagination */}
            {currentData.length > 0 && (
              <div className="flex flex-col sm:flex-row justify-between items-center mt-8 pt-6 border-t border-gray-200/50">
                <Text className="text-sm text-gray-600">
                  Showing {Math.min((currentPage - 1) * pageSize + 1, currentData.length)} to{' '}
                  {Math.min(currentPage * pageSize, currentData.length)} of {currentData.length} entries
                </Text>

                <Pagination
                  current={currentPage}
                  total={currentData.length}
                  pageSize={pageSize}
                  showSizeChanger={false}
                  onChange={(page) => setCurrentPage(page)}
                  className="mt-4 sm:mt-0"
                  showQuickJumper
                />
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Modern Modal */}
      <Modal
        title={
          <div className="flex items-center gap-3">
            {activeTabConfig && <activeTabConfig.icon style={{ color: activeTabConfig.color }} />}
            <span>
              {modalType === "add" ? `Tambah ${activeTab}` :
                modalType === "edit" ? `Edit ${activeTab}` :
                  modalType === "view" ? "Detail Data" :
                    "Konfirmasi Hapus"}
            </span>
          </div>
        }
        open={modalType !== null}
        onCancel={closeModal}
        width={800}
        footer={null}
        className="modern-modal"
        centered
        maskStyle={{ 
          backgroundColor: "rgba(0, 0, 0, 0.3)",
          backdropFilter: "blur(8px)"
        }}
      >
        {/* Add / Edit Form */}
        {(modalType === "add" || modalType === "edit") && (
          <div className="p-4">
            <div className="mb-6 p-4 bg-blue-50/50 rounded-lg border-l-4 border-blue-500">
              <Text className="text-blue-700 text-sm">
                <span className="text-red-500">*</span> Required fields
              </Text>
            </div>

            <Row gutter={[24, 16]}>
              {activeTab === "User" && (
                <>
                  <Col span={12}>
                    <div className="space-y-2">
                      <Text strong className="text-gray-700">Email <span className="text-red-500">*</span></Text>
                      <Input 
                        placeholder="Enter email" 
                        value={formData.Email || ""} 
                        onChange={(e) => handleChange("Email", e.target.value)}
                        className="hover:border-blue-400 focus:border-blue-500 transition-colors"
                      />
                    </div>
                  </Col>
                  <Col span={12}>
                    <div className="space-y-2">
                      <Text strong className="text-gray-700">Name <span className="text-red-500">*</span></Text>
                      <Input 
                        placeholder="Enter name" 
                        value={formData.Name || ""} 
                        onChange={(e) => handleChange("Name", e.target.value)}
                        className="hover:border-blue-400 focus:border-blue-500 transition-colors"
                      />
                    </div>
                  </Col>
                  <Col span={12}>
                    <div className="space-y-2">
                      <Text strong className="text-gray-700">Username <span className="text-red-500">*</span></Text>
                      <Input 
                        placeholder="Enter username" 
                        value={formData.Username || ""} 
                        onChange={(e) => handleChange("Username", e.target.value)}
                        className="hover:border-blue-400 focus:border-blue-500 transition-colors"
                      />
                    </div>
                  </Col>
                  <Col span={12}>
                    <div className="space-y-2">
                      <Text strong className="text-gray-700">Password <span className="text-red-500">*</span></Text>
                      <Input.Password 
                        placeholder="Enter password" 
                        value={formData.Password || ""} 
                        onChange={(e) => handleChange("Password", e.target.value)}
                        className="hover:border-blue-400 focus:border-blue-500 transition-colors"
                      />
                    </div>
                  </Col>
                </>
              )}

              {/* Add other form fields for different tabs similarly */}
              {activeTab === "Merchant" && (
                <>
                  <Col span={12}>
                    <div className="space-y-2">
                      <Text strong className="text-gray-700">Merchant Name <span className="text-red-500">*</span></Text>
                      <Input 
                        placeholder="Enter merchant name" 
                        value={formData.Merchant || ""} 
                        onChange={(e) => handleChange("Merchant", e.target.value)}
                        className="hover:border-blue-400 focus:border-blue-500 transition-colors"
                      />
                    </div>
                  </Col>
                  <Col span={12}>
                    <div className="space-y-2">
                      <Text strong className="text-gray-700">Owner <span className="text-red-500">*</span></Text>
                      <Input 
                        placeholder="Enter owner name" 
                        value={formData.Owner || ""} 
                        onChange={(e) => handleChange("Owner", e.target.value)}
                        className="hover:border-blue-400 focus:border-blue-500 transition-colors"
                      />
                    </div>
                  </Col>
                </>
              )}

              {activeTab === "Product Category" && (
                <>
                  <Col span={12}>
                    <div className="space-y-2">
                      <Text strong className="text-gray-700">Category Name <span className="text-red-500">*</span></Text>
                      <Input 
                        placeholder="Enter category name" 
                        value={formData.Category || ""} 
                        onChange={(e) => handleChange("Category", e.target.value)}
                        className="hover:border-blue-400 focus:border-blue-500 transition-colors"
                      />
                    </div>
                  </Col>
                  <Col span={12}>
                    <div className="space-y-2">
                      <Text strong className="text-gray-700">Merchant <span className="text-red-500">*</span></Text>
                      <Input 
                        placeholder="Enter merchant" 
                        value={formData.AllMerchant || ""} 
                        onChange={(e) => handleChange("AllMerchant", e.target.value)}
                        className="hover:border-blue-400 focus:border-blue-500 transition-colors"
                      />
                    </div>
                  </Col>
                  <Col span={12}>
                    <div className="space-y-2">
                      <Text strong className="text-gray-700">COA <span className="text-red-500">*</span></Text>
                      <Input 
                        placeholder="Enter COA" 
                        value={formData.COA || ""} 
                        onChange={(e) => handleChange("COA", e.target.value)}
                        className="hover:border-blue-400 focus:border-blue-500 transition-colors"
                      />
                    </div>
                  </Col>
                </>
              )}

              {activeTab === "Product" && (
                <>
                  <Col span={12}>
                    <div className="space-y-2">
                      <Text strong className="text-gray-700">Product Name <span className="text-red-500">*</span></Text>
                      <Input 
                        placeholder="Enter product name" 
                        value={formData.Product || ""} 
                        onChange={(e) => handleChange("Product", e.target.value)}
                        className="hover:border-blue-400 focus:border-blue-500 transition-colors"
                      />
                    </div>
                  </Col>
                  <Col span={12}>
                    <div className="space-y-2">
                      <Text strong className="text-gray-700">Category</Text>
                      <Input 
                        placeholder="Enter category" 
                        value={formData.AllCategory || ""} 
                        onChange={(e) => handleChange("AllCategory", e.target.value)}
                        className="hover:border-blue-400 focus:border-blue-500 transition-colors"
                      />
                    </div>
                  </Col>
                  <Col span={12}>
                    <div className="space-y-2">
                      <Text strong className="text-gray-700">HPP</Text>
                      <Input 
                        placeholder="Enter HPP" 
                        value={formData.Hpp || ""} 
                        onChange={(e) => handleChange("Hpp", e.target.value)}
                        className="hover:border-blue-400 focus:border-blue-500 transition-colors"
                        prefix="Rp"
                      />
                    </div>
                  </Col>
                  <Col span={12}>
                    <div className="space-y-2">
                      <Text strong className="text-gray-700">Price (IDR)</Text>
                      <Input 
                        placeholder="Enter price" 
                        value={formData.Price || ""} 
                        onChange={(e) => handleChange("Price", e.target.value)}
                        className="hover:border-blue-400 focus:border-blue-500 transition-colors"
                        prefix="Rp"
                      />
                    </div>
                  </Col>
                  <Col span={12}>
                    <div className="space-y-2">
                      <Text strong className="text-gray-700">Merchant</Text>
                      <Input 
                        placeholder="Enter merchant" 
                        value={formData.AllMerchant || ""} 
                        onChange={(e) => handleChange("AllMerchant", e.target.value)}
                        className="hover:border-blue-400 focus:border-blue-500 transition-colors"
                      />
                    </div>
                  </Col>
                  <Col span={12}>
                    <div className="space-y-2">
                      <Text strong className="text-gray-700">Status</Text>
                      <Select 
                        placeholder="Select status" 
                        value={formData.AllStatus || ""} 
                        onChange={(value) => handleChange("AllStatus", value)}
                        className="w-full hover:border-blue-400 focus:border-blue-500 transition-colors"
                      >
                        <Option value="Available">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            Available
                          </div>
                        </Option>
                        <Option value="Not Available">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                            Not Available
                          </div>
                        </Option>
                      </Select>
                    </div>
                  </Col>
                </>
              )}

              {activeTab === "Space Unit" && (
                <>
                  <Col span={12}>
                    <div className="space-y-2">
                      <Text strong className="text-gray-700">Space Name <span className="text-red-500">*</span></Text>
                      <Input 
                        placeholder="Enter space name" 
                        value={formData.SpaceName || ""} 
                        onChange={(e) => handleChange("SpaceName", e.target.value)}
                        className="hover:border-blue-400 focus:border-blue-500 transition-colors"
                      />
                    </div>
                  </Col>
                  <Col span={12}>
                    <div className="space-y-2">
                      <Text strong className="text-gray-700">Category <span className="text-red-500">*</span></Text>
                      <Input 
                        placeholder="Enter category" 
                        value={formData.AllCategory || ""} 
                        onChange={(e) => handleChange("AllCategory", e.target.value)}
                        className="hover:border-blue-400 focus:border-blue-500 transition-colors"
                      />
                    </div>
                  </Col>
                  <Col span={24}>
                    <div className="space-y-2">
                      <Text strong className="text-gray-700">Description</Text>
                      <Input.TextArea 
                        placeholder="Enter description" 
                        value={formData.Desc || ""} 
                        onChange={(e) => handleChange("Desc", e.target.value)}
                        className="hover:border-blue-400 focus:border-blue-500 transition-colors"
                        rows={3}
                      />
                    </div>
                  </Col>
                </>
              )}

              {activeTab === "Client Virtual Office" && (
                <>
                  <Col span={12}>
                    <div className="space-y-2">
                      <Text strong className="text-gray-700">Nama Perusahaan <span className="text-red-500">*</span></Text>
                      <Input 
                        placeholder="Enter company name" 
                        value={formData.NamaPerusahaan || ""} 
                        onChange={(e) => handleChange("NamaPerusahaan", e.target.value)}
                        className="hover:border-blue-400 focus:border-blue-500 transition-colors"
                      />
                    </div>
                  </Col>
                  <Col span={12}>
                    <div className="space-y-2">
                      <Text strong className="text-gray-700">Bidang Usaha <span className="text-red-500">*</span></Text>
                      <Input 
                        placeholder="Enter business field" 
                        value={formData.BidangUsaha || ""} 
                        onChange={(e) => handleChange("BidangUsaha", e.target.value)}
                        className="hover:border-blue-400 focus:border-blue-500 transition-colors"
                      />
                    </div>
                  </Col>
                  <Col span={12}>
                    <div className="space-y-2">
                      <Text strong className="text-gray-700">Email Perusahaan <span className="text-red-500">*</span></Text>
                      <Input 
                        placeholder="Enter company email" 
                        value={formData.EmailPerusahaan || ""} 
                        onChange={(e) => handleChange("EmailPerusahaan", e.target.value)}
                        className="hover:border-blue-400 focus:border-blue-500 transition-colors"
                        type="email"
                      />
                    </div>
                  </Col>
                  <Col span={12}>
                    <div className="space-y-2">
                      <Text strong className="text-gray-700">Nama Pendaftar <span className="text-red-500">*</span></Text>
                      <Input 
                        placeholder="Enter registrant name" 
                        value={formData.NamaPendaftar || ""} 
                        onChange={(e) => handleChange("NamaPendaftar", e.target.value)}
                        className="hover:border-blue-400 focus:border-blue-500 transition-colors"
                      />
                    </div>
                  </Col>
                  <Col span={12}>
                    <div className="space-y-2">
                      <Text strong className="text-gray-700">Jabatan <span className="text-red-500">*</span></Text>
                      <Input 
                        placeholder="Enter position" 
                        value={formData.Jabatan || ""} 
                        onChange={(e) => handleChange("Jabatan", e.target.value)}
                        className="hover:border-blue-400 focus:border-blue-500 transition-colors"
                      />
                    </div>
                  </Col>
                  <Col span={12}>
                    <div className="space-y-2">
                      <Text strong className="text-gray-700">Nomor Telepon <span className="text-red-500">*</span></Text>
                      <Input 
                        placeholder="Enter phone number" 
                        value={formData.NomorTelepon || ""} 
                        onChange={(e) => handleChange("NomorTelepon", e.target.value)}
                        className="hover:border-blue-400 focus:border-blue-500 transition-colors"
                      />
                    </div>
                  </Col>
                  <Col span={24}>
                    <div className="space-y-2">
                      <Text strong className="text-gray-700">Alamat Domisili <span className="text-red-500">*</span></Text>
                      <Input.TextArea 
                        placeholder="Enter address" 
                        value={formData.AlamatDomisili || ""} 
                        onChange={(e) => handleChange("AlamatDomisili", e.target.value)}
                        className="hover:border-blue-400 focus:border-blue-500 transition-colors"
                        rows={2}
                      />
                    </div>
                  </Col>
                </>
              )}

              {activeTab === "Virtual Office" && (
                <>
                  <Col span={24}>
                    <div className="space-y-2">
                      <Text strong className="text-gray-700">Paket VO <span className="text-red-500">*</span></Text>
                      <Input 
                        placeholder="Enter virtual office package name" 
                        value={formData.PaketVO || ""} 
                        onChange={(e) => handleChange("PaketVO", e.target.value)}
                        className="hover:border-blue-400 focus:border-blue-500 transition-colors"
                      />
                    </div>
                  </Col>
                  <Col span={24}>
                    <div className="space-y-2">
                      <Text strong className="text-gray-700">Description</Text>
                      <Input.TextArea 
                        placeholder="Enter package description" 
                        value={formData.Desc || ""} 
                        onChange={(e) => handleChange("Desc", e.target.value)}
                        className="hover:border-blue-400 focus:border-blue-500 transition-colors"
                        rows={3}
                      />
                    </div>
                  </Col>
                  <Col span={24}>
                    <div className="space-y-2">
                      <Text strong className="text-gray-700">Fasilitas</Text>
                      <Input.TextArea 
                        placeholder="Enter facilities" 
                        value={formData.Fasilitas || ""} 
                        onChange={(e) => handleChange("Fasilitas", e.target.value)}
                        className="hover:border-blue-400 focus:border-blue-500 transition-colors"
                        rows={3}
                      />
                    </div>
                  </Col>
                  <Col span={12}>
                    <div className="space-y-2">
                      <Text strong className="text-gray-700">Harga</Text>
                      <Input 
                        placeholder="Enter price" 
                        value={formData.Harga || ""} 
                        onChange={(e) => handleChange("Harga", e.target.value)}
                        className="hover:border-blue-400 focus:border-blue-500 transition-colors"
                        prefix="Rp"
                      />
                    </div>
                  </Col>
                </>
              )}

              {activeTab === "Paket Membership" && (
                <>
                  <Col span={12}>
                    <div className="space-y-2">
                      <Text strong className="text-gray-700">Nama Ruangan <span className="text-red-500">*</span></Text>
                      <Select 
                        placeholder="Select room" 
                        value={formData.Ruangan || ""} 
                        onChange={(value) => handleChange("Ruangan", value)}
                        className="w-full hover:border-blue-400 focus:border-blue-500 transition-colors"
                      >
                        <Option value="Open Space">Open Space</Option>
                        <Option value="Space Monitor">Space Monitor</Option>
                        <Option value="Meeting Room">Meeting Room</Option>
                      </Select>
                    </div>
                  </Col>
                  <Col span={12}>
                    <div className="space-y-2">
                      <Text strong className="text-gray-700">Nama Paket <span className="text-red-500">*</span></Text>
                      <Select 
                        placeholder="Select package" 
                        value={formData.Paket || ""} 
                        onChange={(value) => handleChange("Paket", value)}
                        className="w-full hover:border-blue-400 focus:border-blue-500 transition-colors"
                      >
                        <Option value="Basic">
                          <div className="flex items-center gap-2">
                            <Tag color="blue">Basic</Tag>
                          </div>
                        </Option>
                        <Option value="Standard">
                          <div className="flex items-center gap-2">
                            <Tag color="orange">Standard</Tag>
                          </div>
                        </Option>
                        <Option value="Premium">
                          <div className="flex items-center gap-2">
                            <Tag color="gold">Premium</Tag>
                          </div>
                        </Option>
                      </Select>
                    </div>
                  </Col>
                  <Col span={12}>
                    <div className="space-y-2">
                      <Text strong className="text-gray-700">Harga</Text>
                      <Input 
                        placeholder="Enter price" 
                        value={formData.Harga || ""} 
                        onChange={(e) => handleChange("Harga", e.target.value)}
                        className="hover:border-blue-400 focus:border-blue-500 transition-colors"
                        prefix="Rp"
                      />
                    </div>
                  </Col>
                  <Col span={12}>
                    <div className="space-y-2">
                      <Text strong className="text-gray-700">Kuota</Text>
                      <Input 
                        placeholder="Enter quota" 
                        value={formData.Kuota || ""} 
                        onChange={(e) => handleChange("Kuota", e.target.value)}
                        className="hover:border-blue-400 focus:border-blue-500 transition-colors"
                        suffix="Credit"
                      />
                    </div>
                  </Col>
                </>
              )}

              {activeTab === "Promo" && (
                <>
                  <Col span={12}>
                    <div className="space-y-2">
                      <Text strong className="text-gray-700">Kode Promo <span className="text-red-500">*</span></Text>
                      <Input 
                        placeholder="Enter promo code" 
                        value={formData.KodePromo || ""} 
                        onChange={(e) => handleChange("KodePromo", e.target.value)}
                        className="hover:border-blue-400 focus:border-blue-500 transition-colors"
                        style={{ fontFamily: 'monospace' }}
                      />
                    </div>
                  </Col>
                  <Col span={12}>
                    <div className="space-y-2">
                      <Text strong className="text-gray-700">Nilai Diskon</Text>
                      <Input 
                        placeholder="Enter discount value" 
                        value={formData.NilaiDiskon || ""} 
                        onChange={(e) => handleChange("NilaiDiskon", e.target.value)}
                        className="hover:border-blue-400 focus:border-blue-500 transition-colors"
                        suffix="%"
                      />
                    </div>
                  </Col>
                  <Col span={24}>
                    <div className="space-y-2">
                      <Text strong className="text-gray-700">Description</Text>
                      <Input.TextArea 
                        placeholder="Enter promo description" 
                        value={formData.Desc || ""} 
                        onChange={(e) => handleChange("Desc", e.target.value)}
                        className="hover:border-blue-400 focus:border-blue-500 transition-colors"
                        rows={2}
                      />
                    </div>
                  </Col>
                  <Col span={12}>
                    <div className="space-y-2">
                      <Text strong className="text-gray-700">Tanggal Mulai</Text>
                      <Input 
                        type="date" 
                        value={formData.TanggalMulai || ""} 
                        onChange={(e) => handleChange("TanggalMulai", e.target.value)}
                        className="hover:border-blue-400 focus:border-blue-500 transition-colors"
                      />
                    </div>
                  </Col>
                  <Col span={12}>
                    <div className="space-y-2">
                      <Text strong className="text-gray-700">Tanggal Selesai</Text>
                      <Input 
                        type="date" 
                        value={formData.TanggalSelesai || ""} 
                        onChange={(e) => handleChange("TanggalSelesai", e.target.value)}
                        className="hover:border-blue-400 focus:border-blue-500 transition-colors"
                      />
                    </div>
                  </Col>
                </>
              )}
            </Row>

            <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-200/50">
              <Button 
                type="primary" 
                onClick={handleSave}
                className="bg-gradient-to-r from-blue-500 to-blue-600 border-0 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 px-8"
                size="large"
              >
                {modalType === "add" ? "Create Data" : "Update Data"}
              </Button>
              <Button 
                onClick={closeModal}
                className="shadow-md hover:shadow-lg transition-shadow duration-300 px-8"
                size="large"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Delete Confirmation - Removed functionality */}
      </Modal>

      <style jsx>{`
        .modern-table .ant-table-thead > tr > th {
          background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
          border-bottom: 2px solid #e2e8f0;
          font-weight: 600;
          color: #475569;
        }
        
        .modern-table .ant-table-tbody > tr:hover > td {
          background-color: rgba(59, 130, 246, 0.05) !important;
          transition: all 0.3s ease;
        }
        
        .modern-modal .ant-modal-header {
          border-bottom: 1px solid #f1f5f9;
          background: linear-gradient(135deg, #fefefe 0%, #f8fafc 100%);
        }
        
        .modern-modal .ant-modal-body {
          background: #fefefe;
        }
      `}</style>
    </div>
  );
};

export default MasterData;