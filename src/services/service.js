import { jwtStorage } from "../utils/jwtStorage"

const baseUrl = import.meta.env.VITE_BASE_URL

const JSON_HEADERS = { "Content-Type": "application/json" };





export const apiGetAllOpenSessions = async () => {
    try {
        const token = await jwtStorage.retrieveToken();
        if (!token) throw new Error("Token tidak ditemukan");

        const response = await fetch(`${baseUrl}/api/v1/kasir/sesi/all-open`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` },
        });
        return handleResponse(response);
    } catch (error) {
        console.error("Error getting all open sessions:", error);
        throw error;
    }
};


export const apiGetRecentClosedSessions = async () => {
    try {
        const token = await jwtStorage.retrieveToken();
        if (!token) throw new Error("Token tidak ditemukan");

        const response = await fetch(`${baseUrl}/api/v1/kasir/sesi/recent-closed`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` },
        });
        return handleResponse(response);
    } catch (error) {
        console.error("Error getting recent closed sessions:", error);
        throw error;
    }
};


export const apiTakeoverSession = async (id_sesi) => {
    try {
        const token = await jwtStorage.retrieveToken();
        if (!token) throw new Error("Token tidak ditemukan");

        const response = await fetch(`${baseUrl}/api/v1/kasir/sesi/takeover`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ id_sesi }),
        });
        return handleResponse(response);
    } catch (error) {
        console.error("Error taking over session:", error);
        throw error;
    }
};





const handleResponses = async (response) => {
    if (!response.ok) {
        const errorData = await response.json();
        // Lemparkan error agar bisa ditangkap oleh .catch() di AuthProvider
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }
    // Jika ok, kembalikan data JSON
    return response.json();
};


export const apiCheckActiveSession = async () => {
    try {
        const token = await jwtStorage.retrieveToken();
        if (!token) throw new Error("Token tidak ditemukan");

        const response = await fetch(`${baseUrl}/api/v1/kasir/sesi/aktif`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });
        return handleResponse(response);
    } catch (error) {
        console.error("Error checking active session:", error);
        throw error; // Lemparkan error ke AuthProvider
    }
};


export const apiOpenSession = async (sessionData) => {
    try {
        const token = await jwtStorage.retrieveToken();
        if (!token) throw new Error("Token tidak ditemukan");

        const response = await fetch(`${baseUrl}/api/v1/kasir/sesi/buka`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(sessionData), // Kirim data sebagai JSON
        });
        return handleResponse(response);
    } catch (error) {
        console.error("Error opening session:", error);
        throw error; // Lemparkan error ke AuthProvider
    }
};


export const apiCloseSession = async (sessionData) => {
    try {
        const token = await jwtStorage.retrieveToken();
        if (!token) throw new Error("Token tidak ditemukan");

        const response = await fetch(`${baseUrl}/api/v1/kasir/sesi/tutup`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(sessionData), // Kirim data sebagai JSON
        });
        return handleResponse(response);
    } catch (error) {
        console.error("Error closing session:", error);
        throw error; // Lemparkan error ke AuthProvider
    }
};

export const apiGetLastSaldo = async () => {
    try {
        const token = await jwtStorage.retrieveToken();
        if (!token) throw new Error("Token tidak ditemukan");

        const response = await fetch(`${baseUrl}/api/v1/kasir/sesi/saldo-terakhir`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });
        return handleResponse(response);
    } catch (error) {
        console.error("Error getting last saldo:", error);
        throw error; // Lemparkan error ke AuthProvider
    }
};
















export const getSelf = async () => {
  try {
    const token = await jwtStorage.retrieveToken();
    if (!token) throw new Error("Token tidak ditemukan");

    const response = await fetch(`${baseUrl}/api/v1/ruangan/self`, { // Asumsi endpoint-nya ini
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!response.ok) throw new Error("Gagal mengambil data user");
    return await response.json();
  } catch (error) {
    console.error("Error getSelf:", error);
    throw error;
  }
};

// Fungsi BARU untuk mengambil data ruangan untuk halaman Private Office
export const getPrivateOfficeRooms = async () => {
  try {
    const token = await jwtStorage.retrieveToken();
    const response = await fetch(`${baseUrl}/api/v1/ruangan/private-office-rooms`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!response.ok) {
      throw new Error("Gagal mengambil data ruangan");
    }
    return await response.json();
  } catch (error) {
    console.error("Error getPrivateOfficeRooms:", error);
    throw error;
  }
};

// Fungsi BARU untuk mengirim data booking bulk
export const createBulkBooking = async (payload) => {
  try {
    const token = await jwtStorage.retrieveToken();
    const response = await fetch(`${baseUrl}/api/v1/ruangan/bookRuanganBulk`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const responseData = await response.json();

    // Kembalikan objek utuh berisi status dan data
    return {
      status: response.status,
      data: responseData
    };

  } catch (error) {
    console.error("Error createBulkBooking:", error);
    throw error;
  }
};






// Helper untuk menangani response
const handleResponse = async (response) => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({})); // Tangkap jika body bukan json
    throw new Error(
      errorData.error ||
      errorData.message ||
      `HTTP error! status: ${response.status}`
    );
  }
  // Cek jika content-type adalah json
  const contentType = response.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    return response.json();
  }
  // Jika bukan json (misal: file csv)
  return response;
};

// Helper untuk download file
const downloadFile = async (response, defaultFilename) => {
  const contentDisposition = response.headers.get("content-disposition");
  let filename = defaultFilename;
  if (contentDisposition) {
    const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
    if (filenameMatch && filenameMatch[1]) {
      filename = filenameMatch[1];
    }
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

const getAuthHeaders = async () => {
  const token = await jwtStorage.retrieveToken();
  return {
    "Authorization": `Bearer ${token}`,
    "Content-Type": "application/json",
  };
};


export const fetchRekapData = async (params) => {
  const { tahun, bulan, p1_start, p1_end, p2_start, p2_end } = params;
  const query = new URLSearchParams({
    tahun,
    bulan,
    p1_start,
    p1_end,
    p2_start,
    p2_end,
  }).toString();

  try {
    const response = await fetch(`${baseUrl}/api/v1/admin/rekap-bagi-hasil?${query}`, {
      method: "GET",
      headers: await getAuthHeaders(),
    });
    return handleResponse(response);
  } catch (error) {
    console.error("Error fetching rekap data:", error);
    throw error;
  }
};


export const updateRekapData = async (data) => {
  try {
    const response = await fetch(`${baseUrl}/api/v1/admin/rekap-bagi-hasil/update`, {
      method: "PUT",
      headers: await getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  } catch (error) {
    console.error("Error updating rekap data:", error);
    throw error;
  }
};

export const addUtangTenant = async (data) => {
  try {
    const response = await fetch(`${baseUrl}/api/v1/admin/utang-tenant`, {
      method: "POST",
      headers: await getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  } catch (error) {
    console.error("Error adding utang tenant:", error);
    throw error;
  }
};


export const deleteUtangTenant = async (id_utang) => {
  try {
    const response = await fetch(`${baseUrl}/api/v1/admin/utang-tenant/${id_utang}`, {
      method: "DELETE",
      headers: await getAuthHeaders(),
    });
    return handleResponse(response);
  } catch (error) {
    console.error("Error deleting utang tenant:", error);
    throw error;
  }
};

/**
 * Download rekap semua bulan (format CSV)
 */
export const downloadRekapSemuaBulan = async () => {
  try {
    const response = await fetch(`${baseUrl}/api/v1/admin/rekap-bagi-hasil/export/all`, {
      method: "GET",
      headers: await getAuthHeaders(),
    });
    const res = await handleResponse(response);
    await downloadFile(res, "rekap_semua_bulan.csv");
    return { message: "OK", info: "File berhasil di-download" };
  } catch (error) {
    console.error("Error downloading all rekap:", error);
    throw error;
  }
};


export const downloadRekapBulanan = (csvContent, filename) => {
  try {
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Error downloading monthly rekap:", error);
    throw error;
  }
};

export const getRekapBagiHasil = async (startDate, endDate) => {
  try {
    // Ambil bulan dan tahun dari startDate
    const date = new Date(startDate);
    const month = date.getMonth() + 1; // JS month is 0-11
    const year = date.getFullYear();

    const response = await fetch(`${baseUrl}/api/v1/admin/rekapBagiHasil?startDate=${startDate}&endDate=${endDate}&month=${month}&year=${year}`);
    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(errorData?.error || "Gagal mengambil data rekap bagi hasil");
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching rekap bagi hasil:", error);
    throw error;
  }
};

// 2. Service untuk form "Input Utang Tenant Baru" (UPDATE/CREATE)
export const saveTenantHutang = async (id_tenant, periode_bulan, periode_tahun, utang_awal) => {
  try {
    const response = await fetch(`${baseUrl}/api/v1/admin/rekapBagiHasil/utang`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id_tenant,
        periode_bulan,
        periode_tahun,
        utang_awal: Number(utang_awal) || 0,
      }),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(errorData?.error || "Gagal menyimpan utang tenant");
    }
    return await response.json();
  } catch (error) {
    console.error("Error saving tenant hutang:", error);
    throw error;
  }
};

// 3. Service untuk mengubah status bayar T1/T2
export const toggleTenantPayment = async (id_tenant, periode_bulan, periode_tahun, termin) => {
  try {
    const response = await fetch(`${baseUrl}/api/v1/admin/rekapBagiHasil/payment`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id_tenant,
        periode_bulan,
        periode_tahun,
        termin, // kirim 'all_paid' atau 'all_unpaid'
      }),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(errorData?.error || "Gagal mengubah status pembayaran");
    }
    return await response.json();
  } catch (error) {
    console.error("Error toggling tenant payment:", error);
    throw error;
  }
};

// 4. Service untuk mendapatkan daftar tenant (untuk dropdown)
export const getAllTenants = async () => {
  try {
    // Asumsi Anda punya endpoint untuk ini di MasterData
    // Jika tidak, buat endpoint sederhana: SELECT id_tenant, nama_tenant FROM tenants
    const response = await fetch(`${baseUrl}/api/v1/admin/tenants`);
    if (!response.ok) {
      throw new Error("Gagal mengambil daftar tenant");
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching tenants:", error);
    throw error;
  }
};



export const getAdminAcara = async () => {
  try {
    // Diasumsikan perlu token untuk akses admin
    const token = await jwtStorage.retrieveToken();
    const response = await fetch(`${baseUrl}/api/v1/acara/getAcaraAdmin`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const result = await response.json();
    return { status: response.status, data: result };
  } catch (error) {
    throw error;
  }
};

// ✅ Create Acara (menggunakan FormData)
export const createAcara = async (formData) => {
  try {
    const token = await jwtStorage.retrieveToken();
    const response = await fetch(`${baseUrl}/api/v1/acara/createAcara`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData, // FormData sudah benar
    });
    const result = await response.json();
    return { status: response.status, data: result };
  } catch (error) {
    throw error;
  }
};

// ✅ Update Acara (menggunakan FormData)
export const updateAcara = async (id_acara, formData) => {
  try {
    const token = await jwtStorage.retrieveToken();
    const response = await fetch(`${baseUrl}/api/v1/acara/updateAcara/${id_acara}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}` },
      body: formData, // FormData sudah benar
    });
    const result = await response.json();
    return { status: response.status, data: result };
  } catch (error) {
    throw error;
  }
};

export const updateAcaraStatus = async (id_acara, newStatus) => {
  try {
    const token = await jwtStorage.retrieveToken();
    const response = await fetch(`${baseUrl}/api/v1/acara/updateAcaraStatus/${id_acara}/status`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json", // Kirim JSON untuk status
      },
      body: JSON.stringify({ status_acara: newStatus }), // Body berisi status baru
    });
    const result = await response.json();
    return { status: response.status, data: result };
  } catch (error) {
    throw error;
  }
};

