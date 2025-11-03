// src/utils/printerFinder.js

export const findPrinterDetails = async () => {
  try {
    console.log("Mencari printer dengan nama 'EPP'...");
    
    // 1. Minta izin ke user untuk memilih printer
    // Kita filter berdasarkan nama, karena EPPOS biasanya punya nama 'EPP-XXX'
    const device = await navigator.bluetooth.requestDevice({
      filters: [{ namePrefix: "EPP" }],
      acceptAllDevices: false,
    });

    console.log("Printer ditemukan:", device.name);
    console.log("Menghubungkan ke GATT Server...");
    const server = await device.gatt.connect();

    console.log("Mendapatkan semua Services...");
    const services = await server.getPrimaryServices();

    console.log("Menjelajahi Services dan Characteristics:");
    
    for (const service of services) {
      console.log(`> Service UUID: ${service.uuid}`);
      const characteristics = await service.getCharacteristics();
      
      for (const characteristic of characteristics) {
        console.log(`  >> Characteristic UUID: ${characteristic.uuid}`);
        // Cek properti untuk menemukan yang bisa 'write' (untuk mencetak)
        if (characteristic.properties.write || characteristic.properties.writeWithoutResponse) {
          console.log(`    [!!!] DITEMUKAN: Characteristic ini bisa untuk 'write'`);
        }
      }
    }
    
    alert("Cek Console (F12) untuk melihat daftar UUID. Cari yang bisa 'write'.");

  } catch (error) {
    console.error("Error:", error);
    alert(`Gagal terhubung: ${error.message}`);
  }
};