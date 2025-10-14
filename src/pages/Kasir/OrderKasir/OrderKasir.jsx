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
    Divider
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
import { getPosInitData, createOrderKasir, getRoomsToday, createRoomBookingKasir } from "../../../services/service"; // Pastikan path ini benar
import { MdOutlineShoppingCart } from "react-icons/md";
import { FaRegIdCard } from "react-icons/fa";

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

    // --- PERUBAHAN --- State baru untuk mode dan data ruangan
    const [posMode, setPosMode] = useState('fnb'); // 'fnb' atau 'ruangan'
    const [rooms, setRooms] = useState([]);
    const [isLoadingRooms, setIsLoadingRooms] = useState(false);
    const [selectedRoomForBooking, setSelectedRoomForBooking] = useState(null);
    const [selectedDuration, setSelectedDuration] = useState(null);
    const [selectedStartTime, setSelectedStartTime] = useState(null);
    const [isBookingConfirmModalVisible, setIsBookingConfirmModalVisible] = useState(false);
    const [bookingForm] = Form.useForm();

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

    // --- PERUBAHAN --- useEffect baru untuk mengambil data ruangan
    useEffect(() => {
        const loadRoomData = async () => {
            try {
                setIsLoadingRooms(true);
                const roomData = await getRoomsToday();
                setRooms(roomData || []);
            } catch (error) {
                message.error("Gagal memuat data ruangan.");
            } finally {
                setIsLoadingRooms(false);
            }
        };
        if (posMode === 'ruangan') {
            loadRoomData();
        }
    }, [posMode]);


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

    const handleRoomCardClick = (room) => {
        setSelectedRoomForBooking(room);
        setSelectedDuration(null); // Reset pilihan sebelumnya
        setSelectedStartTime(null);
        bookingForm.setFieldsValue({
            customerName: "Guest",
            paymentMethod: null,
        });
        setIsBookingConfirmModalVisible(true);
    };

    const handleBookingSubmit = async () => {
        try {
            const values = await bookingForm.validateFields();
            const bookingData = {
                id_ruangan: selectedRoomForBooking.id_ruangan,
                durasi_jam: selectedDuration.durasi_jam,
                waktu_mulai_jam: selectedStartTime,
                nama_guest: values.customerName,
                metode_pembayaran: values.paymentMethod,
                total_harga_final: selectedDuration.harga_paket
            };

            const result = await createRoomBookingKasir(bookingData);
            message.success(`Booking untuk ruangan ${selectedRoomForBooking.nama_ruangan} berhasil dibuat (ID Transaksi: ${result.id_transaksi})!`);

            // Refresh data ruangan
            const updatedRooms = await getRoomsToday();
            setRooms(updatedRooms || []);

            setIsBookingConfirmModalVisible(false);

        } catch (errorInfo) {
            if (errorInfo.message) {
                message.error(`Gagal membuat booking: ${errorInfo.message}`);
            } else {
                console.error("Validation Failed:", errorInfo);
                message.error("Harap isi semua field yang diperlukan.");
            }
        }
    };


    // --- JSX / RENDER ---
    // --- JSX / RENDER ---
    return (
        <div className="flex bg-gray-50 text-gray-800 font-sans">
            {/* Main Content Area */}
            <div className=" flex-1 grid grid-cols-1 lg:grid-cols-3 gap-0">
                {/* Left Panel - Product/Room List & Categories */}
                {/* <div className="lg:col-span-2 h-screen bg-white flex flex-col p-6 border-r border-gray-100 overflow-y-auto"> */}
                <div className="lg:col-span-2 h-screen overflow-y-scroll p-6 bg-white border-r border-gray-100">
                    {/* Header */}
                    <div className="flex justify-between items-center mb-6">
                        <Radio.Group value={posMode} onChange={(e) => setPosMode(e.target.value)}>
                            <Radio.Button value="fnb"><MdOutlineShoppingCart /> F&B</Radio.Button>
                            <Radio.Button value="ruangan"><FaRegIdCard /> Ruangan</Radio.Button>
                        </Radio.Group>
                        <img src="/img/logo_dago.png" alt="Dago Creative Home" className="h-12" />
                        <div className="flex items-center space-x-2 text-gray-600"><UserOutlined /><span>{cashierName}</span></div>
                    </div>

                    {/* Tampilan Kondisional berdasarkan Mode */}
                    {posMode === 'fnb' ? (
                        <>
                            {/* Search Bar F&B */}
                            <div className="mb-6">
                                <Input placeholder="Cari produk F&B..." prefix={<SearchOutlined />} value={searchProductQuery} onChange={(e) => setSearchProductQuery(e.target.value)} />
                            </div>
                            {/* Filter F&B */}
                            <div className="mb-4">
                                <h3 className="text-sm text-gray-500 mb-2">Filter Tenant</h3>
                                <div className="flex flex-wrap gap-2">
                                    {merchantCategories.map((category) => <Button key={category.id} type={selectedMerchant === category.id ? "primary" : "default"} size="small" shape="round" onClick={() => setSelectedMerchant(category.id)}>{category.name}</Button>)}
                                </div>
                            </div>
                            <div className="mb-6">
                                <h3 className="text-sm text-gray-500 mb-2">Filter Tipe Produk</h3>
                                <div className="flex flex-wrap gap-2">
                                    {productTypeCategories.map((category) => <Button key={category.id} type={selectedProductType === category.id ? "primary" : "default"} size="small" shape="round" onClick={() => setSelectedProductType(category.id)}>{category.name}</Button>)}
                                </div>
                            </div>

                            {/* Product List */}
                            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                                {isLoading ? <div className="flex justify-center items-center h-full"><Spin size="large" /></div> : (
                                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                                        {filteredProducts.map((product) => (
                                            <div key={product.id} className={`rounded-xl shadow-sm border p-3 ${product.available ? "bg-white border-gray-200 cursor-pointer hover:shadow-md" : "bg-red-50 border-red-200 cursor-not-allowed opacity-70"}`} onClick={() => product.available && handleAddProductToCart(product)}>
                                                <h3 className={`font-semibold text-sm mb-1 ${product.available ? "text-gray-800" : "text-gray-500"}`}>{product.name}</h3>
                                                <div className="flex items-center justify-between mt-2">
                                                    <span className={`text-base font-bold ${product.available ? "text-blue-600" : "text-gray-500"}`}>{formatRupiah(product.price)}</span>
                                                    {!product.available && <Tag color="red">Habis</Tag>}
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
                        </>
                    ) : (
                        // --- Tampilan untuk Mode Ruangan ---
                        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                            <h2 className="text-xl font-bold text-gray-800 mb-4">Pilih Ruangan untuk Booking Hari Ini</h2>
                            {isLoadingRooms ? <div className="flex justify-center items-center h-full"><Spin size="large" /></div> : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {rooms.map((room) => (
                                        <div key={room.id_ruangan} className="bg-white rounded-lg border border-gray-200 p-4 cursor-pointer hover:shadow-lg transition-shadow" onClick={() => handleRoomCardClick(room)}>
                                            <h3 className="font-bold text-gray-800">{room.nama_ruangan}</h3>
                                            <p className="text-sm text-gray-500">{room.nama_kategori} - Kapasitas: {room.kapasitas} orang</p>
                                            <Tag color="green" className="mt-2">Booking Cepat</Tag>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Right Panel - Order Cart & Payment (HANYA UNTUK F&B) */}
                <div className={`bg-gray-50 flex flex-col p-6 transition-opacity  duration-300 ${posMode === 'ruangan' ? 'opacity-30 pointer-events-none' : 'opacity-100'} overflow-y-scroll h-screen`}>
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold text-gray-800">Order F&B</h2>
                        <Dropdown overlay={orderDropdownMenu} trigger={["click"]}>
                            <Button type="text" icon={<MoreOutlined className="text-xl" />} />
                        </Dropdown>
                    </div>
                    <div className="flex bg-gray-100 rounded-lg p-1 mb-6 text-sm font-medium">
                        {orderTypes.map((type) => (
                            <Button key={type.id} type={currentOrderType === type.id ? "primary" : "text"} className={`flex-1 rounded-md py-2 px-4 transition-all duration-200 ${currentOrderType === type.id ? "bg-blue-600 text-white shadow-md" : "text-gray-600 hover:bg-gray-200"}`} onClick={() => setCurrentOrderType(type.id)}>{type.name}</Button>
                        ))}
                    </div>
                    <div className="flex flex-col mb-6">
                        <span className="text-gray-500 text-sm">Order ({currentOrderNumber})</span>
                        <span className="text-lg font-bold">Order {customerName} {room && `(Meja: ${room})`}</span>
                    </div>
                    <div className=" space-y-3 mb-6">
                        {selectedItems.length === 0 ? (
                            <div className="text-center py-10 text-gray-500">Keranjang F&B kosong.</div>
                        ) : (
                            selectedItems.map((item) => (
                                <div key={`${item.id}-${item.note || ''}`} className="flex items-center justify-between bg-white rounded-lg p-3 shadow-sm border border-gray-200">
                                    <div className="flex flex-col flex-1 min-w-0 mr-2">
                                        <span className="font-semibold text-gray-800 truncate">{item.name}</span>
                                        <span className="text-sm text-gray-500">{formatRupiah(item.price)} {item.note && <span className="text-gray-400">({item.note})</span>}</span>
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
                    <div className="bg-white rounded-xl shadow-md p-4 mb-6 border">
                        <div className="flex justify-between items-center text-sm mb-2"><span>Subtotal</span><span>{formatRupiah(subtotal)}</span></div>
                        {taxPercentage > 0 && (<div className="flex justify-between items-center text-sm mb-2"><span>Tax ({taxPercentage * 100}%)</span><span>{formatRupiah(totalTax)}</span></div>)}
                        <div className="flex justify-between items-center text-sm mb-4"><span>Discount ({discountPercentage}%)</span><span>-{formatRupiah(totalDiscount)}</span></div>
                        <div className="flex justify-between items-center text-xl font-bold text-blue-600 border-t pt-4"><span>Total</span><span>{formatRupiah(totalAmount)}</span></div>
                    </div>
                    <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                            <Button size="large" onClick={() => message.info("Fungsi diskon belum aktif.")}>Discount</Button>
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

            {/* --- MODAL BARU UNTUK BOOKING RUANGAN --- */}
            <Modal
                title={<div className="font-bold text-lg">Booking Ruangan: {selectedRoomForBooking?.nama_ruangan}</div>}
                open={isBookingConfirmModalVisible}
                onCancel={() => setIsBookingConfirmModalVisible(false)}
                footer={[
                    <Button key="back" onClick={() => setIsBookingConfirmModalVisible(false)}>
                        Batal
                    </Button>,
                    <Button key="submit" type="primary" onClick={handleBookingSubmit} disabled={!selectedDuration || !selectedStartTime}>
                        Konfirmasi & Bayar
                    </Button>,
                ]}
                width={600}
                centered
            >
                <Form form={bookingForm} layout="vertical" className="mt-4">
                    <p className="mb-4 text-gray-600">Pilih jam mulai dan durasi untuk booking hari ini.</p>
                    <Divider>Pilih Jam Mulai</Divider>
                    <div className="grid grid-cols-5 md:grid-cols-7 gap-2 mb-4">
                        {Array.from({ length: 14 }, (_, i) => 8 + i).map(hour => {
                            const isBooked = selectedRoomForBooking?.booked_hours.includes(hour);
                            const isPast = hour < dayjs().hour();
                            const isDisabled = isBooked || isPast;
                            return (
                                <Button
                                    key={hour}
                                    type={selectedStartTime === hour ? 'primary' : 'default'}
                                    disabled={isDisabled}
                                    onClick={() => { setSelectedStartTime(hour); setSelectedDuration(null); }}
                                >
                                    {`${hour}:00`}
                                </Button>
                            );
                        })}
                    </div>

                    {selectedStartTime && (
                        <>
                            <Divider>Pilih Durasi</Divider>
                            <div className="grid grid-cols-3 md:grid-cols-4 gap-2 mb-4">
                                {selectedRoomForBooking?.paket_harga
                                    .sort((a, b) => a.durasi_jam - b.durasi_jam)
                                    .map(pkg => {
                                        const endTime = selectedStartTime + pkg.durasi_jam;
                                        // Cek apakah ada jam yang sudah dibooking di dalam rentang durasi yang dipilih
                                        const isOverlapping = selectedRoomForBooking.booked_hours.some(h => h >= selectedStartTime && h < endTime);
                                        const isInvalid = endTime > 22 || isOverlapping;
                                        return (
                                            <Button
                                                key={pkg.durasi_jam}
                                                type={selectedDuration?.durasi_jam === pkg.durasi_jam ? 'primary' : 'default'}
                                                disabled={isInvalid}
                                                onClick={() => setSelectedDuration(pkg)}
                                                className="h-auto py-2"
                                            >
                                                <div className="flex flex-col">
                                                    <span>{pkg.durasi_jam} Jam</span>
                                                    <span className="text-xs font-normal">{formatRupiah(pkg.harga_paket)}</span>
                                                </div>
                                            </Button>
                                        );
                                    })}
                            </div>
                        </>
                    )}

                    <Divider />

                    <Form.Item label="Nama Customer" name="customerName" rules={[{ required: true, message: "Nama customer harus diisi!" }]}>
                        <Input placeholder="Masukkan nama customer" />
                    </Form.Item>
                    <Form.Item label="Metode Pembayaran" name="paymentMethod" rules={[{ required: true, message: "Pilih metode pembayaran!" }]}>
                        <Radio.Group>
                            <Radio.Button value="cash">Cash</Radio.Button>
                            <Radio.Button value="qris">QRIS</Radio.Button>
                        </Radio.Group>
                    </Form.Item>
                    {selectedDuration && <div className="text-right font-bold text-lg text-blue-600">Total: {formatRupiah(selectedDuration.harga_paket)}</div>}
                </Form>
            </Modal>

            {/* ... (Modal-modal F&B yang sudah ada tidak berubah) ... */}
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
            <Modal title={<div className="text-xl font-bold text-gray-800">Tambahkan Catatan untuk <span className="font-normal">{itemToAddNote?.name}</span></div>} open={isAddNoteModalVisible} onOk={handleAddNoteOk} onCancel={handleAddNoteCancel} okText="Konfirmasi" cancelText="Batal" width={400} centered>
                <Form form={addNoteForm} layout="vertical" className="mt-4" initialValues={{ note: itemToAddNote?.note || "" }}>
                    {itemToAddNote && (<><p className="text-sm text-gray-500 mb-2">Kategori: {itemToAddNote.category}</p></>)}
                    <Form.Item label="Catatan" name="note"><Input.TextArea placeholder="nasi setengah, tidak pedas, dll." rows={2} /></Form.Item>
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
            <Modal title={<div className="text-xl font-bold text-gray-800 flex items-center justify-between">Pembayaran Tunai <span className="text-blue-600">{formatRupiah(totalAmount)}</span></div>} open={isCashPaymentModalVisible} onCancel={() => setIsCashPaymentModalVisible(false)} footer={null} width={400} centered>
                <Form layout="vertical" className="mt-4">
                    <Form.Item label="Uang Tunai" className="mb-4">
                        <Input prefix="Rp" value={cashInput > 0 ? cashInput.toLocaleString('id-ID') : ''} onChange={(e) => { const value = e.target.value.replace(/[^0-9]/g, ''); setCashInput(Number(value)); }} suffix={cashInput > 0 && (<CloseOutlined className="cursor-pointer text-gray-400" onClick={() => setCashInput(0)} />)} className="text-right text-lg font-medium" size="large" />
                    </Form.Item>
                    <div className="grid grid-cols-3 gap-3 mb-6">
                        {paymentQuickAmounts.map((amount) => (<Button key={amount} size="large" className="h-12" onClick={() => setCashInput(amount)}>{formatRupiah(amount)}</Button>))}
                        <Button size="large" className="h-12" onClick={() => setCashInput(totalAmount)}>{formatRupiah(totalAmount)}</Button>
                    </div>
                    <div className="flex justify-between items-center mb-4 text-base">
                        <span>Kembalian:</span>
                        <span className="font-bold text-green-600">{formatRupiah(changeAmount)}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <Button size="large" onClick={() => setIsCashPaymentModalVisible(false)}>Batal</Button>
                        <Button type="primary" size="large" onClick={handleCashPaymentSubmit} disabled={cashInput < totalAmount}>Submit</Button>
                    </div>
                </Form>
            </Modal>
            <Modal title={<div className="text-xl font-bold text-gray-800">Struk Pembayaran</div>} open={isStrukModalVisible} onCancel={paymentSuccess ? handleStrukConfirmPayment : handleStrukCancel} footer={null} width={400} centered>
                <div className="flex flex-col p-4 bg-white rounded-lg shadow-inner mt-4 border border-gray-200">
                    {paymentSuccess && (<div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4 flex items-center"><CheckCircleOutlined className="mr-2 text-xl" /><span className="font-semibold">Pembayaran berhasil!</span></div>)}
                    <div className="text-sm text-gray-600 mb-4">
                        <p><strong>Customer:</strong> {customerName}</p>
                        <p><strong>Tipe Order:</strong> {currentOrderType === 'dinein' ? 'Dine In' : currentOrderType === 'takeaway' ? 'Take Away' : 'Pick Up'}</p>
                        {room && <p><strong>Ruangan/Meja:</strong> {room}</p>}
                        <p><strong>Order #:</strong> {currentOrderNumber}</p>
                        <p><strong>Kasir:</strong> {cashierName}</p>
                        <p><strong>Tanggal:</strong> {currentDate.format("DD MMMM YYYY h:mm A")}</p>
                        <p><strong>Metode Bayar:</strong> {selectedPaymentMethod === 'cash' ? 'Cash' : selectedPaymentMethod === 'qris' ? 'QRIS' : '-'}</p>
                    </div>
                    <div className="border-t border-b border-gray-200 py-4 mb-4">
                        {selectedItems.map((item) => (<div key={`${item.id}-${item.note || ''}`} className="flex justify-between items-center mb-2"><div><p className="font-semibold text-gray-800">{item.name} x{item.qty}</p>{item.note && <p className="text-xs text-gray-500 italic">Catatan: {item.note}</p>}</div><span>{formatRupiah(item.price * item.qty)}</span></div>))}
                    </div>
                    <div className="mb-4">
                        <div className="flex justify-between text-sm mb-1"><span>Subtotal</span><span>{formatRupiah(subtotal)}</span></div>
                        {taxPercentage > 0 && (<div className="flex justify-between text-sm mb-1"><span>Pajak ({taxPercentage * 100}%)</span><span>{formatRupiah(totalTax)}</span></div>)}
                        <div className="flex justify-between text-sm mb-1"><span>Diskon ({discountPercentage}%)</span><span>-{formatRupiah(totalDiscount)}</span></div>
                        <div className="flex justify-between text-base font-bold text-gray-800 mt-2"><span>Total</span><span>{formatRupiah(totalAmount)}</span></div>
                        {selectedPaymentMethod === 'cash' && (<><div className="flex justify-between text-sm mt-2"><span>Tunai</span><span>{formatRupiah(cashInput)}</span></div><div className="flex justify-between text-base font-bold text-green-600 mt-1"><span>Kembalian</span><span>{formatRupiah(changeAmount)}</span></div></>)}
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