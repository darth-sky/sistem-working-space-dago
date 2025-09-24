import React, { useState } from "react";
import { FaArrowRight, FaArrowLeft } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";


const slides = [
  {
    title: "Aula",
    desc: "Aula luas yang cocok untuk seminar, rapat besar, dan acara resmi.",
    img: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1170&q=80",
    features: [
      "Audio visual modern",
      "Kursi dan meja lengkap",
      "AC dan ventilasi baik",
      "Panggung untuk presentasi",
    ],
  },
  {
    title: "Open Space",
    desc: "Ruang terbuka fleksibel untuk workshop kreatif, pameran, atau acara santai.",
    img: "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1170&q=80",
    features: [
      "Desain fleksibel",
      "Ruang luas tanpa sekat",
      "Cocok untuk pameran & workshop",
      "Dekorasi bisa disesuaikan",
    ],
  },
  {
    title: "Seluruh Tempat",
    desc: "Sewa seluruh area event space untuk pengalaman eksklusif dengan privasi penuh.",
    img: "https://images.unsplash.com/photo-1499951360447-b19be8fe80f5?auto=format&fit=crop&w=1170&q=80",
    features: [
      "Privasi penuh",
      "Akses ke semua fasilitas",
      "Cocok untuk acara besar",
      "Catering & layanan lengkap",
    ],
  },
];



const EventSpaces = () => {
  const [index, setIndex] = useState(0);

  const nextSlide = () => setIndex((prev) => (prev + 1) % slides.length);
  const prevSlide = () => setIndex((prev) => (prev - 1 + slides.length) % slides.length);

  return (
    <div className="bg-gradient-to-b from-gray-50 to-white">
      {/* Event Spaces Section */}
      <section className="py-16 px-6 md:px-12">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">

          {/* Left Content */}
          <div className="order-2 md:order-1">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Premium Event Space<span className="text-blue-600">.</span>
            </h2>
            <p className="text-gray-600 mb-6 text-lg leading-relaxed">
              Apa pun acaranya, besar maupun kecil, kami siap menyediakannya. Jadi, baik Anda mengadakan peluncuran produk, acara malam, atau perayaan perusahaan seharian penuh, kami akan hadir untuk membantu acara berjalan lancar.
            </p>


            <button
              type="submit"
              className="flex items-center gap-2 bg-blue-600 text-white px-6 py-4 font-medium hover:bg-blue-700 transition whitespace-nowrap rounded-2xl"
            >
              <span>Pesan Sekarang</span>
              <FaArrowRight className="text-lg" />
            </button>
          </div>

          {/* Right Image */}
          <div className="order-1 md:order-2 flex justify-center md:justify-end relative">
            <img
              src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80"
              alt="Event space"
              className="rounded-2xl shadow-xl w-full max-w-md object-cover h-96"
            />

          </div>
        </div>
      </section>
      <section className="py-16 px-6 md:px-12 bg-white">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Whatever the event, we've got the space<span className="text-blue-600">.</span>
            </h2>
            <p className="text-gray-600 mb-8 text-lg leading-relaxed">
              Apa pun yang Anda butuhkan, dan di mana pun Anda membutuhkannya, kami memiliki ruang yang sempurna untuk memenuhi kebutuhan Anda. Dengan ribuan lokasi di seluruh dunia, serta berbagai ukuran dan konfigurasi yang bisa dipilih.
              .
            </p>

            {/* Features List with Checkboxes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
              <div className="flex items-center">
                <div className="flex items-center justify-center w-6 h-6 rounded border border-gray-300 mr-3">
                  <div className="w-3 h-3 rounded-sm bg-blue-600"></div>
                </div>
                <span className="text-gray-700">Aula</span>
              </div>
              <div className="flex items-center">
                <div className="flex items-center justify-center w-6 h-6 rounded border border-gray-300 mr-3">
                  <div className="w-3 h-3 rounded-sm bg-blue-600"></div>
                </div>
                <span className="text-gray-700">Open Space</span>
              </div>
              <div className="flex items-center">
                <div className="flex items-center justify-center w-6 h-6 rounded border border-gray-300 mr-3">
                  <div className="w-3 h-3 rounded-sm bg-blue-600"></div>
                </div>
                <span className="text-gray-700">Seluruh Tempat</span>
              </div>
            </div>
          </div>
          {/* Right Image */}
          <div className="flex justify-center md:justify-end">
            <div className="relative">
              <img
                src="https://images.unsplash.com/photo-1497366811353-6870744d04b2?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80"
                alt="Modern event space"
                className="rounded-2xl shadow-xl w-full max-w-md object-cover h-96"
              />
            </div>
          </div>
        </div>
      </section>
      <section className="py-16 px-6 md:px-12 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="relative">
            <AnimatePresence mode="wait">
              <motion.div
                key={index}
                initial={{ opacity: 0, x: 100 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -100 }}
                transition={{ duration: 0.5 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center bg-white rounded-2xl shadow-xl overflow-hidden"
              >
                {/* Left Content */}
                <div className="p-8 text-left">
                  <h3 className="text-3xl font-semibold text-gray-800 mb-4">
                    {slides[index].title}
                  </h3>
                  <p className="text-gray-600 mb-6 text-lg leading-relaxed">
                    {slides[index].desc}
                  </p>

                  {/* Features List with Blue Bullet */}
                  <div className="space-y-3">
                    {slides[index].features.map((feature, i) => (
                      <div key={i} className="flex items-center">
                        <div className="flex items-center justify-center w-6 h-6 rounded border border-gray-300 mr-3">
                          <div className="w-3 h-3 rounded-sm bg-blue-600"></div>
                        </div>
                        <span className="text-gray-700">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right Image */}
                <div className="flex justify-end">
                  <img
                    src={slides[index].img}
                    alt={slides[index].title}
                    className="w-full h-80 md:h-96 object-cover rounded-l-none rounded-r-2xl"
                  />
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Navigation Buttons */}
            <button
              onClick={prevSlide}
              className="absolute top-1/2 -left-4 transform -translate-y-1/2 bg-white p-3 rounded-full shadow-md hover:bg-blue-50"
            >
              <FaArrowLeft className="text-gray-700" />
            </button>
            <button
              onClick={nextSlide}
              className="absolute top-1/2 -right-4 transform -translate-y-1/2 bg-white p-3 rounded-full shadow-md hover:bg-blue-50"
            >
              <FaArrowRight className="text-gray-700" />
            </button>

            {/* Slide Indicator */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
              {slides.map((_, i) => (
                <span
                  key={i}
                  className={`w-3 h-3 rounded-full transition-colors ${i === index ? "bg-blue-600" : "bg-gray-300"
                    }`}
                ></span>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default EventSpaces;