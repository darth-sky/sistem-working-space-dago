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
    List, // Added List for modal
} from "antd";
import dayjs from "dayjs";
import isBetween from 'dayjs/plugin/isBetween'; // Import plugin if needed for complex range logic, though not strictly necessary here
import { jwtStorage } from "../../../utils/jwtStorage"; // Adjust path if needed
import { formatRupiah } from "../../../utils/formatRupiah"; // Ensure this path is correct
import {
    CalendarOutlined,
    ClockCircleOutlined,
    UserOutlined,
    CheckCircleOutlined,
    DollarCircleOutlined,
    SearchOutlined, // Added icon for check button
    ExclamationCircleOutlined // Added icon for error/warning messages
} from "@ant-design/icons";

// --- IMPORT NECESSARY SERVICE FUNCTIONS ---
import {
    getUserProfile,
    getPrivateOfficeRooms,
    createBulkBooking,
    checkBulkAvailability // <-- Import the new service function
} from "../../../services/service"; // Adjust path

dayjs.extend(isBetween); // Extend dayjs if using isBetween plugin

const { RangePicker } = DatePicker;
const { Option } = Select;
const baseUrl = import.meta.env.VITE_BASE_URL || "";

const qrisImgSrc = "/static/qris-barcode.png"; // Ensure this path is correct