// ✅ Delete Acara
export const deleteAcara = async (id_acara) => {
  try {
    const token = await jwtStorage.retrieveToken();
    const response = await fetch(`${baseUrl}/api/v1/acara/deleteAcara/${id_acara}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    const result = await response.json();
    return { status: response.status, data: result };
  } catch (error) {
    throw error;
  }
};




export const getSemuaAcara = async () => {
  try {
    // Diasumsikan tidak perlu token karena ini halaman info publik
    const response = await fetch(`${baseUrl}/api/v1/acara/Getacara`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Gagal mengambil data acara");
    }

    const result = await response.json();
    return result.data; // Langsung kembalikan array 'data'
  } catch (error) {
    throw error;
  }
};

export const saveOrderKasir = async (orderData) => {
  try {
    const token = await jwtStorage.retrieveToken();
    const response = await fetch(`${baseUrl}/api/v1/kasir/save-order`, { // Endpoint baru
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(orderData), // Mengirim data order dalam format JSON
    });

    if (!response.ok) {
      // Coba parse error JSON dari backend
      let errorData;
      try {
        errorData = await response.json();
      } catch (e) {
        // Jika respons bukan JSON, gunakan status text
        throw new Error(response.statusText || `HTTP error! status: ${response.status}`);
      }
      // Gunakan pesan error dari backend jika ada, fallback ke status text
      throw new Error(errorData?.error || errorData?.message || `HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log("Save Order Response:", result); // Log respons sukses
    return result; // Mengembalikan respons sukses dari server (e.g., {"message": "OK", "id_transaksi": ...})

  } catch (error) {
    console.error("Error saving order (service):", error);
    // Lemparkan error agar bisa ditangkap oleh komponen pemanggil
    throw error;
  }
};


export const getSavedOrderDetails = async (id_transaksi) => {
  try {
    const token = await jwtStorage.retrieveToken();
    const response = await fetch(`${baseUrl}/api/v1/kasir/saved-order/${id_transaksi}`, { // Endpoint baru
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        // Tidak perlu 'Content-Type' untuk GET tanpa body
      },
    });

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch (e) {
        throw new Error(response.statusText || `HTTP error! status: ${response.status}`);
      }
      throw new Error(errorData?.error || errorData?.message || `HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log(`Get Saved Order Details (ID: ${id_transaksi}) Response:`, result);
    // Konversi beberapa string angka kembali ke number jika perlu di frontend
    // Ini tergantung bagaimana Anda ingin menggunakannya di state React
    result.subtotal = parseFloat(result.subtotal || 0);
    result.taxPercentage = parseFloat(result.taxPercentage || 0);
    result.taxNominal = parseFloat(result.taxNominal || 0);
    result.totalAmount = parseFloat(result.totalAmount || 0);
    result.discountPercentage = parseFloat(result.discountPercentage || 0);
    if (result.items && Array.isArray(result.items)) {
      result.items = result.items.map(item => ({
        ...item,
        harga_saat_order: parseFloat(item.harga_saat_order || 0),
        jumlah: parseInt(item.jumlah || 0)
      }));
    }

    return result; // Data order: { customerName, items: [...], ... }

  } catch (error) {
    console.error(`Error fetching saved order details for ID ${id_transaksi} (service):`, error);
    throw error;
  }
};

export const paySavedOrder = async (id_transaksi, updatedOrderData) => {
  try {
    const token = await jwtStorage.retrieveToken();
    const response = await fetch(`${baseUrl}/api/v1/kasir/pay-saved-order/${id_transaksi}`, { // Endpoint baru
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updatedOrderData), // Kirim data order yang sudah diupdate
    });

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch (e) {
        throw new Error(response.statusText || `HTTP error! status: ${response.status}`);
      }
      throw new Error(errorData?.error || errorData?.message || `HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log(`Pay Saved Order (ID: ${id_transaksi}) Response:`, result);
    return result; // e.g., {"message": "OK", "info": "Order #... berhasil dibayar."}

  } catch (error) {
    console.error(`Error paying saved order ID ${id_transaksi} (service):`, error);
    throw error;
  }
};

export const updatePaymentStatus = async (trx_id) => {
  try {
    const token = await jwtStorage.retrieveToken();
    const response = await fetch(
      `${baseUrl}/api/v1/kasir/updatePaymentStatus/${trx_id}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error("Gagal memperbarui status pembayaran");
    }

    const result = await response.json();
    return result;
  } catch (error) {
    throw error;
  }
};


export const updateBatalStatus = async (trx_id) => {
  try {
    const token = await jwtStorage.retrieveToken();
    const response = await fetch(
      `${baseUrl}/api/v1/kasir/updateBatalStatus/${trx_id}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error("Gagal memperbarui status pembayaran");
    }

    const result = await response.json();
    return result;
  } catch (error) {
    throw error;
  }
};


export const getUserProfile = async () => {
  try {
    const token = await jwtStorage.retrieveToken(); // Ambil token
    if (!token) {
      // Jika tidak ada token, tidak perlu panggil API, langsung throw error
      throw new Error("Token autentikasi tidak ditemukan.");
    }

    const response = await fetch(`${baseUrl}/api/v1/auth/profile`, { // Panggil endpoint profile
      method: "GET", // Method GET
      headers: {
        // Sertakan token di header Authorization
        Authorization: `Bearer ${token}`,
        // 'Content-Type': 'application/json' // Tidak perlu Content-Type untuk GET tanpa body
      },
    });

    // Cek jika respons tidak OK (misal: 401 Unauthorized jika token salah/kadaluarsa)
    if (!response.ok) {
      const errorResult = await response.json().catch(() => ({})); // Tangkap jika body bukan JSON
      // Berikan pesan error yang lebih spesifik jika memungkinkan
      let errorMessage = `HTTP error! status: ${response.status}`;
      if (response.status === 401) {
        errorMessage = "Sesi tidak valid atau telah berakhir. Silakan login kembali.";
        // Anda mungkin ingin menghapus token lama di sini
        // jwtStorage.removeItem(); 
      } else if (errorResult.error) {
        errorMessage = errorResult.error;
      }
      throw new Error(errorMessage);
    }

    const result = await response.json();
    // Endpoint /profile Anda mengembalikan { user_logged, id_user, email, roles }
    // Kembalikan ini dalam field 'data'
    return { status: response.status, data: result };

  } catch (error) {
    console.error("Error fetching user profile:", error);
    // Lempar error agar bisa ditangkap di komponen
    throw error;
  }
};


// export const createBulkBooking = async (bookingData) => {
//   try {
//     const token = jwtStorage.retrieveToken();
//     // GANTI '/api/v1/booking/createBulk' jika nama endpoint di backend berbeda
//     const response = await fetch(`${baseUrl}/api/v1/ruangan/createBulk`, { // Sesuaikan baseUrl jika perlu
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//         Authorization: `Bearer ${token}`,
//       },
//       body: JSON.stringify(bookingData),
//     });
//     // Cek jika respons tidak OK (misal: 4xx, 5xx)
//     if (!response.ok) {
//       // Coba parse error dari body JSON backend
//       const errorResult = await response.json().catch(() => ({})); // Tangkap jika body bukan JSON
//       throw new Error(errorResult.error || `HTTP error! status: ${response.status}`);
//     }
//     const result = await response.json();
//     return { status: response.status, data: result }; // Kembalikan status & data
//   } catch (error) {
//     console.error("Error during bulk booking creation:", error);
//     // Lempar error agar bisa ditangkap di komponen dan menampilkan pesan yang sesuai
//     throw error;
//   }
// };


export const calculateBagiHasil = async (periode) => {
  try {
    const response = await fetch(`${baseUrl}/api/v1/admin/kalkulasi`, {
      method: "POST",
      // Content-Type *harus* di-set untuk JSON
      headers: {
        "Content-Type": "application/json",
        // 'Authorization': `Bearer ${token}` // Tambahkan jika perlu
      },
      body: JSON.stringify({ periode }),
    });
    const result = await response.json();
    return { status: response.status, data: result };
  } catch (error) {
    throw error;
  }
};



export const getBagiHasilRekap = async (periode) => {
  try {
    const response = await fetch(
      `${baseUrl}/api/v1/admin/rekap?periode=${periode}`,
      {
        method: "GET",
        headers: {
          // 'Authorization': `Bearer ${token}` // Tambahkan jika perlu
        },
      }
    );
    const result = await response.json();
    return { status: response.status, data: result };
  } catch (error) {
    throw error;
  }
};


export const updateRekap = async (id_rekap, payload) => {
  try {
    const response = await fetch(
      `${baseUrl}/api/v1/admin/rekap/${id_rekap}`,
      {
        method: "PUT",
        // Content-Type *harus* di-set untuk JSON
        headers: {
          "Content-Type": "application/json",
          // 'Authorization': `Bearer ${token}` // Tambahkan jika perlu
        },
        body: JSON.stringify(payload),
      }
    );
    const result = await response.json();
    return { status: response.status, data: result };
  } catch (error) {
    throw error;
  }
};


export const getPaymentSummary = async (tanggal) => {
  try {
    const token = await jwtStorage.retrieveToken();
    if (!token) {
      throw new Error("Token autentikasi tidak ditemukan");
    }

    const response = await fetch(
      `${baseUrl}/api/v1/kasir/summary_by_payment?tanggal=${tanggal}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || `HTTP error! status: ${response.status}`);
    }

    return data; // Mengembalikan { message: "OK", data: {...} }
  } catch (error) {
    console.error("Error fetching payment summary:", error);
    throw error;
  }
};

export const getWorkingSpaceDashboardData = async (startDate, endDate) => {
  try {
    const token = jwtStorage.retrieveToken();

    // Endpoint baru yang spesifik untuk working space
    let url = `${baseUrl}/api/v1/admin/ws-dashboard-data`;
    if (startDate && endDate) {
      url += `?startDate=${startDate}&endDate=${endDate}`;
    }

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Gagal mengambil data dasbor Working Space');
    }

    const result = await response.json();
    return result.datas; // Mengembalikan struktur data yang sudah disiapkan dari backend
  } catch (error) {
    console.error("Error fetching working space dashboard data:", error);
    throw error;
  }
};



export const getVORequests = async () => {
  try {
    const token = jwtStorage.retrieveToken();
    const response = await fetch(`${baseUrl}/api/v1/virtualofficeadmin/getRequests`, {
      headers: { "Authorization": `Bearer ${token}` },
    });
    if (!response.ok) throw new Error("Gagal mengambil data permintaan VO");
    return await response.json();
  } catch (error) {
    throw error;
  }
};

export const approveVORequest = async (clientId) => {
  try {
    const token = jwtStorage.retrieveToken();
    const response = await fetch(`${baseUrl}/api/v1/virtualofficeadmin/approveRequests/${clientId}/approve`, {
      method: "POST",
      headers: { "Authorization": `Bearer ${token}` },
    });
    if (!response.ok) throw new Error("Gagal menyetujui permintaan");
    return await response.json();
  } catch (error) {
    throw error;
  }
};

export const rejectVORequest = async (clientId) => {
  try {
    const token = jwtStorage.retrieveToken();
    const response = await fetch(`${baseUrl}/api/v1/virtualofficeadmin/rejectRequests/${clientId}/reject`, {
      method: "POST",
      headers: { "Authorization": `Bearer ${token}` },
    });
    if (!response.ok) throw new Error("Gagal menolak permintaan");
    return await response.json();
  } catch (error) {
    throw error;
  }
};


export const getBagiHasilReport = async (startDate, endDate) => {
  try {
    const response = await fetch(`${baseUrl}/api/v1/admin/laporanBagiHasil?startDate=${startDate}&endDate=${endDate}`);
    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(errorData?.error || "Gagal mengambil data laporan bagi hasil");
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching bagi hasil report:", error);
    throw error;
  }
};


export const getExpenses = async (startDate, endDate) => {
  try {
    const response = await fetch(`${baseUrl}/api/v1/admin/costBulananRead?startDate=${startDate}&endDate=${endDate}`);
    if (!response.ok) {
      throw new Error("Gagal mengambil data pengeluaran");
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error in getExpenses:", error);
    throw error;
  }
};

// POST: Membuat pengeluaran baru
export const createExpense = async (expenseData) => {
  try {
    const response = await fetch(`${baseUrl}/api/v1/admin/costBulananCreate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(expenseData),
    });
    const result = await response.json();
    return { status: response.status, data: result };
  } catch (error) {
    console.error("Error in createExpense:", error);
    throw error;
  }
};

