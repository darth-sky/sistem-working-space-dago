import React, { useState, useMemo, useEffect } from "react";
import {
    Table,
    Input,
    Button,
    Dropdown,
    Menu,
    DatePicker,
    message,
} from "antd";
import dayjs from "dayjs";
import { getHistoryKasir } from "../../../services/service"; // ⬅️ import service

const HistoryKasir = () => {
    const [openBalance] = useState(1895000);
    const [filterPayment, setFilterPayment] = useState("All");
    const [openCashier, setOpenCashier] = useState(dayjs().startOf('month'));
    const [closeCashier, setCloseCashier] = useState(dayjs().endOf('month'));
    const [data, setData] = useState([]);
    const [searchTerm, setSearchTerm] = useState(""); // Perubahan: State untuk input pencarian

    // --- FETCH DATA DARI DATABASE ---
    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await getHistoryKasir(
                    openCashier.format("YYYY-MM-DD HH:mm:ss"),
                    closeCashier.format("YYYY-MM-DD HH:mm:ss")
                );
                if (res.status === 200) {
                    setData(res.data.datas);
                } else {
                    message.error("Gagal mengambil data kasir");
                }
            } catch (err) {
                console.error(err);
                message.error("Terjadi kesalahan koneksi ke server");
            }
        };
        fetchData();
    }, [openCashier, closeCashier]);
    // --------------------------------

    // Perubahan: Logika filter diupdate untuk menyertakan pencarian
    const filteredData = useMemo(() => {
        return data.filter((item) => {
            const paymentMatch =
                filterPayment === "All" || item.payment === filterPayment;

            // Jika tidak ada teks pencarian, langsung loloskan
            if (!searchTerm) {
                return paymentMatch;
            }

            // Cek pencocokan pada nama atau nama meja (case-insensitive)
            const searchMatch = 
                item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.table_name?.toLowerCase().includes(searchTerm.toLowerCase());
            
            return paymentMatch && searchMatch;
        });
    }, [filterPayment, data, searchTerm]); // Perubahan: Tambahkan searchTerm sebagai dependency

    // Hitung total transaksi
    const totalTransaction = useMemo(() => {
        return filteredData.reduce((sum, item) => sum + item.total, 0);
    }, [filteredData]);

    // Cash In - Cash Out (ikut filter)
    const cashInOut = totalTransaction;

    // Current Balance
    const currentBalance = openBalance + cashInOut;

    const columns = [
        { title: "Datetime", dataIndex: "datetime", key: "datetime" },
        { title: "Name", dataIndex: "name", key: "name" },
        { title: "Payment", dataIndex: "payment", key: "payment" },
        { title: "Table", dataIndex: "table_name", key: "table_name" },
        {
            title: "Sub Total",
            dataIndex: "subtotal",
            key: "subtotal",
            render: (val) => `Rp ${val.toLocaleString("id-ID")}`,
        },
        {
            title: "Discount",
            dataIndex: "discount",
            key: "discount",
            render: (val) => `Rp ${val.toLocaleString("id-ID")}`,
        },
        {
            title: "Tax",
            dataIndex: "tax",
            key: "tax",
            render: (val) => `Rp ${val.toLocaleString("id-ID")}`,
        },
        {
            title: "Total (Rp)",
            dataIndex: "total",
            key: "total",
            render: (val) => `Rp ${val.toLocaleString("id-ID")}`,
        },
    ];

    const menu = (
        <Menu
            onClick={(e) => setFilterPayment(e.key)}
            items={[
                { key: "All", label: "All Payment" },
                { key: "Tunai", label: "Tunai" },
                { key: "Non-Tunai", label: "Non-Tunai" },
            ]}
        />
    );

    return (
        <div className="p-3 w-full overflow-x-hidden">
            {/* Filter section */}
            <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center mb-5 gap-3">
                {/* Perubahan: Tambahkan value dan onChange pada Input.Search */}
                <Input.Search 
                    placeholder="Cari nama atau meja..." 
                    className="w-full sm:w-72"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                <Dropdown overlay={menu} trigger={["click"]}>
                    <Button
                        type="primary"
                        className="bg-blue-500 w-full sm:w-auto flex justify-center"
                    >
                        {filterPayment}
                    </Button>
                </Dropdown>
            </div>

            {/* Cashier info section */}
            <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center rounded-lg mb-5 p-3 border gap-3">
                <div className="flex flex-col sm:flex-row items-start sm:items-center sm:space-x-2">
                    <p className="font-semibold mb-1 sm:mb-0">Open Cashier 📅</p>
                    <DatePicker
                        showTime
                        value={openCashier}
                        onChange={(val) => setOpenCashier(val)}
                        format="DD MMMM YYYY HH:mm:ss"
                        className="w-full sm:w-auto"
                    />
                </div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center sm:space-x-2">
                    <p className="font-semibold mb-1 sm:mb-0">Close Cashier 📅</p>
                    <DatePicker
                        showTime
                        value={closeCashier}
                        onChange={(val) => setCloseCashier(val)}
                        format="DD MMMM YYYY HH:mm:ss"
                        className="w-full sm:w-auto"
                    />
                </div>
            </div>

            {/* Balance info */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center text-sm text-gray-700 pb-2 gap-3">
                <div className="w-full sm:w-auto">
                    <p className="text-xs">Open Balance</p>
                    <p className="font-bold">Rp {openBalance.toLocaleString("id-ID")}</p>
                </div>
                <div className="w-full sm:w-auto">
                    <p className="text-xs">Cash In - Cash Out</p>
                    <p>Rp {cashInOut.toLocaleString("id-ID")}</p>
                </div>
                <div className="w-full sm:w-auto">
                    <p className="text-xs">Total Transaction</p>
                    <p className="text-blue-600 font-medium">
                        Rp {totalTransaction.toLocaleString("id-ID")}
                    </p>
                </div>
                <div className="w-full sm:w-auto">
                    <p className="text-xs">Current Balance</p>
                    <p className="text-blue-600 font-bold">
                        Rp {currentBalance.toLocaleString("id-ID")}
                    </p>
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto mt-3">
                <Table
                    columns={columns}
                    dataSource={filteredData}
                    pagination={false}
                    bordered
                    rowKey="id_transaksi"
                    className="min-w-full"
                />
            </div>
        </div>
    );
};

export default HistoryKasir;