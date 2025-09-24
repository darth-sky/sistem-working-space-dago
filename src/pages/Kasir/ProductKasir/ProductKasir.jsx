import React, { useState } from "react";
import { Table, Input, Tag, Typography, Select, Space } from "antd";

const { Title } = Typography;
const { Option } = Select;

const ProductKasir = () => {
    const [search, setSearch] = useState("");
    const [categoryFilter, setCategoryFilter] = useState("All");

    const data = [
        {
            key: 1,
            no: 1,
            product: "Nasi Ayam Ngejengit",
            merchant: "Dapoer M.S",
            category: "Best Deal",
            hpp: 15000,
            price: 15000,
            status: "Active",
            updated: "01 Juni 2025 22:53:49"
        },
        {
            key: 2,
            no: 2,
            product: "Paket Ruang Leseh (8 Jam)",
            merchant: "Dago Creative Space",
            category: "Space Lesehan",
            hpp: 45000,
            price: 45000,
            status: "Active",
            updated: "31 Mei 2025 22:53:49"
        },
        {
            key: 3,
            no: 3,
            product: "Danish ",
            merchant: "HomeBro",
            category: "Bakery & Sweets",
            hpp: 16000,
            price: 16000,
            status: "Inactive",
            updated: "01 Juni 2025 22:53:49"
        },
        {
            key: 4,
            no: 4,
            product: "Meeting Room Besar (8 Jam)",
            merchant: "Dago Creative Space",
            category: "Meeting Room Besar",
            hpp: 300000,
            price: 300000,
            status: "Active",
            updated: "01 Juni 2025 22:53:49"
        },
        {
            key: 5,
            no: 5,
            product: "Space Monitor (6 Jam)",
            merchant: "Dago Creative Space",
            category: "Space Monitor",
            hpp: 60000,
            price: 60000,
            status: "Active",
            updated: "01 Juni 2025 22:53:49"
        },
        {
            key: 6,
            no: 6,
            product: "Air Mineral",
            merchant: "Dapoer M.S",
            category: "Minuman",
            hpp: 5000,
            price: 5000,
            status: "Inactive",
            updated: "01 Juni 2025 22:53:49"
        },
        {
            key: 7,
            no: 7,
            product: "Sandwich CLT",
            merchant: "Homebro",
            category: "Hearty Bites",
            hpp: 22000,
            price: 22000,
            status: "Active",
            updated: "01 Juni 2025 22:53:49"
        },
        {
            key: 8,
            no: 8,
            product: "Meeting Room Besar (4 Jam)",
            merchant: "Dago Creative Space",
            category: "Meeting Room Besar",
            hpp: 200000,
            price: 200000,
            status: "Active",
            updated: "01 Juni 2025 22:53:49"
        },
    ];

    // ambil semua kategori unik untuk isi dropdown
    const categories = ["All", ...new Set(data.map((item) => item.category))];

    // filter data
    const filteredData = data.filter((item) => {
        const matchSearch = item.product.toLowerCase().includes(search.toLowerCase());
        const matchCategory = categoryFilter === "All" || item.category === categoryFilter;
        return matchSearch && matchCategory;
    });

    const columns = [
        { title: "No", dataIndex: "no", key: "no" },
        { title: "Product", dataIndex: "product", key: "product" },
        { title: "Merchant", dataIndex: "merchant", key: "merchant" },
        { title: "Category", dataIndex: "category", key: "category" },
        { title: "HPP", dataIndex: "hpp", key: "hpp", render: (val) => `Rp ${val.toLocaleString()}` },
        { title: "Price", dataIndex: "price", key: "price", render: (val) => `Rp ${val.toLocaleString()}` },
        {
            title: "Ketersediaan",
            dataIndex: "status",
            key: "status",
            render: (status) =>
                status === "Active" ? (
                    <Tag color="blue">Active</Tag>
                ) : (
                    <Tag color="red">Inactive</Tag>
                )
        },
        { title: "Updated At", dataIndex: "updated", key: "updated" }
    ];

    return (
        <div style={{ padding: 20 }}>
            <Title level={3}>My Menu Management</Title>
            <Space style={{ marginBottom: 20 }}>
                <Input.Search
                    placeholder="Search"
                    style={{ width: 300 }}
                    onChange={(e) => setSearch(e.target.value)}
                />
                <Select
                    value={categoryFilter}
                    style={{ width: 200 }}
                    onChange={(value) => setCategoryFilter(value)}
                >
                    {categories.map((cat) => (
                        <Option key={cat} value={cat}>
                            {cat}
                        </Option>
                    ))}
                </Select>
            </Space>
            <Table
                columns={columns}
                dataSource={filteredData}
                pagination={false}
                bordered
                className="[&_.ant-table-thead>tr>th]:bg-gray-300" // header abu-abu
            />
        </div>
    );
};

export default ProductKasir;