// PUT: Memperbarui pengeluaran
export const updateExpense = async (id, expenseData) => {
  try {
    const response = await fetch(`${baseUrl}/api/v1/admin/costBulananUpdate/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(expenseData),
    });
    const result = await response.json();
    return { status: response.status, data: result };
  } catch (error) {
    console.error("Error in updateExpense:", error);
    throw error;
  }
};

// DELETE: Menghapus pengeluaran
export const deleteExpense = async (id) => {
  try {
    const response = await fetch(`${baseUrl}/api/v1/admin/costBulananDelete/${id}`, {
      method: "DELETE",
    });
    const result = await response.json();
    return { status: response.status, data: result };
  } catch (error) {
    console.error("Error in deleteExpense:", error);
    throw error;
  }
};



export const getAdminDashboardData = async (startDate, endDate) => {
  try {
    const token = jwtStorage.retrieveToken();

    // PERBAIKAN: Tambahkan parameter tanggal ke URL
    let url = `${baseUrl}/api/v1/admin/dashboard-data`;
    if (startDate && endDate) {
      url += `?startDate=${startDate}&endDate=${endDate}`;
    }

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Gagal mengambil data dasbor admin');
    }

    const result = await response.json();
    return result.datas;
  } catch (error) {
    console.error("Error fetching admin dashboard data:", error);
    throw error;
  }
};



export const getTransactionHistory = async (startDate, endDate) => {
  try {
    const token = jwtStorage.retrieveToken();
    // Mengirim tanggal sebagai query parameter
    const response = await fetch(`${baseUrl}/api/v1/admin/transactions?startDate=${startDate}&endDate=${endDate}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Gagal mengambil riwayat transaksi');
    }

    const result = await response.json();
    return result.datas;
  } catch (error) {
    console.error("Error fetching transaction history:", error);
    throw error;
  }
};




