import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography, message, Modal } from 'antd';
import { LockOutlined, KeyOutlined } from '@ant-design/icons';
import { useAuth } from '../../../providers/AuthProvider'; // Import useAuth
import { apiChangePassword } from '../../../services/service'; // Import service baru
import logo from '../../../assets/images/logo.png'; // Sesuaikan path ke logo Anda

const { Title, Text } = Typography;

const GantiPasswordKasir = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const { userProfile, logout } = useAuth(); // Ambil fungsi logout

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      await apiChangePassword(values.old_password, values.new_password);
      form.resetFields();
      setLoading(false);
      Modal.success({
        title: 'Password Berhasil Diubah',
        content: 'Anda akan dialihkan ke halaman Login untuk masuk kembali dengan password baru Anda.',
        onOk: () => logout(),
      });


    } catch (error) {
      console.error("Error ganti password:", error);
      message.error(error.message || "Gagal mengubah password. Pastikan password lama Anda benar.");
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <div className="flex flex-col items-center mb-4">
          <img src={logo} alt="Logo" className="w-24 h-24 mb-2" />
          <Title level={3}>Ganti Password</Title>
          <Text type="secondary">
            Selamat datang, {userProfile?.email || 'Kasir'}.
          </Text>
          <Text>Ini adalah login pertama Anda. Harap ganti password Anda.</Text>
        </div>

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          autoComplete="off"
        >
          <Form.Item
            name="old_password"
            label="Password Lama"
            rules={[{ required: true, message: 'Silakan masukkan password lama Anda!' }]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Password Lama"
              autoComplete="current-password"
            />
          </Form.Item>

          <Form.Item
            name="new_password"
            label="Password Baru"
            rules={[{ required: true, message: 'Silakan masukkan password baru!' }]}
            hasFeedback
          >
            <Input.Password
              prefix={<KeyOutlined />}
              placeholder="Password Baru"
              autoComplete="new-password"
            />
          </Form.Item>

          <Form.Item
            name="confirm_password"
            label="Konfirmasi Password Baru"
            dependencies={['new_password']}
            hasFeedback
            rules={[
              { required: true, message: 'Silakan konfirmasi password baru Anda!' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('new_password') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('Password baru yang Anda masukkan tidak cocok!'));
                },
              }),
            ]}
          >
            <Input.Password
              prefix={<KeyOutlined />}
              placeholder="Konfirmasi Password Baru"
              autoComplete="new-password"
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              className="w-full"
            >
              Ganti Password
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default GantiPasswordKasir;