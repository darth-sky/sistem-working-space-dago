import React from "react";
import { Button, Form, Input, Radio, Card } from "antd";
import { useNavigate } from "react-router-dom";
import { UserOutlined, ArrowRightOutlined } from "@ant-design/icons";
import dayjs from "dayjs";

const BuatOrderKasir = () => {
    const navigate = useNavigate();
    const [form] = Form.useForm();
    const orderType = Form.useWatch("orderType", form); // Memantau perubahan field 'orderType'

    const cashierName = "Rossa"; // Bisa diambil dari state global/login

    // Fungsi yang akan dijalankan setelah form di-submit
    const onFinish = (values) => {
        console.log("Initial Order Data:", values);
        // Navigasi ke halaman OrderKasir sambil mengirimkan state
        navigate('/orderkasir', {
            state: {
                orderType: values.orderType,
                customerName: values.customerName || "Guest", // Default ke 'Guest' jika kosong
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
                    initialValues={{ orderType: "dinein" }} // Nilai default
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

                    {/* Input Ruangan/Meja akan muncul hanya jika tipe order adalah 'dinein' */}
                    {orderType === "dinein" && (
                        <Form.Item
                            label="Nomor Meja/Ruangan"
                            name="room"
                            rules={[{ required: true, message: "Nomor meja/ruangan harus diisi untuk Dine In!" }]}
                        >
                            <Input placeholder="Contoh: Meja 5, RM2" />
                        </Form.Item>
                    )}

                    <Form.Item label="Kasir">
                        <Input value={cashierName} disabled prefix={<UserOutlined />} />
                    </Form.Item>

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