export const getVOClientByUserId = async (userId, targetDate) => {
  try {
    const token = jwtStorage.retrieveToken();
    if (!token) {
      throw new Error("Token tidak ditemukan");
    }

    // Buat URL dengan query parameter untuk id_user dan target_date
    const url = new URL(`${baseUrl}/api/v1/ruangan/getVOClientByUserId`);
    url.searchParams.append('id_user', userId);
    url.searchParams.append('target_date', targetDate);

    const response = await fetch(url.toString(), {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      const error = new Error(errorData.message || 'Gagal mengambil data klien Virtual Office');
      error.response = response;
      throw error;
    }

    const result = await response.json();
    return result; // Response ini diharapkan berisi { data: { ... } }

  } catch (error) {
    // Melemparkan error kembali agar bisa ditangani oleh komponen React
    throw error;
  }
};



// ---------- SERVICE LAPORAN ----------



export const getTotalPendapatan = async () => {
  try {
    const response = await fetch(`${baseUrl}/api/v1/owner/totalPendapatan`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });
    if (!response.ok) {
      throw new Error("Gagal mengambil data total pendapatan");
    }
    return await response.json();
  } catch (error) {
    console.error("Error getTotalPendapatan:", error);
    throw error;
  }
};

export const getTopFNB = async () => {
  try {
    const response = await fetch(`${baseUrl}/api/v1/owner/topFNB`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });
    if (!response.ok) {
      throw new Error("Gagal mengambil data Top FNB");
    }
    return await response.json();
  } catch (error) {
    console.error("Error getTopFNB:", error);
    throw error;
  }
};

export const getTopWorking = async () => {
  try {
    const response = await fetch(`${baseUrl}/api/v1/owner/topWorking`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });
    if (!response.ok) {
      throw new Error("Gagal mengambil data Top Working Space");
    }
    return await response.json();
  } catch (error) {
    console.error("Error getTopWorking:", error);
    throw error;
  }
};

export const getDailySelling = async (month, year) => {
  try {
    const response = await fetch(
      `${baseUrl}/api/v1/owner/dailySelling?month=${month}&year=${year}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      }
    );
    if (!response.ok) {
      throw new Error("Gagal mengambil data Daily Selling");
    }
    return await response.json();
  } catch (error) {
    console.error("Error getDailySelling:", error);
    throw error;
  }
};

export const getProfitSummary = async () => {
  try {
    const response = await fetch(`${baseUrl}/api/v1/owner/profitSummary`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });
    if (!response.ok) {
      throw new Error("Gagal mengambil data Profit Summary");
    }
    return await response.json();
  } catch (error) {
    console.error("Error getProfitSummary:", error);
    throw error;
  }
};











// ✅ Read
export const getUsersAdmin = async () => {
  try {
    const response = await fetch(`${baseUrl}/api/v1/useradmin/userReads`);
    const result = await response.json();
    return { status: response.status, data: result };
  } catch (error) {
    throw error;
  }
};

// ✅ Create
export const createUser = async (formData) => {
  try {
    const response = await fetch(`${baseUrl}/api/v1/useradmin/userCreate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });
    const result = await response.json();
    return { status: response.status, data: result };
  } catch (error) {
    throw error;
  }
};

// ✅ Update
export const updateUser = async (id_user, formData) => {
  try {
    const response = await fetch(`${baseUrl}/api/v1/useradmin/userUpdate/${id_user}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });
    const result = await response.json();
    return { status: response.status, data: result };
  } catch (error) {
    throw error;
  }
};

// ✅ Delete
export const deleteUser = async (id_user) => {
  try {
    const response = await fetch(`${baseUrl}/api/v1/useradmin/userDelete/${id_user}`, {
      method: "DELETE",
    });
    const result = await response.json();
    return { status: response.status, data: result };
  } catch (error) {
    throw error;
  }
};





// ✅ Read
export const getTenants = async () => {
  try {
    const response = await fetch(`${baseUrl}/api/v1/tenantadmin/tenantRead`);
    const result = await response.json();
    return { status: response.status, data: result };
  } catch (error) {
    throw error;
  }
};

// ✅ Create
// ✅ Create (Diubah untuk menggunakan FormData)
export const createTenant = async (formData) => {
  try {
    // formData di sini adalah objek FormData, bukan JSON
    const response = await fetch(`${baseUrl}/api/v1/tenantadmin/tenantCreate`, {
      method: "POST",
      // HAPUS headers 'Content-Type'. Browser akan menentukannya secara otomatis
      body: formData,
    });
    const result = await response.json();
    return { status: response.status, data: result };
  } catch (error) {
    throw error;
  }
};

// ✅ Update
// ✅ Update (Diubah untuk menggunakan FormData)
export const updateTenant = async (id_tenant, formData) => {
  try {
    const response = await fetch(`${baseUrl}/api/v1/tenantadmin/tenantUpdate/${id_tenant}`, {
      method: "PUT",
      // HAPUS headers 'Content-Type'
      body: formData,
    });
    const result = await response.json();
    return { status: response.status, data: result };
  } catch (error) {
    throw error;
  }
};

export const updateTenantStatus = async (id_tenant, status_tenant) => {
  try {
    const response = await fetch(`${baseUrl}/api/v1/tenantadmin/tenantUpdateStatus/${id_tenant}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status_tenant }), // Kirim e.g., {"status_tenant": "Inactive"}
    });
    const result = await response.json();
    return { status: response.status, data: result };
  } catch (error) {
    throw error;
  }
};

// ✅ Delete
export const deleteTenant = async (id_tenant) => {
  try {
    const response = await fetch(`${baseUrl}/api/v1/tenantadmin/tenantDelete/${id_tenant}`, {
      method: "DELETE",
    });
    const result = await response.json();
    return { status: response.status, data: result };
  } catch (error) {
    throw error;
  }
};

// Tambahan: Service untuk mengambil data user (untuk dropdown Owner)
export const getUsers = async () => {
  try {
    // Asumsi Anda punya endpoint untuk mengambil semua user
    const response = await fetch(`${baseUrl}/api/v1/tenantadmin/users`);
    const result = await response.json();
    return { status: response.status, data: result };
  } catch (error) {
    throw error;
  }
};


// ✅ READ all event spaces
export const getEventSpacesAdmin = async () => {
  try {
    const response = await fetch(`${baseUrl}/api/v1/eventspacesadmin/read`);
    const result = await response.json();
    return {
      status: response.status,
      data: result,
    };
  } catch (error) {
    throw error;
  }
};

export const createEventSpace = async (formData) => {
  try {
    const response = await fetch(`${baseUrl}/api/v1/eventspacesadmin/create`, {
      method: "POST",
      // Content-Type tidak perlu di-set, browser akan otomatis menambahkannya
      body: formData,
    });
    const result = await response.json();
    return { status: response.status, data: result };
  } catch (error) {
    throw error;
  }
};

// ✅ UPDATE an event space (mengirim FormData)
export const updateEventSpace = async (id_event_space, formData) => {
  try {
    const response = await fetch(
      `${baseUrl}/api/v1/eventspacesadmin/update/${id_event_space}`,
      {
        method: "PUT",
        body: formData,
      }
    );
    const result = await response.json();
    return { status: response.status, data: result };
  } catch (error) {
    throw error;
  }
};

// ✅ DELETE an event space
export const deleteEventSpace = async (id_event_space) => {
  try {
    const response = await fetch(
      `${baseUrl}/api/v1/eventspacesadmin/delete/${id_event_space}`,
      {
        method: "DELETE",
      }
    );
    const result = await response.json();
    return { status: response.status, data: result };
  } catch (error) {
    throw error;
  }
};





export const getAllProductsForStock = async (idTenant) => {
  try {
    if (!idTenant) {
      throw new Error("ID Tenant tidak ditemukan. Pastikan sudah login.");
    }

    const response = await fetch(`${baseUrl}/api/v1/tenant/readProduktenant/${idTenant}`);
    const result = await response.json();

    if (!response.ok) {
      console.error("Error fetching product list:", result);
      throw new Error(result.message || "Gagal memuat data produk");
    }

    return { status: response.status, data: result.datas };
  } catch (error) {
    console.error("Error in getAllProductsForStock:", error);
    throw error;
  }
};

/**
 * 🔹 Update status ketersediaan produk (PUT)
 */
export const updateProductAvailability = async (id_produk, isAvailable) => {
  try {
    const response = await fetch(
      `${baseUrl}/api/v1/tenant/updateProdukStatus/${id_produk}`, // ✅ prefix diperbaiki
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ available: isAvailable }),
      }
    );

    const result = await response.json();
    return { status: response.status, ok: response.ok, message: result.message };
  } catch (error) {
    console.error("Error in updateProductAvailability:", error);
    throw error;
  }
};





export const getOrdersByTenant = async (tenantId) => {
  try {
    const response = await fetch(`${baseUrl}/api/v1/tenant/orders/tenant/${tenantId}`, {
      method: "GET",
    });
    const result = await response.json();
    return { status: response.status, data: result };
  } catch (error) {
    console.error("Error fetching tenant orders:", error);
    throw error;
  }
};


