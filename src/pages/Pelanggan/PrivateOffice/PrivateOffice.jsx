import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    DatePicker,
    TimePicker,
    InputNumber,
    Button,
    message,
    Spin,
    Alert,
    Modal,
    Input,
    Select,
    Tag,
    List,
    Card, // Ditambahkan karena ada di kode Anda tapi tidak di import
    Typography, // Ditambahkan karena ada di kode Anda tapi tidak di import
} from "antd";
import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";
import { jwtStorage } from "../../../utils/jwtStorage";
import { formatRupiah } from "../../../utils/formatRupiah";
import {
    CalendarOutlined,
    ClockCircleOutlined,
    UserOutlined,
    CheckCircleOutlined,
    DollarCircleOutlined,
    SearchOutlined,
    ExclamationCircleOutlined,
} from "@ant-design/icons";

import {
    getUserProfile,
    getPrivateOfficeRooms,
    createBulkBooking,
    checkBulkAvailability,
} from "../../../services/service";

dayjs.extend(isBetween);

const { RangePicker } = DatePicker;
const { Option } = Select;
const baseUrl = import.meta.env.VITE_BASE_URL || "";

const qrisImgSrc = "/static/qris-barcode.png";

const PrivateOffice = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [submitLoading, setSubmitLoading] = useState(false);
    const [rooms, setRooms] = useState([]);
    const [selectedDateRange, setSelectedDateRange] = useState(null);
    const [selectedTimeRange, setSelectedTimeRange] = useState([
        dayjs().hour(8).minute(0),
        dayjs().hour(17).minute(0),
    ]);
    const [quantities, setQuantities] = useState({});
    const [error, setError] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        metode: "qris",
    });
    const [selectedCategoriesForModal, setSelectedCategoriesForModal] = useState(
        []
    );
    const [loggedInUser, setLoggedInUser] = useState(null);

    // --- NEW STATES FOR AVAILABILITY CHECK ---
    const [checkingAvailability, setCheckingAvailability] = useState(false);
    const [availabilityResult, setAvailabilityResult] = useState(null);
    const [showAvailabilityModal, setShowAvailabilityModal] = useState(false);
    const [lastCheckParams, setLastCheckParams] = useState(null);

    // === NEW: include weekends state ===
    const [includeWeekends, setIncludeWeekends] = useState({
        saturday: false,
        sunday: false,
    });

    // --- FUNCTION TO LOAD INITIAL DATA ---
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                setError(null);

                const userData = await getUserProfile();
                if (userData.data) {
                    setLoggedInUser(userData.data);
                } else {
                    throw new Error("Gagal memuat data pengguna.");
                }

                const roomData = await getPrivateOfficeRooms();
                setRooms(roomData || []);
            } catch (err) {
                console.error("Error fetching data:", err);
                setError(err.message || "Gagal memuat data. Silakan coba lagi.");
                if (err.message.includes("Token") || err.message.includes("Sesi")) {
                    message.error("Sesi Anda habis, silakan login kembali.");
                    navigate("/login");
                }
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [navigate]);

    // Reset availability check result if parameters change (now also when includeWeekends changes)
    useEffect(() => {
        setAvailabilityResult(null);
        setLastCheckParams(null);
    }, [selectedDateRange, selectedTimeRange, quantities, includeWeekends]);

    const groupByCategory = (list) => {
        return list.reduce((acc, item) => {
            const kategori = item.nama_kategori || "Lainnya";
            if (!acc[kategori]) acc[kategori] = [];
            acc[kategori].push(item);
            return acc;
        }, {});
    };

    const groupedRooms = groupByCategory(rooms);

    // --- PERBAIKAN URUTAN KATEGORI ---
    // Tentukan urutan kategori yang Anda inginkan
    const categoryOrder = [
        "Open Space",
        "Space Monitor",
        "Ruang Meeting Kecil",
        "Ruang Meeting Besar"
    ];

    // Ambil semua keys (kategori) yang ada
    const allCategoryKeys = Object.keys(groupedRooms);

    // Urutkan keys tersebut berdasarkan 'categoryOrder'
    const sortedCategoryKeys = allCategoryKeys.sort((a, b) => {
        const indexA = categoryOrder.indexOf(a);
        const indexB = categoryOrder.indexOf(b);

        // Jika kategori tidak ada di 'categoryOrder', taruh di akhir
        if (indexA === -1) return 1;
        if (indexB === -1) return -1;

        // Urutkan berdasarkan indeks di 'categoryOrder'
        return indexA - indexB;
    });
    // --- BATAS AKHIR PERBAIKAN ---


    const disabledDate = (current) => current && current < dayjs().startOf("day");

    const handleQuantityChange = (category, value) => {
        const availableUnits = groupedRooms[category]?.length ?? 0;
        const numericValue = Number(value);
        if (isNaN(numericValue)) {
            setQuantities((prev) => ({ ...prev, [category]: 0 }));
            return;
        }
        const newValue = Math.max(0, Math.min(numericValue, availableUnits));
        setQuantities((prev) => ({ ...prev, [category]: newValue }));
    };

    const isAnyCategorySelected = Object.keys(quantities).some(
        (k) => quantities[k] > 0
    );

    // === NEW: helper to get active dates taking includeWeekends into account ===
    const getActiveDates = (startDayjs, endDayjs) => {
        if (!startDayjs || !endDayjs) return [];
        const dates = [];
        let cur = startDayjs.startOf("day");
        const last = endDayjs.startOf("day");
        while (cur.isBefore(last) || cur.isSame(last, "day")) {
            const dow = cur.day(); // 0 = Sunday, 6 = Saturday
            const isSat = dow === 6;
            const isSun = dow === 0;
            if (
                (!isSat || includeWeekends.saturday) &&
                (!isSun || includeWeekends.sunday)
            ) {
                dates.push(cur.clone());
            }
            cur = cur.add(1, "day");
        }
        return dates;
    };

    // --- FUNCTION TO HANDLE AVAILABILITY CHECK ---
    const handleCheckAvailability = async () => {
        // Basic input validation
        if (
            !selectedDateRange ||
            !selectedTimeRange ||
            !selectedDateRange[0] ||
            !selectedDateRange[1] ||
            !selectedTimeRange[0] ||
            !selectedTimeRange[1]
        ) {
            return message.warning(
                "Rentang tanggal atau waktu sewa tidak lengkap atau tidak valid."
            );
        }
        // Validate time range is within bounds (8 to 22)
        const startHour = selectedTimeRange[0].hour();
        const endHour = selectedTimeRange[1].hour();
        if (
            startHour < 8 ||
            endHour > 22 ||
            (endHour === 22 && selectedTimeRange[1].minute() > 0) ||
            startHour >= endHour
        ) {
            return message.error(
                "Waktu sewa tidak valid. Pilih antara jam 08:00 pagi hingga 22:00 malam, dan jam selesai harus setelah jam mulai."
            );
        }

        const selectedCats = Object.keys(quantities).filter(
            (k) => quantities[k] > 0
        );
        if (selectedCats.length === 0) {
            return message.warning(
                "Pilih minimal satu unit ruangan untuk dicek ketersediaannya."
            );
        }

        // Collect room IDs to check
        const roomIdsToCheck = [];
        let validationError = false;
        selectedCats.forEach((cat) => {
            const availableRoomsInCategory = groupedRooms[cat] || [];
            const numToCheck = quantities[cat];
            if (numToCheck > availableRoomsInCategory.length || numToCheck <= 0) {
                message.error(`Jumlah unit ${cat} (${numToCheck}) tidak valid.`);
                validationError = true;
                return;
            }
            const ids = availableRoomsInCategory
                .slice(0, numToCheck)
                .map((room) => room.id_ruangan);
            roomIdsToCheck.push(...ids);
        });

        if (validationError || roomIdsToCheck.length === 0) return;

        // Prepare payload for the check (unchanged)
        const payload = {
            room_ids: roomIdsToCheck,
            tanggal_mulai: selectedDateRange[0].format("YYYY-MM-DD"),
            tanggal_selesai: selectedDateRange[1].format("YYYY-MM-DD"),
            jam_mulai: startHour,
            jam_selesai: endHour,
        };

        try {
            setCheckingAvailability(true);
            setAvailabilityResult(null);
            setLastCheckParams(null);

            const result = await checkBulkAvailability(payload);

            setAvailabilityResult(result);
            if (result.available) {
                setLastCheckParams(payload);
            }
            setShowAvailabilityModal(true);
        } catch (error) {
            console.error("Error checking availability:", error);
            message.error(`Gagal memeriksa ketersediaan: ${error.message}`);
            setAvailabilityResult({
                available: false,
                unavailable_slots: [],
                error: error.message,
            });
            setShowAvailabilityModal(true);
        } finally {
            setCheckingAvailability(false);
        }
    };
    // --- END AVAILABILITY CHECK FUNCTION ---

    // --- MODIFIED: Open Order/Payment Modal ---
    const openOrderModal = () => {
        // 1. Basic Validations (Date, Time, Quantity)
        if (
            !selectedDateRange ||
            !selectedTimeRange ||
            !selectedDateRange[0] ||
            !selectedDateRange[1] ||
            !selectedTimeRange[0] ||
            !selectedTimeRange[1]
        ) {
            return message.warning(
                "Rentang tanggal atau waktu sewa tidak lengkap atau tidak valid."
            );
        }
        const startHour = selectedTimeRange[0].hour();
        const endHour = selectedTimeRange[1].hour();
        if (
            startHour < 8 ||
            endHour > 22 ||
            (endHour === 22 && selectedTimeRange[1].minute() > 0) ||
            startHour >= endHour
        ) {
            return message.error(
                "Waktu sewa tidak valid. Pilih antara jam 08:00 pagi hingga 22:00 malam, dan jam selesai harus setelah jam mulai."
            );
        }

        const selectedCats = Object.keys(quantities).filter(
            (k) => quantities[k] > 0
        );
        if (selectedCats.length === 0) {
            return message.warning("Pilih minimal satu unit ruangan.");
        }
        let validationPassed = true;
        selectedCats.forEach((cat) => {
            const requestedQuantity = quantities[cat];
            const availableQuantity = groupedRooms[cat]?.length ?? 0;
            if (requestedQuantity > availableQuantity || requestedQuantity <= 0) {
                message.error(`Jumlah unit ${cat} (${requestedQuantity}) tidak valid.`);
                validationPassed = false;
            }
        });
        if (!validationPassed) return;

        // 2. AVAILABILITY CHECK VALIDATION
        if (!availabilityResult || !availabilityResult.available) {
            message.warning(
                "Silakan cek ketersediaan terlebih dahulu dan pastikan semua slot tersedia."
            );
            return;
        }

        // 3. PARAMETER CONSISTENCY CHECK
        const currentParams = {
            tanggal_mulai: selectedDateRange[0].format("YYYY-MM-DD"),
            tanggal_selesai: selectedDateRange[1].format("YYYY-MM-DD"),
            jam_mulai: startHour,
            jam_selesai: endHour,
        };

        if (
            !lastCheckParams ||
            lastCheckParams.tanggal_mulai !== currentParams.tanggal_mulai ||
            lastCheckParams.tanggal_selesai !== currentParams.tanggal_selesai ||
            lastCheckParams.jam_mulai !== currentParams.jam_mulai ||
            lastCheckParams.jam_selesai !== currentParams.jam_selesai
        ) {
            message.warning(
                "Parameter tanggal/waktu/ruangan berubah sejak cek terakhir. Silakan cek ulang ketersediaan."
            );
            setAvailabilityResult(null);
            setLastCheckParams(null);
            return;
        }

        setSelectedCategoriesForModal(selectedCats);
        setIsModalOpen(true);
    };
    // --- END MODIFIED openOrderModal ---

    const handleFinalSubmit = async () => {
        // --- LOGIC REMAINS LARGELY THE SAME ---
        if (
            !selectedDateRange ||
            !selectedTimeRange ||
            !selectedDateRange[0] ||
            !selectedDateRange[1] ||
            !selectedTimeRange[0] ||
            !selectedTimeRange[1]
        ) {
            return message.warning("Rentang tanggal atau waktu tidak valid.");
        }
        const startHour = selectedTimeRange[0].hour();
        const endHour = selectedTimeRange[1].hour();
        if (
            startHour < 8 ||
            endHour > 22 ||
            (endHour === 22 && selectedTimeRange[1].minute() > 0) ||
            startHour >= endHour
        ) {
            return message.error("Waktu sewa tidak valid (08:00 - 22:00).");
        }

        const selectedCats = Object.keys(quantities).filter(
            (k) => quantities[k] > 0
        );
        if (selectedCats.length === 0) {
            return message.warning("Pilih minimal satu unit ruangan.");
        }

        // Collect room IDs - SAME AS BEFORE
        const roomIdsToBook = [];
        let validationError = false;
        selectedCats.forEach((cat) => {
            const availableRoomsInCategory = groupedRooms[cat] || [];
            const numToBook = quantities[cat];
            if (numToBook > availableRoomsInCategory.length || numToBook <= 0) {
                message.error(`Jumlah unit ${cat} (${numToBook}) tidak valid.`);
                validationError = true;
                return;
            }
            const ids = availableRoomsInCategory
                .slice(0, numToBook)
                .map((room) => room.id_ruangan);
            roomIdsToBook.push(...ids);
        });
        if (validationError || roomIdsToBook.length === 0) return;

        // Prepare payload - unchanged
        const payload = {
            id_user: loggedInUser?.id_user,
            room_ids: roomIdsToBook,
            tanggal_mulai: selectedDateRange[0].format("YYYY-MM-DD"),
            tanggal_selesai: selectedDateRange[1].format("YYYY-MM-DD"),
            jam_mulai: startHour,
            jam_selesai: endHour,
            metode_pembayaran: "Non-Tunai",
            status_pembayaran: "Lunas",
        };

        console.log("Mengirim Payload Booking:", JSON.stringify(payload, null, 2));

        try {
            setSubmitLoading(true);
            const response = await createBulkBooking(payload);

            if (response.status === 201) {
                message.success(
                    response.data.message || "Pesanan berhasil dibuat! Silakan scan QRIS."
                );
                setIsModalOpen(false);
                setQuantities({});
                setSelectedDateRange(null);
                setSelectedTimeRange([
                    dayjs().hour(8).minute(0),
                    dayjs().hour(17).minute(0),
                ]);
                setAvailabilityResult(null);
                setLastCheckParams(null);
                navigate("/riwayat-transaksi");
            } else {
                message.error(
                    response.data.error ||
                    response.data.message ||
                    "Gagal membuat pesanan."
                );
            }
        } catch (error) {
            console.error("Error creating bulk booking:", error);
            const errMsg =
                error.response?.data?.error || error.message || "Terjadi kesalahan";
            if (error.response?.status === 409) {
                message.error(
                    `Gagal: ${errMsg}. Slot mungkin terisi saat proses. Cek ulang ketersediaan.`
                );
                setAvailabilityResult(null);
                setLastCheckParams(null);
                setIsModalOpen(false);
            } else {
                message.error("Gagal mengirim pesanan: " + errMsg);
            }
        } finally {
            setSubmitLoading(false);
        }
    };

    // --- FUNCTION TO DISABLE HOURS in TimePicker ---
    const disabledRangeTime = (_, type) => {
        const disabledHours = () => {
            const hours = [];
            for (let i = 0; i < 8; i++) {
                hours.push(i);
            }
            for (let i = 23; i < 24; i++) {
                hours.push(i);
            }

            if (type === "start" && selectedTimeRange?.[1]) {
                for (let i = selectedTimeRange[1].hour(); i <= 23; i++) {
                    if (!hours.includes(i)) hours.push(i);
                }
            } else if (type === "end" && selectedTimeRange?.[0]) {
                for (let i = 0; i <= selectedTimeRange[0].hour(); i++) {
                    if (!hours.includes(i)) hours.push(i);
                }
                if (selectedTimeRange[0].hour() === 22 && !hours.includes(22)) {
                    hours.push(22);
                }
            }

            return hours;
        };

        const disabledMinutes = (selectedHour) => {
            if (selectedHour !== undefined) {
                // Hanya izinkan menit ke-0
                if (selectedHour === 22 && type === 'end') {
                    // Jika jam 22, hanya izinkan 00
                    return Array.from({ length: 59 }, (_, i) => i + 1);
                }
                // Untuk jam lain, izinkan 00
                return Array.from({ length: 59 }, (_, i) => i + 1);
            }
            return [];
        };

        return {
            disabledHours,
            disabledMinutes,
        };
    };
    // --- END FUNCTION TO DISABLE HOURS ---

    // --- dateRender for RangePicker to show "Sabtu"/"Minggu" in small grey text ---
    const dateRender = (current) => {
        const dow = current.day();
        const isSat = dow === 6;
        const isSun = dow === 0;
        const label = isSat ? "Sabtu" : isSun ? "Minggu" : null;

        return (
            <div style={{ position: "relative", width: "100%", height: "100%" }}>
                <div style={{ textAlign: "center" }}>
                    <div>{current.date()}</div>
                    {label && (
                        <div style={{ fontSize: 10, color: "#9CA3AF", marginTop: 2 }}>
                            {label}
                        </div>
                    )}
                </div>
            </div>
        );
    };

    // --- RENDER LOGIC ---
    if (loading) {
        return (
            <div className="flex justify-center items-center h-[60vh]">
                <Spin size="large" tip="Memuat data..." />
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6 max-w-xl mx-auto">
                <Alert type="error" message={error} showIcon />
            </div>
        );
    }

    // --- Helper to compute estimated total price for modal (frontend-only) ---
    const computeEstimatedTotal = () => {
        if (!selectedDateRange || !selectedTimeRange)
            return { totalDays: 0, totalPrice: 0 };

        const activeDates = getActiveDates(
            selectedDateRange[0],
            selectedDateRange[1]
        );
        const totalDays = activeDates.length;
        if (totalDays === 0) return { totalDays: 0, totalPrice: 0 };

        const startHour = selectedTimeRange[0].hour();
        const endHour = selectedTimeRange[1].hour();
        const hoursPerDay = Math.max(0, endHour - startHour);

        let grandTotal = 0;

        // For each selected category, estimate price
        const cats = Object.keys(quantities).filter((k) => quantities[k] > 0);
        cats.forEach((cat) => {
            const qty = quantities[cat] || 0;
            const roomsInCat = groupedRooms[cat] || [];
            if (roomsInCat.length === 0 || qty === 0) return;

            const room = roomsInCat[0];
            // If paket_harga exists, choose the minimum paket by harga_paket
            if (room.paket_harga && room.paket_harga.length > 0) {
                const minPackage = room.paket_harga.reduce(
                    (min, p) => (p.harga_paket < min.harga_paket ? p : min),
                    room.paket_harga[0]
                );
                const paketHours = minPackage.durasi_jam || 1;
                // number of packages needed per day (ceil)
                const packagesPerDay = Math.ceil(hoursPerDay / paketHours) || 1;
                const pricePerUnitPerDay = minPackage.harga_paket * packagesPerDay;
                const totalForCat = pricePerUnitPerDay * qty * totalDays;
                grandTotal += totalForCat;
                m
            } else {
                // fallback to harga_per_jam
                const pricePerHour = room.harga_per_jam || 0;
                const pricePerUnitPerDay = pricePerHour * hoursPerDay;
                const totalForCat = pricePerUnitPerDay * qty * totalDays;
                grandTotal += totalForCat;
            }
        });

        return { totalDays, totalPrice: grandTotal };
    };

    const { totalDays, totalPrice } = computeEstimatedTotal();

    return (
        <div className="max-w-6xl mx-auto px-4 py-8">
            <h2 className="text-3xl font-bold mb-4">Pemesanan Ruang Kerja Tim</h2>
            <p className="text-gray-600 mb-8">
                Sewa beberapa unit ruang kerja sekaligus untuk tim Anda. Pilih tanggal,
                waktu (08:00 - 22:00), dan jumlah unit per kategori.
            </p>

            {/* Date and Time Selection Card */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm mb-10">
                <h2 className="text-2xl font-bold mb-6">Detail Waktu Sewa</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div>
                        <label className="block text-gray-700 mb-2 font-semibold">
                            <CalendarOutlined className="mr-2" /> Tanggal Sewa{" "}
                            <span className="text-red-500">*</span>
                        </label>
                        <RangePicker
                            className="w-full"
                            format="DD MMM YYYY"
                            onChange={(dates) => setSelectedDateRange(dates)}
                            disabledDate={disabledDate}
                            value={selectedDateRange}
                            dateRender={dateRender} // Menambahkan dateRender di sini
                        />

                        {/* Checkbox Sabtu/Minggu */}
                        <div className="mt-3 flex gap-6">
                            <label className="flex items-center gap-2 text-gray-700">
                                <input
                                    type="checkbox"
                                    checked={includeWeekends.saturday}
                                    onChange={(e) =>
                                        setIncludeWeekends((prev) => ({
                                            ...prev,
                                            saturday: e.target.checked,
                                        }))
                                    }
                                />
                                Sertakan Sabtu
                            </label>
                            <label className="flex items-center gap-2 text-gray-700">
                                <input
                                    type="checkbox"
                                    checked={includeWeekends.sunday}
                                    onChange={(e) =>
                                        setIncludeWeekends((prev) => ({
                                            ...prev,
                                            sunday: e.target.checked,
                                        }))
                                    }
                                />
                                Sertakan Minggu
                            </label>
                        </div>
                    </div>
                    <div>
                        <label className="block text-gray-700 mb-2 font-semibold">
                            <ClockCircleOutlined className="mr-2" /> Waktu Sewa (08:00 -
                            22:00) <span className="text-red-500">*</span>
                        </label>
                        <TimePicker.RangePicker
                            className="w-full"
                            format="HH:00"
                            minuteStep={60}
                            hourStep={1}
                            hideDisabledOptions
                            disabledTime={disabledRangeTime}
                            onChange={(times) => setSelectedTimeRange(times)}
                            value={selectedTimeRange}
                            order={false}
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            Pilih jam mulai (mulai 08:00) dan jam selesai (maks 22:00).
                        </p>
                    </div>
                </div>
            </div>

            {/* Room Selection Section */}
            <h2 className="text-2xl font-bold mb-6">Pilih Unit Ruangan</h2>
            <div className="grid grid-cols-1 gap-6 mb-8">
                {Object.keys(groupedRooms).length === 0 && !loading && (
                    <Alert
                        message="Tidak ada kategori ruangan yang tersedia saat ini."
                        type="info"
                        showIcon
                    />
                )}

                {/* PERBAIKAN: Gunakan sortedCategoryKeys.map di sini */}
                {sortedCategoryKeys.map((category) => {
                    const categoryRooms = groupedRooms[category];
                    if (!categoryRooms || categoryRooms.length === 0) return null;
                    const room = categoryRooms[0];
                    let displayPrice = room?.harga_per_jam ?? 0;
                    let priceLabel = "per Jam";
                    if (room.paket_harga && room.paket_harga.length > 0) {
                        const minPackage = room.paket_harga.reduce(
                            (min, p) => (p.harga_paket < min.harga_paket ? p : min),
                            room.paket_harga[0]
                        );
                        displayPrice = minPackage.harga_paket;
                        priceLabel = `/ ${minPackage.durasi_jam} Jam`;
                    } else if (displayPrice <= 0) {
                        priceLabel = "";
                    }

                    const features = room?.fitur_ruangan
                        ? room.fitur_ruangan
                            .split(/[\r\n]+/)
                            .map((f) => f.trim())
                            .filter((f) => f)
                        : [];
                    const availableUnits = categoryRooms.length;

                    return (
                        <div
                            key={category}
                            className={`bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex flex-col md:flex-row items-start md:items-stretch gap-4 relative ${availableUnits === 0 ? "opacity-50 pointer-events-none" : ""
                                }`}
                        >
                            <div className="w-full md:w-1/3 flex-shrink-0">
                                <img
                                    src={`${baseUrl}/static/${room?.gambar_ruangan}`}
                                    alt={category}
                                    className="w-full h-56 object-cover rounded-lg bg-gray-200"
                                    onError={(e) => {
                                        e.target.src =
                                            "https://placehold.co/600x400/EEE/31343C?text=No+Image";
                                    }}
                                />
                            </div>
                            <div className="flex-1 flex flex-col justify-between">
                                <div>
                                    <div className="flex flex-wrap justify-between items-start mb-2 gap-2">
                                        <h3 className="text-xl font-semibold">{category}</h3>
                                        {displayPrice > 0 && priceLabel && (
                                            <div>
                                                <span className="text-sm text-gray-600 mr-1">
                                                    Mulai:
                                                </span>
                                                <Tag
                                                    color="blue"
                                                    className="font-semibold text-sm py-1 px-3"
                                                >
                                                    {formatRupiah(displayPrice)} {priceLabel}
                                                </Tag>
                                            </div>
                                        )}
                                    </div>
                                    <div className="text-gray-600 text-sm flex items-center gap-3 mb-3">
                                        <UserOutlined />
                                        <span>
                                            Kapasitas: {room?.kapasitas || "N/A"} org/unit | Tersedia:{" "}
                                            <strong
                                                className={
                                                    availableUnits > 0 ? "text-green-600" : "text-red-600"
                                                }
                                            >
                                                {availableUnits} unit
                                            </strong>
                                        </span>
                                    </div>
                                    {features.length > 0 && (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-1 gap-x-4 mt-3 text-sm text-gray-700 mb-3">
                                            {features.map((f, i) => (
                                                <div key={i} className="flex items-center gap-2">
                                                    <CheckCircleOutlined
                                                        style={{ color: "#1890ff", fontSize: "20px" }}
                                                    />
                                                    <span className="truncate" title={f}>
                                                        {f}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div className="mt-auto pt-3 flex items-center justify-between border-t border-gray-100">
                                    <label className="block text-gray-700 font-semibold mr-2">
                                        Jumlah Unit <span className="text-red-500">*</span>:
                                    </label>
                                    <InputNumber
                                        min={0}
                                        max={availableUnits}
                                        value={quantities[category] || 0}
                                        onChange={(val) => handleQuantityChange(category, val)}
                                        disabled={availableUnits === 0}
                                        controls={true}
                                        className="w-24"
                                    />
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Check Availability Button */}
            <div className="my-6">
                <Button
                    type="default"
                    icon={<SearchOutlined />}
                    size="large"
                    className="w-full"
                    onClick={handleCheckAvailability}
                    loading={checkingAvailability}
                    disabled={
                        !isAnyCategorySelected ||
                        !selectedDateRange ||
                        !selectedDateRange[0] ||
                        !selectedTimeRange ||
                        !selectedTimeRange[0] ||
                        checkingAvailability ||
                        submitLoading
                    }
                >
                    Cek Ketersediaan Slot
                </Button>
                {availabilityResult && !checkingAvailability && (
                    <Alert
                        message={
                            availabilityResult.error
                                ? "Gagal Memeriksa"
                                : availabilityResult.available
                                    ? "Semua slot yang dipilih tersedia!"
                                    : "Beberapa slot tidak tersedia."
                        }
                        description={
                            availabilityResult.error ? availabilityResult.error : null
                        }
                        type={
                            availabilityResult.error
                                ? "error"
                                : availabilityResult.available
                                    ? "success"
                                    : "warning"
                        }
                        showIcon
                        style={{ marginTop: "10px" }}
                        action={
                            !availabilityResult.error && (
                                <Button
                                    size="small"
                                    type="link"
                                    onClick={() => setShowAvailabilityModal(true)}
                                >
                                    Lihat Detail
                                </Button>
                            )
                        }
                    />
                )}
            </div>

            {/* Proceed to Confirmation Button */}
            <div className="mt-8 mb-10">
                <Button
                    type="primary"
                    size="large"
                    className="w-full"
                    onClick={openOrderModal}
                    disabled={
                        !isAnyCategorySelected ||
                        !selectedDateRange ||
                        !selectedDateRange[0] ||
                        !selectedTimeRange ||
                        !selectedTimeRange[0] ||
                        submitLoading ||
                        checkingAvailability ||
                        !availabilityResult?.available ||
                        !lastCheckParams
                    }
                    loading={submitLoading}
                >
                    Lanjut ke Konfirmasi Pesanan
                </Button>
            </div>

            {/* Payment Confirmation Modal */}
            <Modal
                title="Konfirmasi Pesanan & Pembayaran"
                open={isModalOpen}
                onCancel={() => setIsModalOpen(false)}
                footer={null}
                centered
                width={600}
                bodyStyle={{ padding: 24 }}
                maskClosable={!submitLoading}
            >
                <Spin spinning={submitLoading} tip="Memproses pesanan...">
                    <div className="space-y-4">
                        {/* QRIS Image */}
                        <div>
                            <div className="mt-3 flex flex-col items-center p-3 border rounded-lg bg-gray-50">
                                <img
                                    src={qrisImgSrc}
                                    alt="QRIS Barcode"
                                    style={{ width: 160, height: 160, objectFit: "contain" }}
                                    onError={(e) => {
                                        e.target.src =
                                            "https://placehold.co/160x160/EEE/31343C?text=QR+Error";
                                    }}
                                />
                                <p className="text-xs text-gray-500 mt-2 text-center">
                                    Scan kode QR di atas untuk pembayaran.
                                    <br />
                                    Pesanan akan diproses setelah pembayaran dikonfirmasi.
                                </p>
                            </div>
                        </div>

                        {/* Order Summary */}
                        <div className="border-t pt-3 text-sm text-gray-700">
                            <p className="mb-1">
                                <strong>Tanggal:</strong>{" "}
                                {selectedDateRange?.[0]?.format("DD MMM YYYY")} -{" "}
                                {selectedDateRange?.[1]?.format("DD MMM YYYY")}
                            </p>
                            <p className="mb-2">
                                <strong>Waktu:</strong>{" "}
                                {selectedTimeRange?.[0]?.format("HH:mm")} -{" "}
                                {selectedTimeRange?.[1]?.format("HH:mm")}
                            </p>

                            <p className="mb-2">
                                <strong>Termasuk Hari:</strong>{" "}
                                {includeWeekends.saturday ? "Sabtu " : ""}
                                {includeWeekends.sunday ? "Minggu" : ""}
                                {!includeWeekends.saturday &&
                                    !includeWeekends.sunday &&
                                    "Hanya Senin - Jumat"}
                            </p>

                            <p className="mb-2">
                                <strong>Total Hari Aktif:</strong> {totalDays} hari
                            </p>

                            <p className="mb-2">
                                <strong>Estimasi Harga :</strong>{" "}
                                {totalPrice > 0 ? formatRupiah(totalPrice) : "—"}
                            </p>

                            <p className="mt-2 font-medium">Kategori Dipesan:</p>
                            <ul className="list-disc list-inside ml-4 mt-1 text-sm">
                                {selectedCategoriesForModal.map((k) => (
                                    <li key={k}>
                                        {k} ({quantities[k]} unit)
                                    </li>
                                ))}
                            </ul>
                            <p className="text-xs text-gray-500 mt-2">
                                Catatan: estimasi harga hanya tampilan. Harga final dihitung
                                oleh backend saat konfirmasi pembayaran.
                            </p>
                        </div>

                        {/* Footer Buttons */}
                        <div className="flex justify-end gap-3 pt-4 border-t">
                            <Button
                                onClick={() => setIsModalOpen(false)}
                                disabled={submitLoading}
                            >
                                Batal
                            </Button>
                            <Button
                                type="primary"
                                onClick={handleFinalSubmit}
                                loading={submitLoading}
                            >
                                Saya Sudah Bayar & Kirim Pesanan
                            </Button>
                        </div>
                    </div>
                </Spin>
            </Modal>

            {/* Availability Check Results Modal */}
            <Modal
                title="Hasil Pengecekan Ketersediaan"
                open={showAvailabilityModal}
                onCancel={() => setShowAvailabilityModal(false)}
                footer={[
                    <Button
                        key="close"
                        type="primary"
                        onClick={() => setShowAvailabilityModal(false)}
                    >
                        Tutup
                    </Button>,
                ]}
                width={600}
                centered
            >
                {checkingAvailability && (
                    <div className="text-center p-10">
                        <Spin tip="Memeriksa..." />
                    </div>
                )}

                {!checkingAvailability && availabilityResult && (
                    <div>
                        {availabilityResult.error ? (
                            <Alert
                                message="Gagal Memeriksa Ketersediaan"
                                description={availabilityResult.error || "Terjadi kesalahan."}
                                type="error"
                                showIcon
                                icon={<ExclamationCircleOutlined />}
                            />
                        ) : (
                            <>
                                {availabilityResult.available ? (
                                    <Alert
                                        message="Semua Slot Tersedia"
                                        description="Semua unit yang Anda pilih tersedia."
                                        type="success"
                                        showIcon
                                        icon={<CheckCircleOutlined />}
                                        style={{ marginBottom: "16px" }}
                                    />
                                ) : (
                                    <Alert
                                        message="Beberapa Slot Tidak Tersedia"
                                        description="Silakan ubah tanggal, waktu, atau jumlah unit."
                                        type="error"
                                        showIcon
                                        icon={<ExclamationCircleOutlined />}
                                        style={{ marginBottom: "16px" }}
                                    />
                                )}

                                {/* === Bagian Sesuai Pesanan === */}
                                {availabilityResult.bookings && (
                                    <Card
                                        bordered={false}
                                        style={{
                                            background: "#fafafa",
                                            borderRadius: "8px",
                                            marginTop: "12px",
                                        }}
                                    >
                                        <Typography.Title level={5}>
                                            Sesuai Pesanan:
                                        </Typography.Title>

                                        <List
                                            size="small"
                                            dataSource={availabilityResult.bookings}
                                            renderItem={(item, index) => (
                                                <List.Item
                                                    style={{
                                                        padding: "10px 0",
                                                        borderBottom:
                                                            index === availabilityResult.bookings.length - 1
                                                                ? "none"
                                                                : "1px solid #f0f0f0",
                                                    }}
                                                >
                                                    <div>
                                                        <Typography.Text strong>
                                                            {item.nama_ruangan} : {item.jumlah_unit} unit
                                                        </Typography.Text>
                                                        <br />
                                                        <Typography.Text type="secondary">
                                                            <CalendarOutlined
                                                                style={{ marginRight: "6px" }}
                                                                S />
                                                            {dayjs(item.tanggal_mulai).format(
                                                                "DD MMM YYYY, HH:mm"
                                                            )}{" "}
                                                            - {dayjs(item.tanggal_selesai).format("HH:mm")}
                                                            S                       </Typography.Text>
                                                    </div>
                                                    _           </List.Item>
                                            )}
                                        />
                                    </Card>
                                )}

                                {/* === Jika Ada Slot Tidak Tersedia === */}
                                {!availabilityResult.available &&
                                    availabilityResult.unavailable_slots?.length > 0 && (
                                        <div style={{ marginTop: "16px" }}>
                                            <Typography.Text strong>
                                                Detail Slot Tidak Tersedia:
                                            </Typography.Text>
                                            _   <List
                                                size="small"
                                                S bordered
                                                dataSource={availabilityResult.unavailable_slots}
                                                renderItem={(item) => (
                                                    <List.Item>
                                                        <List.Item.Meta
                                                            title={item.nama_ruangan}
                                                            description={`Pada ${dayjs(item.tanggal).format(
                                                                "DD MMM YYYY"
                                                            )}, Jam ${item.jam_mulai}:00 - ${item.jam_selesai
                                                                }:00`}
                                                            M />
                                                    </List.Item>
                                                )}
                                                style={{ maxHeight: "200px", overflowY: "auto" }}
                                                Datang />
                                        </div>
                                    )}
                            </>
                        )}
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default PrivateOffice;