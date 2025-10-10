import React, { useState, useEffect } from "react";
import {
    Button,
    Input,
    Select,
    Tag,
    Modal,
    Form,
    InputNumber,
    Radio,
    message,
    Dropdown,
    Menu,
    Spin, // --- PERUBAHAN --- Ditambahkan untuk loading indicator
} from "antd";
import {
    SearchOutlined,
    PlusOutlined,
    MinusOutlined,
    CloseOutlined,
    UserOutlined,
    MoreOutlined,
    DollarOutlined,
    QrcodeOutlined,
    CheckCircleOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { useLocation } from "react-router-dom";
import { getPosInitData, createOrderKasir } from "../../../services/service"; // Pastikan path ini benar


const { Option } = Select;


// --- FUNGSI HELPER --- (Tidak ada perubahan)
const formatRupiah = (amount) =>
    new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
    }).format(amount);

const generateOrderNumber = () => {
    return `T${Math.floor(100000 + Math.random() * 900000)}`;
};


const OrderKasir = () => {
    const location = useLocation();
    const initialState = location.state || {};

    // --- STATE MANAGEMENT --- (Tidak ada perubahan signifikan, sudah siap)
    const [searchProductQuery, setSearchProductQuery] = useState("");
    const [selectedMerchant, setSelectedMerchant] = useState("all_merchants");
    const [selectedProductType, setSelectedProductType] = useState("all_types");
    const [currentOrderType, setCurrentOrderType] = useState(initialState.orderType || "dinein");
    const [currentOrderNumber, setCurrentOrderNumber] = useState(generateOrderNumber());
    const [customerName, setCustomerName] = useState(initialState.customerName || "Adit");
    const [room, setRoom] = useState(initialState.room || null);
    const [cashierName, setCashierName] = useState("Rossa");
    const [currentDate, setCurrentDate] = useState(dayjs());
    const [selectedItems, setSelectedItems] = useState([]);
    const [discountPercentage, setDiscountPercentage] = useState(0);
    const [taxPercentage, setTaxPercentage] = useState(0);
    const [isNewOrderModalVisible, setIsNewOrderModalVisible] = useState(false);
    const [newOrderForm] = Form.useForm();
    const [isCashPaymentModalVisible, setIsCashPaymentModalVisible] = useState(false);
    const [isStrukModalVisible, setIsStrukModalVisible] = useState(false);
    const [isAddNoteModalVisible, setIsAddNoteModalVisible] = useState(false);
    const [itemToAddNote, setItemToAddNote] = useState(null);
    const [addNoteForm] = Form.useForm();
    const [cashInput, setCashInput] = useState(0);
    const [paymentSuccess, setPaymentSuccess] = useState(false);
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);
    const [products, setProducts] = useState([]);
    const [merchantCategories, setMerchantCategories] = useState([]);
    const [productTypeCategories, setProductTypeCategories] = useState([]);
    const [orderTypes, setOrderTypes] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    // --- DATA FETCHING & INITIALIZATION --- (Tidak ada perubahan, sudah benar)
    useEffect(() => {
        if (initialState.customerName || initialState.orderType) {
            newOrderForm.setFieldsValue({
                customerName: initialState.customerName,
                orderType: initialState.orderType,
                room: initialState.room,
            });
        }
    }, [initialState, newOrderForm]);

    useEffect(() => {
        const loadData = async () => {
            try {
                setIsLoading(true);
                const data = await getPosInitData();
                setProducts(data.products || []);
                setMerchantCategories(data.merchantCategories || []);
                setProductTypeCategories(data.productTypeCategories || []);
                setOrderTypes(data.orderTypes || []);
                message.success("Data produk berhasil dimuat!");
            } catch (error) {
                message.error("Gagal memuat data dari server. Coba muat ulang halaman.");
            } finally {
                setIsLoading(false);
            }
        };
        loadData();
    }, []);

    // --- LOGIC FOR PRODUCTS --- (Tidak ada perubahan)
    const filteredProducts = products.filter((product) => {
        const matchesMerchant =
            selectedMerchant === "all_merchants" || product.merchantId === selectedMerchant;
        const matchesProductType =
            selectedProductType === "all_types" || product.category === selectedProductType;
        const matchesSearch = product.name
            .toLowerCase()
            .includes(searchProductQuery.toLowerCase());
        return matchesMerchant && matchesProductType && matchesSearch;
    });

    const handleAddProductToCart = (product) => {
        setItemToAddNote({ ...product, qty: 1, note: "" });
        setIsAddNoteModalVisible(true);
    };

    const handleUpdateItemQty = (productId, newQty, itemNote) => {
        if (newQty <= 0) {
            handleRemoveItemFromCart(productId, itemNote);
            return;
        }
        const updatedItems = selectedItems.map((item) =>
            item.id === productId && item.note === itemNote ? { ...item, qty: newQty } : item
        );
        setSelectedItems(updatedItems);
    };

    const handleRemoveItemFromCart = (productId, itemNote) => {
        setSelectedItems(selectedItems.filter((item) => !(item.id === productId && item.note === itemNote)));
    };

    // --- CALCULATION LOGIC --- (Tidak ada perubahan)
    const subtotal = selectedItems.reduce(
        (sum, item) => sum + item.price * item.qty,
        0
    );
    const totalTax = subtotal * taxPercentage;
    const totalDiscount = subtotal * (discountPercentage / 100);
    const totalAmount = subtotal - totalDiscount + totalTax;
    const changeAmount = cashInput > totalAmount ? cashInput - totalAmount : 0;

    // --- MODAL HANDLERS --- (Tidak ada perubahan)
    const showNewOrderModal = () => {
        setIsNewOrderModalVisible(true);
    };

    const handleNewOrderOk = async () => {
        try {
            const values = await newOrderForm.validateFields();
            setCustomerName(values.customerName || "Guest");
            setCurrentOrderType(values.orderType);
            setRoom(values.room || null);
            message.success("Order baru dibuat! Silakan tambahkan produk.");
            setIsNewOrderModalVisible(false);
            setSelectedItems([]);
            setSearchProductQuery("");
            setSelectedMerchant("all_merchants");
            setSelectedProductType("all_types");
            setCurrentOrderNumber(generateOrderNumber());
            setSelectedPaymentMethod(null);
        } catch (error) {
            console.error("Failed to create new order:", error);
            message.error("Gagal membuat order baru. Periksa kembali input Anda.");
        }
    };

    const handleNewOrderCancel = () => {
        setIsNewOrderModalVisible(false);
        newOrderForm.resetFields();
    };

    const handleAddNoteOk = async () => {
        try {
            const values = await addNoteForm.validateFields();
            const updatedItem = { ...itemToAddNote, note: values.note };

            setSelectedItems((prevItems) => {
                const existingItemIndex = prevItems.findIndex(
                    (item) => item.id === updatedItem.id && item.note === updatedItem.note
                );

                if (existingItemIndex > -1) {
                    const newItems = [...prevItems];
                    newItems[existingItemIndex].qty += updatedItem.qty;
                    return newItems;
                } else {
                    return [...prevItems, updatedItem];
                }
            });

            message.success(`Produk "${updatedItem.name}" ditambahkan ke keranjang.`);
            setIsAddNoteModalVisible(false);
            setItemToAddNote(null);
            addNoteForm.resetFields();
        } catch (error) {
            console.error("Failed to add note:", error);
            message.error("Gagal menambahkan catatan.");
        }
    };

    const handleAddNoteCancel = () => {
        setIsAddNoteModalVisible(false);
        setItemToAddNote(null);
        addNoteForm.resetFields();
    };

    // --- PAYMENT FLOW HANDLERS --- (Tidak ada perubahan)
    const handleProcessPayment = () => {
        if (selectedItems.length === 0) {
            message.warning("Keranjang masih kosong.");
            return;
        }
        if (!selectedPaymentMethod) {
            message.warning("Pilih metode pembayaran terlebih dahulu (Cash atau QRIS).");
            return;
        }

        if (selectedPaymentMethod === 'cash') {
            setCashInput(0);
            setIsCashPaymentModalVisible(true);
        } else if (selectedPaymentMethod === 'qris') {
            message.info("Simulasi Pembayaran QRIS berhasil! (Dalam pengembangan)");
            setPaymentSuccess(true);
            setIsStrukModalVisible(true);
        }
    };

    const handleCashPaymentSubmit = () => {
        if (cashInput < totalAmount) {
            message.error("Jumlah uang yang dibayar kurang dari total belanja.");
            return;
        }
        message.success("Pembayaran tunai berhasil!");
        setIsCashPaymentModalVisible(false);
        setPaymentSuccess(true);
        setIsStrukModalVisible(true);
    };

    // --- PERUBAHAN ---
    // Memastikan fungsi ini memanggil service 'createOrderKasir'
    const handleStrukConfirmPayment = async () => {
        const orderData = {
            customerName: customerName,
            orderType: currentOrderType,
            room: room,
            paymentMethod: selectedPaymentMethod,
            items: selectedItems,
            subtotal: subtotal,
            totalTax: totalTax,
            totalDiscount: totalDiscount,
            totalAmount: totalAmount,
            cashInput: selectedPaymentMethod === 'cash' ? cashInput : totalAmount,
            changeAmount: selectedPaymentMethod === 'cash' ? changeAmount : 0
        };

        try {
            // Memanggil service yang benar
            const result = await createOrderKasir(orderData);

            message.success(`Order #${result.id_transaksi} berhasil disimpan!`);

            // Reset state setelah berhasil
            setIsStrukModalVisible(false);
            setPaymentSuccess(false);
            setSelectedItems([]);
            setDiscountPercentage(0);
            setCashInput(0);
            setCustomerName("Guest"); // Reset ke default
            setRoom(null);
            setCurrentOrderNumber(generateOrderNumber());
            setSelectedPaymentMethod(null);

        } catch (error) {
            message.error(`Gagal menyimpan order: ${error.message}`);
        }
    };

    const handleStrukCancel = () => {
        setIsStrukModalVisible(false);
        setPaymentSuccess(false);
        message.info("Pembayaran dibatalkan.");
    };

    // --- DROPDOWN & QUICK AMOUNTS --- (Tidak ada perubahan)
    const orderDropdownMenu = (
        <Menu>
            <Menu.Item key="1" onClick={showNewOrderModal}>Ganti/Buat Order Baru</Menu.Item>
            <Menu.Item key="2" danger onClick={() => {
                setSelectedItems([]);
                setCustomerName("Adit");
                setRoom(null);
                setCurrentOrderNumber(generateOrderNumber());
                message.warning("Order dibatalkan.");
            }}>Hapus Order</Menu.Item>
        </Menu>
    );

    const paymentQuickAmounts = [
        5000, 10000, 20000, 50000, 100000
    ].filter(amount => amount >= totalAmount || totalAmount === 0);

    // --- JSX / RENDER ---
    return (
        <div className="flex h-screen bg-gray-50 text-gray-800 font-sans">
            {/* Main Content Area */}
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-0">
                {/* Left Panel - Product List & Categories */}
                <div className="lg:col-span-2 bg-white flex flex-col p-6 border-r border-gray-100">
                    {/* Header (Tidak ada perubahan) */}
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex flex-col">
                            <span className="text-gray-500 text-sm">{currentDate.format("h:mm A")}</span>
                            <span className="text-gray-500 text-sm">{currentDate.format("ddd, MMM D")}</span>
                        </div>
                        <img src="/img/logo_dago.png" alt="Dago Creative Home" className="h-15" />
                        <div className="flex items-center space-x-2 text-gray-600">
                            <UserOutlined />
                            <span>{cashierName}</span>
                        </div>
                    </div>

                    {/* Search Bar (Tidak ada perubahan) */}
                    <div className="mb-6">
                        <Input
                            placeholder="Search..."
                            prefix={<SearchOutlined />}
                            value={searchProductQuery}
                            onChange={(e) => setSearchProductQuery(e.target.value)}
                            className="w-full rounded-lg border-gray-300"
                        />
                    </div>

                    {/* --- PERUBAHAN --- Mengganti dummy data dengan state dari API */}
                    {/* Category Type (Merchants) */}
                    <div className="mb-6">
                        <h3 className="text-sm text-gray-500 mb-2">
                            Category Type ({merchantCategories.length > 0 ? merchantCategories.length - 1 : 0})
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            {merchantCategories.map((category) => (
                                <Button
                                    key={category.id}
                                    type={selectedMerchant === category.id ? "primary" : "default"}
                                    size="small"
                                    shape="round"
                                    onClick={() => setSelectedMerchant(category.id)}
                                >
                                    {category.name}
                                </Button>
                            ))}
                        </div>
                    </div>

                    {/* Product List (Product Types) */}
                    <div className="mb-6">
                        <h3 className="text-sm text-gray-500 mb-2">
                            Product List ({productTypeCategories.length > 0 ? productTypeCategories.length - 1 : 0})
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            {productTypeCategories.map((category) => (
                                <Button
                                    key={category.id}
                                    type={selectedProductType === category.id ? "primary" : "default"}
                                    size="small"
                                    shape="round"
                                    onClick={() => setSelectedProductType(category.id)}
                                >
                                    {category.name}
                                </Button>
                            ))}
                        </div>
                    </div>

                    {/* --- PERUBAHAN --- Menambahkan loading indicator */}
                    {/* Product List */}
                    <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                        {isLoading ? (
                            <div className="flex justify-center items-center h-full">
                                <Spin size="large" />
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                                {filteredProducts.map((product) => (
                                    <div
                                        key={product.id}
                                        className={`rounded-xl shadow-sm border p-3 ${product.available
                                            ? "bg-white border-gray-200 cursor-pointer hover:shadow-md transition-all duration-200"
                                            : "bg-red-50 border-red-200 cursor-not-allowed opacity-70" // <-- UBAH DI SINI
                                            }`}
                                        onClick={() => product.available && handleAddProductToCart(product)}
                                    >
                                        <h3 className={`font-semibold text-sm mb-1 ${product.available ? "text-gray-800" : "text-gray-500"}`}>
                                            {product.name}
                                        </h3>
                                        <div className="flex items-center justify-between mt-2">
                                            <span className={`text-base font-bold ${product.available ? "text-blue-600" : "text-gray-500"}`}>
                                                {formatRupiah(product.price)}
                                            </span>
                                            {!product.available && <Tag color="red">Inactive</Tag>}
                                        </div>
                                    </div>
                                ))}
                                {filteredProducts.length === 0 && !isLoading && (
                                    <div className="col-span-full text-center py-10 text-gray-500">
                                        Tidak ada produk ditemukan.
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Panel - Order Cart & Payment */}
                <div className="bg-gray-50 flex flex-col p-6">
                    {/* Header Section (Tidak ada perubahan) */}
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold text-gray-800">Your Order</h2>
                        <Dropdown overlay={orderDropdownMenu} trigger={["click"]}>
                            <Button type="text" icon={<MoreOutlined className="text-xl" />} />
                        </Dropdown>
                    </div>

                    {/* --- PERUBAHAN --- Mengganti dummy data dengan state dari API */}
                    {/* Order Type Tabs */}
                    <div className="flex bg-gray-100 rounded-lg p-1 mb-6 text-sm font-medium">
                        {orderTypes.map((type) => (
                            <Button
                                key={type.id}
                                type={currentOrderType === type.id ? "primary" : "text"}
                                className={`flex-1 rounded-md py-2 px-4 transition-all duration-200
                                ${currentOrderType === type.id ? "bg-blue-600 text-white shadow-md" : "text-gray-600 hover:bg-gray-200"}`}
                                onClick={() => setCurrentOrderType(type.id)}
                            >
                                {type.name}
                            </Button>
                        ))}
                    </div>

                    {/* Sisa dari Right Panel, Cart, Summary, dan Modals tidak perlu diubah karena sudah menggunakan state. */}
                    {/* ... (kode sisanya sama persis seperti yang Anda berikan) ... */}
                    <div className="flex flex-col mb-6">
                        <span className="text-gray-500 text-sm">Order ({currentOrderNumber})</span>
                        <span className="text-lg font-bold">Order {customerName} {room && `(Room: ${room})`}</span>
                    </div>

                    <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-3 mb-6">
                        {selectedItems.length === 0 ? (
                            <div className="text-center py-10 text-gray-500">
                                Keranjang kosong. Tambahkan produk!
                            </div>
                        ) : (
                            selectedItems.map((item) => (
                                <div
                                    key={`${item.id}-${item.note || ''}`}
                                    className="flex items-center justify-between bg-white rounded-lg p-3 shadow-sm border border-gray-200"
                                >
                                    <div className="flex flex-col flex-1 min-w-0 mr-2">
                                        <span className="font-semibold text-gray-800 truncate">{item.name}</span>
                                        <span className="text-sm text-gray-500">
                                            {formatRupiah(item.price)} {item.note && <span className="text-gray-400">({item.note})</span>}
                                        </span>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Button icon={<MinusOutlined />} size="small" onClick={() => handleUpdateItemQty(item.id, item.qty - 1, item.note)} />
                                        <span className="font-medium w-6 text-center">{item.qty}</span>
                                        <Button icon={<PlusOutlined />} size="small" onClick={() => handleUpdateItemQty(item.id, item.qty + 1, item.note)} />
                                        <Button danger type="text" icon={<CloseOutlined />} size="small" onClick={() => handleRemoveItemFromCart(item.id, item.note)} />
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    <div className="bg-white rounded-xl shadow-md p-4 mb-6">
                        <div className="flex justify-between items-center text-sm mb-2">
                            <span>Subtotal</span>
                            <span>{formatRupiah(subtotal)}</span>
                        </div>
                        {taxPercentage > 0 && (
                            <div className="flex justify-between items-center text-sm mb-2">
                                <span>Tax ({taxPercentage * 100}%)</span>
                                <span>{formatRupiah(totalTax)}</span>
                            </div>
                        )}
                        <div className="flex justify-between items-center text-sm mb-4">
                            <span>Discount ({discountPercentage}%)</span>
                            <span>-{formatRupiah(totalDiscount)}</span>
                        </div>
                        <div className="flex justify-between items-center text-xl font-bold text-blue-600 border-t pt-4">
                            <span>Total</span>
                            <span>{formatRupiah(totalAmount)}</span>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                            <Button size="large" onClick={() => message.info("Discount action!")}>Discount</Button>
                            <Button danger size="large" onClick={() => { setSelectedItems([]); message.warning("Order dibatalkan."); }}>Cancel Order</Button>
                        </div>
                        <div className="flex bg-gray-100 rounded-lg p-1 mb-2 text-sm font-medium">
                            <Button type={selectedPaymentMethod === "cash" ? "primary" : "text"} className={`flex-1 rounded-md py-2 px-4 transition-all duration-200 ${selectedPaymentMethod === "cash" ? "bg-blue-600 text-white shadow-md" : "text-gray-600 hover:bg-gray-200"}`} icon={<DollarOutlined />} onClick={() => setSelectedPaymentMethod("cash")}>Cash</Button>
                            <Button type={selectedPaymentMethod === "qris" ? "primary" : "text"} className={`flex-1 rounded-md py-2 px-4 transition-all duration-200 ${selectedPaymentMethod === "qris" ? "bg-blue-600 text-white shadow-md" : "text-gray-600 hover:bg-gray-200"}`} icon={<QrcodeOutlined />} onClick={() => setSelectedPaymentMethod("qris")}>QRIS</Button>
                        </div>
                        <Button type="primary" size="large" block onClick={handleProcessPayment} disabled={selectedItems.length === 0 || !selectedPaymentMethod}>Payment & Print</Button>
                    </div>
                </div>

            </div>

            {/* ... (semua kode Modal sama persis) ... */}
            <Modal title={<div className="text-xl font-bold text-gray-800"><PlusOutlined className="mr-2" /> Buat Order Baru</div>} open={isNewOrderModalVisible} onOk={handleNewOrderOk} onCancel={handleNewOrderCancel} okText="Buat Order" cancelText="Batal" width={400} centered className="new-order-modal">
                <Form form={newOrderForm} layout="vertical" initialValues={{ orderType: currentOrderType, customerName: customerName, room: room }} className="mt-4">
                    <Form.Item label="Tipe Order" name="orderType" rules={[{ required: true, message: "Pilih tipe order!" }]}>
                        <Radio.Group className="w-full">
                            <Radio.Button value="dinein" className="w-1/3 text-center">Dine In</Radio.Button>
                            <Radio.Button value="takeaway" className="w-1/3 text-center">Take Away</Radio.Button>
                            <Radio.Button value="pickup" className="w-1/3 text-center">Pick Up</Radio.Button>
                        </Radio.Group>
                    </Form.Item>
                    <Form.Item label="Nama Customer (Opsional)" name="customerName"><Input placeholder="Nama customer" /></Form.Item>
                    {newOrderForm.getFieldValue('orderType') === 'dinein' && (<Form.Item label="Nomor Meja/Ruangan (contoh: Meja 1, RM1)" name="room"><Input placeholder="Nomor Meja/Ruangan" /></Form.Item>)}
                    <Form.Item label="Kasir" className="mb-0"><Input value={cashierName} disabled prefix={<UserOutlined />} /></Form.Item>
                </Form>
            </Modal>
            <Modal title={<div className="text-xl font-bold text-gray-800">Add Order <span className="font-normal">{itemToAddNote?.name}</span></div>} open={isAddNoteModalVisible} onOk={handleAddNoteOk} onCancel={handleAddNoteCancel} okText="Confirm" cancelText="Cancel" width={400} centered>
                <Form form={addNoteForm} layout="vertical" className="mt-4" initialValues={{ note: itemToAddNote?.note || "" }}>
                    {itemToAddNote && (<><p className="text-sm text-gray-500 mb-2">Category: {itemToAddNote.category}</p><Tag color="blue" className="mb-4">#{itemToAddNote.category.toLowerCase()}</Tag></>)}
                    <Form.Item label="Note" name="note"><Input.TextArea placeholder="nasi setengah, tidak pedas, dll." rows={2} /></Form.Item>
                    <div className="flex items-center justify-between text-lg font-bold text-blue-600">
                        <span>{formatRupiah(itemToAddNote?.price || 0)}</span>
                        <div className="flex items-center space-x-2">
                            <Button icon={<MinusOutlined />} size="small" onClick={() => setItemToAddNote(prev => ({ ...prev, qty: Math.max(1, prev.qty - 1) }))} disabled={itemToAddNote?.qty <= 1} />
                            <span className="font-medium w-6 text-center">{itemToAddNote?.qty || 1}</span>
                            <Button icon={<PlusOutlined />} size="small" onClick={() => setItemToAddNote(prev => ({ ...prev, qty: prev.qty + 1 }))} />
                        </div>
                    </div>
                </Form>
            </Modal>
            <Modal title={<div className="text-xl font-bold text-gray-800 flex items-center justify-between">Cash Payment <span className="text-blue-600">{formatRupiah(totalAmount)}</span></div>} open={isCashPaymentModalVisible} onCancel={() => setIsCashPaymentModalVisible(false)} footer={null} width={400} centered>
                <Form layout="vertical" className="mt-4">
                    <Form.Item label="Input Cash" className="mb-4">
                        <Input prefix="Rp" value={cashInput > 0 ? cashInput.toLocaleString('id-ID') : ''} onChange={(e) => { const value = e.target.value.replace(/[^0-9]/g, ''); setCashInput(Number(value)); }} suffix={cashInput > 0 && (<CloseOutlined className="cursor-pointer text-gray-400" onClick={() => setCashInput(0)} />)} className="text-right text-lg font-medium" size="large" />
                    </Form.Item>
                    <div className="grid grid-cols-3 gap-3 mb-6">
                        {paymentQuickAmounts.map((amount) => (<Button key={amount} size="large" className="h-12" onClick={() => setCashInput(amount)}>{formatRupiah(amount)}</Button>))}
                        <Button size="large" className="h-12" onClick={() => setCashInput(totalAmount)}>{formatRupiah(totalAmount)}</Button>
                    </div>
                    <div className="flex justify-between items-center mb-4 text-base">
                        <span>Uang Kembali:</span>
                        <span className="font-bold text-green-600">{formatRupiah(changeAmount)}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <Button size="large" onClick={() => setIsCashPaymentModalVisible(false)}>Cancel</Button>
                        <Button type="primary" size="large" onClick={handleCashPaymentSubmit} disabled={cashInput < totalAmount}>Submit</Button>
                    </div>
                </Form>
            </Modal>
            <Modal title={<div className="text-xl font-bold text-gray-800">Struk</div>} open={isStrukModalVisible} onCancel={paymentSuccess ? handleStrukConfirmPayment : handleStrukCancel} footer={null} width={400} centered>
                <div className="flex flex-col p-4 bg-white rounded-lg shadow-inner mt-4 border border-gray-200">
                    {paymentSuccess && (<div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4 flex items-center"><CheckCircleOutlined className="mr-2 text-xl" /><span className="font-semibold">Pembayaran berhasil!</span></div>)}
                    <div className="text-sm text-gray-600 mb-4">
                        <p><strong>Customer:</strong> {customerName}</p>
                        <p><strong>Order Type:</strong> {currentOrderType === 'dinein' ? 'Dine In' : currentOrderType === 'takeaway' ? 'Take Away' : 'Pick Up'}</p>
                        {room && <p><strong>Ruangan/Meja:</strong> {room}</p>}
                        <p><strong>Order #:</strong> {currentOrderNumber}</p>
                        <p><strong>Cashier:</strong> {cashierName}</p>
                        <p><strong>Date:</strong> {currentDate.format("DD MMMM YYYY h:mm A")}</p>
                        <p><strong>Metode Pembayaran:</strong> {selectedPaymentMethod === 'cash' ? 'Cash' : selectedPaymentMethod === 'qris' ? 'QRIS' : '-'}</p>
                    </div>
                    <div className="border-t border-b border-gray-200 py-4 mb-4">
                        {selectedItems.map((item) => (<div key={`${item.id}-${item.note || ''}`} className="flex justify-between items-center mb-2"><div><p className="font-semibold text-gray-800">{item.name} x{item.qty}</p>{item.note && <p className="text-xs text-gray-500 italic">Note: {item.note}</p>}</div><span>{formatRupiah(item.price * item.qty)}</span></div>))}
                    </div>
                    <div className="mb-4">
                        <div className="flex justify-between text-sm mb-1"><span>Subtotal</span><span>{formatRupiah(subtotal)}</span></div>

                        {taxPercentage > 0 && (
                            <div className="flex justify-between text-sm mb-1">
                                <span>Tax ({taxPercentage * 100}%)</span>
                                <span>{formatRupiah(totalTax)}</span>
                            </div>
                        )}

                        <div className="flex justify-between text-sm mb-1"><span>Discount ({discountPercentage}%)</span><span>-{formatRupiah(totalDiscount)}</span></div>
                        <div className="flex justify-between text-base font-bold text-gray-800 mt-2"><span>Total</span><span>{formatRupiah(totalAmount)}</span></div>
                        {selectedPaymentMethod === 'cash' && (<><div className="flex justify-between text-sm mt-2"><span>Uang Dibayar</span><span>{formatRupiah(cashInput)}</span></div><div className="flex justify-between text-base font-bold text-green-600 mt-1"><span>Uang Kembali</span><span>{formatRupiah(changeAmount)}</span></div></>)}
                    </div>
                    <div className="grid grid-cols-1 gap-3 mt-4">
                        <Button type="primary" size="large" block onClick={handleStrukConfirmPayment}>Simpan & Cetak</Button>
                        {!paymentSuccess && (<Button size="large" block onClick={handleStrukCancel}>Batal</Button>)}
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default OrderKasir;