export const updateOrderStatus = async (transaksiId, newStatus, tenantId) => {
  try {
    const token = jwtStorage.retrieveToken();

    // 1. Sesuaikan URL endpoint
    const response = await fetch(`${baseUrl}/api/v1/tenant/orders/transaksi/${transaksiId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      // 2. Kirim status DAN tenant_id di body
      body: JSON.stringify({ status: newStatus, tenant_id: tenantId })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Gagal memperbarui status pesanan');
    }

    return await response.json();
  } catch (error) {
    console.error(`Error updating order status for transaction ${transaksiId}:`, error);
    throw error;
  }
};


export const getKasirDashboardData = async () => {
  try {
    const token = jwtStorage.retrieveToken();
    const response = await fetch(`${baseUrl}/api/v1/kasir/dashboard-data`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      const error = new Error(errorData.message || 'Gagal mengambil data dasbor kasir');
      error.response = response;
      throw error;
    }

    const result = await response.json();
    return result.datas; // Langsung kembalikan bagian 'datas'
  } catch (error) {
    console.error("Error fetching cashier dashboard data:", error);
    throw error;
  }
};


// promo start
// services/service.js (tambahkan kode ini ke file service Anda)

// ================== PROMO MANAGEMENT ==================

// ✅ Get semua promo
export const getPromoAdmin = async () => {
  try {
    const response = await fetch(`${baseUrl}/api/v1/promoadmin/readPromo`); // Sesuaikan dengan route Blueprint Anda
    const result = await response.json();
    return {
      status: response.status,
      data: result,
    };
  } catch (error) {
    throw error;
  }
};

// ✅ Create promo
export const createPromo = async (formData) => {
  try {
    const response = await fetch(`${baseUrl}/api/v1/promoadmin/createPromo`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });
    const result = await response.json();
    return { status: response.status, data: result };
  } catch (error) {
    throw error;
  }
};

// ✅ Update promo
export const updatePromo = async (id_promo, formData) => {
  try {
    const response = await fetch(
      `${baseUrl}/api/v1/promoadmin/updatePromo/${id_promo}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      }
    );
    const result = await response.json();
    return { status: response.status, data: result };
  } catch (error) {
    throw error;
  }
};

// ✅ Delete promo
export const deletePromo = async (id_promo) => {
  try {
    const response = await fetch(
      `${baseUrl}/api/v1/promoadmin/deletePromo/${id_promo}`,
      {
        method: "DELETE",
      }
    );
    const result = await response.json();
    return { status: response.status, data: result };
  } catch (error) {
    throw error;
  }
};

// promo end




// Di dalam file services/service.js
export const getMembershipForCategory = async (userId, categoryId) => {
  try {
    const token = jwtStorage.retrieveToken();
    const response = await fetch(`${baseUrl}/api/v1/ruangan/readMembershipByUserId?id_user=${userId}&id_kategori_ruangan=${categoryId}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    if (!response.ok) {
      // Melemparkan error agar bisa ditangkap oleh .catch() di komponen
      const errorData = await response.json();
      const error = new Error(errorData.message || 'Gagal mengambil data membership');
      error.response = response;
      throw error;
    }
    const result = await response.json();
    return result;
  } catch (error) {
    throw error;
  }
};

export const getProdukKasir = async () => {
  try {
    const response = await fetch(`${baseUrl}/api/v1/kasir/readProdukKasir`);
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || "Gagal mengambil data produk");
    return result.datas;
  } catch (error) {
    console.error("Error getProdukKasir:", error);
    throw error;
  }
};

export const getHistoryKasir = async (startDate, endDate) => {
  try {
    let url = `${baseUrl}/api/v1/kasir/historyKasir`;
    if (startDate && endDate) {
      url += `?start_date=${startDate}&end_date=${endDate}`;
    }

    const response = await fetch(url);
    const result = await response.json();

    return { status: response.status, data: result };
  } catch (error) {
    console.error("Error fetching kasir history:", error);
    throw error;
  }
};

export const getActivePromos = async () => {
  try {
    // Melakukan panggilan ke endpoint backend
    const response = await fetch(`${baseUrl}/api/v1/promo/active`);

    // Jika respons dari server tidak sukses (misal: error 500, 404)
    if (!response.ok) {
      // Lemparkan error agar bisa ditangkap oleh komponen yang memanggil
      throw new Error(`Gagal mengambil data promo: Status ${response.status}`);
    }

    // Ubah respons menjadi format JSON
    const result = await response.json();

    // Kembalikan hanya array 'datas' dari respons
    return result.datas;

  } catch (error) {
    // Tampilkan error di console untuk debugging
    console.error("Error fetching active promos:", error);
    // Lempar kembali error agar komponen (halaman) bisa menanganinya
    throw error;
  }
};


export const getWorkspaces = async () => {
  try {
    const token = await jwtStorage.retrieveToken(); // Jika endpoint ini butuh otentikasi
    const response = await fetch(`${baseUrl}/api/v1/ruangan/workspaces`, {
      headers: {
        // 'Authorization': `Bearer ${token}`, // Aktifkan jika perlu login
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result.datas; // Mengembalikan array of workspaces
  } catch (error) {
    console.error("Error fetching workspaces:", error);
    throw error;
  }
};


// Tambahkan ini di file service.js Anda
export const getRoomsToday = async () => {
  try {
    const token = await jwtStorage.retrieveToken();
    const response = await fetch(`${baseUrl}/api/v1/kasir/rooms-todays`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result.datas; // Mengembalikan array berisi objek-objek ruangan

  } catch (error) {
    console.error("Error fetching rooms for today:", error);
    throw error;
  }
};

// Tambahkan juga ini di file service.js Anda

export const createRoomBookingKasir = async (bookingData) => {
  try {
    const token = await jwtStorage.retrieveToken();
    const response = await fetch(`${baseUrl}/api/v1/kasir/book-room`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(bookingData), // Mengirim data booking dalam format JSON
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result; // Mengembalikan respons sukses dari server (termasuk id_transaksi)

  } catch (error) {
    console.error("Error creating room booking:", error);
    throw error;
  }
};


export const getPosInitData = async () => {
  try {
    const token = await jwtStorage.retrieveToken();
    const response = await fetch(`${baseUrl}/api/v1/kasir/pos-init`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result.datas; // Mengembalikan objek berisi products, categories, dll.

  } catch (error) {
    console.error("Error fetching POS initial data:", error);
    // Melempar error kembali agar komponen bisa menanganinya (misal: menampilkan pesan error)
    throw error;
  }
};


//=========================================================================================
// SERVICE 2: Mengirim data order baru ke server
//=========================================================================================

export const createOrderKasir = async (orderData) => {
  try {
    const token = await jwtStorage.retrieveToken();
    const response = await fetch(`${baseUrl}/api/v1/kasir/order`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(orderData), // Mengirim data order dalam format JSON
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result; // Mengembalikan respons sukses dari server (termasuk id_transaksi baru)

  } catch (error) {
    console.error("Error creating new order:", error);
    throw error;
  }
};



export const getActiveMemberships = async (userId, kategoriRuanganId) => {
  if (!userId || !kategoriRuanganId) {
    throw new Error("User ID and Kategori Ruangan ID are required");
  }

  try {
    const token = await jwtStorage.retrieveToken()
    const response = await fetch(
      `${baseUrl}/api/v1/ruangan/readMembershipByUserId?user_id=${userId}&kategori_ruangan_id=${kategoriRuanganId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
    );
    // Jika response 404 (Not Found), artinya user tidak punya membership, kembalikan array kosong.
    if (response.status === 404) {
      return [];
    }
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result || []; // Pastikan selalu mengembalikan array
  } catch (error) {
    console.error("Error fetching active memberships:", error);
    // Kembalikan array kosong jika terjadi error agar aplikasi tidak crash
    return [];
  }
};


// ✅ Get semua paket virtual office
export const getPaketVOadmin = async () => {
  try {
    // Ganti endpoint sesuai dengan API backend Anda
    const response = await fetch(`${baseUrl}/api/v1/virtualofficeadmin/readPaket`);
    const result = await response.json();
    return { status: response.status, data: result };
  } catch (error) {
    throw error;
  }
};

// ✅ Create paket virtual office
export const createPaketVO = async (formData) => {
  try {
    const response = await fetch(`${baseUrl}/api/v1/virtualofficeadmin/createPaket`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });
    const result = await response.json();
    return { status: response.status, data: result };
  } catch (error) {
    throw error;
  }
};

