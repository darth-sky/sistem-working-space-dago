/* eslint-disable react/prop-types */
import React, { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  Progress,
  Button,
  Typography,
  Row,
  Col,
  Space,
  List,
  Spin,
  Divider,
} from "antd";
import {
  CalendarOutlined,
  ClockCircleOutlined,
  CreditCardOutlined,
} from "@ant-design/icons";
import { AuthContext } from "../../../providers/AuthProvider";
import { getMemberData } from "../../../services/service";

const { Title, Text } = Typography;

const CekKreditMembership = () => {
  const { userProfile } = useContext(AuthContext);
  const [member, setMember] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchMember = async () => {
      if (!userProfile?.id_user) return;

      try {
        const data = await getMemberData(userProfile.id_user);

        if (!data?.datas || data.datas.length === 0) {
          setMember(null);
          return;
        }

        const membership = data.datas[0];

        setMember({
          paketId: membership.id_paket_membership,
          name: userProfile.email,
          membershipType: `${membership.nama_paket} (${membership.nama_kategori})`,
          startDate: new Date(membership.tanggal_mulai).toLocaleDateString("id-ID", {
            day: "numeric",
            month: "long",
            year: "numeric",
          }),
          endDate: new Date(membership.tanggal_berakhir).toLocaleDateString("id-ID", {
            day: "numeric",
            month: "long",
            year: "numeric",
          }),
          creditsUsed: membership.total_credit - membership.sisa_credit,
          totalCredits: membership.kuota,
          riwayat: [],
        });
      } catch (error) {
        console.error("Gagal ambil data member:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMember();
  }, [userProfile]);

  const handlePerpanjang = () => {
    if (member && member.paketId) {
      navigate(`/daftar-member/${member.paketId}`);
    } else {
      console.error("ID Paket Membership tidak ditemukan!");
    }
  };

  if (loading)
    return <Spin tip="Loading..." style={{ display: "block", margin: "50px auto" }} />;

  if (!member)
    return (
      <div style={{ textAlign: "center", marginTop: 50 }}>
        Tidak ada data membership
      </div>
    );

  const sisaKredit = member.totalCredits - member.creditsUsed;
  const persentase = Math.round((member.creditsUsed / member.totalCredits) * 100);

  return (
    <div style={{ padding: "24px", maxWidth: "1000px", margin: "0 auto" }}>
      <Space direction="vertical" size="large" style={{ width: "100%" }}>
        {/* Hero Membership Info */}
        <Card
          bordered={false}
          style={{
            borderRadius: "16px",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
            background: "linear-gradient(135deg, #1890ff, #40a9ff)",
            color: "#fff",
          }}
          bodyStyle={{ padding: "24px" }}
        >
          <Row justify="space-between" align="middle" gutter={[16, 16]}>
            <Col xs={24} sm={16}>
              <Text strong style={{ color: "#e6f7ff", fontSize: 14 }}>
                Status Membership
              </Text>
              <Title level={3} style={{ margin: "4px 0", color: "#fff" }}>
                {member.membershipType}
              </Title>
              <Text style={{ color: "#f0f5ff" }}>
                Berlaku {member.startDate} → {member.endDate}
              </Text>
              <Divider style={{ borderColor: "rgba(255,255,255,0.3)" }} />
              <Text style={{ fontSize: 16, color: "#fff" }}>
                Sisa Kredit: <strong>{sisaKredit}</strong> dari {member.totalCredits}
              </Text>
            </Col>
            <Col xs={24} sm={8} style={{ textAlign: "right" }}>
              <Button
                type="primary"
                size="large"
                shape="round"
                onClick={handlePerpanjang}
                style={{
                  backgroundColor: "#fff",
                  color: "#1890ff",
                  fontWeight: "bold",
                  width: "100%",
                  maxWidth: 200,
                }}
              >
                Perpanjang
              </Button>
            </Col>
          </Row>
        </Card>

        {/* Quick Info Cards */}
        <Row gutter={[24, 24]}>
          <Col xs={24} sm={8}>
            <Card
              bordered={false}
              style={{
                textAlign: "center",
                borderRadius: "16px",
                backgroundColor: "#e6f7ff",
              }}
            >
              <CreditCardOutlined style={{ fontSize: "24px", color: "#1890ff" }} />
              <Title level={3} style={{ margin: "8px 0 4px 0", color: "#1890ff" }}>
                {sisaKredit} / {member.totalCredits}
              </Title>
              <Text type="secondary">Sisa Kredit</Text>
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card
              bordered={false}
              style={{
                textAlign: "center",
                borderRadius: "16px",
                backgroundColor: "#e6f7ff",
              }}
            >
              <CalendarOutlined style={{ fontSize: "24px", color: "#1890ff" }} />
              <Title level={4} style={{ margin: "8px 0 4px 0", color: "#1890ff" }}>
                {member.endDate}
              </Title>
              <Text type="secondary">Tanggal Berakhir</Text>
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card
              bordered={false}
              style={{
                textAlign: "center",
                borderRadius: "16px",
                backgroundColor: "#e6f7ff",
              }}
            >
              <ClockCircleOutlined style={{ fontSize: "24px", color: "#1890ff" }} />
              <Title level={3} style={{ margin: "8px 0 4px 0", color: "#1890ff" }}>
                {persentase}%
              </Title>
              <Text type="secondary">Kredit Digunakan</Text>
            </Card>
          </Col>
        </Row>

        {/* Progress Bar */}
        <Card
          bordered={false}
          style={{ borderRadius: "16px", boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)" }}
          bodyStyle={{ padding: "24px 24px 8px 24px" }}
        >
          <Progress
            percent={persentase}
            strokeColor="#1890ff"
            status="active"
            style={{ marginBottom: "8px" }}
          />
          <Text type="secondary" style={{ display: "block", textAlign: "center" }}>
            {persentase}% dari kredit Anda sudah digunakan
          </Text>
        </Card>

        {/* Riwayat Penggunaan */}
        <Card
          bordered={false}
          title={<Title level={4} style={{ margin: 0 }}>Riwayat Penggunaan</Title>}
          style={{ borderRadius: "16px", boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)" }}
        >
          {member.riwayat.length > 0 ? (
            <List
              itemLayout="horizontal"
              dataSource={member.riwayat}
              renderItem={(item) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={
                      <div
                        style={{
                          padding: "12px",
                          borderRadius: "50%",
                          backgroundColor: "#e6f7ff",
                        }}
                      >
                        <ClockCircleOutlined
                          style={{ color: "#1890ff", fontSize: "20px" }}
                        />
                      </div>
                    }
                    title={<Text strong>{item.deskripsi}</Text>}
                    description={<Text type="secondary">{item.tanggal}</Text>}
                  />
                </List.Item>
              )}
            />
          ) : (
            <Text type="secondary" style={{ display: "block", textAlign: "center" }}>
              Belum ada riwayat penggunaan
            </Text>
          )}
        </Card>
      </Space>
    </div>
  );
};

export default CekKreditMembership;