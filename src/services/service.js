import { jwtStorage } from "../utils/jwtStorage"

const baseUrl = import.meta.env.VITE_BASE_URL


export const getDataPrivate = async () => {
  try {
    const token = await jwtStorage.retrieveToken()
    const response = await fetch(`${baseUrl}/api/v1/protected/data`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
    if (!response.ok) throw new Error("failed to get data private")
    const result = await response.json()
    return result
  } catch (error) {
    throw error
  }
}

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

export const postTransaksiRuangan = async (
  id_user,
  id_ruangan,
  waktu_mulai,
  waktu_selesai,
  metode_pembayaran,
  total_harga_final,
  nama_guest
) => {
  try {
    const token = await jwtStorage.retrieveToken();

    const response = await fetch(`${baseUrl}/api/v1/ruangan/bookRuangan`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id_user,
        id_ruangan,
        waktu_mulai,
        waktu_selesai,
        metode_pembayaran,
        total_harga_final,
        nama_guest
      }),
    });

    return await response.json();
  } catch (error) {
    console.error("Error postTransaksiRuangan:", error);
    throw error;
  }
};



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

export const registerVirtualOffice = async (payload) => {
  try {
    const token = jwtStorage.retrieveToken();
    const response = await fetch(`${baseUrl}/api/v1/virtualOffice/register`, {
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



// cek masa vo start

export const getVirtualOfficeDetail = async (userId) => {
  try {
    const token = jwtStorage.retrieveToken();
    const response = await fetch(`${baseUrl}/api/v1/virtualOffice/cekMasaVO/${userId}`, {
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error("Error fetching VO detail:", error);
    throw error;
  }
};

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

// event spaces end