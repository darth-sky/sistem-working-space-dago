import React, { useState, useEffect } from "react";
import {
  Table, Button, Modal, Form, Input, Select, Space, message, Popconfirm, Upload, Image,
  Typography, Tag,
  Switch, // PERUBAHAN: Impor Switch
} from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined, UploadOutlined } from "@ant-design/icons";
import {
  getTenants,
  createTenant,
  updateTenant,
  deleteTenant,
  getUsers,
  updateTenantStatus
} from "../../../../services/service";

const { Option } = Select;
const { Text } = Typography;
const API_URL = import.meta.env.VITE_BASE_URL;

// Helper untuk Ant Design Form & Upload
const normFile = (e) => {
  if (Array.isArray(e)) {
    return e;
  }
  return e && e.fileList;
};

const TenantTab = () => {
  const [tenants, setTenants] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [updatingStatusId, setUpdatingStatusId] = useState(null); // PERUBAHAN: State untuk loading per-switch
  const [open, setOpen] = useState(false);
  const [editingTenant, setEditingTenant] = useState(null);
  const [fileList, setFileList] = useState([]);
  const [form] = Form.useForm();

  const fetchTenants = async () => {
    setLoading(true);
    try {
      const res = await getTenants();
      if (res.status === 200) {
        setTenants(res.data.datas);
      } else {
        message.error("Gagal memuat data tenant!");
      }
    } catch (error) {
      message.error("Terjadi kesalahan: " + error.message);
    } finally {
      setLoading(false);
      setUpdatingStatusId(null); // PERUBAHAN: Pastikan loading switch mati setelah fetch
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await getUsers();
      if (res.status === 200) {
        setUsers(res.data.datas);
      }
    } catch (error) {
      console.error("Gagal memuat data user:", error);
    }
  };

  useEffect(() => {
    fetchTenants();
    fetchUsers();
  }, []);

  const handleAdd = () => {
    setEditingTenant(null);
    form.resetFields();
    setFileList([]);
    setOpen(true);
  };

  const handleEdit = (record) => {
    setEditingTenant(record);
    form.setFieldsValue({
      nama_tenant: record.nama_tenant,
      deskripsi_tenant: record.deskripsi_tenant,
      id_user: record.id_user
    });

    if (record.gambar_tenant) {
      setFileList([
        {
          uid: '-1',
          name: record.gambar_tenant,
          status: 'done',
          url: `${API_URL}/static/${record.gambar_tenant}`,
        },
      ]);
    } else {
      setFileList([]);
    }
    setOpen(true);
  };

  const handleDelete = async (id_tenant) => {
    try {
      const res = await deleteTenant(id_tenant);
      if (res.status === 200) {
        message.success("Tenant berhasil dihapus!");
        fetchTenants();
      } else {
        message.error(res.data.error || "Gagal menghapus tenant.");
      }
    } catch (error) {
      message.error("Terjadi kesalahan: " + error.message);
    }
  };

  // PERUBAHAN: Logika untuk menangani loading per-switch
  const handleStatusChange = async (newStatus, id_tenant) => {
    setUpdatingStatusId(id_tenant); // Atur loading HANYA untuk switch ini
    try {
      const res = await updateTenantStatus(id_tenant, newStatus);
      if (res.status === 200) {
        message.success(res.data.message || "Status tenant diperbarui!");
        // Update state lokal secara manual agar UI cepat merespons
        // Ini opsional, tapi UX-nya lebih baik daripada fetchTenants()
        setTenants(prevTenants =>
          prevTenants.map(tenant =>
            tenant.id_tenant === id_tenant
              ? { ...tenant, status_tenant: newStatus }
              : tenant
          )
        );
      } else {
        message.error(res.data.error || "Gagal memperbarui status.");
      }
    } catch (error) {
      message.error("Terjadi kesalahan: " + error.message);
    } finally {
      // Hentikan loading untuk switch ini
      setUpdatingStatusId(null); 
      // fetchTenants(); // Anda bisa juga fetch ulang, tapi update manual lebih cepat
    }
  };

  const handleCancel = () => {
    setOpen(false);
    setFileList([]);
  };

  const handleOk = () => {
    form.validateFields().then(async (values) => {
      const formData = new FormData();
      formData.append('nama_tenant', values.nama_tenant);
      formData.append('deskripsi_tenant', values.deskripsi_tenant || '');
      formData.append('id_user', values.id_user);

      if (values.gambar_tenant && values.gambar_tenant.length > 0 && values.gambar_tenant[0].originFileObj) {
        formData.append('gambar_tenant', values.gambar_tenant[0].originFileObj);
      }

      try {
        setLoading(true);
        let res;
        if (editingTenant) {
          res = await updateTenant(editingTenant.id_tenant, formData);
        } else {
          res = await createTenant(formData);
        }

        if (res.status === 200 || res.status === 201) {
          message.success(`Tenant berhasil ${editingTenant ? 'diperbarui' : 'ditambahkan'}!`);
          setOpen(false);
          fetchTenants();
        } else {
          message.error(res.data.error || "Operasi gagal.");
        }
      } catch (error) {
        message.error("Terjadi kesalahan: " + error.message);
      } finally {
        setLoading(false);
      }
    });
  };

  const columns = [
    { title: "No", key: "no", render: (text, record, index) => index + 1, width: 70 },
    {
      title: "Gambar",
      dataIndex: "gambar_tenant",
      key: "gambar_tenant",
      render: (text) =>
        text ? (
          <Image width={80} src={`${API_URL}/static/${text}`} />
        ) : (
          <Text type="secondary">No Image</Text>
        )
    },
    { title: "Tenant", dataIndex: "nama_tenant", key: "nama_tenant", sorter: (a, b) => a.nama_tenant.localeCompare(b.nama_tenant) },
    { title: "Owner", dataIndex: "nama_owner", key: "nama_owner" },
    { title: "Deskripsi", dataIndex: "deskripsi_tenant", key: "deskripsi_tenant" },
    {
      title: "Status",
      dataIndex: "status_tenant",
      key: "status_tenant",
      render: (text, record) => (
        <Space size="middle">
          
          
          {/* PERUBAHAN: Ganti dua tombol Popconfirm dengan satu Switch */}
          <Switch
            checkedChildren="Active"
            unCheckedChildren="Inactive"
            checked={record.status_tenant === 'Active'}
            onChange={(checked) => handleStatusChange(checked ? 'Active' : 'Inactive', record.id_tenant)}
            loading={updatingStatusId === record.id_tenant} // Loading per-baris
            disabled={loading} // Disable jika tabel sedang loading
          />


        </Space>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      render: (text, record) => (
        <Space size="middle">
          <Button icon={<EditOutlined />} onClick={() => handleEdit(record)}>Edit</Button>
          


          <Popconfirm
            title="Anda yakin ingin menghapus tenant ini?"
            onConfirm={() => handleDelete(record.id_tenant)}
            okText="Ya"
            cancelText="Tidak"
          >
            <Button danger icon={<DeleteOutlined />}>Delete</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          Add Tenant
        </Button>
      </div>

      <Table columns={columns} dataSource={tenants} rowKey="id_tenant" loading={loading} />

      <Modal
        title={editingTenant ? "Edit Tenant" : "Add Tenant"}
        open={open}
        onCancel={handleCancel}
        onOk={handleOk}
        confirmLoading={loading}
        okText={editingTenant ? "Update" : "Create"}
        cancelText="Cancel"
      >
        <Form layout="vertical" form={form}>
          <Form.Item label="Tenant Name" name="nama_tenant" rules={[{ required: true, message: 'Nama tenant tidak boleh kosong' }]}>
            <Input />
          </Form.Item>
          <Form.Item label="Owner" name="id_user" rules={[{ required: true, message: 'Owner harus dipilih' }]}>
            <Select showSearch placeholder="Pilih atau cari owner" optionFilterProp="children" filterOption={(input, option) => (option?.children ?? '').toLowerCase().includes(input.toLowerCase())}>
              {users.map(user => (
                <Option key={user.id_user} value={user.id_user}>{user.nama}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item label="Deskripsi" name="deskripsi_tenant">
            <Input.TextArea rows={4} />
          </Form.Item>
          <Form.Item
            label="Gambar Tenant"
            name="gambar_tenant"
            valuePropName="fileList"
            getValueFromEvent={normFile}
          >
            <Upload
              listType="picture-card"
              maxCount={1}
              beforeUpload={() => false}
              fileList={fileList}
              onChange={({ fileList: newFileList }) => setFileList(newFileList)}
            >
              <div>
                <PlusOutlined />
                <div style={{ marginTop: 8 }}>Upload</div>
              </div>
            </Upload>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default TenantTab;