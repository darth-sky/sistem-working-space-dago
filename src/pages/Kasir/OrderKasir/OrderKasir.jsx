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
    ConfigProvider, // Keep ConfigProvider if you use it globally or for specific theme overrides
    Space // Import Space for layout
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
    SaveOutlined // <-- Import SaveOutlined
} from "@ant-design/icons";
import dayjs from "dayjs";
import { useLocation, useNavigate } from "react-router-dom"; // <-- Import useNavigate
import {
    getPosInitData,
    createOrderKasir,
    getRoomsToday,
    createRoomBookingKasir,
    saveOrderKasir, // <-- Import saveOrderKasir
    getSavedOrderDetails, // <-- Import getSavedOrderDetails
    paySavedOrder // <-- Import paySavedOrder
} from "../../../services/service"; // <-- Make sure path is correct
import { MdOutlineShoppingCart } from "react-icons/md";
import { FaRegIdCard } from "react-icons/fa";

const { Option } = Select;

// formatRupiah and generateOrderNumber remain the same
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
    const navigate = useNavigate(); // <-- Hook for navigation
    const initialState = location.state || {};

    // --- Existing States ---
    const [searchProductQuery, setSearchProductQuery] = useState("");
    const [selectedMerchant, setSelectedMerchant] = useState("all_merchants");
    const [selectedProductType, setSelectedProductType] = useState("all_types");
    const [currentOrderType, setCurrentOrderType] = useState(initialState.orderType || "dinein");
    const [currentOrderNumber, setCurrentOrderNumber] = useState(generateOrderNumber());
    const [customerName, setCustomerName] = useState(initialState.customerName || "Adit"); // Consider changing default later
    const [room, setRoom] = useState(initialState.room || null);
    const [cashierName, setCashierName] = useState("Rossa"); // Fetch from profile later?
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

    const [isLoadingInitData, setIsLoadingInitData] = useState(true); // Loading data awal (produk dll)
    const [isLoading, setIsLoadingSavedOrder] = useState(false); // Loading khusus saat memuat order simpanan

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
    const [isProcessing, setIsProcessing] = useState(false); // Loading state for save/payment

    // --- New State ---
    const [editingOrderId, setEditingOrderId] = useState(null); // Track ID of the saved order being edited


    const resetOrderState = () => {
        setSelectedItems([]);
        setDiscountPercentage(0);
        setCashInput(0);
        setCustomerName("Guest"); // Reset customer name to default
        setRoom(null);
        setCurrentOrderType("dinein"); // Reset order type
        setCurrentOrderNumber(generateOrderNumber()); // Generate a new order number
        setSelectedPaymentMethod(null);
        setPaymentSuccess(false);
        setEditingOrderId(null); // Crucial: clear the editing ID
        setIsStrukModalVisible(false); // Close modals
        setIsCashPaymentModalVisible(false);
        setIsDiscountModalVisible(false);
        setIsNewOrderModalVisible(false);
        setIsAddNoteModalVisible(false);
        newOrderForm.resetFields({ // Reset the new order form fields
            customerName: "Guest",
            orderType: "dinein",
            room: null
        });
        discountForm.resetFields();
        addNoteForm.resetFields();
        setSearchProductQuery(""); // Clear search
        setSelectedMerchant("all_merchants"); // Reset filters
        setSelectedProductType("all_types");
        console.log("Order state reset.");
    };
    // --- useEffect Hooks ---

    // Effect for initializing form based on initial state (from navigation)
    useEffect(() => {
        if (initialState.customerName || initialState.orderType) {
            newOrderForm.setFieldsValue({
                customerName: initialState.customerName,
                orderType: initialState.orderType,
                room: initialState.room,
            });
        }
    }, [initialState, newOrderForm]);


    // 1. useEffect: Load data awal (produk, kategori, pajak) HANYA SEKALI saat mount
    useEffect(() => {
        let isMounted = true;
        const loadInitialData = async () => {
            // Hapus atau comment pengecekan savedOrderId di sini
            // if (location.state?.savedOrderId && isMounted) return;

            setIsLoadingInitData(true); // Gunakan state loading yang baru
            setLoadingError(null);
            try {
                const data = await getPosInitData();
                if (isMounted) {
                    setProducts(data.products || []);
                    setMerchantCategories(data.merchantCategories || []);
                    setProductTypeCategories(data.productTypeCategories || []);
                    setOrderTypes(data.orderTypes || []);
                    setTaxRateFnbPercentFromAPI(data.taxRateFnbPercent || 10); // Default 10
                    console.log("Initial POS data loaded.");
                    // Jangan tampilkan message success di sini karena bisa tertimpa
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
                if (isMounted) setIsLoadingInitData(false); // Selesai loading data awal
            }
        };

        loadInitialData();

        return () => { isMounted = false; };
    }, []); // <-- PERBAIKAN UTAMA: Array dependensi KOSONG

    // Effect for loading SAVED ORDER details (runs after initial data or if navigated with savedOrderId)
    // 2. useEffect: Load order tersimpan JIKA ada savedOrderId dari navigasi
    //    Jalankan SETELAH data awal (produk) selesai dimuat.
    useEffect(() => {
        let isMounted = true;
        const savedOrderIdFromState = location.state?.savedOrderId;

        const loadSavedOrder = async (orderId) => {
            setIsLoadingSavedOrder(true); // Gunakan state loading yang baru
            console.log(`Attempting to load saved order ID: ${orderId}`);
            try {
                // Pastikan data produk sudah ada sebelum lanjut
                // Pengecekan products.length > 0 sudah ada di kondisi pemanggilan di bawah
                const savedOrderData = await getSavedOrderDetails(orderId);
                console.log("Saved order data received:", savedOrderData);

                if (isMounted) {
                    // Isi state dengan data dari order tersimpan
                    setCustomerName(savedOrderData.customerName || "Guest");
                    const orderTypeFrontend = savedOrderData.orderType?.toLowerCase().replace(" ", "") || 'dinein';
                    setCurrentOrderType(orderTypeFrontend);
                    setRoom(savedOrderData.room || null);

                    // Map item dari backend ke format frontend
                    const mappedItems = (savedOrderData.items || []).map(item => {
                        const productDetail = products.find(p => p.id === item.id_produk);
                        return {
                            id: item.id_produk,
                            name: item.nama_produk || productDetail?.name || `ID:${item.id_produk}?`,
                            price: item.harga_saat_order, // Harusnya sudah number dari service
                            qty: item.jumlah, // Harusnya sudah number dari service
                            note: item.catatan_pesanan || "",
                            merchantId: productDetail?.merchantId,
                            category: productDetail?.category,
                            available: productDetail?.available ?? true,
                        };
                    });
                    setSelectedItems(mappedItems);

                    setDiscountPercentage(savedOrderData.discountPercentage || 0);
                    setCurrentOrderNumber(savedOrderData.orderNumber || generateOrderNumber());
                    setEditingOrderId(orderId); // Tandai sedang mengedit

                    // Update form info order juga
                    newOrderForm.setFieldsValue({
                        customerName: savedOrderData.customerName || "Guest",
                        orderType: orderTypeFrontend,
                        room: savedOrderData.room || null,
                    });

                    message.success(`Melanjutkan order #${orderId}`);

                    // Hapus state dari history
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
                    // navigate('/kasir/transaksi'); // Arahkan kembali
                }
            } finally {
                if (isMounted) setIsLoadingSavedOrder(false); // Selesai loading order simpanan
            }
        };

        // Kondisi pemanggilan loadSavedOrder
        if (savedOrderIdFromState && !isLoadingInitData && products.length > 0) {
            // Panggil HANYA jika ID order yang diminta berbeda dari yang sedang diedit,
            // atau jika belum ada order yang sedang diedit.
            if (!editingOrderId || editingOrderId !== savedOrderIdFromState) {
                loadSavedOrder(savedOrderIdFromState);
            }
        }
        // Jangan reset state di sini jika tidak ada savedOrderIdFromState

        return () => { isMounted = false; };

        // **PERBAIKAN UTAMA: Array Dependensi yang Benar**
    }, [
        location.state?.savedOrderId, // Pemicu utama
        isLoadingInitData,            // Tunggu data awal selesai
        products,                     // Butuh data produk untuk mapping
        editingOrderId,               // Mencegah re-run jika ID sama
        resetOrderState,              // Fungsi reset (pastikan di useCallback)
        newOrderForm                  // Jika form diupdate di sini
        // JANGAN masukkan isLoadingSavedOrder, setIsLoading, navigate, loadingError di sini!
    ]);

    // Effect for loading room data when mode changes to 'ruangan'
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

    // useMemo and other useEffects for filtering remain the same...
    // Filter kategori produk berdasarkan merchant yang dipilih
    const availableProductTypes = useMemo(() => {
        if (selectedMerchant === "all_merchants") {
            return productTypeCategories;
        }

        const merchantProducts = products.filter(p => p.merchantId === selectedMerchant);
        const uniqueCategoryIds = [...new Set(merchantProducts.map(p => p.category))]; // Get unique category IDs for the merchant

        // Filter the main productTypeCategories list based on the unique IDs found
        return productTypeCategories.filter(cat =>
            cat.id === "all_types" || uniqueCategoryIds.includes(cat.id)
        );
    }, [selectedMerchant, products, productTypeCategories]);


    // Reset tipe produk jika tidak tersedia di merchant baru
    useEffect(() => {
        // Only reset if a specific merchant is selected AND the current product type is NOT 'all_types'
        if (selectedMerchant !== "all_merchants" && selectedProductType !== "all_types") {
            const isCurrentTypeAvailable = availableProductTypes.some(
                cat => cat.id === selectedProductType
            );
            // If the selected type is no longer in the filtered list for this merchant, reset to 'all_types'
            if (!isCurrentTypeAvailable) {
                setSelectedProductType("all_types");
            }
        }
        // If the selected merchant goes back to 'all_merchants', we don't need to reset the product type filter
    }, [selectedMerchant, availableProductTypes, selectedProductType]);


    // --- Calculation Memos --- (Remain the same, based on frontend state)
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
        // Ensure rounding to 2 decimal places if needed, e.g., using Math.round or .toFixed(2) after calculation
        parseFloat((taxableAmount * (taxRateFnbPercentFromAPI / 100)).toFixed(2)),
        [taxableAmount, taxRateFnbPercentFromAPI]);
    const totalAmount = useMemo(() =>
        // Ensure precision, especially after tax calculation
        parseFloat((taxableAmount + totalTaxNominal).toFixed(2)),
        [taxableAmount, totalTaxNominal]);
    const changeAmount = useMemo(() =>
        // Ensure cashInput is treated as a number
        parseFloat(cashInput) > totalAmount ? parseFloat(cashInput) - totalAmount : 0,
        [cashInput, totalAmount]);





    // --- Event Handlers ---

    // Handlers for adding/updating/removing items (handleAddProductToCart, handleUpdateItemQty, handleRemoveItemFromCart) remain the same
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




    // Handlers for discount modal (showDiscountModal, handleDiscountSubmit) remain the same
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


    // Handlers for New Order Modal (showNewOrderModal, handleNewOrderOk, handleNewOrderCancel) remain the same, but handleNewOrderOk should also call resetOrderState()
    const showNewOrderModal = () => {
        setIsNewOrderModalVisible(true);
    };

    const handleNewOrderOk = async () => {
        try {
            const values = await newOrderForm.validateFields();
            // Reset the entire order state first
            resetOrderState();

            // Then set the new customer info
            setCustomerName(values.customerName || "Guest");
            setCurrentOrderType(values.orderType);
            setRoom(values.room || null);

            message.success("Order baru siap! Silakan tambahkan produk.");
            setIsNewOrderModalVisible(false);
            // No need to reset items etc. here, already done by resetOrderState

        } catch (error) {
            console.error("Failed to validate new order form:", error);
            if (error.errorFields && error.errorFields.length > 0) {
                message.error("Gagal membuat order baru. Periksa kembali input Anda.");
            } else {
                // Handle other potential errors during async operations if any
                message.error("Terjadi kesalahan saat memproses order baru.");
            }
        }
    };

    const handleNewOrderCancel = () => {
        setIsNewOrderModalVisible(false);
        newOrderForm.resetFields();
    };


    // Handlers for Add Note Modal (handleAddNoteOk, handleAddNoteCancel) remain the same

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


    // Handlers for Payment Modals (handleProcessPayment, handleCashPaymentSubmit, handleStrukCancel) remain mostly the same
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

    const handleStrukCancel = () => {
        setIsStrukModalVisible(false);
        setPaymentSuccess(false);
        message.info("Pembayaran dibatalkan.");
    };




    // --- NEW: Handler for Save Order Button ---
    const handleSaveOrder = async () => {
        if (selectedItems.length === 0) {
            message.warning("Tidak ada item untuk disimpan.");
            return;
        }
        setIsProcessing(true); // Show loading indicator

        // Prepare data for saving (similar to payment, but no paymentMethod)
        const orderData = {
            customerName: customerName,
            orderType: currentOrderType,
            room: currentOrderType === 'dinein' ? room : null,
            items: selectedItems.map(item => ({
                id: item.id,
                qty: parseInt(item.qty) || 0,
                price: parseFloat(item.price) || 0, // Send price used in frontend calculation
                note: item.note || null
            })),
            // Send calculated values from frontend state
            subtotal: subtotal,
            discountPercentage: discountPercentage,
            discountNominal: totalDiscountNominal,
            taxPercentage: taxRateFnbPercentFromAPI,
            taxNominal: totalTaxNominal,
            totalAmount: totalAmount,
            // Include editingOrderId IF you want the backend to potentially UPDATE an existing saved order
            // (Requires backend logic change). For now, we assume saving always creates new or errors.
            // saved_order_id: editingOrderId,
        };

        try {
            console.log("Menyimpan Order Data (Kasir):", orderData);
            const result = await saveOrderKasir(orderData); // Call the NEW service
            message.success(`Order #${result.id_transaksi || 'N/A'} berhasil disimpan!`);

            resetOrderState(); // Reset the POS screen for a new order

        } catch (error) {
            message.error(`Gagal menyimpan order: ${error.message || 'Error tidak diketahui'}`);
            console.error("Error saving order:", error);
        } finally {
            setIsProcessing(false); // Hide loading indicator
        }
    };


    // --- MODIFIED: Handler for Confirming Payment (in Struk Modal) ---
    const handleStrukConfirmPayment = async () => {
        setIsProcessing(true); // Show loading

        // Prepare data object, ensure numbers are numbers
        const orderData = {
            customerName: customerName,
            orderType: currentOrderType,
            room: currentOrderType === 'dinein' ? room : null,
            paymentMethod: selectedPaymentMethod === 'cash' ? 'CASH' : 'QRIS',
            items: selectedItems.map(item => ({
                id: item.id,
                qty: parseInt(item.qty) || 0,
                price: parseFloat(item.price) || 0,
                note: item.note || null
            })),
            // Send calculated values
            subtotal: subtotal,
            discountPercentage: discountPercentage,
            discountNominal: totalDiscountNominal,
            taxPercentage: taxRateFnbPercentFromAPI,
            taxNominal: totalTaxNominal,
            totalAmount: totalAmount,
            // DO NOT send cashInput or changeAmount to backend for saving/paying transaction
        };

        try {
            let result;
            if (editingOrderId) {
                // If editingOrderId exists, call paySavedOrder
                console.log(`Membayar Order Tersimpan (ID: ${editingOrderId}):`, orderData);
                result = await paySavedOrder(editingOrderId, orderData); // Use paySavedOrder service
                message.success(result.info || `Order #${editingOrderId} berhasil diselesaikan!`);
            } else {
                // If it's a new order, call createOrderKasir
                console.log("Mengirim Order Data Baru (Kasir):", orderData);
                result = await createOrderKasir(orderData); // Use original service
                message.success(`Order #${result.id_transaksi || 'N/A'} berhasil disimpan!`);
            }

            // Reset state AFTER successful API call
            // resetOrderState(); // Use the helper function to reset everything
            navigate('/transaksikasir');

        } catch (error) {
            message.error(`Gagal ${editingOrderId ? 'menyelesaikan' : 'menyimpan'} order: ${error.message || 'Error tidak diketahui'}`);
            console.error(`Error ${editingOrderId ? 'paying saved' : 'saving new'} order:`, error);
            // Optionally keep the struk modal open on error?
            // setIsStrukModalVisible(true);
            // setPaymentSuccess(true); // Keep success state? Maybe not.
        } finally {
            setIsProcessing(false); // Hide loading
            // Close struk modal regardless of success/fail AFTER processing? Or only on success?
            // Decide based on desired UX. Closing it ensures user sees the main screen again.
            // If kept open on error, user might try saving again without knowing what failed.
            // setIsStrukModalVisible(false);
            // setPaymentSuccess(false);
        }
    };


    // orderDropdownMenu and paymentQuickAmounts remain the same
    const orderDropdownMenu = (
        <Menu>
            {/* Option to start fresh only if NOT editing a saved order */}
            {!editingOrderId && (
                <Menu.Item key="1" onClick={showNewOrderModal}>Ganti/Buat Order Baru</Menu.Item>
            )}
            <Menu.Item key="2" danger onClick={() => {
                // Reset should clear everything, including editing state
                resetOrderState();
                message.warning(`Order ${editingOrderId ? `#${editingOrderId}` : 'saat ini'} dibatalkan.`);
            }}>
                {/* Change text based on context */}
                {editingOrderId ? 'Batalkan Edit & Mulai Baru' : 'Hapus Order Saat Ini'}
            </Menu.Item>
        </Menu>
    );
    const paymentQuickAmounts = [5000, 10000, 20000, 50000, 100000].filter(amount => amount >= totalAmount || totalAmount === 0);

    // Handlers for room booking (handleRoomCardClick, handleBookingSubmit) remain the same
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

    const filteredProducts = products.filter((product) => {
        const matchesMerchant =
            selectedMerchant === "all_merchants" || product.merchantId === selectedMerchant;
        const matchesProductType =
            selectedProductType === "all_types" || product.category === selectedProductType;
        const matchesSearch = product.name
            .toLowerCase()
            .includes(searchProductQuery.toLowerCase());

        // --- TAMBAHKAN BARIS INI ---
        // (Asumsi nama propertinya 'status_visibilitas' dan nilainya 'non aktif'
        // Jika nama properti/nilai beda, sesuaikan di sini)
        const matchesVisibility = product.status_visibilitas !== 'Nonaktif';
        // --- SELESAI TAMBAHAN ---

        return matchesMerchant && matchesProductType && matchesSearch && matchesVisibility; // <-- TAMBAHKAN matchesVisibility DI SINI
    });


    // --- JSX Structure ---
    return (
        // Wrap with Spin if isLoading or isProcessing
        <Spin spinning={isLoading || isProcessing} tip={isProcessing ? "Menyimpan..." : "Memuat..."} size="large">
            <div className="flex bg-gray-50 text-gray-800 font-sans">
                {/* Product Selection Column */}
                <div className="lg:col-span-2 h-screen overflow-y-scroll p-6 bg-white border-r border-gray-100">
                    {/* Header: Mode Toggle, Logo, Cashier */}
                    <div className="flex justify-between items-center mb-6">
                        {/* ... (Mode toggle, logo, cashier name) ... */}
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
                                {!isLoading && loadingError && ( // Show general loading error here if needed
                                    <div className="text-center py-10 text-red-500">{loadingError}</div>
                                )}
                                {/* Show product loading specific spin here? Already covered by outer Spin */}
                                {!isLoading && !loadingError && filteredProducts.length === 0 && (
                                    <div className="text-center py-10 text-gray-500">Tidak ada produk ditemukan.</div>
                                )}
                                {!isLoading && !loadingError && filteredProducts.length > 0 && (
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
                                    {rooms.map((roomItem) => ( // Renamed variable to avoid conflict
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
                {/* Apply disabled effect if in 'ruangan' mode */}
                <div className={`bg-gray-50 flex flex-col p-6 transition-opacity duration-300 ${posMode === 'ruangan' ? 'opacity-30 pointer-events-none select-none' : 'opacity-100'} overflow-y-scroll h-screen`}>
                    {/* Header: Title and Order Options Dropdown */}
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold text-gray-800">
                            {/* Show different title when editing */}
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
                        <span className="text-lg font-bold">Order {customerName} {room && `(Meja: ${room})`}</span>
                    </div>


                    {/* Selected Items List */}
                    <div className="flex-1 space-y-3 mb-6 overflow-y-auto custom-scrollbar pr-1"> {/* Added flex-1 and overflow */}
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
                        {/* Show loading only if initial data isn't ready */}
                        {isLoading && !editingOrderId ? (
                            <div className="flex justify-center items-center py-4"><Spin /></div>
                        ) : (
                            <>
                                {/* Subtotal */}
                                <div className="flex justify-between items-center text-sm mb-1 text-gray-600">
                                    <span>Subtotal</span>
                                    <span className="font-medium">{formatRupiah(subtotal)}</span>
                                </div>
                                {/* Discount */}
                                {discountPercentage > 0 && (
                                    <div className="flex justify-between items-center text-sm mb-1 text-red-600">
                                        <span>Diskon ({discountPercentage}%)</span>
                                        <span className="font-medium">-{formatRupiah(totalDiscountNominal)}</span>
                                    </div>
                                )}
                                {/* Tax */}
                                {subtotal > 0 && taxRateFnbPercentFromAPI > 0 && (
                                    <div className="flex justify-between items-center text-sm mb-3 text-gray-600">
                                        <span>Pajak F&B ({taxRateFnbPercentFromAPI}%)</span>
                                        <span className="font-medium">{formatRupiah(totalTaxNominal)}</span>
                                    </div>
                                )}
                                {/* Total */}
                                <div className="flex justify-between items-center text-lg font-bold text-blue-600 border-t border-gray-200 pt-3 mt-2">
                                    <span>Total</span>
                                    <span>{formatRupiah(totalAmount)}</span>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-3 mt-auto"> {/* Added mt-auto to push to bottom */}
                        {/* Row 1: Discount & Save/Cancel */}
                        <div className="grid grid-cols-3 gap-3"> {/* Use grid-cols-3 */}
                            {/* Discount Button */}
                            <div className="flex items-center gap-1 col-span-1"> {/* Takes 1 column */}
                                <Button size="large" icon={<PercentageOutlined />} onClick={showDiscountModal} className="flex-1">
                                    {discountPercentage > 0 ? `Edit Diskon (${discountPercentage}%)` : 'Tambah Diskon'}
                                </Button>
                                {discountPercentage > 0 && (
                                    <Button danger type="primary" size="large" icon={<CloseOutlined />} onClick={() => { setDiscountPercentage(0); message.info("Diskon berhasil dihapus."); }} />
                                )}
                            </div>

                            {/* Save Order Button (NEW) */}
                            <Button
                                size="large"
                                icon={<SaveOutlined />}
                                onClick={handleSaveOrder}
                                disabled={selectedItems.length === 0 || isProcessing} // Disable if no items or processing
                                className="col-span-1" // Takes 1 column
                            >
                                Simpan Order
                            </Button>

                            {/* Cancel Button */}
                            <Button
                                danger
                                size="large"
                                onClick={() => {
                                    resetOrderState(); // Use reset function
                                    message.warning(`Order ${editingOrderId ? `#${editingOrderId}` : 'saat ini'} dibatalkan.`);
                                }}
                                className="col-span-1" // Takes 1 column
                            >
                                {editingOrderId ? 'Batal Edit' : 'Cancel Order'}
                            </Button>
                        </div>

                        {/* Row 2: Payment Method */}
                        <div className="flex bg-gray-100 rounded-lg p-1 text-sm font-medium">
                            <Button type={selectedPaymentMethod === "cash" ? "primary" : "text"} className={`flex-1 rounded-md py-2 px-4 transition-all duration-200 ${selectedPaymentMethod === "cash" ? "bg-blue-600 text-white shadow-md" : "text-gray-600 hover:bg-gray-200"}`} icon={<DollarOutlined />} onClick={() => setSelectedPaymentMethod("cash")}>Cash</Button>
                            <Button type={selectedPaymentMethod === "qris" ? "primary" : "text"} className={`flex-1 rounded-md py-2 px-4 transition-all duration-200 ${selectedPaymentMethod === "qris" ? "bg-blue-600 text-white shadow-md" : "text-gray-600 hover:bg-gray-200"}`} icon={<QrcodeOutlined />} onClick={() => setSelectedPaymentMethod("qris")}>QRIS</Button>
                        </div>

                        {/* Row 3: Payment Button */}
                        <Button
                            type="primary"
                            size="large"
                            block
                            onClick={handleProcessPayment}
                            disabled={selectedItems.length === 0 || !selectedPaymentMethod || isProcessing} // Disable if no items, no payment method, or processing
                            loading={isProcessing && selectedPaymentMethod !== null} // Show loading only when trying to pay
                        >
                            {/* Change text based on context */}
                            {editingOrderId ? 'Bayar & Selesaikan Order' : 'Payment & Print'}
                        </Button>
                    </div>

                </div>
            </div>

            {/* --- Modals --- */}
            {/* Discount Modal */}
            <Modal title="Masukkan Diskon Manual" open={isDiscountModalVisible} onOk={handleDiscountSubmit} onCancel={() => setIsDiscountModalVisible(false)} okText="Terapkan" cancelText="Batal">
                <Form form={discountForm} layout="vertical" className="mt-4">
                    <Form.Item label="Persentase Diskon" name="discount" rules={[{ required: true, message: 'Harap masukkan nilai diskon!' }]}>
                        <InputNumber min={0} max={100} formatter={(value) => `${value}%`} parser={(value) => value.replace('%', '')} className="w-full" size="large" />
                    </Form.Item>
                </Form>
            </Modal>


            {/* Room Booking Modal */}
            <Modal title={<div className="font-bold text-lg">Booking Ruangan: {selectedRoomForBooking?.nama_ruangan}</div>} open={isBookingConfirmModalVisible} onCancel={() => setIsBookingConfirmModalVisible(false)} footer={[<Button key="back" onClick={() => setIsBookingConfirmModalVisible(false)}>Batal</Button>, <Button key="submit" type="primary" onClick={handleBookingSubmit} disabled={!selectedDuration || !selectedStartTime}>Konfirmasi & Bayar</Button>]} width={600} centered>
                {/* ... (Form content remains the same) ... */}
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
                                    const isInvalid = endTime > 22 || isOverlapping; // Assuming closing hour is 22:00
                                    return (
                                        <Button key={pkg.durasi_jam} type={selectedDuration?.durasi_jam === pkg.durasi_jam ? 'primary' : 'default'} disabled={isInvalid} onClick={() => setSelectedDuration(pkg)} className="h-auto py-2">
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

            {/* New Order Modal */}
            <Modal title={<div className="text-xl font-bold text-gray-800"><PlusOutlined className="mr-2" /> Buat Order Baru</div>} open={isNewOrderModalVisible} onOk={handleNewOrderOk} onCancel={handleNewOrderCancel} okText="Buat Order" cancelText="Batal" width={400} centered className="new-order-modal">
                {/* ... (Form content remains the same) ... */}
                <Form form={newOrderForm} layout="vertical" initialValues={{ orderType: currentOrderType, customerName: customerName, room: room }} className="mt-4">
                    <Form.Item label="Tipe Order" name="orderType" rules={[{ required: true, message: "Pilih tipe order!" }]}>
                        <Radio.Group className="w-full">
                            <Radio.Button value="dinein" className="w-1/3 text-center">Dine In</Radio.Button>
                            <Radio.Button value="takeaway" className="w-1/3 text-center">Take Away</Radio.Button>
                            <Radio.Button value="pickup" className="w-1/3 text-center">Pick Up</Radio.Button>
                        </Radio.Group>
                    </Form.Item>
                    <Form.Item label="Nama Customer (Opsional)" name="customerName"><Input placeholder="Nama customer" /></Form.Item>
                    {/* Conditional rendering for room input based on selected order type in the form */}
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
            <Modal title={<div className="text-xl font-bold text-gray-800">Tambahkan Catatan untuk <span className="font-normal">{itemToAddNote?.name}</span></div>} open={isAddNoteModalVisible} onOk={handleAddNoteOk} onCancel={handleAddNoteCancel} okText="Konfirmasi" cancelText="Batal" width={400} centered>
                {/* ... (Form content remains the same) ... */}
                <Form form={addNoteForm} layout="vertical" className="mt-4" initialValues={{ note: itemToAddNote?.note || "" }}>
                    {/* Display category if available in itemToAddNote */}
                    {itemToAddNote?.category && (
                        <p className="text-sm text-gray-500 mb-2">
                            Kategori: {productTypeCategories.find(cat => cat.id === itemToAddNote.category)?.name || itemToAddNote.category}
                        </p>
                    )}
                    <Form.Item label="Catatan" name="note"><Input.TextArea placeholder="nasi setengah, tidak pedas, dll." rows={2} /></Form.Item>
                    <div className="flex items-center justify-between text-lg font-bold text-blue-600">
                        <span>{formatRupiah(itemToAddNote?.price || 0)}</span>
                        <div className="flex items-center space-x-2">
                            <Button icon={<MinusOutlined />} size="small" onClick={() => setItemToAddNote(prev => ({ ...prev, qty: Math.max(1, (prev?.qty || 1) - 1) }))} disabled={itemToAddNote?.qty <= 1} />
                            <span className="font-medium w-6 text-center">{itemToAddNote?.qty || 1}</span>
                            <Button icon={<PlusOutlined />} size="small" onClick={() => setItemToAddNote(prev => ({ ...prev, qty: (prev?.qty || 0) + 1 }))} />
                        </div>
                    </div>
                </Form>
            </Modal>


            {/* Cash Payment Modal */}
            <Modal title={<div className="text-xl font-bold text-gray-800 flex items-center justify-between">Pembayaran Tunai <span className="text-blue-600">{formatRupiah(totalAmount)}</span></div>} open={isCashPaymentModalVisible} onCancel={() => setIsCashPaymentModalVisible(false)} footer={null} width={400} centered>
                {/* ... (Form content remains the same) ... */}
                <Form layout="vertical" className="mt-4">
                    <Form.Item label="Uang Tunai" className="mb-4">
                        <Input prefix="Rp" value={cashInput > 0 ? cashInput.toLocaleString('id-ID') : ''} onChange={(e) => { const value = e.target.value.replace(/[^0-9]/g, ''); setCashInput(Number(value) || 0); }} /* Ensure Number or 0 */ suffix={cashInput > 0 && (<CloseOutlined className="cursor-pointer text-gray-400" onClick={() => setCashInput(0)} />)} className="text-right text-lg font-medium" size="large" autoFocus />
                    </Form.Item>
                    <div className="grid grid-cols-3 gap-3 mb-6">
                        {paymentQuickAmounts.map((amount) => (<Button key={amount} size="large" className="h-12" onClick={() => setCashInput(amount)}>{formatRupiah(amount)}</Button>))}
                        {/* Ensure totalAmount is a valid number before formatting */}
                        {totalAmount > 0 && !paymentQuickAmounts.includes(totalAmount) && (
                            <Button size="large" className="h-12" onClick={() => setCashInput(totalAmount)}>{formatRupiah(totalAmount)}</Button>
                        )}
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


            {/* Struk/Confirm Modal */}
            <Modal
                title={<div className="text-xl font-bold text-gray-800">Struk Pembayaran</div>}
                open={isStrukModalVisible}
                onOk={handleStrukConfirmPayment} // OK triggers payment confirmation/save
                onCancel={handleStrukCancel}    // Cancel closes modal
                footer={[
                    <Button key="back" size="large" onClick={handleStrukCancel}>
                        {/* Change cancel text slightly */}
                        {paymentSuccess ? "Tutup" : "Batal Pembayaran"}
                    </Button>,
                    <Button
                        key="submit"
                        type="primary"
                        size="large"
                        // block // No need to block if Cancel is always there
                        onClick={handleStrukConfirmPayment}
                        loading={isProcessing} // Show loading on this button
                        disabled={isProcessing} // Disable while processing
                    >
                        {/* Change text based on context */}
                        {editingOrderId ? 'Selesaikan & Cetak' : 'Simpan & Cetak Struk'}
                    </Button>,
                ]}
                width={380}
                centered
                destroyOnClose // Reset modal state on close
            >
                {/* ... (Struk content remains the same) ... */}
                <div className="flex flex-col pt-4 bg-white rounded-lg text-xs">
                    {/* Payment Success Message */}
                    {paymentSuccess && (
                        <div className="bg-green-100 border border-green-400 text-green-700 px-3 py-2 rounded-md relative mb-3 flex items-center text-xs">
                            <CheckCircleOutlined className="mr-2 text-base" />
                            <span className="font-semibold">Pembayaran berhasil diterima!</span>
                        </div>
                    )}
                    {/* Header Info */}
                    <div className="text-gray-600 mb-3 space-y-0.5">
                        <p><strong>Customer:</strong> {customerName || 'Guest'}</p>
                        <p><strong>Tipe:</strong> {currentOrderType === 'dinein' ? 'Dine In' : currentOrderType === 'takeaway' ? 'Take Away' : 'Pick Up'}{room ? ` (${room})` : ''}</p>
                        <p><strong>Order #:</strong> {currentOrderNumber}</p>
                        <p><strong>Kasir:</strong> {cashierName}</p>
                        <p><strong>Tanggal:</strong> {currentDate.format("DD/MM/YY HH:mm")}</p>
                        <p><strong>Bayar:</strong> {selectedPaymentMethod === 'cash' ? 'Tunai' : selectedPaymentMethod === 'qris' ? 'QRIS' : '-'}</p>
                    </div>
                    {/* Item Details (Scrollable) */}
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
                    {/* Final Price Breakdown */}
                    <div className="mb-1 space-y-0.5">
                        {/* Subtotal */}
                        <div className="flex justify-between">
                            <span>Subtotal</span>
                            <span>{formatRupiah(subtotal)}</span>
                        </div>
                        {/* Discount */}
                        {discountPercentage > 0 && (
                            <div className="flex justify-between text-red-600">
                                <span>Diskon ({discountPercentage}%)</span>
                                <span>-{formatRupiah(totalDiscountNominal)}</span>
                            </div>
                        )}
                        {/* Tax */}
                        {subtotal > 0 && taxRateFnbPercentFromAPI > 0 && (
                            <div className="flex justify-between">
                                <span>Pajak F&B ({taxRateFnbPercentFromAPI}%)</span>
                                <span>{formatRupiah(totalTaxNominal)}</span>
                            </div>
                        )}
                        {/* Total */}
                        <div className="flex justify-between text-sm font-bold text-gray-800 pt-1.5 border-t border-dashed mt-1.5">
                            <span>Total</span>
                            <span>{formatRupiah(totalAmount)}</span>
                        </div>
                        {/* Cash & Change */}
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


        </Spin> // Close Spin wrapper
    );
};

export default OrderKasir;