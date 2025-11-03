import React, { useState, useEffect, useMemo, useCallback } from "react"; // Import useMemo dan useCallback
import {
  Table,
  Button,
  Modal,
  Input,
  Typography,
  Row,
  Col,
  Card,
  Space,
  Select,
  message,
  Popconfirm,
  Tooltip,
  Upload,
  InputNumber,
  Switch,
  Spin, // Import Spin for loading indicator
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  ShoppingOutlined,
  FileImageOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import {
  getProduk,
  createProduk,
  updateProduk,
  deleteProduk,
  getKategoriTenant,
} from "../../../../services/service"; // Pastikan path benar

const { Text } = Typography;
const { Option } = Select;
const { Search, TextArea } = Input;

// Helper function to get base URL for images - PASTIKAN SESUAI DENGAN BACKEND ANDA
const getImageUrl = (filename) => {
  if (!filename) return "/static/kopi.jpg"; // Fallback default jika filename null/undefined
  const baseUrlWithoutApi = import.meta.env.VITE_BASE_URL?.replace('/api/v1', '') || '';
   return `${baseUrlWithoutApi}/static/${filename}`; // Gunakan '/static/' sesuai backend
};


// Helper function di luar komponen agar tidak dibuat ulang
const uniqueValues = (arr, key) => {
   if (!arr) return [];
   const values = arr.map((item) => item?.[key]).filter(Boolean);
   return [...new Set(values)].sort().map((val) => ({
     text: val,
     value: val,
   }));
 };


const ProductTab = () => {
  const [open, setOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [formData, setFormData] = useState({ status_ketersediaan: "Active", status_visibilitas: "Aktif" });
  const [fileFoto, setFileFoto] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [loading, setLoading] = useState(false); // Loading untuk fetch data awal & delete
  const [submitLoading, setSubmitLoading] = useState(false); // Loading untuk submit form modal
  const [data, setData] = useState([]);
  const [pageSize, setPageSize] = useState(10);
  const [kategoriList, setKategoriList] = useState([]);
  const [tenantList, setTenantList] = useState([]);

  // Memoize filtered category list based on selected tenant in the form
  const filteredKategoriList = useMemo(() => {
    if (!formData.id_tenant || !kategoriList) return [];
    return kategoriList.filter((k) => k.id_tenant === formData.id_tenant);
  }, [formData.id_tenant, kategoriList]);


  // 🚀 Fetch data produk & kategori secara paralel
  const fetchData = useCallback(async () => { // Bungkus dengan useCallback
    setLoading(true);
    try {
      const [resProduk, resKategori] = await Promise.all([
        getProduk(),
        getKategoriTenant()
      ]);

      if (resProduk.status === 200 && resProduk.data.message === "OK") {
        const produk = resProduk.data.datas.map((item) => ({ // Hapus index + 1
          key: item.id_produk, // Gunakan id_produk asli sebagai key
          ...item,
        }));
        setData(produk);
      } else {
         message.error(resProduk.data?.error || "Gagal mengambil data produk");
      }

      if (resKategori.status === 200 && resKategori.data.message === "OK") {
        const allKategori = resKategori.data.datas.map((item) => ({
          id: item.id_kategori,
          nama: item.nama_kategori,
          tenant: item.nama_tenant,
          id_tenant: item.id_tenant,
        }));
        setKategoriList(allKategori);

        const uniqueTenants = allKategori.reduce((acc, current) => {
          if (!acc.find((item) => item.id_tenant === current.id_tenant)) {
            acc.push({ id_tenant: current.id_tenant, nama_tenant: current.tenant });
          }
          return acc;
        }, []);
        setTenantList(uniqueTenants);
      } else {
           message.error(resKategori.data?.error || "Gagal mengambil data kategori");
      }
    } catch (err) {
      console.error("Gagal fetch data:", err);
      message.error("Terjadi kesalahan saat mengambil data");
    } finally {
      setLoading(false);
    }
  }, []); // Dependensi kosong karena hanya perlu dijalankan sekali


  useEffect(() => {
    fetchData();
  }, [fetchData]); // Panggil fetchData saat komponen mount


  // 🔎 Memoize Filter pencarian global
  const filteredData = useMemo(() => {
     if (!searchText) return data; // Jika tidak ada search text, kembalikan data asli
     const lowerSearchText = searchText.toLowerCase();
     return data.filter(
       (item) =>
         item.nama_produk?.toLowerCase().includes(lowerSearchText) ||
         item.nama_kategori?.toLowerCase().includes(lowerSearchText) ||
         item.nama_tenant?.toLowerCase().includes(lowerSearchText)
     );
   }, [data, searchText]); // Hitung ulang hanya jika data atau searchText berubah

   // --- 🔽 Memoize FILTER OPTIONS untuk Kolom Table ---
   const uniqueNamaProdukFilters = useMemo(() => uniqueValues(data, "nama_produk"), [data]);
   const uniqueTenantFilters = useMemo(() => uniqueValues(data, "nama_tenant"), [data]);
   const statusKetersediaanFilters = useMemo(() => [
        { text: "Tersedia", value: "Active" },
        { text: "Habis", value: "Inactive" },
      ], []);
   const statusVisibilitasFilters = useMemo(() => [
       { text: "Ditampilkan", value: "Aktif" },
       { text: "Disembunyikan", value: "Nonaktif" },
     ], []);


  // --- Memoize Definisi Kolom Tabel ---
  const columns = useMemo(() => [
    {
      title: "Nama Produk",
      dataIndex: "nama_produk",
      key: "nama_produk",
      sorter: (a, b) => a.nama_produk.localeCompare(b.nama_produk),
      filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
          <div style={{ padding: 8 }}>
            <Input
              placeholder={`Cari Nama Produk`}
              value={selectedKeys[0]}
              onChange={e => setSelectedKeys(e.target.value ? [e.target.value] : [])}
              onPressEnter={() => confirm()}
              style={{ marginBottom: 8, display: 'block' }}
            />
            <Space>
              <Button type="primary" onClick={() => confirm()} icon={<SearchOutlined />} size="small">Search</Button>
              <Button onClick={() => { clearFilters(); setSelectedKeys([]); confirm(); }} size="small">Reset</Button>
            </Space>
          </div>
        ),
      filterIcon: filtered => <SearchOutlined style={{ color: filtered ? '#1890ff' : undefined }} />,
      onFilter: (value, record) => record.nama_produk?.toLowerCase().includes(value.toLowerCase()),
      render: (text) => (
        <Space>
          <ShoppingOutlined style={{ color: "#1890ff" }} />
          <Text strong>{text}</Text>
        </Space>
      ),
    },
    {
      title: "Kategori / Tenant",
      dataIndex: "nama_kategori",
      key: "kategori_info",
      filters: uniqueTenantFilters, // Gunakan filter tenant yang sudah dimemoize
      onFilter: (value, record) => record.nama_tenant === value,
      render: (_, record) => (
        <div>
          <Text strong>{record.nama_kategori || "-"}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: "12px" }}>
            {record.nama_tenant || "N/A"}
          </Text>
        </div>
      ),
    },
    {
      title: "Harga",
      dataIndex: "harga",
      key: "harga",
      sorter: (a, b) => a.harga - b.harga,
      render: (harga) => `Rp ${Number(harga || 0).toLocaleString("id-ID")}`,
    },
    {
      title: "Status Ketersediaan",
      dataIndex: "status_ketersediaan",
      key: "status_ketersediaan",
      filters: statusKetersediaanFilters, // Gunakan filter yang sudah dimemoize
      onFilter: (value, record) => record.status_ketersediaan === value,
      render: (status) =>
        status === "Active" ? (
          <Text type="success">Tersedia</Text>
        ) : (
          <Text type="warning">Habis</Text>
        ),
    },
    {
      title: "Visibilitas Admin",
      dataIndex: "status_visibilitas",
      key: "status_visibilitas",
      filters: statusVisibilitasFilters, // Gunakan filter yang sudah dimemoize
      onFilter: (value, record) => record.status_visibilitas === value,
      render: (status) =>
        status === "Aktif" ? (
          <Text type="success">Ditampilkan</Text>
        ) : (
          <Text type="danger">Disembunyikan</Text>
        ),
    },
    {
      title: "Deskripsi",
      dataIndex: "deskripsi_produk",
      key: "deskripsi_produk",
      width: 200,
      ellipsis: true,
      render: (text) => <Text ellipsis={{ tooltip: text }}>{text || "-"}</Text>,
    },
    {
      title: "Foto",
      dataIndex: "foto_produk",
      key: "foto_produk",
      width: 80,
      render: (url) =>
        url ? (
          <img
            src={getImageUrl(url)}
            alt="produk"
            style={{ width: 50, height: 50, borderRadius: 8, objectFit: 'cover' }}
            onError={(e) => { e.target.onerror = null; e.target.src="/static/kopi.jpg" }}
          />
        ) : (
          <FileImageOutlined style={{ fontSize: '24px', color: '#ccc' }} />
        ),
    },
    {
      title: "Actions",
      key: "actions",
      width: 100,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Edit Produk">
            {/* Panggil handleEdit yang sudah di-memoize */}
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
              style={{ color: "#1890ff" }}
            />
          </Tooltip>
          <Tooltip title="Delete Produk">
            <Popconfirm
              title="Hapus Produk"
              description={`Yakin ingin menghapus "${record.nama_produk}"?`}
              // Panggil handleDelete yang sudah di-memoize
              onConfirm={() => handleDelete(record.id_produk)}
              okText="Ya"
              cancelText="Tidak"
              okButtonProps={{ danger: true, loading: loading }} // Tambah loading di tombol OK popconfirm
            >
              <Button type="text" danger icon={<DeleteOutlined />} disabled={loading}/>
            </Popconfirm>
          </Tooltip>
        </Space>
      ),
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [uniqueNamaProdukFilters, uniqueTenantFilters, statusKetersediaanFilters, statusVisibilitasFilters, loading]); // Tambahkan dependensi filters dan loading

  // --- Memoize Form Handler ---
  const handleChange = useCallback((field, value) => {
    setFormData(prevFormData => {
        const newFormData = { ...prevFormData, [field]: value };
        // Jika ganti tenant, reset kategori
        if (field === "id_tenant") {
            console.log("Tenant changed in form handler, resetting category");
            delete newFormData.id_kategori; // Reset kategori field
            // Filter list tidak perlu dihandle di sini karena sudah dihandle useMemo filteredKategoriList
        }
        console.log("Setting FormData:", newFormData);
        return newFormData;
    });
   // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kategoriList]); // kategoriList mungkin diperlukan jika ada logic yg bergantung padanya

  // --- Memoize Submit Handler (Create/Update) ---
  const handleAddProduct = useCallback(async () => {
    if (!formData.id_tenant || !formData.id_kategori || !formData.nama_produk || formData.harga === null || formData.harga === undefined || formData.harga < 0) {
      message.error("Tenant, Kategori, Nama Produk, dan Harga (minimal 0) wajib diisi!");
      return;
    }

    setSubmitLoading(true); // Gunakan state loading terpisah untuk form
    try {
      const formPayload = new FormData();
      // Append semua data dari formData
      for (const key in formData) {
           if (formData[key] !== null && formData[key] !== undefined) { // Hindari append null/undefined
               formPayload.append(key, formData[key] || ''); // Kirim string kosong jika null/undefined (kecuali harga)
           }
      }
       // Pastikan harga dikirim
        formPayload.set("harga", formData.harga);
        // Pastikan status default dikirim jika tidak ada di formData
        formPayload.set("status_ketersediaan", formData.status_ketersediaan || "Active");
        formPayload.set("status_visibilitas", formData.status_visibilitas || "Aktif");


      if (fileFoto) {
        const isJpgOrPng = fileFoto.type === 'image/jpeg' || fileFoto.type === 'image/png';
        if (!isJpgOrPng) throw new Error('Hanya bisa upload file JPG/PNG!');
        const isLt2M = fileFoto.size / 1024 / 1024 < 2;
        if (!isLt2M) throw new Error('Gambar harus lebih kecil dari 2MB!');
        formPayload.append("foto_produk", fileFoto);
      }

      let res;
      if (editingProduct) {
        console.log("Updating product ID:", editingProduct.id_produk);
        res = await updateProduk(editingProduct.id_produk, formPayload);
        if (res.status === 200) {
            message.success("Produk berhasil diperbarui!");
        } else {
             const errorMsg = res.data?.error || res.data?.message || "Gagal memperbarui produk";
            throw new Error(errorMsg);
        }
      } else {
        console.log("Creating new product");
        res = await createProduk(formPayload);
        if (res.status === 201) {
            message.success("Produk baru berhasil ditambahkan!");
        } else {
            const errorMsg = res.data?.error || res.data?.message || "Gagal menambahkan produk baru";
            throw new Error(errorMsg);
        }
      }

      await fetchData(); // Fetch ulang data
      handleCancel(); // Tutup modal & reset
    } catch (err) {
      console.error("Error save produk:", err);
      message.error(err.message || "Gagal menyimpan produk");
    } finally {
      setSubmitLoading(false); // Set loading form selesai
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData, fileFoto, editingProduct, fetchData]); // Tambahkan fetchData ke dependency

  // --- Memoize Delete Handler ---
  const handleDelete = useCallback(async (id_produk) => {
    setLoading(true); // Gunakan loading utama untuk delete
    try {
      console.log("Deleting product ID:", id_produk);
      const res = await deleteProduk(id_produk);
      if (res.status === 200) {
        message.success("Produk berhasil dihapus!");
        // Optimasi: Hapus item dari state `data` daripada fetch ulang semua
        setData(prevData => prevData.filter(item => item.id_produk !== id_produk));
        // await fetchData(); // Alternatif: fetch ulang jika perlu data konsisten dari server
      } else {
         const errorMsg = res.data?.error || res.data?.message || "Gagal menghapus produk";
         throw new Error(errorMsg);
      }
    } catch (err) {
      console.error("Error delete produk:", err);
      message.error(err.message || "Gagal menghapus produk");
    } finally {
      setLoading(false);
    }
  }, [/* fetchData */]); // Hapus fetchData jika pakai optimasi hapus dari state

const handleEdit = useCallback((product) => {
    console.log("Editing product data:", product);
    const kategoriProduk = kategoriList.find((k) => k.id === product.id_kategori);
    const tenantId = kategoriProduk ? kategoriProduk.id_tenant : null;
    console.log("Found tenant ID for edit:", tenantId);

    setEditingProduct(product);
    setFormData({ // Set semua field form sesuai data produk
      id_tenant: tenantId,
      id_kategori: product.id_kategori,
      nama_produk: product.nama_produk,
      deskripsi_produk: product.deskripsi_produk,
      harga: product.harga,
      status_ketersediaan: product.status_ketersediaan,
      
      // ===== INI ADALAH PERBAIKANNYA =====
      // Kode ini membaca status_visibilitas dari produk yang diedit,
      // bukan lagi menggunakan nilai default "Aktif".
      status_visibilitas: product.status_visibilitas, 
      // ===================================

    });
    setFileFoto(null);
    setPreviewImage(product.foto_produk ? getImageUrl(product.foto_produk) : null);
    setOpen(true);
  }, [kategoriList]); // Tambah kategoriList sebagai dependency

  
  // --- Memoize Cancel Handler ---
  const handleCancel = useCallback(() => {
    setOpen(false);
    setFormData({ status_ketersediaan: "Active", status_visibilitas: "Aktif" });
    setEditingProduct(null);
    setFileFoto(null);
    setPreviewImage(null);
    // setFilteredKategoriList tidak perlu direset manual karena tergantung formData.id_tenant
  }, []);

   // --- Memoize File Change Handler ---
   const handleFileChange = useCallback((info) => {
       if (info.fileList.length > 0) {
           const file = info.fileList[0].originFileObj;
           if (file) {
               const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png';
               if (!isJpgOrPng) {
                   message.error('Hanya bisa upload file JPG/PNG!');
                   setFileFoto(null);
                   setPreviewImage(editingProduct?.foto_produk ? getImageUrl(editingProduct.foto_produk) : null);
                   return;
               }
               const isLt2M = file.size / 1024 / 1024 < 2;
               if (!isLt2M) {
                   message.error('Gambar harus lebih kecil dari 2MB!');
                    setFileFoto(null);
                   setPreviewImage(editingProduct?.foto_produk ? getImageUrl(editingProduct.foto_produk) : null);
                   return;
               }
               setFileFoto(file);
               const reader = new FileReader();
               reader.onload = (e) => setPreviewImage(e.target.result);
               reader.readAsDataURL(file);
           }
       } else {
           setFileFoto(null);
           setPreviewImage(editingProduct?.foto_produk ? getImageUrl(editingProduct.foto_produk) : null);
       }
   // eslint-disable-next-line react-hooks/exhaustive-deps
   }, [editingProduct]); // Tambah editingProduct dependency


  // --- Render ---
  return (
    <Spin spinning={loading} tip="Memuat data produk..."> {/* Tambah Spin indicator */}
        <div style={{ padding: "24px" }}>
          <Row gutter={[16, 16]} align="middle" justify="space-between" style={{ marginBottom: 24 }}>
            <Col xs={24} sm={12} md={10} lg={8}>
              <Search
                placeholder="Cari produk, kategori, tenant..."
                allowClear
                enterButton={<SearchOutlined />}
                size="large"
                value={searchText}
                onSearch={value => setSearchText(value)}
                onChange={(e) => setSearchText(e.target.value)}
              />
            </Col>
            <Col>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => {
                    handleCancel(); // Reset form dulu
                    setOpen(true); // Baru buka modal
                }}
                size="large"
                 style={{
                    background: "#667eea",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    fontWeight: "600",
                 }}
              >
                Tambah Produk Baru
              </Button>
            </Col>
          </Row>

          <Card style={{ borderRadius: "12px", overflowX: 'auto' }}>
            <Table
              columns={columns} // Gunakan columns yg sudah dimemoize
              dataSource={filteredData} // Gunakan data yg sudah dimemoize
              pagination={{
                current: Math.floor(data.findIndex(item => item.key === filteredData[0]?.key) / pageSize) + 1 || 1, // Kalkulasi halaman saat ini
                pageSize,
                showSizeChanger: true,
                pageSizeOptions: ['10', '20', '50', '100'], // Opsi page size
                showQuickJumper: true,
                total: filteredData.length,
                showTotal: (total, range) => `${range[0]}-${range[1]} dari ${total} produk`,
                 onChange: (page, newSize) => {
                     // Hanya update pageSize jika benar-benar berubah
                     if (newSize !== pageSize) {
                         setPageSize(newSize);
                     }
                     // Antd akan handle perubahan halaman (page)
                 },
                position: ["bottomRight"],
              }}
              loading={loading} // Gunakan state loading utama
              scroll={{ x: 1300 }}
              rowKey="id_produk" // Pastikan rowKey benar
            />
          </Card>

          {/* Modal Form Produk */}
          <Modal
             title={
               <Space>
                 {editingProduct ? <EditOutlined /> : <PlusOutlined />}
                 {editingProduct ? "Edit Produk" : "Tambah Produk Baru"}
               </Space>
             }
             open={open}
             onCancel={handleCancel} // Gunakan handler yg dimemoize
             onOk={handleAddProduct} // Gunakan handler yg dimemoize
             confirmLoading={submitLoading} // Gunakan loading form
             okText={editingProduct ? "Update" : "Simpan"}
             cancelText="Batal"
             width={800}
             destroyOnClose // Tetap gunakan ini untuk reset
             maskClosable={false}
          >
            {/* Display loading indicator inside modal if needed */}
            {/* <Spin spinning={submitLoading}> */}
                <Row gutter={[20, 20]} style={{ marginTop: 20}}>
                  <Col xs={24} md={12}>
                    <div style={{ marginBottom: 16 }}>
                      <Text strong>Tenant *</Text>
                      <Select
                        placeholder="Pilih tenant"
                        value={formData.id_tenant}
                        onChange={(val) => handleChange("id_tenant", val)} // Gunakan handler yg dimemoize
                        style={{ width: "100%"}}
                        showSearch
                        optionFilterProp="children"
                        filterOption={(input, option) =>
                          (option?.children ?? "").toLowerCase().includes(input.toLowerCase())
                        }
                        status={!formData.id_tenant && open && !editingProduct ? 'error' : ''}
                      >
                        {tenantList.map((t) => (
                          <Option key={t.id_tenant} value={t.id_tenant}>
                            {t.nama_tenant}
                          </Option>
                        ))}
                      </Select>
                    </div>

                    <div style={{ marginBottom: 16 }}>
                      <Text strong>Kategori *</Text>
                      <Select
                        placeholder="Pilih kategori (setelah pilih tenant)"
                        value={formData.id_kategori}
                        onChange={(val) => handleChange("id_kategori", val)} // Gunakan handler yg dimemoize
                        style={{ width: "100%"}}
                        disabled={!formData.id_tenant || filteredKategoriList.length === 0}
                        showSearch
                        optionFilterProp="children"
                        filterOption={(input, option) =>
                          (option?.children ?? "").toLowerCase().includes(input.toLowerCase())
                        }
                        notFoundContent={!formData.id_tenant ? "Pilih tenant dulu" : "Tidak ada kategori untuk tenant ini"}
                        status={!formData.id_kategori && formData.id_tenant && open && !editingProduct ? 'error' : ''}
                      >
                        {filteredKategoriList.map((k) => (
                          <Option key={k.id} value={k.id}>
                            {k.nama}
                          </Option>
                        ))}
                      </Select>
                    </div>

                    <div style={{ marginBottom: 16 }}>
                      <Text strong>Nama Produk *</Text>
                      <Input
                        placeholder="Masukkan nama produk"
                        value={formData.nama_produk || ""}
                        onChange={(e) => handleChange("nama_produk", e.target.value)} // Gunakan handler yg dimemoize
                        status={!formData.nama_produk && open && !editingProduct ? 'error' : ''}
                      />
                    </div>

                    <div style={{ marginBottom: 16 }}>
                      <Text strong>Harga *</Text>
                      <InputNumber
                        controls={false}
                        placeholder="Masukkan harga (angka saja)"
                        value={formData.harga === null || formData.harga === undefined ? null : formData.harga}
                        onChange={(val) => handleChange("harga", val)} // Gunakan handler yg dimemoize
                        style={{ width: "100%"}}
                        formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                        parser={(value) => value.replace(/\$\s?|(,*)/g, '')}
                        min={0}
                        status={(formData.harga === null || formData.harga === undefined || formData.harga < 0) && open && !editingProduct ? 'error' : ''}
                      />
                    </div>

                    <div style={{ marginBottom: 16 }}>
                      <Text strong>Status Ketersediaan (Tenant)</Text>
                      <Switch
                        checked={formData.status_ketersediaan === "Active"}
                        onChange={(checked) =>
                          handleChange("status_ketersediaan", checked ? "Active" : "Inactive") // Gunakan handler yg dimemoize
                        }
                        checkedChildren="Tersedia"
                        unCheckedChildren="Habis"
                        style={{ display: "block", marginTop: 8 }}
                      />
                    </div>

                    <div>
                      <Text strong>Visibilitas Produk (Admin)</Text>
                      <Switch
                        checked={formData.status_visibilitas === "Aktif"}
                        onChange={(checked) =>
                          handleChange("status_visibilitas", checked ? "Aktif" : "Nonaktif") // Gunakan handler yg dimemoize
                        }
                        checkedChildren="Ditampilkan"
                        unCheckedChildren="Disembunyikan"
                        style={{ display: "block", marginTop: 8 }}
                      />
                    </div>
                  </Col>

                  <Col xs={24} md={12}>
                    <div style={{ marginBottom: 16 }}>
                      <Text strong>Deskripsi</Text>
                      <TextArea
                        rows={6}
                        placeholder="Masukkan deskripsi produk (opsional)"
                        value={formData.deskripsi_produk || ""}
                        onChange={(e) => handleChange("deskripsi_produk", e.target.value)} // Gunakan handler yg dimemoize
                      />
                    </div>

                    <div>
                      <Text strong>Foto Produk</Text>
                      <Upload
                        listType="picture-card"
                        className="product-uploader"
                        showUploadList={false}
                        // beforeUpload di-handle oleh onChange
                        onChange={handleFileChange} // Gunakan handler yg dimemoize
                        maxCount={1}
                        accept="image/png, image/jpeg"
                      >
                        {previewImage ? (
                          <img src={previewImage} alt="Preview" style={{ width: '100%', borderRadius: '8px' }} />
                        ) : (
                          <div>
                            <PlusOutlined />
                            <div style={{ marginTop: 8 }}>Upload Foto</div>
                          </div>
                        )}
                      </Upload>
                      {previewImage && (
                        <Button
                          size="small"
                          danger
                          onClick={() => { // Logic hapus preview
                            setFileFoto(null);
                            setPreviewImage(editingProduct?.foto_produk ? getImageUrl(editingProduct.foto_produk) : null);
                          }}
                          style={{ marginTop: 8 }}
                        >
                          Hapus Foto
                        </Button>
                      )}
                      <Text type="secondary" style={{ fontSize: '12px', display: 'block', marginTop: 4 }}>
                        Klik area di atas untuk upload (JPG/PNG, Max 2MB).
                        {editingProduct && ' Kosongkan jika tidak ingin mengubah foto.'}
                      </Text>
                    </div>
                  </Col>
                </Row>
            {/* </Spin> */}
          </Modal>

          {/* CSS untuk preview upload picture-card */}
          <style jsx global>{`
              .product-uploader .ant-upload.ant-upload-select-picture-card {
                width: 150px;
                height: 150px;
                margin-right: 8px; /* Tambah margin */
                margin-bottom: 8px;
              }
              .product-uploader .ant-upload img {
                 border-radius: 8px;
                 object-fit: cover; /* Pastikan gambar ter-cover */
              }
            `}</style>
        </div>
    </Spin> // Tutup Spin indicator
  );
};

export default ProductTab;