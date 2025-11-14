import React from "react";
import { Button, Form, Input, Radio, Card } from "antd";
import { useNavigate } from "react-router-dom";
import { UserOutlined, ArrowRightOutlined } from "@ant-design/icons";
import dayjs from "dayjs";

// --- TAMBAHAN: Impor useAuth untuk mendapatkan data user ---
import { useAuth } from "../../../providers/AuthProvider";
// --- AKHIR TAMBAHAN ---

const BuatOrderKasir = () => {
    const navigate = useNavigate();
    const [form] = Form.useForm();
    const orderType = Form.useWatch("orderType", form);

    // --- TAMBAHAN: Panggil hook useAuth ---
    const { userProfile } = useAuth();
    // --- AKHIR TAMBAHAN ---

    // --- PERUBAHAN: Ambil nama dari userProfile, dengan fallback ---
    const cashierName = userProfile?.detail?.nama || userProfile?.email || "Kasir";
    // --- AKHIR PERUBAHAN ---

    // Fungsi yang akan dijalankan setelah form di-submit
    const onFinish = (values) => {
        console.log("Initial Order Data:", values);
        // Navigasi ke halaman OrderKasir sambil mengirimkan state
        navigate('/orderkasir', {
            state: {
                orderType: values.orderType,
                customerName: values.customerName || "Guest",
                room: values.room || null,
            }
        });
    };

    return (
        <div className="flex justify-center items-center h-screen bg-gray-100">
            <Card
                title={<div className="text-xl font-bold text-gray-800">Buat Order Baru</div>}
                style={{ width: 450 }}
                className="shadow-lg"
            >
                <p className="text-gray-500 mb-4">
                    {dayjs().format("DD MMMM YYYY HH:mm")}
                </p>

                <Form
                    form={form}
                    layout="vertical"
                    onFinish={onFinish}
                    initialValues={{ orderType: "dinein" }}
                >
                    <Form.Item
                        label="Tipe Order"
                        name="orderType"
                        rules={[{ required: true, message: "Silakan pilih tipe order!" }]}
                    >
                        <Radio.Group className="w-full">
                            <Radio.Button value="dinein" className="w-1/3 text-center">
                                Dine In
                            </Radio.Button>
                            <Radio.Button value="takeaway" className="w-1/3 text-center">
                                Takeaway
                            </Radio.Button>
                            <Radio.Button value="pickup" className="w-1/3 text-center">
                                Pick Up
                            </Radio.Button>
                        </Radio.Group>
                    </Form.Item>

                    <Form.Item
                        label="Nama Customer (Opsional)"
                        name="customerName"
                    >
                        <Input placeholder="Contoh: Budi" />
                    </Form.Item>

                    {orderType === "dinein" && (
                        <>
                            <Form.Item
                                label="Nomor Meja/Ruangan"
                                name="room"
                                rules={[{ required: true, message: "Nomor meja/ruangan harus diisi untuk Dine In!" }]}
                            >
                                <Input placeholder="Contoh: Meja 5, RM2" />
                            </Form.Item>
                            
                            {/* Tampilan kasir sekarang sudah dinamis */}
                            <div className="flex items-center text-sm text-gray-500 -mt-2 mb-4 ml-1">
                                <UserOutlined className="mr-2" />
                                <span>Kasir: {cashierName}</span>
                            </div>
                        </>
                    )}

                    <Form.Item className="mt-6">
                        <Button
                            type="primary"
                            htmlType="submit"
                            block
                            size="large"
                            icon={<ArrowRightOutlined />}
                        >
                            Lanjutkan ke Pemesanan
                        </Button>
                    </Form.Item>
                </Form>
            </Card>
        </div>
    );
};

export default BuatOrderKasir;