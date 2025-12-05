import React, { useState, useEffect } from "react";
import {
    Table, Button, Modal, Form, Input, Space,
    message, Popconfirm, Typography, Row, Col, notification, Card, Tag
} from "antd";
import { 
    PlusOutlined, EditOutlined, DeleteOutlined, 
    CheckCircleOutlined, CloseCircleOutlined, SettingOutlined
} from "@ant-design/icons";
import {
    getSettings, createSetting, updateSetting, deleteSetting
} from "../../../../services/service"; // Sesuaikan path import

const { Text, Title } = Typography;
const { TextArea } = Input;

const SettingsTab = () => {
    const [settingsList, setSettingsList] = useState([]);
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null); // Menyimpan item yang sedang diedit
    const [form] = Form.useForm();
    const [searchText, setSearchText] = useState("");

    const [api, contextHolder] = notification.useNotification();

    const openNotif = (type, title, desc) => {
        api[type]({
            message: title,
            description: desc,
            placement: "topRight",
            duration: 3,
            icon: type === "success" ? (
                <CheckCircleOutlined style={{ color: "#52c41a" }} />
            ) : (
                <CloseCircleOutlined style={{ color: "#ff4d4f" }} />
            ),
        });
    };

    const fetchSettingsData = async () => {
        setLoading(true);
        try {
            const res = await getSettings();
            if (res.status === 200) {
                setSettingsList(res.data.datas);
            } else {
                openNotif("error", "Gagal Memuat", "Gagal memuat konfigurasi settings.");
            }
        } catch (error) {
            openNotif("error", "Kesalahan", error.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSettingsData();
    }, []);

    // Filter data di client-side
    const filteredData = settingsList.filter(item => 
        item.key.toLowerCase().includes(searchText.toLowerCase()) ||
        item.value.toLowerCase().includes(searchText.toLowerCase()) ||
        (item.deskripsi && item.deskripsi.toLowerCase().includes(searchText.toLowerCase()))
    );

    const handleAdd = () => {
        setEditingItem(null);
        form.resetFields();
        setOpen(true);
    };

    const handleEdit = (record) => {
        setEditingItem(record);
        form.setFieldsValue({
            key: record.key,
            value: record.value,
            deskripsi: record.deskripsi
        });
        setOpen(true);
    };

    const handleDelete = async (key) => {
        try {
            setLoading(true);
            const res = await deleteSetting(key);
            if (res.status === 200) {
                openNotif("success", "Berhasil", "Setting berhasil dihapus.");
                fetchSettingsData();
            } else {
                openNotif("error", "Gagal", res.data.message || "Gagal menghapus setting.");
            }
        } catch (error) {
            openNotif("error", "Kesalahan", error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleOk = () => {
        form.validateFields().then(async (values) => {
            setLoading(true);
            try {
                let res;
                if (editingItem) {
                    // Update: Key tidak dikirim di body untuk update, tapi lewat URL param di service
                    res = await updateSetting(editingItem.key, {
                        value: values.value,
                        deskripsi: values.deskripsi
                    });
                } else {
                    // Create
                    res = await createSetting(values);
                }

                if (res.status === 200 || res.status === 201) {
                    openNotif(
                        "success", 
                        editingItem ? "Diperbarui" : "Ditambahkan",
                        editingItem ? "Setting berhasil diperbarui!" : "Setting baru berhasil dibuat!"
                    );
                    setOpen(false);
                    fetchSettingsData();
                } else {
                    openNotif("error", "Gagal", res.data.message || "Operasi gagal.");
                }
            } catch (error) {
                openNotif("error", "Kesalahan", error.message);
            } finally {
                setLoading(false);
            }
        });
    };

    const columns = [
        {
            title: "No",
            key: "no",
            render: (_, __, index) => index + 1,
            width: 60,
        },
        {
            title: "Key (Kunci)",
            dataIndex: "key",
            key: "key",
            width: 200,
            render: text => <Tag color="blue" style={{ fontSize: '14px', padding: '5px 10px' }}>{text}</Tag>,
            sorter: (a, b) => a.key.localeCompare(b.key),
        },
        {
            title: "Value (Nilai)",
            dataIndex: "value",
            key: "value",
            width: 250,
            render: text => <Text strong>{text}</Text>,
        },
        {
            title: "Deskripsi",
            dataIndex: "deskripsi",
            key: "deskripsi",
            render: text => <Text type="secondary">{text || "-"}</Text>,
        },
        {
            title: "Aksi",
            key: "actions",
            width: 150,
            render: (_, record) => (
                <Space>
                    <Button 
                        type="default" 
                        size="small" 
                        icon={<EditOutlined />} 
                        onClick={() => handleEdit(record)}
                    >
                        Edit
                    </Button>
                    <Popconfirm
                        title="Hapus setting ini?"
                        description="Tindakan ini mungkin mempengaruhi fitur aplikasi."
                        onConfirm={() => handleDelete(record.key)}
                        okText="Ya, Hapus"
                        cancelText="Batal"
                        okButtonProps={{ danger: true }}
                    >
                        <Button danger size="small" icon={<DeleteOutlined />}>
                            Hapus
                        </Button>
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    return (
        <div style={{ padding: '20px' }}>
            {contextHolder}
            
            <Card title={<><SettingOutlined /> Manajemen System Settings</>} bordered={false} style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
                    <Col>
                        <Input 
                            placeholder="Cari Setting..." 
                            value={searchText}
                            onChange={(e) => setSearchText(e.target.value)}
                            style={{ width: 250 }} 
                            allowClear
                        />
                    </Col>
                    <Col>
                        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
                            Tambah Setting
                        </Button>
                    </Col>
                </Row>

                <Table
                    columns={columns}
                    dataSource={filteredData}
                    rowKey="key"
                    loading={loading}
                    pagination={{ pageSize: 10 }}
                    bordered
                    scroll={{ x: 800 }}
                />
            </Card>

            <Modal
                title={editingItem ? "Edit Setting" : "Tambah Setting Baru"}
                open={open}
                onCancel={() => setOpen(false)}
                onOk={handleOk}
                confirmLoading={loading}
            >
                <Form layout="vertical" form={form}>
                    <Form.Item
                        label="Key (Kunci Unik)"
                        name="key"
                        rules={[
                            { required: true, message: "Key wajib diisi" },
                            { pattern: /^[A-Z0-9_]+$/, message: "Gunakan huruf kapital, angka, atau underscore (_)" }
                        ]}
                        tooltip="Digunakan oleh sistem code untuk mengidentifikasi setting. Contoh: PAJAK_PPN, HARGA_DEFAULT"
                    >
                        {/* Key tidak boleh diedit jika sedang mode Edit karena merupakan Primary Key */}
                        <Input 
                            placeholder="Cth: PAJAK_FNB_PERSEN" 
                            disabled={!!editingItem} 
                            style={{ textTransform: 'uppercase' }}
                        />
                    </Form.Item>

                    <Form.Item
                        label="Value (Nilai)"
                        name="value"
                        rules={[{ required: true, message: "Value wajib diisi" }]}
                    >
                        <Input placeholder="Cth: 10 atau aktif" />
                    </Form.Item>

                    <Form.Item
                        label="Deskripsi"
                        name="deskripsi"
                    >
                        <TextArea rows={3} placeholder="Jelaskan fungsi setting ini..." />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default SettingsTab;