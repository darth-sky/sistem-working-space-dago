import React, { useState, useEffect, useMemo } from "react";
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
    Spin,
    Divider,
    ConfigProvider,
    Space
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
    PercentageOutlined,
    SaveOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { useLocation, useNavigate } from "react-router-dom";
// --- PERBAIKAN 1: Import useAuth ---
import { useAuth } from "../../../providers/AuthProvider";
import {
    getPosInitData,
    createOrderKasir,
    getRoomsToday,
    createRoomBookingKasir,
    saveOrderKasir,
    getSavedOrderDetails,
    paySavedOrder
} from "../../../services/service";
import { MdOutlineShoppingCart } from "react-icons/md";
import { FaRegIdCard } from "react-icons/fa";

const { Option } = Select;

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
    const navigate = useNavigate();
    const initialState = location.state || {};

    // --- PERBAIKAN 2: Ambil Sesi Aktif dan Info User ---
    const { activeSession, userProfile } = useAuth();

    // --- Existing States ---
    const [searchProductQuery, setSearchProductQuery] = useState("");
    const [selectedMerchant, setSelectedMerchant] = useState("all_merchants");
    const [selectedProductType, setSelectedProductType] = useState("all_types");
    const [currentOrderType, setCurrentOrderType] = useState(initialState.orderType || "dinein");
    const [currentOrderNumber, setCurrentOrderNumber] = useState(generateOrderNumber());
    const [customerName, setCustomerName] = useState(initialState.customerName || "Guest"); // Diubah dari "Adit"
    const [room, setRoom] = useState(initialState.room || null);

    // --- PERBAIKAN 3: Gunakan nama user dari profile ---
    const [cashierName, setCashierName] = useState(userProfile?.nama_user || userProfile?.nama || "Kasir"); // Dinamis

    const [currentDate, setCurrentDate] = useState(dayjs());
    const [selectedItems, setSelectedItems] = useState([]);
    const [taxRateFnbPercentFromAPI, setTaxRateFnbPercentFromAPI] = useState(0);
    const [loadingError, setLoadingError] = useState(null);
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

    const [isLoadingInitData, setIsLoadingInitData] = useState(true);
    const [isLoading, setIsLoadingSavedOrder] = useState(false);

    const [discountPercentage, setDiscountPercentage] = useState(0);
    const [isDiscountModalVisible, setIsDiscountModalVisible] = useState(false);
    const [discountForm] = Form.useForm();
    const [posMode, setPosMode] = useState('fnb');
    const [rooms, setRooms] = useState([]);
    const [isLoadingRooms, setIsLoadingRooms] = useState(false);
    const [selectedRoomForBooking, setSelectedRoomForBooking] = useState(null);
    const [selectedDuration, setSelectedDuration] = useState(null);
    const [selectedStartTime, setSelectedStartTime] = useState(null);
    const [isBookingConfirmModalVisible, setIsBookingConfirmModalVisible] = useState(false);
    const [bookingForm] = Form.useForm();
    const [isProcessing, setIsProcessing] = useState(false);

    const [editingOrderId, setEditingOrderId] = useState(null);
    const [pendingBookingData, setPendingBookingData] = useState(null);
    const [isRoomCashModalVisible, setIsRoomCashModalVisible] = useState(false);
    const [roomCashInput, setRoomCashInput] = useState(0);
    const [isBookingProcessing, setIsBookingProcessing] = useState(false);

    // resetOrderState (Tidak berubah)
    const resetOrderState = () => {
        setSelectedItems([]);
        setDiscountPercentage(0);
        setCashInput(0);
        setCustomerName("Guest");
        setRoom(null);
        setCurrentOrderType("dinein");
        setCurrentOrderNumber(generateOrderNumber());
        setSelectedPaymentMethod(null);
        setPaymentSuccess(false);
        setEditingOrderId(null);
        setIsStrukModalVisible(false);
        setIsCashPaymentModalVisible(false);
        setIsDiscountModalVisible(false);
        setIsNewOrderModalVisible(false);
        setIsAddNoteModalVisible(false);
        newOrderForm.resetFields({
            customerName: "Guest",
            orderType: "dinein",
            room: null
        });
        discountForm.resetFields();
        addNoteForm.resetFields();
        setSearchProductQuery("");
        setSelectedMerchant("all_merchants");
        setSelectedProductType("all_types");
        console.log("Order state reset.");
    };

    // useEffect Hooks (Tidak berubah)
    // ... (useEffect for initialState)
    useEffect(() => {
        if (initialState.customerName || initialState.orderType) {
            newOrderForm.setFieldsValue({
                customerName: initialState.customerName,
                orderType: initialState.orderType,
                room: initialState.room,
            });
        }
    }, [initialState, newOrderForm]);

    // ... (useEffect for LoadInitialData)
    // (Perbaikan kecil: Pindahkan dependensi `location.state` ke useEffect berikutnya)
    useEffect(() => {
        let isMounted = true;
        const loadInitialData = async () => {
            setIsLoadingInitData(true);
            setLoadingError(null);
            try {
                const data = await getPosInitData();
                if (isMounted) {
                    setProducts(data.products || []);
                    setMerchantCategories(data.merchantCategories || []);
                    setProductTypeCategories(data.productTypeCategories || []);
                    setOrderTypes(data.orderTypes || []);
                    setTaxRateFnbPercentFromAPI(data.taxRateFnbPercent || 10);
                    console.log("Initial POS data loaded.");
                }
            } catch (error) {
                if (isMounted) {
                    const errorMsg = "Gagal memuat data POS awal. Menggunakan pajak default 10%.";
                    message.error(errorMsg);
                    setLoadingError(errorMsg);
                    console.error("Error loading initial POS data:", error);
                    setTaxRateFnbPercentFromAPI(10); // Fallback
                }
            } finally {
                if (isMounted) setIsLoadingInitData(false);
            }
        };

        loadInitialData();

        return () => { isMounted = false; };
    }, []); // <-- Dependensi KOSONG (Hanya sekali)


    // ... (useEffect for loading SAVED ORDER)
    // (Perbaikan kecil: Pastikan 'resetOrderState' ada di array dependensi)
    useEffect(() => {
        let isMounted = true;
        const savedOrderIdFromState = location.state?.savedOrderId;

        const loadSavedOrder = async (orderId) => {
            setIsLoadingSavedOrder(true);
            console.log(`Attempting to load saved order ID: ${orderId}`);
            try {
                const savedOrderData = await getSavedOrderDetails(orderId);
                console.log("Saved order data received:", savedOrderData);

                if (isMounted) {
                    setCustomerName(savedOrderData.customerName || "Guest");
                    const orderTypeFrontend = savedOrderData.orderType?.toLowerCase().replace(" ", "") || 'dinein';
                    setCurrentOrderType(orderTypeFrontend);
                    setRoom(savedOrderData.room || null);

                    const mappedItems = (savedOrderData.items || []).map(item => {
                        const productDetail = products.find(p => p.id === item.id_produk);
                        return {
                            id: item.id_produk,
                            name: item.nama_produk || productDetail?.name || `ID:${item.id_produk}?`,
                            price: item.harga_saat_order,
                            qty: item.jumlah,
                            note: item.catatan_pesanan || "",
                            merchantId: productDetail?.merchantId,
                            category: productDetail?.category,
                            available: productDetail?.available ?? true,
                        };
                    });
                    setSelectedItems(mappedItems);

                    setDiscountPercentage(savedOrderData.discountPercentage || 0);
                    setCurrentOrderNumber(savedOrderData.orderNumber || generateOrderNumber());
                    setEditingOrderId(orderId);

                    newOrderForm.setFieldsValue({
                        customerName: savedOrderData.customerName || "Guest",
                        orderType: orderTypeFrontend,
                        room: savedOrderData.room || null,
                    });

                    message.success(`Melanjutkan order #${orderId}`);

                    if (window.history.replaceState) {
                        window.history.replaceState({}, document.title)
                    }
                }
            } catch (error) {
                if (isMounted) {
                    message.error(`Gagal memuat order tersimpan #${orderId}: ${error.message}`);
                    console.error("Error loading saved order:", error);
                    setEditingOrderId(null);
                    resetOrderState(); // Panggil fungsi reset
                }
            } finally {
                if (isMounted) setIsLoadingSavedOrder(false);
            }
        };

        if (savedOrderIdFromState && !isLoadingInitData && products.length > 0) {
            if (!editingOrderId || editingOrderId !== savedOrderIdFromState) {
                loadSavedOrder(savedOrderIdFromState);
            }
        }

        return () => { isMounted = false; };

    }, [
        location.state?.savedOrderId,
        isLoadingInitData,
        products,
        editingOrderId,
        newOrderForm,
        resetOrderState // Tambahkan resetOrderState ke dependensi
    ]);

    // ... (useEffect for loading room data)
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

    // ... (useMemo and other useEffects for filtering remain the same)
    const availableProductTypes = useMemo(() => {
        if (selectedMerchant === "all_merchants") {
            return productTypeCategories;
        }
        const merchantProducts = products.filter(p => p.merchantId === selectedMerchant);
        const uniqueCategoryIds = [...new Set(merchantProducts.map(p => p.category))];
        return productTypeCategories.filter(cat =>
            cat.id === "all_types" || uniqueCategoryIds.includes(cat.id)
        );
    }, [selectedMerchant, products, productTypeCategories]);

    useEffect(() => {
        if (selectedMerchant !== "all_merchants" && selectedProductType !== "all_types") {
            const isCurrentTypeAvailable = availableProductTypes.some(
                cat => cat.id === selectedProductType
            );
            if (!isCurrentTypeAvailable) {
                setSelectedProductType("all_types");
            }
        }
    }, [selectedMerchant, availableProductTypes, selectedProductType]);


    // Calculation Memos (Tidak berubah)
    const subtotal = useMemo(() =>
        selectedItems.reduce((sum, item) => sum + (parseFloat(item.price) || 0) * (parseInt(item.qty) || 0), 0),
        [selectedItems]);
    const totalDiscountNominal = useMemo(() =>
        subtotal * (discountPercentage / 100),
        [subtotal, discountPercentage]);
    const taxableAmount = useMemo(() =>
        subtotal - totalDiscountNominal,
        [subtotal, totalDiscountNominal]);
    const totalTaxNominal = useMemo(() =>
        parseFloat((taxableAmount * (taxRateFnbPercentFromAPI / 100)).toFixed(2)),
        [taxableAmount, taxRateFnbPercentFromAPI]);
    const totalAmount = useMemo(() =>
        parseFloat((taxableAmount + totalTaxNominal).toFixed(2)),
        [taxableAmount, totalTaxNominal]);
    const changeAmount = useMemo(() =>
        parseFloat(cashInput) > totalAmount ? parseFloat(cashInput) - totalAmount : 0,
        [cashInput, totalAmount]);

    // Event Handlers (Tidak berubah)
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
    const showDiscountModal = () => {
        discountForm.setFieldsValue({ discount: discountPercentage });
        setIsDiscountModalVisible(true);
    };
    const handleDiscountSubmit = async () => {
        try {
            const values = await discountForm.validateFields();
            const discountValue = parseFloat(values.discount) || 0;
            if (discountValue < 0 || discountValue > 100) {
                message.error("Diskon harus antara 0 dan 100.");
                return;
            }
            setDiscountPercentage(discountValue);
            setIsDiscountModalVisible(false);
            message.success(`Diskon ${discountValue}% berhasil diterapkan.`);
        } catch (error) {
            console.error("Validation failed:", error);
        }
    };
    const showNewOrderModal = () => {
        setIsNewOrderModalVisible(true);
    };
    const handleNewOrderOk = async () => {
        try {
            const values = await newOrderForm.validateFields();
            resetOrderState();
            setCustomerName(values.customerName || "Guest");
            setCurrentOrderType(values.orderType);
            setRoom(values.room || null);
            message.success("Order baru siap! Silakan tambahkan produk.");
            setIsNewOrderModalVisible(false);
        } catch (error) {
            console.error("Failed to validate new order form:", error);
            if (error.errorFields && error.errorFields.length > 0) {
                message.error("Gagal membuat order baru. Periksa kembali input Anda.");
            } else {
                message.error("Terjadi kesalahan saat memproses order baru.");
            }
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
        } else if (selectedPaymentMethod === 'debit') {
            message.info("Simulasi Pembayaran Debit berhasil! (Dalam pengembangan)");
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
    const handleStrukCancel = () => {
        setIsStrukModalVisible(false);
        setPaymentSuccess(false);
        message.info("Pembayaran dibatalkan.");
    };

    // --- PERBAIKAN 4: Modifikasi handleSaveOrder ---
    const handleSaveOrder = async () => {
        if (selectedItems.length === 0) {
            message.warning("Tidak ada item untuk disimpan.");
            return;
        }

        // Validasi Sesi
        if (!activeSession || !activeSession.id_sesi) {
            message.error("Sesi kasir tidak aktif. Silakan kembali ke 'Buka Sesi'.");
            return;
        }

        setIsProcessing(true);

        const orderData = {
            id_sesi: activeSession.id_sesi, // <-- WAJIB
            customerName: customerName,
            orderType: currentOrderType,
            room: currentOrderType === 'dinein' ? room : null,
            items: selectedItems.map(item => ({
                id: item.id,
                qty: parseInt(item.qty) || 0,
                price: parseFloat(item.price) || 0,
                note: item.note || null
            })),
            subtotal: subtotal,
            discountPercentage: discountPercentage,
            discountNominal: totalDiscountNominal,
            taxPercentage: taxRateFnbPercentFromAPI,
            taxNominal: totalTaxNominal,
            totalAmount: totalAmount,
        };

        try {
            console.log("Menyimpan Order Data (Kasir):", orderData);
            const result = await saveOrderKasir(orderData); // Panggil service
            message.success(`Order #${result.id_transaksi || 'N/A'} berhasil disimpan!`);
            resetOrderState();
            navigate('/transaksikasir'); // Navigasi kembali setelah sukses
        } catch (error) {
            message.error(`Gagal menyimpan order: ${error.message || 'Error tidak diketahui'}`);
            console.error("Error saving order:", error);
        } finally {
            setIsProcessing(false);
        }
    };

    // --- PERBAIKAN 5: Modifikasi handleStrukConfirmPayment ---
    const handleStrukConfirmPayment = async () => {
        setIsProcessing(true);

        // Validasi Sesi
        if (!activeSession || !activeSession.id_sesi) {
            message.error("Sesi kasir tidak aktif. Silakan kembali ke 'Buka Sesi'.");
            setIsProcessing(false);
            return;
        }

        const orderData = {
            id_sesi: activeSession.id_sesi, // <-- WAJIB
            customerName: customerName,
            orderType: currentOrderType,
            room: currentOrderType === 'dinein' ? room : null,
            paymentMethod: selectedPaymentMethod === 'cash' ? 'CASH' : selectedPaymentMethod === 'qris' ? 'QRIS' : 'DEBIT',
            items: selectedItems.map(item => ({
                id: item.id,
                qty: parseInt(item.qty) || 0,
                price: parseFloat(item.price) || 0,
                note: item.note || null
            })),
            subtotal: subtotal,
            discountPercentage: discountPercentage,
            discountNominal: totalDiscountNominal,
            taxPercentage: taxRateFnbPercentFromAPI,
            taxNominal: totalTaxNominal,
            totalAmount: totalAmount,
        };

        try {
            let result;
            if (editingOrderId) {
                console.log(`Membayar Order Tersimpan (ID: ${editingOrderId}):`, orderData);
                result = await paySavedOrder(editingOrderId, orderData);
                message.success(result.info || `Order #${editingOrderId} berhasil diselesaikan!`);
            } else {
                console.log("Mengirim Order Data Baru (Kasir):", orderData);
                result = await createOrderKasir(orderData);
                message.success(`Order #${result.id_transaksi || 'N/A'} berhasil disimpan!`);
            }

            navigate('/transaksikasir'); // Navigasi kembali

        } catch (error) {
            message.error(`Gagal ${editingOrderId ? 'menyelesaikan' : 'menyimpan'} order: ${error.message || 'Error tidak diketahui'}`);
            console.error(`Error ${editingOrderId ? 'paying saved' : 'saving new'} order:`, error);
        } finally {
            setIsProcessing(false);
        }
    };

    // orderDropdownMenu (Tidak berubah)
    const orderDropdownMenu = (
        <Menu>
            {!editingOrderId && (
                <Menu.Item key="1" onClick={showNewOrderModal}>Ganti/Buat Order Baru</Menu.Item>
            )}
            <Menu.Item key="2" danger onClick={() => {
                resetOrderState();
                message.warning(`Order ${editingOrderId ? `#${editingOrderId}` : 'saat ini'} dibatalkan.`);
            }}>
                {editingOrderId ? 'Batalkan Edit & Mulai Baru' : 'Hapus Order Saat Ini'}
            </Menu.Item>
        </Menu>
    );

    // paymentQuickAmounts (Tidak berubah)
    const paymentQuickAmounts = [5000, 10000, 20000, 50000, 100000].filter(amount => amount >= totalAmount || totalAmount === 0);

    const handleRoomCardClick = (room) => {
        setSelectedRoomForBooking(room);
        setSelectedDuration(null);
        setSelectedStartTime(null);
        bookingForm.setFieldsValue({
            customerName: "Guest",
            paymentMethod: null,
        });
        setIsBookingConfirmModalVisible(true);
    };
    // --- PERBAIKAN 6: Modifikasi handleBookingSubmit ---
    const handleBookingSubmit = async () => {
        try {
            // Validasi Sesi
            if (!activeSession || !activeSession.id_sesi) {
                message.error("Sesi kasir tidak aktif. Silakan kembali ke 'Buka Sesi'.");
                return;
            }

            setIsBookingProcessing(true);
            const values = await bookingForm.validateFields();

            const bookingData = {
                id_sesi: activeSession.id_sesi, // <-- WAJIB
                id_ruangan: selectedRoomForBooking.id_ruangan,
                durasi_jam: selectedDuration.durasi_jam,
                waktu_mulai_jam: selectedStartTime,
                nama_guest: values.customerName,
                metode_pembayaran: values.paymentMethod, // 'cash' atau 'qris'
                total_harga_final: selectedDuration.harga_paket
            };

            setPendingBookingData(bookingData);

            if (values.paymentMethod === 'cash') {
                setRoomCashInput(0);
                setIsRoomCashModalVisible(true);
                setIsBookingConfirmModalVisible(false);
            } else {
                console.log("Mengirim booking (non-tunai):", bookingData);
                const result = await createRoomBookingKasir(bookingData);
                message.success(`Booking (non-tunai) untuk ${selectedRoomForBooking.nama_ruangan} berhasil (ID: ${result.id_transaksi})!`);
                const updatedRooms = await getRoomsToday();
                setRooms(updatedRooms || []);
                setIsBookingConfirmModalVisible(false);
                setPendingBookingData(null);
            }

        } catch (errorInfo) {
            if (errorInfo.message) {
                message.error(`Gagal membuat booking: ${errorInfo.message}`);
            } else {
                console.error("Validation Failed:", errorInfo);
                message.error("Harap isi semua field yang diperlukan.");
            }
        } finally {
            setIsBookingProcessing(false);
        }
    };

    // filteredProducts (Tidak berubah)
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

    // --- JSX (RENDER) ---
    // (Tidak ada perubahan signifikan pada JSX, hanya memastikan nama kasir dinamis)
    return (
        <Spin spinning={isLoadingInitData || isLoading || isProcessing} tip={isProcessing ? "Menyimpan..." : "Memuat..."} size="large">
            <div className="flex flex-col lg:flex-row bg-gray-50 text-gray-800 font-sans h-screen">
                {/* Product Selection Column */}
                <div className="flex-1 h-screen overflow-y-scroll p-6 bg-white border-r border-gray-100">
                    {/* Header: Mode Toggle, Logo, Cashier */}
                    <div className="flex justify-between items-center mb-6">
                        <Radio.Group value={posMode} onChange={(e) => setPosMode(e.target.value)}>
                            <Radio.Button value="fnb">
                                <div className="flex items-center justify-center gap-2">
                                    <MdOutlineShoppingCart />
                                    <span>F&B</span>
                                </div>
                            </Radio.Button>
                            <Radio.Button value="ruangan">
                                <div className="flex items-center justify-center gap-2">
                                    <FaRegIdCard />
                                    <span>Ruangan</span>
                                </div>
                            </Radio.Button>
                        </Radio.Group>
                        <img src="/img/logo_dago.png" alt="Dago Creative Home" className="h-12" />
                        {/* Nama Kasir (Sudah dinamis dari PERBAIKAN 3) */}
                        <div className="flex items-center space-x-2 text-gray-600"><UserOutlined /><span>{cashierName}</span></div>
                    </div>

                    {/* Content based on posMode */}
                    {posMode === 'fnb' ? (
                        <>
                            {/* Search and Filters */}
                            <div className="mb-6">
                                <Input placeholder="Cari produk F&B..." prefix={<SearchOutlined />} value={searchProductQuery} onChange={(e) => setSearchProductQuery(e.target.value)} />
                            </div>
                            <div className="mb-4">
                                <h3 className="text-sm text-gray-500 mb-2">Filter Tenant</h3>
                                <div className="flex flex-wrap gap-2">
                                    {merchantCategories.map((category) => <Button key={category.id} type={selectedMerchant === category.id ? "primary" : "default"} size="small" shape="round" onClick={() => setSelectedMerchant(category.id)}>{category.name}</Button>)}
                                </div>
                            </div>
                            <div className="mb-6">
                                <h3 className="text-sm text-gray-500 mb-2">Filter Tipe Produk</h3>
                                <div className="flex flex-wrap gap-2">
                                    {availableProductTypes.map((category) => <Button key={category.id} type={selectedProductType === category.id ? "primary" : "default"} size="small" shape="round" onClick={() => setSelectedProductType(category.id)}>{category.name}</Button>)}
                                </div>
                            </div>

                            {/* Product List */}
                            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar pt-1">
                                {!isLoadingInitData && loadingError && (
                                    <div className="text-center py-10 text-red-500">{loadingError}</div>
                                )}
                                {!isLoadingInitData && !loadingError && filteredProducts.length === 0 && (
                                    <div className="text-center py-10 text-gray-500">Tidak ada produk ditemukan.</div>
                                )}
                                {!isLoadingInitData && !loadingError && filteredProducts.length > 0 && (
                                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                                        {filteredProducts.map((product) => (
                                            <div
                                                key={product.id}
                                                className={`rounded-lg shadow-sm border p-3 flex flex-col justify-between transition-all duration-150 h-full ${product.available ? "bg-white border-gray-200 cursor-pointer hover:shadow-md hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-300" : "bg-gray-100 border-gray-200 cursor-not-allowed opacity-60"}`}
                                                onClick={() => product.available && handleAddProductToCart(product)}
                                                tabIndex={product.available ? 0 : -1}
                                                role="button"
                                                aria-disabled={!product.available}
                                            >
                                                <div className="flex-1 mb-1">
                                                    <h3 className={`font-semibold text-sm leading-tight ${product.available ? "text-gray-800" : "text-gray-500"}`}>{product.name}</h3>
                                                </div>
                                                <div className="flex items-center justify-between mt-1">
                                                    <span className={`text-xs font-bold ${product.available ? "text-blue-600" : "text-gray-500"}`}>{formatRupiah(product.price)}</span>
                                                    {!product.available && <Tag color="red" className="ml-1 text-xs">Habis</Tag>}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        // Room Booking Mode Content
                        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                            <h2 className="text-xl font-bold text-gray-800 mb-4">Pilih Ruangan untuk Booking Hari Ini</h2>
                            {isLoadingRooms ? <div className="flex justify-center items-center h-full"><Spin size="large" /></div> : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {rooms.map((roomItem) => (
                                        <div key={roomItem.id_ruangan} className="bg-white rounded-lg border border-gray-200 p-4 cursor-pointer hover:shadow-lg transition-shadow" onClick={() => handleRoomCardClick(roomItem)}>
                                            <h3 className="font-bold text-gray-800">{roomItem.nama_ruangan}</h3>
                                            <p className="text-sm text-gray-500">{roomItem.nama_kategori} - Kapasitas: {roomItem.kapasitas} orang</p>
                                            <Tag color="green" className="mt-2">Booking Cepat</Tag>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Order Summary/Cart Column */}
                <div className={`lg:w-2/5 bg-gray-50 flex flex-col p-6 transition-opacity duration-300 ${posMode === 'ruangan' ? 'opacity-30 pointer-events-none select-none' : 'opacity-100'} overflow-y-scroll h-screen`}>
                    {/* Header: Title and Order Options Dropdown */}
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold text-gray-800">
                            {editingOrderId ? `Edit Order #${editingOrderId}` : 'Order F&B'}
                        </h2>
                        <Dropdown overlay={orderDropdownMenu} trigger={["click"]}>
                            <Button type="text" icon={<MoreOutlined className="text-xl" />} />
                        </Dropdown>
                    </div>

                    {/* Order Type Buttons */}
                    <div className="flex bg-gray-100 rounded-lg p-1 mb-6 text-sm font-medium">
                        {orderTypes.map((type) => (
                            <Button
                                key={type.id}
                                type={currentOrderType === type.id ? "primary" : "text"}
                                className={`flex-1 rounded-md py-2 px-4 transition-all duration-200 ${currentOrderType === type.id ? "bg-blue-600 text-white shadow-md" : "text-gray-600 hover:bg-gray-200"}`}
                                onClick={() => setCurrentOrderType(type.id)}
                            >
                                {type.name}
                            </Button>
                        ))}
                    </div>

                    {/* Customer Info */}
                    <div className="flex flex-col mb-6">
                        <span className="text-gray-500 text-sm">Order ({currentOrderNumber})</span>
                        <span className="text-lg font-bold">Order {customerName} {room && `(${room})`}</span>
                    </div>

                    {/* Selected Items List */}
                    <div className="flex-1 space-y-3 mb-6 overflow-y-auto custom-scrollbar pr-1">
                        {selectedItems.length === 0 ? (
                            <div className="text-center py-10 text-gray-500">Keranjang F&B kosong.</div>
                        ) : (
                            selectedItems.map((item) => (
                                <div key={`${item.id}-${item.note || 'no-note'}`} className="flex items-center justify-between bg-white rounded-lg p-3 shadow-sm border border-gray-200">
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

                    {/* Price Summary */}
                    <div className="bg-white rounded-xl shadow-md p-4 mb-6 border">
                        {isLoadingInitData && !editingOrderId ? ( // Ganti 'isLoading'
                            <div className="flex justify-center items-center py-4"><Spin /></div>
                        ) : (
                            <>
                                <div className="flex justify-between items-center text-sm mb-1 text-gray-600">
                                    <span>Subtotal</span>
                                    <span className="font-medium">{formatRupiah(subtotal)}</span>
                                </div>
                                {discountPercentage > 0 && (
                                    <div className="flex justify-between items-center text-sm mb-1 text-red-600">
                                        <span>Diskon ({discountPercentage}%)</span>
                                        <span className="font-medium">-{formatRupiah(totalDiscountNominal)}</span>
                                    </div>
                                )}
                                {subtotal > 0 && taxRateFnbPercentFromAPI > 0 && (
                                    <div className="flex justify-between items-center text-sm mb-3 text-gray-600">
                                        <span>Pajak F&B ({taxRateFnbPercentFromAPI}%)</span>
                                        <span className="font-medium">{formatRupiah(totalTaxNominal)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between items-center text-lg font-bold text-blue-600 border-t border-gray-200 pt-3 mt-2">
                                    <span>Total</span>
                                    <span>{formatRupiah(totalAmount)}</span>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-3 mt-auto">
                        <div className="grid grid-cols-2 gap-3">
                            <Button size="large" type="primary" className="bg-blue-500 hover:bg-blue-600 border-none text-white" icon={<PercentageOutlined />} onClick={showDiscountModal}>
                                Discount
                            </Button>
                            <Button danger size="large" className="text-white border-none bg-red-500 hover:bg-red-600" onClick={() => {
                                resetOrderState();
                                message.warning(`Order ${editingOrderId ? `#${editingOrderId}` : "saat ini"} dibatalkan.`);
                            }}>
                                Cancel Order
                            </Button>
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-sm font-medium">
                            <Button
                                type={selectedPaymentMethod === "cash" ? "primary" : "default"}
                                className={`flex-1 py-2 px-3 ${selectedPaymentMethod === "cash" ? "bg-blue-600 text-white" : "text-gray-700"}`}
                                icon={<DollarOutlined />}
                                onClick={() => setSelectedPaymentMethod("cash")}
                            >
                                Cash
                            </Button>
                            <Button
                                type={selectedPaymentMethod === "qris" ? "primary" : "default"}
                                className={`flex-1 py-2 px-3 ${selectedPaymentMethod === "qris" ? "bg-blue-600 text-white" : "text-gray-700"}`}
                                icon={<QrcodeOutlined />}
                                onClick={() => setSelectedPaymentMethod("qris")}
                            >
                                QRIS
                            </Button>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <Button
                                size="large"
                                icon={<SaveOutlined />}
                                onClick={handleSaveOrder}
                                disabled={selectedItems.length === 0 || isProcessing}
                                className="bg-green-600 hover:bg-green-700 border-none text-white"
                            >
                                Save
                            </Button>
                            <Button
                                type="primary"
                                size="large"
                                className="bg-blue-600 hover:bg-blue-700 border-none text-white"
                                block
                                onClick={handleProcessPayment}
                                disabled={selectedItems.length === 0 || !selectedPaymentMethod || isProcessing}
                                loading={isProcessing && selectedPaymentMethod !== null}
                            >
                                Payment & Print
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- Modals (Tidak ada perubahan) --- */}

            {/* Discount Modal */}
            <Modal title="Masukkan Diskon Manual" open={isDiscountModalVisible} onOk={handleDiscountSubmit} onCancel={() => setIsDiscountModalVisible(false)} okText="Terapkan" cancelText="Batal">
                <Form form={discountForm} layout="vertical" className="mt-4">
                    <Form.Item label="Persentase Diskon" name="discount" rules={[{ required: true, message: 'Harap masukkan nilai diskon!' }]}>
                        <InputNumber min={0} max={100} formatter={(value) => `${value}%`} parser={(value) => value.replace('%', '')} className="w-full" size="large" />
                    </Form.Item>
                </Form>
            </Modal>

            {/* Room Booking Modal */}
            <Modal
                title={<div className="font-bold text-lg">Booking Ruangan: {selectedRoomForBooking?.nama_ruangan}</div>}
                open={isBookingConfirmModalVisible}
                onCancel={() => setIsBookingConfirmModalVisible(false)}
                footer={[
                    <Button key="back" onClick={() => setIsBookingConfirmModalVisible(false)}>Batal</Button>,
                    <Button
                        key="submit"
                        type="primary"
                        onClick={handleBookingSubmit}
                        disabled={!selectedDuration || !selectedStartTime || isBookingProcessing} // Tambah disable
                        loading={isBookingProcessing} // Tambah loading
                    >
                        Konfirmasi & Bayar
                    </Button>
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
                                <Button key={hour} type={selectedStartTime === hour ? 'primary' : 'default'} disabled={isDisabled} onClick={() => { setSelectedStartTime(hour); setSelectedDuration(null); }}>
                                    {`${hour}:00`}
                                </Button>
                            );
                        })}
                    </div>

                    {selectedStartTime && (
                        <>
                            <Divider>Pilih Durasi</Divider>
                            <div className="grid grid-cols-3 md:grid-cols-4 gap-2 mb-4">
                                {selectedRoomForBooking?.paket_harga.sort((a, b) => a.durasi_jam - b.durasi_jam).map(pkg => {
                                    const endTime = selectedStartTime + pkg.durasi_jam;
                                    const isOverlapping = selectedRoomForBooking.booked_hours.some(h => h >= selectedStartTime && h < endTime);
                                    const isInvalid = endTime > 22 || isOverlapping;
                                    return (
                                        <Button
                                            key={pkg.durasi_jam}
                                            type={selectedDuration?.durasi_jam === pkg.durasi_jam ? 'primary' : 'default'}
                                            disabled={isInvalid}
                                            onClick={() => setSelectedDuration(pkg)}
                                            className="h-auto py-2 min-w-[100px] min-h-[50px]"
                                        >
                                            <div className="flex flex-col items-center">
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

            {/* New Order Modal */}
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
                    <Form.Item
                        noStyle
                        shouldUpdate={(prevValues, currentValues) => prevValues.orderType !== currentValues.orderType}
                    >
                        {({ getFieldValue }) =>
                            getFieldValue('orderType') === 'dinein' ? (
                                <Form.Item label="Nomor Meja/Ruangan (contoh: Meja 1, RM1)" name="room">
                                    <Input placeholder="Nomor Meja/Ruangan" />
                                </Form.Item>
                            ) : null
                        }
                    </Form.Item>
                    <Form.Item label="Kasir" className="mb-0"><Input value={cashierName} disabled prefix={<UserOutlined />} /></Form.Item>
                </Form>
            </Modal>

            {/* Add Note Modal */}
            <Modal
                title={
                    <div className="flex flex-col items-start">
                        <div className="text-lg font-semibold text-gray-800">Tambahkan Catatan untuk</div>
                        <div className="text-xl font-bold text-blue-600 mt-1">{itemToAddNote?.name}</div>
                    </div>
                }
                open={isAddNoteModalVisible}
                onOk={handleAddNoteOk}
                onCancel={handleAddNoteCancel}
                okText="Konfirmasi"
                cancelText="Batal"
                width={420}
                centered
                className="rounded-xl"
            >
                <Form
                    form={addNoteForm}
                    layout="vertical"
                    className="mt-2 space-y-4"
                    initialValues={{ note: itemToAddNote?.note || "" }}
                >
                    {itemToAddNote?.category && (
                        <p className="text-sm text-gray-500 mb-1">
                            Kategori:{" "}
                            <span className="font-medium text-gray-700">
                                {productTypeCategories.find(
                                    (cat) => cat.id === itemToAddNote.category
                                )?.name || itemToAddNote.category}
                            </span>
                        </p>
                    )}
                    <Form.Item
                        label={<span className="font-medium text-gray-700">Catatan</span>}
                        name="note"
                    >
                        <Input.TextArea
                            placeholder="Contoh: nasi setengah, tidak pedas, tanpa sambal, dll."
                            rows={3}
                            maxLength={150}
                            showCount
                        />
                    </Form.Item>
                    <div className="flex items-center justify-between border-t border-gray-100 pt-3">
                        <span className="text-lg font-bold text-blue-600">
                            {formatRupiah(itemToAddNote?.price || 0)}
                        </span>
                        <div className="flex items-center space-x-3">
                            <Button
                                icon={<MinusOutlined />}
                                size="small"
                                shape="circle"
                                onClick={() =>
                                    setItemToAddNote((prev) => ({
                                        ...prev,
                                        qty: Math.max(1, (prev?.qty || 1) - 1),
                                    }))
                                }
                                disabled={itemToAddNote?.qty <= 1}
                            />
                            <span className="font-semibold text-gray-800 w-6 text-center">
                                {itemToAddNote?.qty || 1}
                            </span>
                            <Button
                                icon={<PlusOutlined />}
                                size="small"
                                shape="circle"
                                onClick={() =>
                                    setItemToAddNote((prev) => ({
                                        ...prev,
                                        qty: (prev?.qty || 0) + 1,
                                    }))
                                }
                            />
                        </div>
                    </div>
                </Form>
            </Modal>

            {/* Cash Payment Modal */}
            <Modal
                title={<div className="text-xl font-bold text-gray-800">Pembayaran Tunai</div>}
                open={isCashPaymentModalVisible}
                onCancel={() => setIsCashPaymentModalVisible(false)}
                footer={null}
                width={400}
                centered
            >
                <div className="text-lg font-semibold text-blue-600 mb-2 text-right">
                    Total: {formatRupiah(totalAmount)}
                </div>
                <Form layout="vertical" className="mt-2">
                    <Form.Item label="Uang Tunai" className="mb-4">
                        <Input
                            prefix="Rp"
                            value={cashInput > 0 ? cashInput.toLocaleString('id-ID') : ''}
                            onChange={(e) => {
                                const value = e.target.value.replace(/[^0-9]/g, '');
                                setCashInput(Number(value) || 0);
                            }}
                            allowClear={false}
                            className="text-right text-lg font-medium"
                            size="large"
                            autoFocus
                        />
                    </Form.Item>
                    <div className="grid grid-cols-3 gap-3 mb-6">
                        {paymentQuickAmounts.map((amount) => (
                            <Button
                                key={amount}
                                size="large"
                                className="h-12"
                                onClick={() => setCashInput(amount)}
                            >
                                {formatRupiah(amount)}
                            </Button>
                        ))}
                        {totalAmount > 0 && !paymentQuickAmounts.includes(totalAmount) && (
                            <Button
                                size="large"
                                className="h-12"
                                onClick={() => setCashInput(totalAmount)}
                            >
                                {formatRupiah(totalAmount)}
                            </Button>
                        )}
                    </div>
                    <div className="flex justify-between items-center mb-4 text-base">
                        <span>Kembalian:</span>
                        <span className="font-bold text-green-600">{formatRupiah(changeAmount)}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <Button size="large" onClick={() => setIsCashPaymentModalVisible(false)}>
                            Batal
                        </Button>
                        <Button
                            type="primary"
                            size="large"
                            onClick={handleCashPaymentSubmit}
                            disabled={cashInput < totalAmount}
                        >
                            Submit
                        </Button>
                    </div>
                </Form>
            </Modal>

            {/* Struk/Confirm Modal */}
            <Modal
                title={<div className="text-xl font-bold text-gray-800">Struk Pembayaran</div>}
                open={isStrukModalVisible}
                onOk={handleStrukConfirmPayment}
                onCancel={handleStrukCancel}
                footer={[
                    <Button key="back" size="large" onClick={handleStrukCancel}>
                        {paymentSuccess ? "Tutup" : "Batal Pembayaran"}
                    </Button>,
                    <Button
                        key="submit"
                        type="primary"
                        size="large"
                        onClick={handleStrukConfirmPayment}
                        loading={isProcessing}
                        disabled={isProcessing}
                    >
                        {editingOrderId ? 'Selesaikan & Cetak' : 'Simpan & Cetak Struk'}
                    </Button>,
                ]}
                width={380}
                centered
                destroyOnClose
            >
                <div className="flex flex-col pt-4 bg-white rounded-lg text-xs">
                    {paymentSuccess && (
                        <div className="bg-green-100 border border-green-400 text-green-700 px-3 py-2 rounded-md relative mb-3 flex items-center text-xs">
                            <CheckCircleOutlined className="mr-2 text-base" />
                            <span className="font-semibold">Pembayaran berhasil diterima!</span>
                        </div>
                    )}
                    <div className="text-gray-600 mb-3 space-y-0.5">
                        <p><strong>Customer:</strong> {customerName || 'Guest'}</p>
                        <p><strong>Tipe:</strong> {currentOrderType === 'dinein' ? 'Dine In' : currentOrderType === 'takeaway' ? 'Take Away' : 'Pick Up'}{room ? ` (${room})` : ''}</p>
                        <p><strong>Order #:</strong> {currentOrderNumber}</p>
                        <p><strong>Kasir:</strong> {cashierName}</p>
                        <p><strong>Tanggal:</strong> {currentDate.format("DD/MM/YY HH:mm")}</p>
                        <p><strong>Bayar:</strong> {selectedPaymentMethod === 'cash' ? 'Tunai' : selectedPaymentMethod === 'qris' ? 'QRIS' : selectedPaymentMethod === 'debit' ? 'DEBIT' : '-'}</p>
                    </div>
                    <div className="border-t border-b border-gray-200 py-2 my-2 max-h-40 overflow-y-auto custom-scrollbar">
                        {selectedItems.map((item) => (
                            <div key={`${item.id}-${item.note || 'no-note'}`} className="flex justify-between items-start mb-1.5">
                                <div className="mr-2">
                                    <p className="font-medium text-gray-800 leading-tight">{item.name} <span className="font-normal text-gray-500">x{item.qty}</span></p>
                                    {item.note && <p className="text-gray-500 italic">({item.note})</p>}
                                </div>
                                <span className="font-medium whitespace-nowrap">{formatRupiah(item.price * item.qty)}</span>
                            </div>
                        ))}
                    </div>
                    <div className="mb-1 space-y-0.5">
                        <div className="flex justify-between">
                            <span>Subtotal</span>
                            <span>{formatRupiah(subtotal)}</span>
                        </div>
                        {discountPercentage > 0 && (
                            <div className="flex justify-between text-red-600">
                                <span>Diskon ({discountPercentage}%)</span>
                                <span>-{formatRupiah(totalDiscountNominal)}</span>
                            </div>
                        )}
                        {subtotal > 0 && taxRateFnbPercentFromAPI > 0 && (
                            <div className="flex justify-between">
                                <span>Pajak F&B ({taxRateFnbPercentFromAPI}%)</span>
                                <span>{formatRupiah(totalTaxNominal)}</span>
                            </div>
                        )}
                        <div className="flex justify-between text-sm font-bold text-gray-800 pt-1.5 border-t border-dashed mt-1.5">
                            <span>Total</span>
                            <span>{formatRupiah(totalAmount)}</span>
                        </div>
                        {selectedPaymentMethod === 'cash' && (
                            <>
                                <div className="flex justify-between pt-1">
                                    <span>Tunai</span>
                                    <span>{formatRupiah(cashInput)}</span>
                                </div>
                                <div className="flex justify-between text-sm font-bold text-green-600">
                                    <span>Kembalian</span>
                                    <span>{formatRupiah(changeAmount)}</span>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </Modal>

            {/* --- MODAL BARU: Pembayaran Tunai RUANGAN --- */}
            <Modal
                title={<div className="text-xl font-bold text-gray-800">Pembayaran Tunai Ruangan</div>}
                open={isRoomCashModalVisible}
                onCancel={() => {
                    setIsRoomCashModalVisible(false);
                    setPendingBookingData(null);
                    message.warning("Pembayaran booking ruangan dibatalkan.");
                }}
                footer={null}
                width={400}
                centered
            >
                {pendingBookingData && (
                    <>
                        <div className="text-lg font-semibold text-blue-600 mb-2 text-right">
                            Total: {formatRupiah(pendingBookingData.total_harga_final)}
                        </div>
                        <Form layout="vertical" className="mt-2">
                            <Form.Item label="Uang Tunai" className="mb-4">
                                <Input
                                    prefix="Rp"
                                    value={roomCashInput > 0 ? roomCashInput.toLocaleString('id-ID') : ''}
                                    onChange={(e) => {
                                        const value = e.target.value.replace(/[^0-9]/g, '');
                                        setRoomCashInput(Number(value) || 0);
                                    }}
                                    className="text-right text-lg font-medium"
                                    size="large"
                                    autoFocus
                                />
                            </Form.Item>
                            <div className="grid grid-cols-3 gap-3 mb-6">
                                {[50000, 100000, 150000, 200000].filter(amount => amount >= pendingBookingData.total_harga_final).map((amount) => (
                                    <Button key={amount} size="large" className="h-12" onClick={() => setRoomCashInput(amount)}>
                                        {formatRupiah(amount)}
                                    </Button>
                                ))}
                                {pendingBookingData.total_harga_final > 0 && (
                                    <Button size="large" className="h-12" onClick={() => setRoomCashInput(pendingBookingData.total_harga_final)}>
                                        {formatRupiah(pendingBookingData.total_harga_final)}
                                    </Button>
                                )}
                            </div>
                            <div className="flex justify-between items-center mb-4 text-base">
                                <span>Kembalian:</span>
                                <span className="font-bold text-green-600">
                                    {formatRupiah(Math.max(0, roomCashInput - pendingBookingData.total_harga_final))}
                                </span>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <Button size="large" onClick={() => {
                                    setIsRoomCashModalVisible(false);
                                    setPendingBookingData(null);
                                    message.warning("Pembayaran booking ruangan dibatalkan.");
                                }}>
                                    Batal
                                </Button>
                                <Button
                                    type="primary"
                                    size="large"
                                    onClick={async () => {
                                        if (roomCashInput < pendingBookingData.total_harga_final) {
                                            message.error("Jumlah uang tunai kurang!");
                                            return;
                                        }
                                        try {
                                            setIsBookingProcessing(true);
                                            console.log("Mengirim booking (tunai):", pendingBookingData);
                                            const result = await createRoomBookingKasir(pendingBookingData);
                                            message.success(`Booking (tunai) untuk ${pendingBookingData.nama_guest} berhasil (ID: ${result.id_transaksi})!`);
                                            const updatedRooms = await getRoomsToday();
                                            setRooms(updatedRooms || []);
                                            setIsRoomCashModalVisible(false);
                                            setPendingBookingData(null);
                                        } catch (error) {
                                            message.error(`Gagal menyimpan booking: ${error.message}`);
                                        } finally {
                                            setIsBookingProcessing(false);
                                        }
                                    }}
                                    disabled={roomCashInput < pendingBookingData.total_harga_final || isBookingProcessing}
                                    loading={isBookingProcessing}
                                >
                                    Submit
                                </Button>
                            </div>
                        </Form>
                    </>
                )}
            </Modal>
        </Spin>
    );
};

export default OrderKasir;