// ✅ Update paket virtual office
export const updatePaketVO = async (id_paket_vo, formData) => {
  try {
    const response = await fetch(
      `${baseUrl}/api/v1/virtualofficeadmin/updatePaket/${id_paket_vo}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      }
    );
    const result = await response.json();
    return { status: response.status, data: result };
  } catch (error) {
    throw error;
  }
};

// ✅ Delete paket virtual office
export const deletePaketVO = async (id_paket_vo) => {
  try {
    const response = await fetch(
      `${baseUrl}/api/v1/virtualofficeadmin/deletePaket/${id_paket_vo}`,
      {
        method: "DELETE",
      }
    );
    const result = await response.json();
    return { status: response.status, data: result };
  } catch (error) {
    throw error;
  }
};


// 1. READ (GET All) - TIDAK PERLU HEADER JSON
export const getPaketMembership = async () => {
  try {
    const response = await fetch(`${baseUrl}/api/v1/membershipadmin/getAllPaket`);

    // Periksa status respons sebelum membaca JSON
    if (!response.ok) {
      throw new Error(`HTTP Error status: ${response.status}`);
    }

    const result = await response.json();
    return { status: response.status, data: result };
  } catch (error) {
    console.error("Error fetching paket membership:", error);
    throw error;
  }
};


// 2. CREATE (POST) - MEMERLUKAN HEADER JSON
export const createPaketMembership = async (formData) => {
  try {
    const response = await fetch(`${baseUrl}/api/v1/membershipadmin/createPaket`, {
      method: "POST",
      // ✅ KUNCI PERBAIKAN: Menambahkan Header Content-Type
      headers: JSON_HEADERS,
      body: JSON.stringify(formData),
    });

    const result = await response.json();
    return { status: response.status, data: result };
  } catch (error) {
    console.error("Error creating paket membership:", error);
    throw error;
  }
};


// 3. UPDATE (PUT) - MEMERLUKAN HEADER JSON
export const updatePaketMembership = async (id_paket_membership, formData) => {
  try {
    const response = await fetch(`${baseUrl}/api/v1/membershipadmin/updatePaket/${id_paket_membership}`, {
      method: "PUT",
      // ✅ KUNCI PERBAIKAN: Menambahkan Header Content-Type
      headers: JSON_HEADERS,
      body: JSON.stringify(formData),
    });

    const result = await response.json();
    return { status: response.status, data: result };
  } catch (error) {
    console.error(`Error updating paket membership ${id_paket_membership}:`, error);
    throw error;
  }
};


// 4. DELETE (DELETE) - CUKUP KOSONG/TIDAK PERLU HEADER JSON, TAPI JIKA PERLU DIKIRIM SEBAGAI KOSONGAN
export const deletePaketMembership = async (id_paket_membership) => {
  try {
    const response = await fetch(`${baseUrl}/api/v1/membershipadmin/deletePaket/${id_paket_membership}`, {
      method: "DELETE",
      // Tambahkan headers jika Anda berencana mengirim body di DELETE (jarang), 
      // atau jika Anda membutuhkan Authorization Header.
      // Untuk kasus ini, kita biarkan simpel karena hanya menghapus berdasarkan ID di URL.
    });

    const result = await response.json();
    return { status: response.status, data: result };
  } catch (error) {
    console.error(`Error deleting paket membership ${id_paket_membership}:`, error);
    throw error;
  }
};



// harga paket start

export const getPaketHargaByRuangan = async (id_ruangan) => {
  try {
    const response = await fetch(`${baseUrl}/api/v1/ruanganadmin/paketHarga/${id_ruangan}`);
    const result = await response.json();
    return { status: response.status, data: result };
  } catch (error) { throw error; }
};

export const addPaketHarga = async (paketData) => {
  try {
    const response = await fetch(`${baseUrl}/api/v1/ruanganadmin/paketHarga`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(paketData),
    });
    const result = await response.json();
    return { status: response.status, data: result };
  } catch (error) { throw error; }
};

export const updatePaketHarga = async (id_paket, paketData) => {
  try {
    const response = await fetch(`${baseUrl}/api/v1/ruanganadmin/paketHarga/${id_paket}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(paketData),
    });
    const result = await response.json();
    return { status: response.status, data: result };
  } catch (error) {
    throw error;
  }
};

export const deletePaketHarga = async (id_paket) => {
  try {
    const response = await fetch(`${baseUrl}/api/v1/ruanganadmin/paketHarga/${id_paket}`, {
      method: "DELETE",
    });
    const result = await response.json();
    return { status: response.status, data: result };
  } catch (error) { throw error; }
};

// harga paket end

// kategori ruangan start

export const getRuangan = async () => {
  try {
    // Asumsi endpoint baru untuk ruangan
    const response = await fetch(`${baseUrl}/api/v1/ruanganadmin/readRuangan`);
    const result = await response.json();
    return {
      status: response.status,
      data: result,
    };
  } catch (error) {
    throw error;
  }
};


// ✅ CREATE RUANGAN
export const createRuangan = async (formData) => {
  try {
    const response = await fetch(`${baseUrl}/api/v1/ruanganadmin/createRuangan`, {
      method: "POST",
      body: formData, // Menggunakan FormData untuk upload file
    });
    const result = await response.json();
    return {
      status: response.status,
      data: result,
    };
  } catch (error) {
    throw error;
  }
};

// ✅ UPDATE RUANGAN
export const updateRuangan = async (id, formData) => {
  try {
    const response = await fetch(`${baseUrl}/api/v1/ruanganadmin/updateRuangan/${id}`, {
      method: "PUT",
      body: formData,
    });
    const result = await response.json();
    return {
      status: response.status,
      data: result,
    };
  } catch (error) {
    throw error;
  }
};

// ✅ DELETE RUANGAN
export const deleteRuangan = async (id) => {
  try {
    const response = await fetch(`${baseUrl}/api/v1/ruanganadmin/deleteRuangan/${id}`, {
      method: "DELETE",
    });
    const result = await response.json();
    return {
      status: response.status,
      data: result,
    };
  } catch (error) {
    throw error;
  }
};


// ✅ Get semua kategori ruangan
export const getKategoriRuangan = async () => {
  try {
    // Ganti endpoint sesuai dengan API backend Anda
    const response = await fetch(`${baseUrl}/api/v1/ruanganadmin/readKategori`);
    const result = await response.json();
    return {
      status: response.status,
      data: result,
    };
  } catch (error) {
    throw error;
  }
};

export const createKategoriRuangan = async (formData) => {
  try {
    const response = await fetch(`${baseUrl}/api/v1/ruanganadmin/createKategori`, {
      method: "POST",
      // Headers tidak perlu di-set, browser akan menanganinya
      body: formData,
    });
    const result = await response.json();
    return { status: response.status, data: result };
  } catch (error) {
    throw error;
  }
};

// ✅ Update kategori ruangan (mengirim FormData)
export const updateKategoriRuangan = async (id_kategori, formData) => {
  try {
    const response = await fetch(
      `${baseUrl}/api/v1/ruanganadmin/updateKategori/${id_kategori}`,
      {
        method: "PUT",
        body: formData,
      }
    );
    const result = await response.json();
    return { status: response.status, data: result };
  } catch (error) {
    throw error;
  }
};

// ✅ Delete kategori ruangan
export const deleteKategoriRuangan = async (id_kategori) => {
  try {
    const response = await fetch(
      `${baseUrl}/api/v1/ruanganadmin/deleteKategori/${id_kategori}`,
      {
        method: "DELETE",
      }
    );
    const result = await response.json();
    return { status: response.status, data: result };
  } catch (error) {
    throw error;
  }
};

// kategori ruangan end

export const getKategoriTenant = async () => {
  try {
    const response = await fetch(`${baseUrl}/api/v1/produkadmin/readKategoriTenant`);
    const result = await response.json();
    return {
      status: response.status,
      data: result,
    };
  } catch (error) {
    throw error;
  }
};


// ✅ Create kategori
export const createKategori = async (formData) => {
  try {
    const response = await fetch(`${baseUrl}/api/v1/produkadmin/createKategori`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });
    const result = await response.json();
    return { status: response.status, data: result };
  } catch (error) {
    throw error;
  }
};