const PrivateOffice = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true); // Initial page load
    const [submitLoading, setSubmitLoading] = useState(false); // Loading during final submission
    const [rooms, setRooms] = useState([]);
    const [selectedDateRange, setSelectedDateRange] = useState(null);
    const [selectedTimeRange, setSelectedTimeRange] = useState([dayjs().hour(8).minute(0), dayjs().hour(17).minute(0)]); // Default 08:00 - 17:00
    const [quantities, setQuantities] = useState({});
    const [error, setError] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false); // Payment confirmation modal
    const [formData, setFormData] = useState({
        metode: "qris",
    });
    const [selectedCategoriesForModal, setSelectedCategoriesForModal] = useState([]);
    const [loggedInUser, setLoggedInUser] = useState(null);

    // --- NEW STATES FOR AVAILABILITY CHECK ---
    const [checkingAvailability, setCheckingAvailability] = useState(false); // Loading for availability check
    const [availabilityResult, setAvailabilityResult] = useState(null); // Stores result { available: bool, unavailable_slots: [...] }
    const [showAvailabilityModal, setShowAvailabilityModal] = useState(false); // Modal to show availability results
    // Store parameters used for the last successful check
    const [lastCheckParams, setLastCheckParams] = useState(null);
    // --- END NEW STATES ---


    // --- FUNCTION TO LOAD INITIAL DATA ---
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                setError(null);

                // 1. Get user data
                const userData = await getUserProfile();
                if (userData.data) {
                    setLoggedInUser(userData.data);
                } else {
                    throw new Error("Gagal memuat data pengguna.");
                }

                // 2. Get room data
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

    // Reset availability check result if parameters change
    useEffect(() => {
        setAvailabilityResult(null);
        setLastCheckParams(null); // Clear last check params too
    }, [selectedDateRange, selectedTimeRange, quantities]);


    const groupByCategory = (list) => {
        return list.reduce((acc, item) => {
            const kategori = item.nama_kategori || "Lainnya";
            if (!acc[kategori]) acc[kategori] = [];
            acc[kategori].push(item);
            return acc;
        }, {});
    };

    const groupedRooms = groupByCategory(rooms);

    // --- TAMBAHAN: SOLUSI UNTUK MENGURUTKAN KATEGORI ---
    // 1. Tentukan urutan kategori yang Anda inginkan
    const desiredCategoryOrder = [
        "Open Space",
        "Space Monitor",
        "Room Meeting Kecil",
        "Room Meeting Besar"
    ];

    // 2. Ambil semua keys (kategori) dari objek groupedRooms
    const allCategories = Object.keys(groupedRooms);

    // 3. Urutkan keys tersebut berdasarkan array desiredCategoryOrder
    const sortedCategories = allCategories.sort((a, b) => {
        const indexA = desiredCategoryOrder.indexOf(a);
        const indexB = desiredCategoryOrder.indexOf(b);

        // Jika kategori tidak ditemukan di desiredCategoryOrder, taruh di paling akhir
        const sortA = indexA === -1 ? Infinity : indexA;
        const sortB = indexB === -1 ? Infinity : indexB;

        return sortA - sortB;
    });
    // --- AKHIR TAMBAHAN ---


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

    const isAnyCategorySelected = Object.keys(quantities).some((k) => quantities[k] > 0);

    // --- FUNCTION TO HANDLE AVAILABILITY CHECK ---
    const handleCheckAvailability = async () => {
        // Basic input validation
        if (!selectedDateRange || !selectedTimeRange || !selectedDateRange[0] || !selectedDateRange[1] || !selectedTimeRange[0] || !selectedTimeRange[1]) {
            return message.warning("Rentang tanggal atau waktu sewa tidak lengkap atau tidak valid.");
        }
        // Validate time range is within bounds (8 to 22)
        const startHour = selectedTimeRange[0].hour();
        const endHour = selectedTimeRange[1].hour();
        if (startHour < 8 || endHour > 22 || (endHour === 22 && selectedTimeRange[1].minute() > 0) || startHour >= endHour) {
            return message.error("Waktu sewa tidak valid. Pilih antara jam 08:00 pagi hingga 22:00 malam, dan jam selesai harus setelah jam mulai.");
        }

        const selectedCats = Object.keys(quantities).filter((k) => quantities[k] > 0);
        if (selectedCats.length === 0) {
            return message.warning("Pilih minimal satu unit ruangan untuk dicek ketersediaannya.");
        }

        // Collect room IDs to check
        const roomIdsToCheck = [];
        let validationError = false;
        selectedCats.forEach(cat => {
            const availableRoomsInCategory = groupedRooms[cat] || [];
            const numToCheck = quantities[cat];
            if (numToCheck > availableRoomsInCategory.length || numToCheck <= 0) {
                 message.error(`Jumlah unit ${cat} (${numToCheck}) tidak valid.`);
                 validationError = true;
                 return;
            }
            const ids = availableRoomsInCategory.slice(0, numToCheck).map(room => room.id_ruangan);
            roomIdsToCheck.push(...ids);
        });

        if (validationError || roomIdsToCheck.length === 0) return;

        // Prepare payload for the check
        const payload = {
            room_ids: roomIdsToCheck,
            tanggal_mulai: selectedDateRange[0].format("YYYY-MM-DD"),
            tanggal_selesai: selectedDateRange[1].format("YYYY-MM-DD"),
            jam_mulai: startHour, // Use validated hour
            jam_selesai: endHour,    // Use validated hour
        };

        try {
            setCheckingAvailability(true);
            setAvailabilityResult(null); // Reset previous result
            setLastCheckParams(null);    // Reset last check params

            const result = await checkBulkAvailability(payload);

            setAvailabilityResult(result);
            // If check was successful, store the parameters used for validation later
            if (result.available) {
                setLastCheckParams(payload);
            }
            setShowAvailabilityModal(true); // Show result modal
        } catch (error) {
            console.error("Error checking availability:", error);
            message.error(`Gagal memeriksa ketersediaan: ${error.message}`);
            setAvailabilityResult({ available: false, unavailable_slots: [], error: error.message }); // Set error state
            setShowAvailabilityModal(true); // Still show modal, but with error indication
        } finally {
            setCheckingAvailability(false);
        }
    };
    // --- END AVAILABILITY CHECK FUNCTION ---


    // --- MODIFIED: Open Order/Payment Modal ---
    const openOrderModal = () => {
        // 1. Basic Validations (Date, Time, Quantity)
        if (!selectedDateRange || !selectedTimeRange || !selectedDateRange[0] || !selectedDateRange[1] || !selectedTimeRange[0] || !selectedTimeRange[1]) {
            return message.warning("Rentang tanggal atau waktu sewa tidak lengkap atau tidak valid.");
        }
         // Validate time range is within bounds (8 to 22) again before opening modal
        const startHour = selectedTimeRange[0].hour();
        const endHour = selectedTimeRange[1].hour();
        if (startHour < 8 || endHour > 22 || (endHour === 22 && selectedTimeRange[1].minute() > 0) || startHour >= endHour) {
             return message.error("Waktu sewa tidak valid. Pilih antara jam 08:00 pagi hingga 22:00 malam, dan jam selesai harus setelah jam mulai.");
        }

        const selectedCats = Object.keys(quantities).filter((k) => quantities[k] > 0);
        if (selectedCats.length === 0) {
            return message.warning("Pilih minimal satu unit ruangan.");
        }
        let validationPassed = true;
        selectedCats.forEach(cat => {
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
             message.warning("Silakan cek ketersediaan terlebih dahulu dan pastikan semua slot tersedia.");
             return;
        }

        // 3. PARAMETER CONSISTENCY CHECK
        const currentParams = {
            tanggal_mulai: selectedDateRange[0].format("YYYY-MM-DD"),
            tanggal_selesai: selectedDateRange[1].format("YYYY-MM-DD"),
            jam_mulai: startHour, // Use validated startHour
            jam_selesai: endHour,    // Use validated endHour
        };

        if (
            !lastCheckParams ||
            lastCheckParams.tanggal_mulai !== currentParams.tanggal_mulai ||
            lastCheckParams.tanggal_selesai !== currentParams.tanggal_selesai ||
            lastCheckParams.jam_mulai !== currentParams.jam_mulai ||
            lastCheckParams.jam_selesai !== currentParams.jam_selesai
            // Add comparison for room IDs if needed (requires storing checked IDs in lastCheckParams)
        ) {
            message.warning("Parameter tanggal/waktu/ruangan berubah sejak cek terakhir. Silakan cek ulang ketersediaan.");
            setAvailabilityResult(null); // Force re-check
            setLastCheckParams(null);
            return;
        }
        // --- END VALIDATIONS ---

        // If all checks pass, proceed to open the modal
        setSelectedCategoriesForModal(selectedCats);
        setIsModalOpen(true);
    };
    // --- END MODIFIED openOrderModal ---


    const handleFinalSubmit = async () => {
        // --- LOGIC REMAINS LARGELY THE SAME ---
        // Basic validations - Redundant but safe
        if (!selectedDateRange || !selectedTimeRange || !selectedDateRange[0] || !selectedDateRange[1] || !selectedTimeRange[0] || !selectedTimeRange[1]) {
            return message.warning("Rentang tanggal atau waktu tidak valid.");
        }
         // Validate time range again
        const startHour = selectedTimeRange[0].hour();
        const endHour = selectedTimeRange[1].hour();
        if (startHour < 8 || endHour > 22 || (endHour === 22 && selectedTimeRange[1].minute() > 0) || startHour >= endHour) {
            return message.error("Waktu sewa tidak valid (08:00 - 22:00).");
        }

        const selectedCats = Object.keys(quantities).filter((k) => quantities[k] > 0);
        if (selectedCats.length === 0) {
            return message.warning("Pilih minimal satu unit ruangan.");
        }

        // Collect room IDs - SAME AS BEFORE
        const roomIdsToBook = [];
        let validationError = false;
        selectedCats.forEach(cat => {
            const availableRoomsInCategory = groupedRooms[cat] || [];
            const numToBook = quantities[cat];
            if (numToBook > availableRoomsInCategory.length || numToBook <= 0) {
                message.error(`Jumlah unit ${cat} (${numToBook}) tidak valid.`);
                validationError = true;
                return;
            }
            const ids = availableRoomsInCategory.slice(0, numToBook).map(room => room.id_ruangan);
            roomIdsToBook.push(...ids);
        });
        if (validationError || roomIdsToBook.length === 0) return;

        // Prepare payload - Use validated hours
        const payload = {
            id_user: loggedInUser?.id_user,
            room_ids: roomIdsToBook,
            tanggal_mulai: selectedDateRange[0].format("YYYY-MM-DD"),
            tanggal_selesai: selectedDateRange[1].format("YYYY-MM-DD"),
            jam_mulai: startHour, // Use validated startHour
            jam_selesai: endHour,    // Use validated endHour
            metode_pembayaran: "Non-Tunai",
            status_pembayaran: "Lunas" // Changed back to Belum Lunas for QRIS flow
        };

        console.log("Mengirim Payload Booking:", JSON.stringify(payload, null, 2));

        // Submit API call - SAME AS BEFORE
        try {
            setSubmitLoading(true);
            const response = await createBulkBooking(payload);

            if (response.status === 201) {
                message.success(response.data.message || "Pesanan berhasil dibuat! Silakan scan QRIS.");
                setIsModalOpen(false);
                setQuantities({});
                setSelectedDateRange(null);
                setSelectedTimeRange([dayjs().hour(8).minute(0), dayjs().hour(17).minute(0)]); // Reset time too
                setAvailabilityResult(null);
                setLastCheckParams(null);
                navigate("/riwayat-transaksi");
            } else {
                message.error(response.data.error || response.data.message || "Gagal membuat pesanan.");
            }
        } catch (error) {
            console.error("Error creating bulk booking:", error);
            const errMsg = error.response?.data?.error || error.message || "Terjadi kesalahan";
            if (error.response?.status === 409) {
                message.error(`Gagal: ${errMsg}. Slot mungkin terisi saat proses. Cek ulang ketersediaan.`);
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
             // Disable hours before 08:00 for both start and end
             for (let i = 0; i < 8; i++) {
                 hours.push(i);
             }
             // Disable hours after 22:00 for both start and end
             for (let i = 23; i < 24; i++) {
                 hours.push(i);
             }

             // Additional logic based on the *other* selected time
             if (type === 'start' && selectedTimeRange?.[1]) {
                 // Disable start hours >= selected end hour
                 for (let i = selectedTimeRange[1].hour(); i <= 23; i++) {
                     if (!hours.includes(i)) hours.push(i);
                 }
             } else if (type === 'end' && selectedTimeRange?.[0]) {
                 // Disable end hours <= selected start hour
                 for (let i = 0; i <= selectedTimeRange[0].hour(); i++) {
                     if (!hours.includes(i)) hours.push(i);
                 }
                 // Disable hour 22 if start hour is also 22 (cannot end at 22:00 if start is 22:00)
                 if (selectedTimeRange[0].hour() === 22 && !hours.includes(22)) {
                      hours.push(22);
                 }
             }
             // Always disable 22:00 specifically for the end time if start is not 22
             // Because end hour > start hour. If start is 21, end can be 22, but not > 22
             if (type === 'end' && (!selectedTimeRange?.[0] || selectedTimeRange[0].hour() < 22)) {
                 // No need to disable 22 specifically here as the general >22 rule handles it.
                 // Ensure end hour > start hour logic handles the edge cases.
             }


             return hours;
        };

        const disabledMinutes = (selectedHour) => {
            // Disable all minutes, only allow :00
            if (selectedHour !== undefined) { // Check if an hour is selected
                 return Array.from({ length: 59 }, (_, i) => i + 1);
            }
            return [];
        };

         // Disable seconds (optional, but good practice)
        const disabledSeconds = () => {
             return Array.from({ length: 60 }, (_, i) => i);
        };

        return {
            disabledHours,
            disabledMinutes,
            // disabledSeconds // Uncomment if you want to explicitly disable seconds
        };
    };
    // --- END FUNCTION TO DISABLE HOURS ---

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

    return (
        <div className="max-w-6xl mx-auto px-4 py-8">
            <h2 className="text-3xl font-bold mb-4">Pemesanan Ruang Kerja Tim</h2>
            <p className="text-gray-600 mb-8">
                Sewa beberapa unit ruang kerja sekaligus untuk tim Anda ({loggedInUser?.email}). Pilih tanggal, waktu (08:00 - 22:00), dan jumlah unit per kategori.
            </p>

            {/* Date and Time Selection Card */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm mb-10">
                <h2 className="text-2xl font-bold mb-6">Detail Waktu Sewa</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div>
                        <label className="block text-gray-700 mb-2 font-semibold">
                            <CalendarOutlined className="mr-2" /> Tanggal Sewa <span className="text-red-500">*</span>
                        </label>
                        <RangePicker
                            className="w-full"
                            format="DD MMM YYYY"
                            onChange={(dates) => setSelectedDateRange(dates)}
                            disabledDate={disabledDate}
                            value={selectedDateRange}
                        />
                    </div>
                    <div>
                        <label className="block text-gray-700 mb-2 font-semibold">
                            <ClockCircleOutlined className="mr-2" /> Waktu Sewa (08:00 - 22:00) <span className="text-red-500">*</span>
                        </label>
                        {/* --- MODIFIED TimePicker --- */}
                        <TimePicker.RangePicker
                            className="w-full"
                            format="HH:00" // Display format
                            minuteStep={60} // Allow only hour steps conceptually
                            hourStep={1}
                            hideDisabledOptions
                            disabledTime={disabledRangeTime} // Use the new function here
                            onChange={(times) => setSelectedTimeRange(times)}
                            value={selectedTimeRange}
                            // Set default value if needed, e.g., [dayjs().hour(8).minute(0), dayjs().hour(17).minute(0)]
                            order={false} // Prevent auto-swapping start/end
                        />
                        <p className="text-xs text-gray-500 mt-1">Pilih jam mulai (mulai 08:00) dan jam selesai (maks 22:00).</p>
                        {/* --- END MODIFIED TimePicker --- */}
                    </div>
                </div>
            </div>

            {/* Room Selection Section */}
            <h2 className="text-2xl font-bold mb-6">Pilih Unit Ruangan</h2>
            <div className="grid grid-cols-1 gap-6 mb-8">
                {Object.keys(groupedRooms).length === 0 && !loading && (
                    <Alert message="Tidak ada kategori ruangan yang tersedia saat ini." type="info" showIcon />
                )}
                
                {/* --- UBAHAN: Gunakan `sortedCategories` untuk mapping --- */}
                {sortedCategories.map((category) => {
                {/* --- AKHIR UBAHAN --- */}

                    const categoryRooms = groupedRooms[category];
                    if (!categoryRooms || categoryRooms.length === 0) return null;
                    const room = categoryRooms[0];
                    let displayPrice = room?.harga_per_jam ?? 0;
                    let priceLabel = "per Jam";
                    // ... (price calculation logic remains the same) ...
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
                        ? room.fitur_ruangan.split(/[\r\n]+/).map(f => f.trim()).filter(f => f)
                        : [];
                    const availableUnits = categoryRooms.length;

                    return (
                        <div
                            key={category}
                            className={`bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex flex-col md:flex-row items-start md:items-stretch gap-4 relative ${availableUnits === 0 ? 'opacity-50 pointer-events-none' : ''}`}
                        >
                            <div className="w-full md:w-1/3 flex-shrink-0">
                                <img
                                    src={`${baseUrl}/static/${room?.gambar_ruangan}`}
                                    alt={category}
                                    className="w-full h-56 object-cover rounded-lg bg-gray-200"
                                    onError={(e) => { e.target.src = "https://placehold.co/600x400/EEE/31343C?text=No+Image"; }}
                                />
                            </div>
                            <div className="flex-1 flex flex-col justify-between">
                                <div>
                                    <div className="flex flex-wrap justify-between items-start mb-2 gap-2">
                                        <h3 className="text-xl font-semibold">{category}</h3>
                                        {displayPrice > 0 && priceLabel && (
                                            <div>
                                                <span className="text-sm text-gray-600 mr-1">Mulai:</span>
                                                <Tag icon={<DollarCircleOutlined />} color="blue" className="font-semibold text-sm py-1 px-3">
                                                    {formatRupiah(displayPrice)} {priceLabel}
                                                </Tag>
                                            </div>
                                        )}
                                    </div>
                                    <div className="text-gray-600 text-sm flex items-center gap-3 mb-3">
                                        <UserOutlined />
                                        <span>
                                            Kapasitas: {room?.kapasitas || 'N/A'} org/unit | Tersedia:{" "}
                                            <strong className={availableUnits > 0 ? 'text-green-600' : 'text-red-600'}>{availableUnits} unit</strong>
                                        </span>
                                    </div>
                                    {features.length > 0 && (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-1 gap-x-4 mt-3 text-sm text-gray-700 mb-3">
                                            {features.map((f, i) => (
                                                <div key={i} className="flex items-center gap-2">
                                                    <CheckCircleOutlined className="text-blue-600 flex-shrink-0" />
                                                    <span className="truncate" title={f}>{f}</span>
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
                         !selectedDateRange || !selectedDateRange[0] ||
                         !selectedTimeRange || !selectedTimeRange[0] ||
                         checkingAvailability ||
                         submitLoading
                     }
                 >
                     Cek Ketersediaan Slot
                 </Button>
                 {availabilityResult && !checkingAvailability && (
                     <Alert
                         message={availabilityResult.error ? "Gagal Memeriksa" : (availabilityResult.available ? "Semua slot yang dipilih tersedia!" : "Beberapa slot tidak tersedia.")}
                         description={availabilityResult.error ? availabilityResult.error : null}
                         type={availabilityResult.error ? "error" : (availabilityResult.available ? "success" : "warning")}
                         showIcon
                         style={{ marginTop: '10px' }}
                         action={!availabilityResult.error &&
                             <Button size="small" type="link" onClick={() => setShowAvailabilityModal(true)}>
                                 Lihat Detail
                             </Button>
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
                        !selectedDateRange || !selectedDateRange[0] ||
                        !selectedTimeRange || !selectedTimeRange[0] ||
                        submitLoading ||
                        checkingAvailability ||
                        !availabilityResult?.available ||
                        !lastCheckParams // Disable if parameters changed after check
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
                width={500}
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
                                    onError={(e) => { e.target.src = "https://placehold.co/160x160/EEE/31343C?text=QR+Error"; }}
                                />
                                <p className="text-xs text-gray-500 mt-2 text-center">
                                    Scan kode QR di atas untuk pembayaran.<br />
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
                            <p className="mt-2 font-medium">Kategori Dipesan:</p>
                            <ul className="list-disc list-inside ml-4 mt-1 text-sm">
                                {selectedCategoriesForModal.map((k) => (
                                    <li key={k}>{k} ({quantities[k]} unit)</li>
                                ))}
                            </ul>
                        </div>
                        {/* Footer Buttons */}
                        <div className="flex justify-end gap-3 pt-4 border-t">
                            <Button onClick={() => setIsModalOpen(false)} disabled={submitLoading}>
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
                footer={[ <Button key="close" type="primary" onClick={() => setShowAvailabilityModal(false)}>Tutup</Button> ]}
                width={600}
                centered
            >
                {checkingAvailability && <div className="text-center p-10"><Spin tip="Memeriksa..." /></div>}
                {!checkingAvailability && availabilityResult && (
                    <div>
                        {availabilityResult.error ? (
                             <Alert message="Gagal Memeriksa Ketersediaan" description={availabilityResult.error || "Terjadi kesalahan."} type="error" showIcon icon={<ExclamationCircleOutlined />} />
                        ) : availabilityResult.available ? (
                            <Alert message="Sukses" description="Semua slot tersedia." type="success" showIcon icon={<CheckCircleOutlined />} />
                        ) : (
                            <div>
                                <Alert message="Slot Tidak Tersedia Ditemukan" description="Ubah pilihan tanggal/waktu/unit, lalu cek lagi." type="error" showIcon icon={<ExclamationCircleOutlined />} style={{ marginBottom: '16px' }}/>
                                {availabilityResult.unavailable_slots?.length > 0 && (
                                    <>
                                        <p className="font-semibold mb-2">Detail Slot Tidak Tersedia:</p>
                                        <List size="small" bordered dataSource={availabilityResult.unavailable_slots} renderItem={item => (
                                            <List.Item>
                                                <List.Item.Meta title={`${item.nama_ruangan}`} description={`Pada ${dayjs(item.tanggal).format('DD MMM YYYY')}, Jam ${item.jam_mulai}:00 - ${item.jam_selesai}:00`}/>
                                            </List.Item>
                                        )} style={{ maxHeight: '200px', overflowY: 'auto' }} />
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default PrivateOffice;