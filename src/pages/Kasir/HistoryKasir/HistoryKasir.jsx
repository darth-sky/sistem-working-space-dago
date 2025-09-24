import React, { useState, useMemo } from "react";
import { Table, Input, Button, Dropdown, Menu, DatePicker } from "antd";
import dayjs from "dayjs";

const HistoryKasir = () => {
    const [openBalance] = useState(1895000); // saldo awal kasir
    const [filterPayment, setFilterPayment] = useState("All"); // filter aktif

    // state untuk open & close cashier (default pakai dayjs sekarang)
    const [openCashier, setOpenCashier] = useState(dayjs("2025-09-02 08:26:06"));
    const [closeCashier, setCloseCashier] = useState(dayjs("2025-09-02 23:59:59"));

    const [data] = useState([
        {
            key: 1,
            datetime: "02 September 2025 09:30:53",
            name: "Tes1",
            payment: "Cash",
            table: "Rm2",
            subtotal: 22500,
            discount: 0,
            tax: 0,
            total: 22500,
        },
        {
            key: 2,
            datetime: "02 September 2025 09:30:53",
            name: "Test2",
            payment: "Cash",
            table: "Rm2",
            subtotal: 22500,
            discount: 0,
            tax: 0,
            total: 22500,
        },
        {
            key: 3,
            datetime: "02 September 2025 09:30:53",
            name: "Test3",
            payment: "Cash",
            table: "Rm2",
            subtotal: 22500,
            discount: 0,
            tax: 0,
            total: 22500,
        },
        {
            key: 4,
            datetime: "02 September 2025 09:30:53",
            name: "Test4",
            payment: "QRIS",
            table: "Rm2",
            subtotal: 22500,
            discount: 0,
            tax: 0,
            total: 22500,
        },
        {
            key: 5,
            datetime: "02 September 2025 09:30:53",
            name: "Test5",
            payment: "QRIS",
            table: "Rm2",
            subtotal: 22500,
            discount: 0,
            tax: 0,
            total: 22500,
        },
    ]);

    // Filter data sesuai pilihan
// Filter data sesuai pilihan + tanggal
const filteredData = useMemo(() => {
    return data.filter((item) => {
        const trxDate = dayjs(item.datetime, "DD MMMM YYYY HH:mm:ss");

        // filter payment
        const paymentMatch =
            filterPayment === "All" || item.payment === filterPayment;

        // filter range tanggal
        const dateMatch =
            trxDate.isAfter(openCashier) && trxDate.isBefore(closeCashier);

        return paymentMatch && dateMatch;
    });
}, [filterPayment, data, openCashier, closeCashier]);


    // Hitung total transaksi
    const totalTransaction = useMemo(() => {
        return filteredData.reduce((sum, item) => {
            const net = item.subtotal - item.discount + item.tax;
            return sum + net;
        }, 0);
    }, [filteredData]);

    // Hitung Cash In - Cash Out (ikut filter)
    const cashInOut = useMemo(() => {
        return filteredData.reduce((sum, item) => {
            const net = item.subtotal - item.discount + item.tax;
            return sum + net;
        }, 0);
    }, [filteredData]);

    // Current Balance
    const currentBalance = openBalance + cashInOut;

    const columns = [
        { title: "Datetime", dataIndex: "datetime", key: "datetime" },
        { title: "Name", dataIndex: "name", key: "name" },
        { title: "Payment", dataIndex: "payment", key: "payment" },
        { title: "Table", dataIndex: "table", key: "table" },
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
        {
            title: "#",
            key: "action",
            render: () => (
                <Button type="link" className="text-blue-500">
                    👁 View
                </Button>
            ),
        },
    ];

    const menu = (
        <Menu
            onClick={(e) => setFilterPayment(e.key)}
            items={[
                { key: "All", label: "All Payment" },
                { key: "Cash", label: "Cash" },
                { key: "QRIS", label: "QRIS" },
            ]}
        />
    );

    return (
        <div className="p-3">
            {/* Top search + button */}
            <div className="flex justify-between items-center mb-5">
                <Input.Search placeholder="Search" className="w-72" />
                <Dropdown overlay={menu} trigger={["click"]}>
                    <Button type="primary" className="bg-blue-500">
                        {filterPayment}
                    </Button>
                </Dropdown>
            </div>

            {/* Cashier info section */}
            <div className="flex justify-between items-center rounded-lg mb-5 p-3 border">
                <div className="flex items-center space-x-2">
                    <p className="font-semibold">Open Cashier 📅</p>
                    <DatePicker
                        showTime
                        value={openCashier}
                        onChange={(val) => setOpenCashier(val)}
                        format="DD MMMM YYYY HH:mm:ss"
                    />
                </div>
                <div className="flex items-center space-x-2">
                    <p className="font-semibold">Close Cashier 📅</p>
                    <DatePicker
                        showTime
                        value={closeCashier}
                        onChange={(val) => setCloseCashier(val)}
                        format="DD MMMM YYYY HH:mm:ss"
                    />

                </div>
            </div>

            {/* Balance info */}
            <div className="flex justify-between items-center text-sm text-gray-700 pb-2">
                <div>
                    <p className="text-xs">Open Balance</p>
                    <p className="font-bold">Rp {openBalance.toLocaleString("id-ID")}</p>
                </div>
                <div>
                    <p className="text-xs">Cash In - Cash Out</p>
                    <p>Rp {cashInOut.toLocaleString("id-ID")}</p>
                </div>
                <div>
                    <p className="text-xs">Total Transaction</p>
                    <p className="text-blue-600 font-medium">
                        Rp {totalTransaction.toLocaleString("id-ID")}
                    </p>
                </div>
                <div>
                    <p className="text-xs">Current Balance</p>
                    <p className="text-blue-600 font-bold">
                        Rp {currentBalance.toLocaleString("id-ID")}
                    </p>
                </div>
            </div>

            {/* Transaction table */}
            <Table columns={columns} dataSource={filteredData} pagination={false} bordered />
        </div>
    );
};

export default HistoryKasir;