// ✅ Update kategori
export const updateKategori = async (id_kategori, formData) => {
  try {
    const response = await fetch(
      `${baseUrl}/api/v1/produkadmin/updateKategori/${id_kategori}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      }
    );
    const result = await response.json();
    return { status: response.status, data: result };
  } catch (error) {
    throw error;
  }
};

// ✅ Delete kategori
export const deleteKategori = async (id_kategori) => {
  try {
    const response = await fetch(
      `${baseUrl}/api/v1/produkadmin/deleteKategori/${id_kategori}`,
      {
        method: "DELETE",
      }
    );
    const result = await response.json();
    return { status: response.status, data: result };
  } catch (error) {
    throw error;
  }
};



export const getTenantsForDropdown = async () => {
  try {
    const response = await fetch(`${baseUrl}/api/v1/produkadmin/tenants`); // Panggil endpoint baru
    const result = await response.json();
    return {
      status: response.status,
      data: result,
    };
  } catch (error) {
    throw error;
  }
};

// ✅ READ PRODUK
export const getProduk = async () => {
  try {
    const response = await fetch(`${baseUrl}/api/v1/produkadmin/readProduk`);
    const result = await response.json();
    return {
      status: response.status,
      data: result,
    };
  } catch (error) {
    throw error;
  }
};

// ✅ CREATE PRODUK
export const createProduk = async (formData) => {
  try {
    const response = await fetch(`${baseUrl}/api/v1/produkadmin/createProduk`, {
      method: "POST",
      body: formData, // pakai FormData biar bisa upload file
    });
    const result = await response.json();
    return {
      status: response.status,
      data: result,
    };
  } catch (error) {
    throw error;
  }
};

// ✅ UPDATE PRODUK
export const updateProduk = async (id, formData) => {
  try {
    const response = await fetch(`${baseUrl}/api/v1/produkadmin/updateProduk/${id}`, {
      method: "PUT",
      body: formData, // juga pakai FormData
    });
    const result = await response.json();
    return {
      status: response.status,
      data: result,
    };
  } catch (error) {
    throw error;
  }
};

// ✅ DELETE PRODUK
export const deleteProduk = async (id) => {
  try {
    const response = await fetch(`${baseUrl}/api/v1/produkadmin/deleteProduk/${id}`, {
      method: "DELETE",
    });
    const result = await response.json();
    return {
      status: response.status,
      data: result,
    };
  } catch (error) {
    throw error;
  }
};





// export const getDataPrivate = async () => {
//   try {
//     const token = await jwtStorage.retrieveToken()
//     const response = await fetch(`${baseUrl}/api/v1/protected/data`, {
//       headers: {
//         Authorization: `Bearer ${token}`
//       }
//     })
//     if (!response.ok) throw new Error("failed to get data private")
//     const result = await response.json()
//     return result
//   } catch (error) {
//     throw error
//   }
// }

export const getDataPrivate = async () => {
  try {
    // 1. Ambil token dari storage
    const token = await jwtStorage.retrieveToken();
    if (!token) {
      throw new Error("Token tidak ditemukan");
    }

    // 2. Lakukan fetch DENGAN menyertakan token di header
    const response = await fetch(`${baseUrl}/api/v1/protected/data`, {
      method: 'GET',
      headers: {
        // 3. Ini adalah bagian yang paling penting
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
       // Ini akan melempar error ke 'catch' jika status 422
       const errorData = await response.json();
       throw new Error(errorData.error || "failed to get data private");
    }

    const result = await response.json();
    return result;

  } catch (error) {
    console.error("Error di dalam getDataPrivate:", error);
    // Lempar ulang error agar AuthProvider bisa menangkapnya
    throw error;
  }
};

export const register = async (formData) => {
  try {
    const response = await fetch(`${baseUrl}/api/v1/auth/register`, {
      method: "POST",
      body: formData,
    });

    const result = await response.json();

    return {
      status: response.status, // ambil status HTTP
      data: result,            // isi body JSON
    };
  } catch (error) {
    throw error;
  }
};


export const loginProses = async (values) => {
  try {
    const response = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: "POST",
      body: values
    })
    if (!response.ok) throw new Error("feiled to login")
    const result = await response.json()
    return result
  } catch (error) {
    throw error
  }
}



// KASIR START

export const getDataTransaksiKasir = async () => {
  try {
    const token = await jwtStorage.retrieveToken()
    const response = await fetch(`${baseUrl}/api/v1/kasir/readTransaksiKasirs`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
    if (!response.ok) throw new Error("failed to get data transaksi kasir")
    const result = await response.json()
    return result
  } catch (error) {
    throw error
  }
}


// Fungsi untuk mengambil semua data transaksi
export const getTransaksi = async () => {
  try {
    const token = await jwtStorage.retrieveToken(); // Ambil token untuk otorisasi
    const response = await fetch(`${baseUrl}/api/v1/kasir/transaksi`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error("Gagal mengambil data transaksi");
    }
    const result = await response.json();
    return result.datas; // Langsung kembalikan array 'datas'
  } catch (error) {
    throw error;
  }
};

// Fungsi untuk membuat order baru
export const createOrder = async (orderData) => {
  try {
    const token = await jwtStorage.retrieveToken();
    const response = await fetch(`${baseUrl}/api/v1/kasir/transaksi`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(orderData),
    });

    if (!response.ok) {
      const errorResult = await response.json();
      throw new Error(errorResult.error || "Gagal membuat order baru");
    }
    const result = await response.json();
    return result;
  } catch (error) {
    throw error;
  }
};


export const getMerchantOrders = async () => {
  try {
    const token = await jwtStorage.retrieveToken(); // Ambil token JWT
    const response = await fetch(`${baseUrl}/api/v1/kasir/merchantOrders`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error("Gagal mengambil data merchant orders");
    }

    const result = await response.json();
    return result.datas; // langsung kembalikan array 'datas'
  } catch (error) {
    console.error("Error di getMerchantOrders:", error);
    throw error;
  }
};




// KASIR END






export const getAllRuangan = async () => {
  try {
    const token = jwtStorage.retrieveToken()
    const response = await fetch(`${baseUrl}/api/v1/ruangan/readRuangan`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
    const result = await response.json()
    return result
  } catch (error) {
    throw error
  }
}

export const getPromo = async () => {
  try {
    const token = jwtStorage.retrieveToken()
    const response = await fetch(`${baseUrl}/api/v1/ruangan/readPromos`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
    const result = await response.json()
    return result
  } catch (error) {
    throw error
  }
}

// Di file service.js

export const postTransaksiRuangan = async (
  bookingData // Kirim sebagai satu objek
) => {
  try {
    const token = await jwtStorage.retrieveToken();
    const response = await fetch(`${baseUrl}/api/v1/ruangan/bookRuangan`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(bookingData), // Langsung kirim objek
    });

    return await response.json();
  } catch (error) {
    console.error("Error postTransaksiRuangan:", error);
    throw error;
  }
};

// export const postTransaksiRuangan = async (
//   id_user,
//   id_ruangan,
//   waktu_mulai,
//   waktu_selesai,
//   metode_pembayaran,
//   total_harga_final,
//   nama_guest
// ) => {
//   try {
//     const token = await jwtStorage.retrieveToken();

//     const response = await fetch(`${baseUrl}/api/v1/ruangan/bookRuangan`, {
//       method: "POST",
//       headers: {
//         Authorization: `Bearer ${token}`,
//         "Content-Type": "application/json",
//       },
//       body: JSON.stringify({
//         id_user,
//         id_ruangan,
//         waktu_mulai,
//         waktu_selesai,
//         metode_pembayaran,
//         total_harga_final,
//         nama_guest
//       }),
//     });

//     return await response.json();
//   } catch (error) {
//     console.error("Error postTransaksiRuangan:", error);
//     throw error;
//   }
// };



export const getAllPaketMembership = async () => {
  try {
    const token = jwtStorage.retrieveToken()
    const response = await fetch(`${baseUrl}/api/v1/ruangan/readPaketMembership`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
    const result = await response.json()
    return result
  } catch (error) {
    throw error
  }
}

// export const getAllMemberships = async () => {
//   try {
//     const token = jwtStorage.retrieveToken()
//     const response = await fetch(`${baseUrl}/api/v1/ruangan/readMembership`, {
//       headers: {
//         Authorization: `Bearer ${token}`
//       }
//     })
//     const result = await response.json()
//     return result
//   } catch (error) {
//     throw error
//   }
// }

export const getMembershipById = async (id) => {
  const token = jwtStorage.retrieveToken()
  const response = await fetch(`${baseUrl}/api/v1/memberships/readMembershipsById/${id}`, {
    headers: { Authorization: `Bearer ${token}` }
  })
  return await response.json()
}

// export const getMembershipDetail = async (id) => {
//   try {
//     const token = jwtStorage.retrieveToken();
//     const response = await fetch(`${baseUrl}/api/v1/memberships/readMembershipsById/${id}`, {
//       headers: {
//         Authorization: `Bearer ${token}`,
//       },
//     });
//     const result = await response.json();
//     return result;
//   } catch (error) {
//     throw error;
//   }
// };

// halaman DaftarVO Pelanggan Start

// Ganti service registerVirtualOffice yang lama dengan yang ini

export const registerVirtualOffice = async (formData) => { // sekarang menerima FormData
  try {
    const token = jwtStorage.retrieveToken();
    const response = await fetch(`${baseUrl}/api/v1/virtualOffice/register`, {
      method: "POST",
      headers: {
        // HAPUS 'Content-Type': 'application/json'
        // Browser akan otomatis set ke multipart/form-data dengan boundary yang benar
        Authorization: `Bearer ${token}`,
      },
      body: formData, // Langsung kirim objek FormData
    });
    return await response.json();
  } catch (error) {
    throw error;
  }
};


// halaman DaftarVo Pelanggan End


export const registerMembership = async (payload) => {
  try {
    const token = jwtStorage.retrieveToken();
    const response = await fetch(`${baseUrl}/api/v1/memberships/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
    return await response.json();
  } catch (error) {
    throw error;
  }
};

export const getCekKreditMembership = async (userId) => {
  try {
    const res = await fetch(`${baseUrl}/api/v1/memberships/cekKredit/${userId}`);
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    return await res.json(); // { message: "OK", data: {...} }
  } catch (error) {
    console.error("Error getCekKreditMembership:", error);
    throw error;
  }
};


export const getMembershipDetail = async (userId) => {
  try {
    const token = jwtStorage.retrieveToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${baseUrl}/api/v1/memberships/getMembershipDetail/${userId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error fetching membership detail:', error);
    throw error;
  }
};

export const getMembershipHistory = async (userId) => {
  try {
    const token = jwtStorage.retrieveToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${baseUrl}/api/v1/memberships/getMembershipHistory/${userId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error fetching membership history:', error);
    throw error;
  }
};

export const getAllMemberships = async () => {
  try {
    const token = jwtStorage.retrieveToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${baseUrl}/api/v1/memberships/readMemberships`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error fetching memberships:', error);
    throw error;
  }
};

// export const getMemberData = async (user_id) => {
//   try {
//     const token = await jwtStorage.retrieveToken();
//     const response = await fetch(`${baseUrl}/api/v1/memberships/readMembershipsByUser/${user_id}`, {
//       headers: {
//         Authorization: `Bearer ${token}`,
//       },
//     });
//     const result = await response.json();
//     return result;
//   } catch (error) {
//     console.error("Error fetching member data:", error);
//     throw error;
//   }
// };

export const getMemberData = async () => {
  const token = await jwtStorage.retrieveToken();
  const res = await fetch(`${baseUrl}/api/v1/memberships/readMembershipsByUser`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.json();
}




export const getMembershipPackageDetail = async (userId) => {
  try {
    const token = jwtStorage.retrieveToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${baseUrl}/api/v1/memberships/paket_detail/${userId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error fetching membership detail:', error);
    throw error;
  }
};




// HALAMAN RiwayatTransaksi Pelanggan start

export const getRiwayatTransaksi = async () => {
  try {
    const token = await jwtStorage.retrieveToken(); // ambil token dari storage
    if (!token) {
      throw new Error("No authentication token found");
    }

    const response = await fetch(`${baseUrl}/api/v1/transaksi/riwayat`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result; // hasil { message: "OK", data: [...] }
  } catch (error) {
    console.error("Error fetching riwayat transaksi:", error);
    throw error;
  }
};


// HALAMAN RiwayatTransaksi Pelanggan end


export const getPaketVOById = async (id) => {
  try {
    const response = await fetch(`${baseUrl}/api/v1/virtualOffice/paket-vo/${id}`); // Sesuaikan URL
    if (!response.ok) {
      throw new Error("Gagal mengambil detail paket VO");
    }
    const result = await response.json();
    return result.data; // Langsung kembalikan objek 'data'
  } catch (error) {
    console.error("Error di getPaketVOById:", error);
    throw error;
  }
};


// halaman virtual office start

export const getPaketVO = async () => {
  try {
    const token = jwtStorage.retrieveToken();
    const response = await fetch(`${baseUrl}/api/v1/virtualOffice/paket_vo`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching paket VO:", error);
    throw error;
  }
};

// halaman virtual office end


// ... (service Anda yang lain)

// BARU: Service untuk submit bukti pembayaran VO
export const submitVOPaymentProof = async (transactionId) => { // Hapus parameter formData
  try {
    const token = jwtStorage.retrieveToken();
    const response = await fetch(`${baseUrl}/api/v1/virtualOffice/submit-payment/${transactionId}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        // Content-Type bisa ditambahkan jika backend memerlukannya, 
        // tapi untuk POST tanpa body biasanya tidak wajib.
        // 'Content-Type': 'application/json' 
      },
      // Hapus baris body: formData,
    });

    // Cek jika response TIDAK ok (selain 200 OK)
    if (!response.ok) {
      let errorData;
      try {
        // Coba parse error JSON dari backend
        errorData = await response.json();
      } catch (parseError) {
        // Jika backend tidak kirim JSON atau ada error lain
        throw new Error(`Aktivasi gagal. Status: ${response.status} ${response.statusText}`);
      }
      // Gunakan pesan error dari backend jika ada
      throw new Error(errorData.error || `Aktivasi gagal. Status: ${response.status}`);
    }

    // Jika response OK (200)
    return await response.json(); // Harusnya berisi {"message": "OK", "new_status": "Aktif"}

  } catch (error) {
    console.error("Error activating VO service:", error); // Ubah pesan console
    throw error; // Lempar error agar bisa ditangkap di komponen
  }
};
// cek masa vo start
export const getVirtualOfficeDetail = async (userId) => {
  try {
    const token = jwtStorage.retrieveToken(); // Mengambil token
    if (!token) {
      throw new Error("Token otentikasi tidak ditemukan.");
    }

    // Memanggil endpoint yang benar dengan menyertakan userId
    const response = await fetch(`${baseUrl}/api/v1/virtualOffice/cekMasaVO/${userId}`, {
      method: 'GET', // Method GET adalah default, tapi lebih eksplisit
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    // Cek jika respons tidak OK (misal: 404 Not Found, 500 Server Error)
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    return await response.json();

  } catch (error) {
    console.error("Error fetching Virtual Office detail:", error);
    // Melempar kembali error agar bisa ditangani oleh komponen yang memanggil
    throw error;
  }
};


// export const getVirtualOfficeDetail = async (userId) => {
//   try {
//     const token = jwtStorage.retrieveToken();
//     const response = await fetch(`${baseUrl}/api/v1/virtualOffice/cekMasaVO/${userId}`, {
//       headers: {
//         "Authorization": `Bearer ${token}`,
//         "Content-Type": "application/json",
//       },
//     });
//     if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
//     return await response.json();
//   } catch (error) {
//     console.error("Error fetching VO detail:", error);
//     throw error;
//   }
// };

// cek masa vo end



// event spaces start


export const getEventSpaces = async () => {
  try {
    // Memanggil endpoint baru yang tidak memerlukan token
    const response = await fetch(`${baseUrl}/api/v1/ruangan/event-spaces`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching event spaces:", error);
    throw error; // Lempar kembali error agar bisa ditangani di komponen
  }
};


export const getEventSpaceById = async (id) => {
  try {
    const response = await fetch(`${baseUrl}/api/v1/ruangan/event-spaces/${id}`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Error fetching event space with id ${id}:`, error);
    throw error;
  }
};

export const createBooking = async (bookingData) => {
  try {
    const response = await fetch(`${baseUrl}/api/v1/ruangan/bookingEvent`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(bookingData),
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || "Gagal membuat booking");
    }

    return result;
  } catch (error) {
    console.error("Error create booking:", error);
    throw error;
  }
};





//admin
// Tambahkan ini di file service.js

export const getAllEventBookings = async () => {
  try {
    const response = await fetch(`${baseUrl}/api/v1/eventspacesadmin/bookings`);
    if (!response.ok) {
      throw new Error("Gagal mengambil data booking");
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching event bookings:", error);
    throw error;
  }
};

export const approveEventBooking = async (id) => {
  try {
    const response = await fetch(`${baseUrl}/api/v1/eventspacesadmin/bookings/${id}/approve`, {
      method: "POST",
    });
    if (!response.ok) {
      throw new Error("Gagal menyetujui booking");
    }
    return await response.json();
  } catch (error) {
    console.error("Error approving booking:", error);
    throw error;
  }
};

export const rejectEventBooking = async (id, reason) => {
  try {
    const response = await fetch(`${baseUrl}/api/v1/eventspacesadmin/bookings/${id}/reject`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason }),
    });
    if (!response.ok) {
      throw new Error("Gagal menolak booking");
    }
    return await response.json();
  } catch (error) {
    console.error("Error rejecting booking:", error);
    throw error;
  }
};

// event spaces end

//owner
const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
});

// SERVICE LAPORAN DASHBOARD OWNER
export const getDashboardSummary = async (startDate, endDate) => {
  const url = `${baseUrl}/api/v1/owner/dashboard/summary?start_date=${startDate}&end_date=${endDate}`;
  const resp = await fetch(url, { method: "GET", headers: authHeaders() });
  if (!resp.ok) throw new Error("Gagal mengambil data dashboard summary");
  return await resp.json();
};

//owner fnb
export const getOwnerFnB = async (startDate, endDate) => {
  try {
    const url = `${baseUrl}/api/v1/owner/ownerfnb?start_date=${startDate}&end_date=${endDate}`;
    const resp = await fetch(url, { method: "GET", headers: authHeaders() });
    if (!resp.ok) throw new Error("Gagal mengambil data Owner FnB Dashboard");
    return await resp.json();
  } catch (err) {
    console.error("getOwnerFnB error:", err);
    throw err;
  }
};

export const getFnBDashboard = getOwnerFnB;