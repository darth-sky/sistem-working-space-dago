import React, { useState, useEffect } from "react";
import { Table, Button, Modal, Form, Input, Select, Space, message, Popconfirm } from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import {
  getTenants,
  createTenant,
  updateTenant,
  deleteTenant,
  getUsers, // Import service untuk get user
} from "../../../../services/service"; // Sesuaikan path import

const { Option } = Select;

const TenantTab = () => {
  const [tenants, setTenants] = useState([]);
  const [users, setUsers] = useState([]); // State untuk menyimpan data user
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [editingTenant, setEditingTenant] = useState(null);
  const [form] = Form.useForm();

  // Fungsi untuk mengambil data dari server
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
    }
  };

  // Fungsi untuk mengambil data user
  const fetchUsers = async () => {
    try {
      const res = await getUsers();
      if (res.status === 200) {
        // Asumsi data user ada di res.data.datas
        setUsers(res.data.datas);
      }
    } catch (error) {
      console.error("Gagal memuat data user:", error);
    }
  };

  // useEffect untuk memuat data saat komponen pertama kali dirender
  useEffect(() => {
    fetchTenants();
    fetchUsers();
  }, []);

  // --- Handlers ---
  const handleAdd = () => {
    setEditingTenant(null);
    form.resetFields();
    setOpen(true);
  };

  const handleEdit = (record) => {
    setEditingTenant(record);
    form.setFieldsValue({
      nama_tenant: record.nama_tenant,
      deskripsi_tenant: record.deskripsi_tenant,
      id_user: record.id_user
    });
    setOpen(true);
  };

  const handleDelete = async (id_tenant) => {
    try {
      const res = await deleteTenant(id_tenant);
      if (res.status === 200) {
        message.success("Tenant berhasil dihapus!");
        fetchTenants(); // Muat ulang data
      } else {
        message.error(res.data.error || "Gagal menghapus tenant.");
      }
    } catch (error) {
      message.error("Terjadi kesalahan: " + error.message);
    }
  };

  const handleOk = () => {
    form.validateFields().then(async (values) => {
      try {
        let res;
        if (editingTenant) {
          // Mode Update
          res = await updateTenant(editingTenant.id_tenant, values);
        } else {
          // Mode Create
          res = await createTenant(values);
        }

        if (res.status === 200 || res.status === 201) {
          message.success(`Tenant berhasil ${editingTenant ? 'diperbarui' : 'ditambahkan'}!`);
          setOpen(false);
          fetchTenants(); // Muat ulang data
        } else {
          message.error(res.data.error || "Operasi gagal.");
        }
      } catch (error) {
        message.error("Terjadi kesalahan: " + error.message);
      }
    });
  };

  const columns = [
    {
      title: "No",
      key: "no",
      render: (text, record, index) => index + 1
    },
    { title: "Tenant", dataIndex: "nama_tenant", key: "nama_tenant" },
    { title: "Owner", dataIndex: "nama_owner", key: "nama_owner" },
    { title: "Deskripsi", dataIndex: "deskripsi_tenant", key: "deskripsi_tenant" },
    {
      title: "Actions",
      key: "actions",
      render: (text, record) => (
        <Space size="middle">
          <Button icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            Edit
          </Button>
          <Popconfirm
            title="Anda yakin ingin menghapus tenant ini?"
            onConfirm={() => handleDelete(record.id_tenant)}
            okText="Ya"
            cancelText="Tidak"
          >
            <Button danger icon={<DeleteOutlined />}>
              Delete
            </Button>
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

      <Table
        columns={columns}
        dataSource={tenants}
        rowKey="id_tenant"
        loading={loading}
      />

      <Modal
        title={editingTenant ? "Edit Tenant" : "Add Tenant"}
        open={open}
        onCancel={() => setOpen(false)}
        onOk={handleOk}
        okText={editingTenant ? "Update" : "Create"}
        cancelText="Cancel"
      >
        <Form layout="vertical" form={form}>
          <Form.Item label="Tenant Name" name="nama_tenant" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item label="Owner" name="id_user" rules={[{ required: true }]}>
            <Select
              showSearch
              placeholder="Pilih atau cari owner"
              optionFilterProp="children"
              filterOption={(input, option) =>
                (option?.children ?? '').toLowerCase().includes(input.toLowerCase())
              }
            >
              {users.map(user => (
                <Option key={user.id_user} value={user.id_user}>
                  {user.nama}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item label="Deskripsi" name="deskripsi_tenant">
            <Input.TextArea rows={4} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default TenantTab;