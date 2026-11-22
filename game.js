/**
 * JEJAK EVAV 3D: CORE GAMEPLAY & HIGH-REPLAYABILITY ENGINE
 * - Splash Screen 10-12 Detik (Autoplay Video Lokal + Upload .MP4 + Fallback Kamera 3D)
 * - Pulau 1: Bank 22 Skenario Larvul Ngabal + Timer + Kombo 2x-3x + Kasus Rahasia Sesepuh
 * - Pulau 2: Simulasi 6 Musim Teluk Sasi Laut 3D + Cuaca Acak + Indeks Pangan vs Ekosistem 3D
 * - Pulau 3: Time Attack 60 Detik Kampung Maren (Pepatah + Urutan Prosesi + Artefak 3D Berotasi)
 * - 4 Lencana Adat & Sertifikat Kelulusan Budaya (Default: "Andi Taufan")
 */

const STORAGE_KEY_3D = 'jejak_evav_3d_state_v1';

let appState = {
  playerName: 'Andi Taufan',
  highScores: {
    larvul: 0,
    sasi: 0,
    maren: 0
  },
  badges: {
    larvul: false,
    sasi: false,
    ain: false,
    tokoh: false
  }
};

function loadAppState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_3D);
    if (raw) {
      const parsed = JSON.parse(raw);
      appState = {
        ...appState,
        ...parsed,
        playerName: parsed.playerName || 'Andi Taufan',
        highScores: { ...appState.highScores, ...(parsed.highScores || {}) },
        badges: { ...appState.badges, ...(parsed.badges || {}) }
      };
    }
  } catch (e) {}
  refreshHUDAndModals();
}

function saveAppState() {
  if (appState.badges.larvul && appState.badges.sasi && appState.badges.ain) {
    appState.badges.tokoh = true;
  }
  try {
    localStorage.setItem(STORAGE_KEY_3D, JSON.stringify(appState));
  } catch (e) {}
  refreshHUDAndModals();
}

function refreshHUDAndModals() {
  const total = appState.highScores.larvul + appState.highScores.sasi + appState.highScores.maren;
  const badgeCount = Object.values(appState.badges).filter(Boolean).length;

  const elTotal = document.getElementById('hud-total-score');
  const elBadges = document.getElementById('hud-badge-count');
  const elRank = document.getElementById('hud-rank-label');

  if (elTotal) elTotal.textContent = total;
  if (elBadges) elBadges.textContent = `${badgeCount}/4`;

  if (elRank) {
    if (badgeCount === 4) elRank.textContent = 'Tokoh Adat Agung Kepulauan Kei 👑';
    else if (badgeCount >= 2) elRank.textContent = 'Penjaga Kearifan Evav 🌿';
    else if (badgeCount === 1) elRank.textContent = 'Pelestari Muda Tanah Kei ⛵';
    else elRank.textContent = 'Penjelajah Kepulauan Kei';
  }

  // High Score HUD
  const hs1 = document.getElementById('hs-larvul');
  const hs2 = document.getElementById('hs-sasi');
  const hs3 = document.getElementById('hs-maren');
  if (hs1) hs1.textContent = appState.highScores.larvul;
  if (hs2) hs2.textContent = appState.highScores.sasi;
  if (hs3) hs3.textContent = appState.highScores.maren;

  // Lencana Modal
  ['larvul', 'sasi', 'ain', 'tokoh'].forEach(k => {
    const card = document.getElementById(`badge-card-${k}`);
    if (card) {
      const st = card.querySelector('.badge-status');
      if (appState.badges[k]) {
        card.classList.add('badge-unlocked');
        if (st) st.textContent = 'TERBUKA ✓';
      } else {
        card.classList.remove('badge-unlocked');
        if (st) st.textContent = 'TERKUNCI';
      }
    }
  });

  // Sertifikat Default "Andi Taufan"
  const certInput = document.getElementById('input-cert-name');
  const certDisp = document.getElementById('cert-name-display');
  if (certInput && document.activeElement !== certInput) {
    certInput.value = appState.playerName || 'Andi Taufan';
  }
  if (certDisp) {
    certDisp.textContent = appState.playerName || 'Andi Taufan';
  }
  const certDate = document.getElementById('cert-date-display');
  if (certDate) {
    certDate.textContent = new Date().toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  }
}

// ========================================================
// 1. SPLASH SCREEN VIDEO OPENING OTOMATIS (MOBILE & DESKTOP)
// ========================================================
let splashClosed = false;
let splashTimeout = null;

function initSplashScreen() {
  const video = document.getElementById('opening-video');

  splashClosed = false;
  if (typeof World3D !== 'undefined') World3D.cameraMode = 'cinematic';

  // Buka jalur audio menggunakan Web Audio API AudioContext
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (AudioCtx) {
    try {
      if (!audio.ctx) audio.ctx = new AudioCtx();
      if (audio.ctx.state === 'suspended') {
        audio.ctx.resume().catch(() => {});
      }
    } catch (e) {}
  }

  if (video) {
    video.loop = false;
    video.currentTime = 0;
    video.muted = true; // Wajib muted saat awal agar autoplay selalu lancar di browser mobile
    video.volume = 1.0;

    const unlockAudio = () => {
      if (!splashClosed && video) {
        if (audio.ctx && audio.ctx.state === 'suspended') {
          audio.ctx.resume().catch(() => {});
        }
        video.muted = false;
        video.volume = 1.0;
        if (video.paused) video.play().catch(() => {});
      }
    };

    ['pointerdown', 'touchstart', 'click', 'keydown'].forEach(evt =>
      window.addEventListener(evt, unlockAudio, { once: true })
    );

    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => {
        video.muted = true;
        video.play().catch(() => {});
      });
    }

    // Transisi otomatis saat video selesai diputar
    video.onended = () => {
      closeSplashScreen();
    };

    // Jika dibuka tanpa jaringan (offline) dan video gagal dimuat, langsung masuk ke Hub 3D
    video.onerror = () => {
      closeSplashScreen();
    };

    if (!navigator.onLine) {
      setTimeout(() => closeSplashScreen(), 1500);
    }
  }

  // Pengaman durasi otomatis ~12 detik jika browser mobile menunda pemutaran video
  if (splashTimeout) clearTimeout(splashTimeout);
  splashTimeout = setTimeout(() => {
    closeSplashScreen();
  }, 12000);
}

function closeSplashScreen() {
  if (splashClosed) return;
  splashClosed = true;
  if (splashTimeout) clearTimeout(splashTimeout);

  const splash = document.getElementById('splash-screen');
  const video = document.getElementById('opening-video');

  if (video) {
    video.pause();
  }

  if (typeof World3D !== 'undefined') {
    World3D.cameraMode = 'explore';
  }

  audio.startOceanAmbient();

  if (splash) {
    splash.classList.add('opacity-0', 'pointer-events-none');
    setTimeout(() => {
      splash.style.display = 'none';
    }, 700);
  }
}

// ========================================================
// 2. NAVIGASI HUB 3D & FAST TRAVEL PULAU MISI
// ========================================================
function triggerFastTravel(islandId) {
  audio.playClick();
  audio.startOceanAmbient();
  closeAllMissionModals();
  if (typeof World3D !== 'undefined') {
    World3D.sailToIsland(islandId, true);
  }
}

function enterNearbyIsland() {
  if (typeof World3D !== 'undefined' && World3D.boatState.nearIsland) {
    openIslandMission(World3D.boatState.nearIsland.id);
  }
}

function openIslandMission(islandId) {
  audio.playGong();
  closeAllMissionModals();
  if (typeof World3D !== 'undefined') {
    World3D.focusCameraOnIsland(islandId);
  }

  if (islandId === 'island1') {
    document.getElementById('modal-island1').classList.remove('hidden');
    initLarvulSession();
  } else if (islandId === 'island2') {
    document.getElementById('modal-island2').classList.remove('hidden');
    initSasi3DGame();
  } else if (islandId === 'island3') {
    document.getElementById('modal-island3').classList.remove('hidden');
    startMarenTimeAttack();
  }
}

function closeAllMissionModals() {
  clearInterval(larvulTimerInterval);
  clearInterval(marenTimerInterval);
  ['modal-island1', 'modal-island2', 'modal-island3', 'modal-badges', 'modal-certificate'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.add('hidden');
  });
}

function returnToHub3D() {
  audio.playClick();
  closeAllMissionModals();
  if (typeof World3D !== 'undefined') {
    World3D.focusCameraOnIsland('explore');
  }
}

function openBadgesModal() {
  audio.playClick();
  refreshHUDAndModals();
  document.getElementById('modal-badges').classList.remove('hidden');
}

function closeBadgesModal() {
  audio.playClick();
  document.getElementById('modal-badges').classList.add('hidden');
}

function openCertificateModal() {
  audio.playClick();
  refreshHUDAndModals();
  document.getElementById('modal-certificate').classList.remove('hidden');
}

function closeCertificateModal() {
  audio.playClick();
  document.getElementById('modal-certificate').classList.add('hidden');
}

function updateCertNameLive(val) {
  appState.playerName = val.trim() || 'Andi Taufan';
  document.getElementById('cert-name-display').textContent = appState.playerName;
  saveAppState();
}

// ========================================================
// 3. PULAU 1: BALAI ADAT LARVUL NGABAL (BANK 22 SKENARIO ACAK)
// ========================================================
const LARVUL_QUESTION_BANK = [
  // NEVIT 7 (Pasal 1-7: Perlindungan Nyawa & Fisik)
  {
    pillar: 'Nevit 7 • Pasal U Mur Adil (Perlindungan Nyawa)',
    title: 'Ancaman Senjata Tajam Saat Sengketa Kebun',
    desc: 'Dua warga berselisih soal batas tanah lalu salah satunya mencabut parang untuk mengancam nyawa lawannya. Sebagai Tuan Tan / Rat di Balai Saniri, apa putusan Anda?',
    options: [
      'Melucuti senjata, mendamaikan lewat sumpah adat, dan menjatuhkan denda Nevit karena mengancam keselamatan jiwa.',
      'Membiarkan keduanya berduel agar masalah cepat selesai.',
      'Mengusir seluruh keluarga besar keduanya dari pulau.',
      'Membakar kebun yang dipersengketakan.'
    ],
    correct: 0,
    exp: 'Nevit 7 menempatkan kesucian nyawa manusia di atas segalanya. Mengancam atau mencelakai jiwa wajib dihentikan dan dipulihkan melalui sidang Saniri.'
  },
  {
    pillar: 'Nevit 7 • Pasal Vun te Vatud (Luka Fisik)',
    title: 'Perkelahian Pemuda di Dermaga Ohoi',
    desc: 'Akibat salah paham saat menambatkan perahu, seorang pemuda memukul rekannya hingga terluka. Bagaimana penyelesaian Larvul Ngabal?',
    options: [
      'Menyuruh keluarga korban membalas memukul pelaku.',
      'Pelaku wajib menanggung biaya pengobatan, menyerahkan denda pemulihan darah, dan berdamai dengan sirih pinang.',
      'Menenggelamkan perahu pelaku di laut.',
      'Mengabaikan karena hanya luka ringan.'
    ],
    correct: 1,
    exp: 'Dalam Nevit 7 (Vun te Vatud), setiap luka fisik harus dipulihkan dengan tanggung jawab pengobatan dan denda perdamaian agar tidak memicu dendam.'
  },
  {
    pillar: 'Nevit 7 • Pasal Rasun / Racun & Bahaya',
    title: 'Membuang Limbah Racun Singkong ke Sumber Air Warga',
    desc: 'Seorang warga membuang air perasan singkong beracun (sianida enbal) sembarangan dekat sumur kampung sehingga membahayakan kesehatan warga.',
    options: [
      'Menegur keras dan menjatuhkan sanksi adat Nevit serta gotong royong membersihkan sumber air karena mengancam keselamatan.',
      'Menutup sumur kampung selamanya.',
      'Melarang pembuatan enbal di seluruh desa.',
      'Membiarkan saja karena air akan mengalir.'
    ],
    correct: 0,
    exp: 'Perbuatan yang membahayakan nyawa orang banyak melalui racun atau pencemaran termasuk pelanggaran berat terhadap prinsip perlindungan jiwa Nevit 7.'
  },
  {
    pillar: 'Nevit 7 • Pasal Fitnah & Provokasi (Lulov)',
    title: 'Menyebarkan Fitnah Adu Domba Antar Kampung',
    desc: 'Seseorang menyebarkan kabar bohong bahwa kampung tetangga hendak menyerang, sehingga warga hampir mengangkat senjata.',
    options: [
      'Langsung menyerang kampung tetangga lebih dulu.',
      'Menggelar musyawarah Rat dua kampung, mengungkap pembuat fitnah, dan menjatuhkan denda perdamaian.',
      'Memutus hubungan kekerabatan antar kampung.',
      'Menyembunyikan pelaku fitnah.'
    ],
    correct: 1,
    exp: 'Lidah yang memicu pertumpahan darah dilarang keras dalam Nevit 7. Musyawarah antar-Rat menjaga perdamaian Tanah Evav.'
  },
  {
    pillar: 'Nevit 7 • Pasal Kelalaian di Laut',
    title: 'Meninggalkan Rekan Nelayan Saat Cuaca Buruk',
    desc: 'Saat angin kencang datang, sebuah perahu pergi meninggalkan nelayan lain yang dayungnya patah di tengah arus.',
    options: [
      'Memberi sanksi teguran adat berat karena mengabaikan keselamatan nyawa sesama saudara di laut.',
      'Memuji karena berhasil menyelamatkan diri sendiri.',
      'Melarang semua orang melaut.',
      'Menyita hasil tangkapan seluruh kampung.'
    ],
    correct: 0,
    exp: 'Persaudaraan bahari Kei mewajibkan saling menolong nyawa di laut sesuai semangat Nevit 7 dan Ain Ni Ain.'
  },
  {
    pillar: 'Nevit 7 • Pasal Perdamaian Sakral',
    title: 'Melanggar Sumpah Damai yang Telah Diikrarkan',
    desc: 'Pihak yang sudah berdamai lewat makan sirih pinang di Balai Adat kembali mengungkit dendam lama dan memicu keributan.',
    options: [
      'Menjatuhkan sanksi adat berlipat karena menodai kesakralan ikrar damai Larvul Ngabal.',
      'Membubarkan dewan adat Saniri.',
      'Membiarkan mereka bertikai kembali.',
      'Menghapus aturan sirih pinang.'
    ],
    correct: 0,
    exp: 'Ikrar sirih pinang di hadapan Tetua Adat bersifat mengikat dan suci untuk menghentikan lingkaran kekerasan.'
  },
  {
    pillar: 'Nevit 7 • Pasal Perlindungan Tamu & Musafir',
    title: 'Mengganggu Nelayan Luar yang Terdampar Badai',
    desc: 'Sebuah perahu dari pulau jauh terdampar di pantai Ohoi karena badai. Beberapa oknum ingin merampas perbekalan mereka.',
    options: [
      'Mencegah perampasan, memberi perlindungan dan makan sesuai adab kemanusiaan Nevit 7.',
      'Menahan perahu mereka sebagai milik desa.',
      'Mengusir mereka kembali ke tengah badai.',
      'Meminta tebusan emas.'
    ],
    correct: 0,
    exp: 'Orang Evav memuliakan keselamatan jiwa setiap manusia, termasuk musafir yang mencari perlindungan dari bahaya laut.'
  },

  // HANAKIT 7 (Pasal 1-7: Martabat Perempuan & Kesusilaan)
  {
    pillar: 'Hanakit 7 • Pasal Far Ro Sut (Ucapan Tidak Sopan)',
    title: 'Merendahkan Martabat Perempuan dengan Siulan & Ejekan',
    desc: 'Sekelompok pemuda melontarkan ejekan yang mempermalukan seorang gadis saat mengambil air di tepi kampung.',
    options: [
      'Menjatuhkan sanksi Hanakit 7 berupa permohonan maaf terbuka dan denda adat kepada keluarga perempuan.',
      'Menganggapnya hal wajar anak muda.',
      'Melarang perempuan keluar rumah.',
      'Menyuruh gadis itu pindah kampung.'
    ],
    correct: 0,
    exp: 'Dalam Hanakit 7, perempuan Kei dimuliakan sebagai penerus jejak Ratu Dit Sakmas. Pelecehan lisan (Far Ro Sut) dikenai sanksi adat tegas.'
  },
  {
    pillar: 'Hanakit 7 • Pasal Kifil Dit (Menjaga Kehormatan)',
    title: 'Menarik Selendang Perempuan Tanpa Izin di Pasar',
    desc: 'Seorang warga dengan sengaja menarik kain/selendang seorang perempuan hingga membuatnya terkejut dan malu di depan umum.',
    options: [
      'Menghukum pelaku dengan denda adat Hanakit karena melanggar kehormatan tubuh dan busana perempuan.',
      'Menertawakan kejadian tersebut.',
      'Menutup pasar kampung.',
      'Tidak perlu dibahas di sidang adat.'
    ],
    correct: 0,
    exp: 'Menyentuh atau mengganggu kehormatan perempuan tanpa izin adalah pelanggaran serius dalam hukum kesusilaan Hanakit 7.'
  },
  {
    pillar: 'Hanakit 7 • Pasal Adab Rumah Tangga',
    title: 'Memasuki Kamar/Rumah Warga Tanpa Permisi',
    desc: 'Seseorang nyelonong masuk ke bagian dalam rumah warga tanpa mengetuk atau meminta izin saat tuan rumah sedang tidak ada.',
    options: [
      'Menjatuhkan sanksi pelanggaran adab kesopanan rumah tangga dalam Hanakit 7.',
      'Membiarkan karena tidak ada barang hilang.',
      'Merobohkan rumah tersebut.',
      'Memutus hubungan tetangga.'
    ],
    correct: 0,
    exp: 'Hanakit 7 menjaga kesucian ruang keluarga agar setiap rumah tangga di Ohoi merasa aman dan dihormati.'
  },
  {
    pillar: 'Hanakit 7 • Pasal Marvuan (Peran Perempuan Penengah)',
    title: 'Perempuan Adat Mengangkat Kain Pemisah Pertikaian',
    desc: 'Ketika dua kelompok warga hendak bentrok, seorang ibu tetua adat maju mengangkat kain tenun untuk melerai. Apa kewajiban warga?',
    options: [
      'Wajib seketika menghentikan pertikaian dan menurunkan senjata demi menghormati tuah perempuan Kei.',
      'Tetap melanjutkan perkelahian.',
      'Menyuruh ibu tersebut pergi.',
      'Mengabaikan tanda kain tenun.'
    ],
    correct: 0,
    exp: 'Sejak zaman Dit Sakmas, kehadiran perempuan yang melerai pertikaian wajib dihormati mutlak oleh seluruh lelaki Evav.'
  },
  {
    pillar: 'Hanakit 7 • Pasal Janji Pernikahan & Marga',
    title: 'Ingkar Janji Adat Antar Dua Keluarga Marga',
    desc: 'Terjadi kesalahpahaman dalam prosesi pinangan adat yang hampir mempermalukan martabat keluarga perempuan.',
    options: [
      'Menyelesaikan secara terhormat lewat utusan tetua marga dengan denda pemulihan kehormatan (lela/emas adat).',
      'Membatalkan lewat pertengkaran terbuka.',
      'Menyebarkan aib keluarga ke desa lain.',
      'Mengusir utusan keluarga.'
    ],
    correct: 0,
    exp: 'Hanakit 7 mengatur agar urusan pernikahan dan kehormatan marga diselesaikan secara bermartabat dan penuh rasa hormat.'
  },
  {
    pillar: 'Hanakit 7 • Pasal Tuduhan Tanpa Bukti',
    title: 'Menuduh Perempuan Kampung Tanpa Saksi',
    desc: 'Seseorang menyebarkan gosip buruk yang mencemarkan nama baik seorang ibu di kampung tanpa bukti yang sah.',
    options: [
      'Penuduh wajib membersihkan nama baik korban di Balai Adat dan membayar denda pemulihan martabat.',
      'Langsung menghukum ibu yang dituduh.',
      'Mengusir kedua belah pihak.',
      'Membiarkan gosip beredar.'
    ],
    correct: 0,
    exp: 'Nama baik dan kesucian martabat perempuan dilindungi ketat oleh pasal-pasal Hanakit 7.'
  },
  {
    pillar: 'Hanakit 7 • Pasal Sopan Santun Saudara (Uran-Koan)',
    title: 'Menjaga Tutur Kata di Hadapan Saudari Perempuan',
    desc: 'Dalam pertemuan keluarga besar, seorang pemuda berbicara kasar di hadapan saudari-saudarinya (Uran).',
    options: [
      'Tetua memberi nasihat dan teguran adat karena saudara laki-laki wajib menjadi pelindung kehormatan saudarinya.',
      'Mendukung ucapan kasar tersebut.',
      'Melarang pertemuan keluarga.',
      'Mengabaikan etika tutur kata.'
    ],
    correct: 0,
    exp: 'Hubungan saudara laki-laki dan perempuan di Kei diikat oleh rasa hormat dan perlindungan timbal balik.'
  },

  // U-NIUT 7 (Pasal 1-7: Hak Milik, Harta Benda, & Ulayat Pesisir)
  {
    pillar: 'U-niut 7 • Pasal Petuanan Laut (Met)',
    title: 'Menangkap Ikan di Wilayah Laut Ohoi Lain Tanpa Izin',
    desc: 'Perahu dari luar desa memanen teripang di zona petuanan laut (met) Ohoi Anda yang sedang dijaga adat.',
    options: [
      'Menegakkan hukum U-niut 7: memanggil mereka ke sidang Saniri, menjelaskan batas petuanan, dan menetapkan ganti rugi adat.',
      'Membakar perahu mereka di tengah laut.',
      'Membiarkan sumber daya desa habis diambil.',
      'Menutup seluruh pelabuhan selamanya.'
    ],
    correct: 0,
    exp: 'Prinsip U-niut 7: "Hira ni fo i ni, it did fo it did" (milik orang adalah miliknya, milik kita adalah milik kita).'
  },
  {
    pillar: 'U-niut 7 • Pasal Kesakralan Hawear',
    title: 'Memetik Kelapa pada Pohon yang Dipasangi Janur Hawear',
    desc: 'Seseorang nekat memetik kelapa di kebun yang sudah dipasangi tanda larangan adat Hawear Balwirin.',
    options: [
      'Mengembalikan hasil curian dan membayar denda adat karena melanggar tanda sakral Hawear serta pasal U-niut 7.',
      'Menebang seluruh pohon kelapa di kebun.',
      'Membiarkan karena hanya beberapa butir.',
      'Menghapus tradisi Hawear.'
    ],
    correct: 0,
    exp: 'Hawear Balwirin adalah simbol perlindungan hak milik dan konservasi yang wajib dipatuhi setiap warga Evav.'
  },
  {
    pillar: 'U-niut 7 • Pasal Barang Temuan di Pesisir',
    title: 'Menemukan Jaring & Dayung Hanyut Milik Nelayan Tetangga',
    desc: 'Seorang warga menemukan jaring ikan bagus yang hanyut di pantai dan tahu siapa pemilik aslinya, namun ingin menyimpannya sendiri.',
    options: [
      'Wajib mengembalikan jaring tersebut kepada pemiliknya sesuai kejujuran hukum U-niut 7.',
      'Menjualnya ke pasar kota.',
      'Menyembunyikannya di rumah.',
      'Merusak jaring tersebut.'
    ],
    correct: 0,
    exp: 'U-niut 7 melarang menguasai hak milik orang lain, termasuk barang temuan yang diketahui pemiliknya.'
  },
  {
    pillar: 'U-niut 7 • Pasal Batas Tanah Kebun (Rahan-Nuhu)',
    title: 'Menggeser Patok Batu Batas Kebun Secara Diam-Diam',
    desc: 'Seorang petani menggeser batu penanda batas lahan ke wilayah kebun tetangganya saat musim tanam.',
    options: [
      'Tetua Tanah (Tuan Tan) memeriksa batas leluhur, mengembalikan patok ke posisi asli, dan memberi sanksi U-niut.',
      'Menyita kedua kebun untuk raja.',
      'Membiarkan siapa yang lebih kuat menguasai lahan.',
      'Melarang pertanian di desa.'
    ],
    correct: 0,
    exp: 'Tuan Tan menjaga keadilan batas tanah ulayat agar tidak terjadi perampasan hak milik antarwarga.'
  },
  {
    pillar: 'U-niut 7 • Pasal Merusak Tanaman Produktif',
    title: 'Ternak Warga Merusak Kebun Singkong Enbal Tetangga',
    desc: 'Karena tidak diikat, hewan ternak seorang warga masuk dan merusak tanaman singkong bahan pangan enbal milik tetangganya.',
    options: [
      'Pemilik ternak wajib meminta maaf, membantu menanam kembali, dan mengganti kerugian pangan sesuai U-niut 7.',
      'Tetangga boleh membunuh seluruh ternak tersebut.',
      'Tidak ada kewajiban ganti rugi.',
      'Bertengkar di jalan kampung.'
    ],
    correct: 0,
    exp: 'Keadilan U-niut 7 menuntut tanggung jawab atas kerugian harta atau pangan yang dialami sesama warga.'
  },

  // KASUS RAHASIA SESEPUH (BONUS TINGGI)
  {
    isSecret: true,
    pillar: '👑 Kasus Rahasia Sesepuh • Sejarah Ratu Dit Sakmas',
    title: 'Asal-Usul Pengorbanan & Sumpah Darah Larvul Ngabal',
    desc: 'Sesepuh bertanya: Mengapa hukum pidana jiwa disebut "Larvul" (Darah Merah) dan dipadukan dengan "Ngabal" (Tombak dari Bali)?',
    options: [
      'Karena lahir dari peristiwa sejarah penghentian kekacauan lewat maklumat suci Dit Sakmas (Larvul di Kei Kecil) dan Kasdew (Ngabal di Kei Besar) yang menyatukan seluruh Kepulauan Kei.',
      'Karena merupakan perjanjian dagang senjata dengan kerajaan luar.',
      'Karena hanya berlaku bagi kaum bangsawan saja.',
      'Karena dibuat pada masa kolonial modern.'
    ],
    correct: 0,
    exp: 'Pengetahuan Sesepuh! Larvul (Kei Kecil/Nuhu Roa) dan Ngabal (Kei Besar/Nuhu Yuut) dipersatukan menjadi satu hukum adat tertinggi masyarakat Evav.'
  },
  {
    isSecret: true,
    pillar: '👑 Kasus Rahasia Sesepuh • Hirarki Denda Adat',
    title: 'Makna Simbolik "Lela" (Meriam Kecil) & "Tahil Emas" dalam Denda Adat',
    desc: 'Dalam sidang berat Larvul Ngabal, pelanggar diminta menyerahkan Lela atau Emas Adat disertai Sirih Pinang. Apa filosofi utamanya?',
    options: [
      'Bukan untuk memperkaya hakim, melainkan simbol penebusan salah, pemulihan keseimbangan kosmis/sosial, dan pengikat persaudaraan kembali.',
      'Sebagai pajak wajib untuk membeli kapal perang.',
      'Untuk menghukum keluarga pelaku hingga miskin.',
      'Sekadar transaksi jual beli hukum.'
    ],
    correct: 0,
    exp: 'Putusan Sesepuh Tepat! Denda adat Kei bersifat restoratif (memulihkan harmoni dan martabat), bukan balas dendam.'
  },
  {
    isSecret: true,
    pillar: '👑 Kasus Rahasia Sesepuh • Falsafah Ain Ni Ain',
    title: 'Makna "Vuut Ain Mehe Nifun, Manut Ain Mehe Tilur"',
    desc: 'Ketika terjadi ketegangan besar di kepulauan, Sesepuh menyerukan pepatah "Vuut ain mehe nifun, manut ain mehe tilur". Apa artinya?',
    options: [
      'Ikan berasal dari satu sarang/telur, burung berasal dari satu sarang/telur — seluruh orang Kei adalah satu kandung persaudaraan yang tak terpisahkan.',
      'Nelayan hanya boleh menangkap satu jenis ikan dan burung.',
      'Setiap pulau harus hidup sendiri-sendiri.',
      'Aturan pembagian hasil buruan di hutan.'
    ],
    correct: 0,
    exp: 'Kebijaksanaan Tertinggi! Pepatah ini adalah jantung persatuan masyarakat Kei lintas pulau dan lintas agama.'
  }
];

let larvulSession = {
  difficulty: 'penjaga', // 'pemula', 'penjaga', 'sesepuh'
  questions: [],
  currentIndex: 0,
  score: 0,
  streak: 0,
  timeLeft: 22,
  maxTime: 22,
  answered: false,
  secretUnlocked: false,
  secretPlayed: false
};
let larvulTimerInterval = null;

function changeLarvulDifficulty(diff) {
  audio.playClick();
  larvulSession.difficulty = diff;
  initLarvulSession();
}

function initLarvulSession() {
  clearInterval(larvulTimerInterval);
  const diff = document.getElementById('larvul-diff-select')?.value || 'penjaga';
  larvulSession.difficulty = diff;

  const config = {
    pemula: { count: 5, time: 30 },
    penjaga: { count: 6, time: 22 },
    sesepuh: { count: 7, time: 16 }
  }[diff] || { count: 6, time: 22 };

  // Acak soal reguler setiap sesi baru
  const regularPool = LARVUL_QUESTION_BANK.filter(q => !q.isSecret).sort(() => Math.random() - 0.5);
  larvulSession.questions = regularPool.slice(0, config.count);
  larvulSession.currentIndex = 0;
  larvulSession.score = 0;
  larvulSession.streak = 0;
  larvulSession.maxTime = config.time;
  larvulSession.secretUnlocked = false;
  larvulSession.secretPlayed = false;

  renderLarvulQuestion();
}

function renderLarvulQuestion() {
  clearInterval(larvulTimerInterval);
  const q = larvulSession.questions[larvulSession.currentIndex];
  if (!q) return;

  larvulSession.answered = false;
  larvulSession.timeLeft = larvulSession.maxTime;

  document.getElementById('larvul-case-num').textContent = larvulSession.currentIndex + 1;
  document.getElementById('larvul-case-total').textContent = larvulSession.questions.length;
  document.getElementById('larvul-score-text').textContent = larvulSession.score;
  updateLarvulComboBadge();

  document.getElementById('larvul-pillar-tag').textContent = q.pillar;
  const secretTag = document.getElementById('larvul-secret-tag');
  if (q.isSecret) secretTag.classList.remove('hidden');
  else secretTag.classList.add('hidden');

  document.getElementById('larvul-case-title').textContent = q.title;
  document.getElementById('larvul-case-desc').textContent = q.desc;
  document.getElementById('larvul-feedback-box').classList.add('hidden');

  // Acak urutan pilihan jawaban agar setiap sesi segar
  const indexedOpts = q.options.map((text, idx) => ({ text, isCorrect: idx === q.correct }));
  indexedOpts.sort(() => Math.random() - 0.5);

  const grid = document.getElementById('larvul-options-grid');
  grid.innerHTML = '';
  const letters = ['A', 'B', 'C', 'D'];

  indexedOpts.forEach((opt, i) => {
    const btn = document.createElement('button');
    btn.className = 'quiz-option-card p-3.5 rounded-2xl border-2 border-sand-border bg-white text-left flex items-start gap-2.5 text-xs sm:text-sm font-bold text-slate-800 shadow-sm';
    btn.innerHTML = `
      <span class="w-6 h-6 rounded-lg bg-amber-100 border border-adat-emas text-ocean-dark font-black flex items-center justify-center shrink-0">${letters[i]}</span>
      <span>${opt.text}</span>
    `;
    btn.onclick = () => submitLarvulAnswer(btn, opt.isCorrect, q, indexedOpts);
    grid.appendChild(btn);
  });

  updateLarvulTimerUI();
  larvulTimerInterval = setInterval(() => {
    larvulSession.timeLeft--;
    updateLarvulTimerUI();
    if (larvulSession.timeLeft <= 0) {
      clearInterval(larvulTimerInterval);
      handleLarvulTimeout(q, indexedOpts);
    }
  }, 1000);
}

function updateLarvulTimerUI() {
  const txt = document.getElementById('larvul-timer-text');
  const bar = document.getElementById('larvul-timer-bar');
  if (txt) txt.textContent = `${larvulSession.timeLeft}s`;
  if (bar) {
    const pct = Math.max(0, (larvulSession.timeLeft / larvulSession.maxTime) * 100);
    bar.style.width = `${pct}%`;
  }
}

function updateLarvulComboBadge() {
  const badge = document.getElementById('larvul-combo-badge');
  if (!badge) return;
  if (larvulSession.streak >= 3) {
    badge.textContent = '🔥 3x Kombo Sesepuh!';
    badge.className = 'text-sm font-black text-adat-sirih animate-pulse';
  } else if (larvulSession.streak === 2) {
    badge.textContent = '⚡ 2x Kombo Bijak!';
    badge.className = 'text-sm font-black text-adat-emas';
  } else {
    badge.textContent = '1x Normal';
    badge.className = 'text-sm font-black text-slate-700';
  }
}

function submitLarvulAnswer(btnEl, isCorrect, q, indexedOpts) {
  if (larvulSession.answered) return;
  larvulSession.answered = true;
  clearInterval(larvulTimerInterval);

  const buttons = document.querySelectorAll('#larvul-options-grid button');
  buttons.forEach(b => (b.disabled = true));

  const diffMult = { pemula: 1.0, penjaga: 1.3, sesepuh: 1.6 }[larvulSession.difficulty] || 1.0;

  if (isCorrect) {
    btnEl.classList.add('selected-correct');
    larvulSession.streak++;
    const comboMult = larvulSession.streak >= 3 ? 3 : larvulSession.streak === 2 ? 2 : 1;
    const basePts = q.isSecret ? 50 : 20;
    const timeBonus = Math.round(larvulSession.timeLeft * 0.5);
    const gained = Math.round((basePts + timeBonus) * comboMult * diffMult);
    larvulSession.score += gained;

    audio.playGong();
    if (comboMult >= 2) audio.playCombo(comboMult);

    if (larvulSession.streak >= 3 && !larvulSession.secretPlayed) {
      larvulSession.secretUnlocked = true;
    }

    showLarvulFeedback(true, `Putusan Tepat! (+${gained} Poin • Kombo ${comboMult}x)`, q.exp);
  } else {
    btnEl.classList.add('selected-wrong');
    larvulSession.streak = 0;
    audio.playWrong();
    indexedOpts.forEach((o, idx) => {
      if (o.isCorrect && buttons[idx]) buttons[idx].classList.add('selected-correct');
    });
    showLarvulFeedback(false, 'Kurang Tepat Menurut Hukum Adat Larvul Ngabal', q.exp);
  }

  document.getElementById('larvul-score-text').textContent = larvulSession.score;
  updateLarvulComboBadge();
}

function handleLarvulTimeout(q, indexedOpts) {
  if (larvulSession.answered) return;
  larvulSession.answered = true;
  larvulSession.streak = 0;
  audio.playWrong();

  const buttons = document.querySelectorAll('#larvul-options-grid button');
  buttons.forEach((b, idx) => {
    b.disabled = true;
    if (indexedOpts[idx]?.isCorrect) b.classList.add('selected-correct');
  });

  updateLarvulComboBadge();
  showLarvulFeedback(false, '⏰ Waktu Musyawarah Habis!', q.exp);
}

function showLarvulFeedback(isCorrect, title, exp) {
  const box = document.getElementById('larvul-feedback-box');
  box.className = `rounded-2xl p-4 border-2 mb-2 ${
    isCorrect ? 'bg-emerald-50 border-eco-zamrud' : 'bg-red-50 border-adat-sirih'
  }`;
  document.getElementById('larvul-fb-icon').textContent = isCorrect ? '✨' : '⚖️';
  document.getElementById('larvul-fb-title').textContent = title;
  document.getElementById('larvul-fb-text').textContent = exp;

  // Tampilkan tombol Kasus Rahasia Sesepuh jika streak >= 3
  const secretBtn = document.getElementById('btn-larvul-secret');
  if (larvulSession.secretUnlocked && !larvulSession.secretPlayed) {
    secretBtn.classList.remove('hidden');
  } else {
    secretBtn.classList.add('hidden');
  }

  const nextBtn = document.getElementById('btn-larvul-next');
  nextBtn.textContent =
    larvulSession.currentIndex < larvulSession.questions.length - 1
      ? 'Kasus Berikutnya →'
      : 'Selesaikan Sidang & Simpan Skor';
}

function triggerSecretElderCase() {
  audio.playFanfare();
  larvulSession.secretPlayed = true;
  document.getElementById('btn-larvul-secret').classList.add('hidden');

  const secretPool = LARVUL_QUESTION_BANK.filter(q => q.isSecret);
  const chosen = secretPool[Math.floor(Math.random() * secretPool.length)];
  larvulSession.questions.splice(larvulSession.currentIndex + 1, 0, chosen);
  nextLarvulCase();
}

function nextLarvulCase() {
  audio.playClick();
  if (larvulSession.currentIndex < larvulSession.questions.length - 1) {
    larvulSession.currentIndex++;
    renderLarvulQuestion();
  } else {
    // Selesai Sidang Pulau 1
    if (larvulSession.score > appState.highScores.larvul) {
      appState.highScores.larvul = larvulSession.score;
    }
    if (larvulSession.score >= 120) {
      appState.badges.larvul = true;
      audio.playFanfare();
    }
    saveAppState();
    alert(
      `Sidang Balai Adat Larvul Ngabal Selesai!\nSkor Sidang Anda: ${larvulSession.score} Poin\nRekor Tertinggi: ${appState.highScores.larvul} Poin${
        appState.badges.larvul ? '\n🏅 Lencana "Ahli Larvul Ngabal" Terbuka!' : ''
      }`
    );
    initLarvulSession();
  }
}

// ========================================================
// 4. PULAU 2: TELUK SASI LAUT EVAV (SIMULASI 3D 6 MUSIM DINAMIS)
// ========================================================
const SASI_RANDOM_EVENTS_POOL = [
  {
    name: 'Fenomena Meti Kei Ekstrem (Surut Terendah)',
    detail: 'Air laut surut bermil-mil! Warga sangat mudah memanen kerang lola & teripang. Jika Sasi dibuka penuh, ekosistem terumbu bisa terkuras drastis.',
    ecoImpactIfOpen: -9,
    foodImpactIfOpen: 12,
    ecoImpactIfClosed: 6,
    foodImpactIfClosed: -5
  },
  {
    name: 'Musim Pemijahan Massal Ikan Lompa',
    detail: 'Ribuan Ikan Lompa bertelur di perairan teluk. Menutup Sasi musim ini akan melipatgandakan populasi ikan 3D secara spektakuler!',
    ecoImpactIfOpen: -8,
    foodImpactIfOpen: 7,
    ecoImpactIfClosed: 11,
    foodImpactIfClosed: -4
  },
  {
    name: 'Gelombang Tinggi Angin Barat',
    detail: 'Laut samudra berombak besar sehingga nelayan tidak bisa melaut jauh. Warga mengandalkan pangan dari teluk pesisir.',
    ecoImpactIfOpen: -4,
    foodImpactIfOpen: 11,
    ecoImpactIfClosed: 4,
    foodImpactIfClosed: -10
  },
  {
    name: 'Kedatangan Kapal Luar Tanpa Izin',
    detail: 'Kapal luar mencoba masuk ke perairan petuanan Ohoi. Menancapkan bambu Hawear (Tutup Sasi) memperkuat patroli hukum adat!',
    ecoImpactIfOpen: -10,
    foodImpactIfOpen: 4,
    ecoImpactIfClosed: 9,
    foodImpactIfClosed: -3
  },
  {
    name: 'Lonjakan Kebutuhan Pangan Upacara Adat Kampung',
    detail: 'Kampung menggelar pesta adat besar dan membutuhkan pasokan ikan lompa serta teripang untuk menjamu tamu.',
    ecoImpactIfOpen: -4,
    foodImpactIfOpen: 13,
    ecoImpactIfClosed: 4,
    foodImpactIfClosed: -11
  },
  {
    name: 'Ledakan Plankton & Nutrisi Laut Banda',
    detail: 'Arus hangat membawa nutrisi melimpah. Biota laut tumbuh dua kali lebih cepat jika dijaga dengan bijak.',
    ecoImpactIfOpen: -3,
    foodImpactIfOpen: 9,
    ecoImpactIfClosed: 10,
    foodImpactIfClosed: -3
  },
  {
    name: 'Harga Kerang Lola & Teripang Melonjak',
    detail: 'Pedagang menawarkan harga tinggi untuk hasil laut Kei. Waspadai godaan eksploitasi berlebihan!',
    ecoImpactIfOpen: -8,
    foodImpactIfOpen: 12,
    ecoImpactIfClosed: 7,
    foodImpactIfClosed: -5
  },
  {
    name: 'Musim Teduh Angin Timur',
    detail: 'Perairan teluk sangat tenang dan jernih. Waktu ideal untuk mengatur panen adat terukur sambil menjaga karang.',
    ecoImpactIfOpen: -3,
    foodImpactIfOpen: 8,
    ecoImpactIfClosed: 7,
    foodImpactIfClosed: -4
  }
];

let sasi3D = {
  difficulty: 'penjaga',
  season: 1,
  maxSeasons: 6,
  ecoHealth: 80,
  foodWelfare: 76,
  consecutiveFullClosed: 0,
  harmonyStreak: 0,
  events: [],
  commodities: {
    lompa: { status: 'tutup', pop: 84 },    // 'tutup' | 'buka'
    teripang: { status: 'tutup', pop: 80 },
    lola: { status: 'tutup', pop: 76 }
  }
};

function changeSasiDifficulty(diff) {
  audio.playClick();
  sasi3D.difficulty = diff;
  initSasi3DGame();
}

function initSasi3DGame() {
  const diff = document.getElementById('sasi-diff-select')?.value || 'penjaga';
  sasi3D.difficulty = diff;
  sasi3D.season = 1;
  sasi3D.consecutiveFullClosed = 0;
  sasi3D.harmonyStreak = 0;

  // Kondisi awal acak di setiap sesi baru agar replayable
  const baseStart = diff === 'pemula' ? 82 : diff === 'sesepuh' ? 70 : 76;
  sasi3D.ecoHealth = baseStart + Math.floor(Math.random() * 8 - 4);
  sasi3D.foodWelfare = baseStart + Math.floor(Math.random() * 8 - 4);

  sasi3D.commodities = {
    lompa: { status: 'tutup', pop: sasi3D.ecoHealth + 4 },
    teripang: { status: 'tutup', pop: sasi3D.ecoHealth },
    lola: { status: 'tutup', pop: sasi3D.ecoHealth - 4 }
  };

  // Acak 6 kejadian musim berbeda
  sasi3D.events = [...SASI_RANDOM_EVENTS_POOL].sort(() => Math.random() - 0.5).slice(0, 6);

  document.getElementById('sasi-result-box').classList.add('hidden');
  document.getElementById('btn-sasi-advance').classList.remove('hidden');
  updateSasi3DUI();
}

function cycleSasiCommodity(key) {
  audio.playClick();
  const curr = sasi3D.commodities[key].status;
  sasi3D.commodities[key].status = curr === 'tutup' ? 'buka' : 'tutup';
  updateSasi3DUI();
}

function setAllSasiCommodities(status) {
  audio.playClick();
  ['lompa', 'teripang', 'lola'].forEach(k => {
    sasi3D.commodities[k].status = status;
  });
  if (status === 'tutup') audio.playGong();
  updateSasi3DUI();
}

function updateSasi3DUI() {
  const ev = sasi3D.events[sasi3D.season - 1] || SASI_RANDOM_EVENTS_POOL[0];
  document.getElementById('sasi-season-name').textContent = `Musim ${sasi3D.season} / ${sasi3D.maxSeasons}`;
  document.getElementById('sasi-streak-badge').textContent = `Harmoni: ${sasi3D.harmonyStreak}x`;
  document.getElementById('sasi-event-headline').textContent = `📢 ${ev.name}`;
  document.getElementById('sasi-event-detail').textContent = ev.detail;

  document.getElementById('sasi-eco-val').textContent = `${sasi3D.ecoHealth}%`;
  document.getElementById('sasi-eco-bar').style.width = `${sasi3D.ecoHealth}%`;
  document.getElementById('sasi-food-val').textContent = `${sasi3D.foodWelfare}%`;
  document.getElementById('sasi-food-bar').style.width = `${sasi3D.foodWelfare}%`;

  const waterTxt = document.getElementById('sasi-water-status');
  if (sasi3D.ecoHealth >= 70) {
    waterTxt.textContent = 'Air Laut 3D: Jernih Zamrud & Ikan Melimpah';
    waterTxt.className = 'text-[10px] font-bold text-emerald-800 mt-1 block';
  } else if (sasi3D.ecoHealth >= 45) {
    waterTxt.textContent = 'Air Laut 3D: Mulai Berkurang, Perlu Sasi';
    waterTxt.className = 'text-[10px] font-bold text-amber-800 mt-1 block';
  } else {
    waterTxt.textContent = '⚠️ Air Laut 3D Keruh & Populasi Ikan Kritis!';
    waterTxt.className = 'text-[10px] font-bold text-red-700 mt-1 block';
  }

  const foodTxt = document.getElementById('sasi-food-status');
  if (sasi3D.foodWelfare >= 70) {
    foodTxt.textContent = 'Pangan Kampung: Makmur & Tercukupi';
  } else if (sasi3D.foodWelfare >= 45) {
    foodTxt.textContent = 'Pangan Kampung: Mulai Menipis (Buka Sebagian Sasi)';
  } else {
    foodTxt.textContent = '⚠️ Warga Kekurangan Pangan Laut!';
  }

  let closedCount = 0;
  ['lompa', 'teripang', 'lola'].forEach(k => {
    const item = sasi3D.commodities[k];
    if (item.status === 'tutup') closedCount++;
    document.getElementById(`sasi-pop-${k}`).textContent = `Populasi: ${item.pop}%`;
    const btn = document.getElementById(`btn-sasi-${k}`);
    if (item.status === 'tutup') {
      btn.textContent = '🌿 TUTUP SASI';
      btn.className = 'w-full py-1.5 rounded-xl font-extrabold text-[11px] bg-red-600 hover:bg-red-700 text-white shadow-sm transition';
    } else {
      btn.textContent = '⛵ BUKA PANEN';
      btn.className = 'w-full py-1.5 rounded-xl font-extrabold text-[11px] bg-eco-zamrud hover:bg-emerald-700 text-white shadow-sm transition';
    }
  });

  // Update Visual Laut 3D secara Real-Time!
  if (typeof World3D !== 'undefined') {
    World3D.updateSasiEcosystem3D(sasi3D.ecoHealth, closedCount >= 2);
  }
}

function advanceSasiSeason3D() {
  audio.playClick();
  const ev = sasi3D.events[sasi3D.season - 1] || SASI_RANDOM_EVENTS_POOL[0];
  const penaltyScale = sasi3D.difficulty === 'sesepuh' ? 1.25 : sasi3D.difficulty === 'pemula' ? 0.8 : 1.0;

  let closedCount = 0;
  ['lompa', 'teripang', 'lola'].forEach(k => {
    const c = sasi3D.commodities[k];
    if (c.status === 'tutup') {
      closedCount++;
      c.pop = Math.min(100, c.pop + 9);
    } else {
      c.pop = Math.max(15, c.pop - Math.round(10 * penaltyScale));
    }
  });

  const openCount = 3 - closedCount;
  if (closedCount === 3) {
    sasi3D.consecutiveFullClosed++;
  } else {
    sasi3D.consecutiveFullClosed = 0;
  }

  // Hitung perubahan Ekosistem 3D dan Pangan Warga
  let ecoDelta = closedCount * 5 - openCount * Math.round(6 * penaltyScale);
  let foodDelta = openCount * 7 - closedCount * Math.round(4 * penaltyScale);

  if (closedCount >= 2) {
    ecoDelta += Math.round(ev.ecoImpactIfClosed * 0.5);
    foodDelta += Math.round(ev.foodImpactIfClosed * 0.5);
  } else {
    ecoDelta += Math.round(ev.ecoImpactIfOpen * 0.5);
    foodDelta += Math.round(ev.foodImpactIfOpen * 0.5);
  }

  // Penalti jika menutup seluruh Sasi terlalu lama berturut-turut (>= 3 musim)
  if (sasi3D.consecutiveFullClosed >= 2) {
    foodDelta -= 8;
  }

  sasi3D.ecoHealth = Math.max(10, Math.min(100, sasi3D.ecoHealth + ecoDelta));
  sasi3D.foodWelfare = Math.max(10, Math.min(100, sasi3D.foodWelfare + foodDelta));

  if (sasi3D.ecoHealth >= 65 && sasi3D.foodWelfare >= 65) {
    sasi3D.harmonyStreak++;
    audio.playGong();
  } else {
    sasi3D.harmonyStreak = 0;
  }

  if (sasi3D.season < sasi3D.maxSeasons) {
    sasi3D.season++;
    updateSasi3DUI();
  } else {
    updateSasi3DUI();
    finishSasi3DSession();
  }
}

function finishSasi3DSession() {
  document.getElementById('btn-sasi-advance').classList.add('hidden');
  const resBox = document.getElementById('sasi-result-box');
  resBox.classList.remove('hidden');

  const diffMult = { pemula: 1.0, penjaga: 1.25, sesepuh: 1.5 }[sasi3D.difficulty] || 1.0;
  const rawScore = Math.round(((sasi3D.ecoHealth + sasi3D.foodWelfare) + sasi3D.harmonyStreak * 15) * diffMult);

  if (rawScore > appState.highScores.sasi) {
    appState.highScores.sasi = rawScore;
  }

  const titleEl = document.getElementById('sasi-rank-title');
  const descEl = document.getElementById('sasi-rank-desc');

  if (sasi3D.ecoHealth >= 75 && sasi3D.foodWelfare >= 75) {
    appState.badges.sasi = true;
    audio.playFanfare();
    titleEl.textContent = `🏆 PERINGKAT: PANEN EMAS BERKELANJUTAN (${rawScore} Poin)`;
    descEl.textContent = 'Luar biasa, Bum-it Agung! Air laut Teluk Kei tetap jernih, populasi Ikan Lompa & Lola melimpah, dan pangan warga makmur. Lencana "Penjaga Sasi Laut" terbuka!';
  } else if (sasi3D.ecoHealth >= 65 && sasi3D.foodWelfare >= 65) {
    appState.badges.sasi = true;
    audio.playGong();
    titleEl.textContent = `🌿 PERINGKAT: PENJAGA SASI BIJAKSANA (${rawScore} Poin)`;
    descEl.textContent = 'Keseimbangan ekosistem 3D dan pangan warga terjaga baik. Tingkatkan harmoni ke 75% untuk meraih predikat Panen Emas Berkelanjutan!';
  } else {
    audio.playWrong();
    titleEl.textContent = `⚖️ PERINGKAT: PERLU EVALUASI SANIRI (${rawScore} Poin)`;
    descEl.textContent = 'Salah satu indikator masih di bawah target. Ingat: buka sebagian komoditas secara bergilir agar warga tidak kekurangan pangan sambil menjaga ekosistem laut 3D tetap jernih!';
  }

  saveAppState();
}

// ========================================================
// 5. PULAU 3: KAMPUNG MAREN & AIN NI AIN (TIME ATTACK 60 DETIK)
// ========================================================
const MAREN_PROVERB_CHALLENGES = [
  {
    typeLabel: '📜 Filosofi & Pepatah Kei',
    question: 'Apa makna luhur dari semboyan masyarakat Kepulauan Kei "Ain Ni Ain"?',
    options: [
      'Kita semua bersaudara sebagai satu kesatuan jiwa dan darah',
      'Aturan pembagian tanah kebun warisan',
      'Nama angin musim timur untuk berlayar',
      'Upacara penyambutan perahu dagang'
    ],
    correct: 0
  },
  {
    typeLabel: '📜 Filosofi & Pepatah Kei',
    question: 'Pepatah adat "It did fo it did, hira ni fo i ni" mengajarkan prinsip...',
    options: [
      'Milik kita adalah milik kita, milik orang lain wajib dihormati sebagai miliknya',
      'Siapa yang cepat melaut mendapat ikan terbanyak',
      'Setiap kampung memiliki bahasa yang berbeda',
      'Perempuan wajib memimpin tarian adat'
    ],
    correct: 0
  },
  {
    typeLabel: '📜 Filosofi & Pepatah Kei',
    question: 'Apa yang dimaksud dengan tradisi "Maren" di kampung-kampung Kepulauan Kei?',
    options: [
      'Gotong royong tulus bersama-sama membangun rumah, kebun, atau fasilitas desa tanpa upah',
      'Perlombaan mendayung perahu di malam bulan purnama',
      'Tradisi menyimpan perhiasan emas di rumah adat',
      'Sistem barter ikan dengan sagu'
    ],
    correct: 0
  },
  {
    typeLabel: '📜 Filosofi & Pepatah Kei',
    question: 'Selain Maren, masyarakat Kei mengenal nilai kasih sayang sejati kepada sesama yang disebut...',
    options: [
      'Fangnanan (Rasa kasih dan kepedulian mendalam antar saudara)',
      'Meti Kei (Surut air laut terendah)',
      'Ngit (Ujung haluan perahu belang)',
      'Gepe (Alat peras singkong)'
    ],
    correct: 0
  },
  {
    typeLabel: '📜 Filosofi & Pepatah Kei',
    question: 'Apa arti filosofis dari "Vuut ain mehe nifun, manut ain mehe tilur"?',
    options: [
      'Ikan dari satu pemijahan dan burung dari satu sarang — simbol satu asal-usul leluhur',
      'Larangan menangkap ikan dan burung di musim hujan',
      'Teknik membuat jaring ikan dari serat kayu',
      'Doa sebelum menebang pohon untuk perahu'
    ],
    correct: 0
  }
];

const MAREN_SEQUENCE_CHALLENGES = [
  {
    typeLabel: '🔢 Urutan Prosesi Budaya (Klik Berurutan 1 → 4)',
    question: 'Susun 4 langkah tradisional pembuatan pangan lokal "Enbal" dari singkong beracun (Kasbi):',
    steps: [
      '1. Mengupas & memarut umbi singkong beracun segar',
      '2. Memeras cairan racun sianida dengan tindihan batu (Gepe)',
      '3. Mengayak tepung enbal kering hingga halus',
      '4. Memanggang di atas cetakan panas hingga menjadi lempeng Enbal tahan lama'
    ]
  },
  {
    typeLabel: '🔢 Urutan Prosesi Budaya (Klik Berurutan 1 → 4)',
    question: 'Susun 4 tahapan gotong royong "Maren" membangun Rumah Adat Rahahan:',
    steps: [
      '1. Musyawarah marga & doa tetua adat menentukan hari Maren',
      '2. Warga bersama-sama menegakkan tiang utama & kerangka kayu',
      '3. Menganyam dan memasang atap rumbia secara serempak',
      '4. Makan bersama pangan lokal (Enbal & Ikan) dengan iringan Tifa'
    ]
  },
  {
    typeLabel: '🔢 Urutan Prosesi Budaya (Klik Berurutan 1 → 4)',
    question: 'Susun 4 tahapan sakral pelaksanaan Sasi Laut (Hawear) di Ohoi:',
    steps: [
      '1. Sidang Saniri & Bum-it menetapkan batas wilayah konservasi teluk',
      '2. Doa adat & penancapan janur kuning Hawear sebagai tanda Tutup Sasi',
      '3. Masa penjagaan bersama agar biota laut berkembang biak tanpa gangguan',
      '4. Upacara Buka Sasi & panen lestari untuk kesejahteraan seluruh warga'
    ]
  },
  {
    typeLabel: '🔢 Urutan Prosesi Budaya (Klik Berurutan 1 → 4)',
    question: 'Susun 4 tahapan tradisi pelayaran Perahu Belang Adat Kei:',
    steps: [
      '1. Memilih kayu pilihan & mengukir haluan tinggi (Ngit) berornamen adat',
      '2. Ritual peluncuran perahu ke pantai oleh Tetua Adat',
      '3. Penabuh Tifa memberi komando irama di tengah perahu',
      '4. Para pendayung mengayuh serempak membelah ombak dalam semangat Ain Ni Ain'
    ]
  }
];

const MAREN_ARTIFACT_3D_CHALLENGES = [
  {
    artifactType: 'belang',
    typeLabel: '🏺 Tebak Artefak 3D yang Berotasi',
    question: 'Amati objek 3D yang berotasi di atas! Artefak bahari berornamen merah-putih-emas ini adalah...',
    options: [
      'Perahu Belang — Perahu dayung adat simbol kekompakan & persaudaraan maritim Kei',
      'Lesung Penumbuk Padi Tradisional',
      'Peti Penyimpanan Kain Tenun',
      'Alat Penangkap Kerang Lola'
    ],
    correct: 0
  },
  {
    artifactType: 'rahahan',
    typeLabel: '🏺 Tebak Artefak 3D yang Berotasi',
    question: 'Amati bangunan 3D beratap tinggi di atas! Apakah fungsi utama bangunan adat ini?',
    options: [
      'Rumah Adat Rahahan — Pusat musyawarah marga, penyimpanan pusaka, dan pemersatu keluarga',
      'Menara Pengawas Cuaca Pelabuhan',
      'Gudang Penyimpanan Garam Laut',
      'Kandang Ternak Komunal'
    ],
    correct: 0
  },
  {
    artifactType: 'hawear',
    typeLabel: '🏺 Tebak Artefak 3D yang Berotasi',
    question: 'Amati tiang berhias janur kuning & puncak merah 3D di atas! Simbol apakah ini?',
    options: [
      'Hawear Balwirin — Penanda sakral larangan Sasi dan perlindungan hak milik adat',
      'Tombak Berburu di Hutan',
      'Tiang Layar Perahu Nelayan',
      'Alat Pengukur Kedalaman Air Surut'
    ],
    correct: 0
  },
  {
    artifactType: 'tifa',
    typeLabel: '🏺 Tebak Artefak 3D yang Berotasi',
    question: 'Amati instrumen 3D yang berotasi ini! Apakah peran alat musik tradisional ini di Kampung Kei?',
    options: [
      'Tifa Adat — Pengatur irama dayung Perahu Belang, pengiring tari Sawat, dan pemanggil musyawarah',
      'Wadah Air Minum dari Bambu',
      'Cetakan Sagu Bakar',
      'Bubu Perangkap Ikan Karang'
    ],
    correct: 0
  },
  {
    artifactType: 'enbal',
    typeLabel: '🏺 Tebak Artefak 3D yang Berotasi',
    question: 'Amati lempengan putih di atas piringan tanah liat 3D ini! Pangan kearifan lokal apakah ini?',
    options: [
      'Pangan Enbal — Olahan singkong yang telah dihilangkan racun sianidanya, tahan disimpan bertahun-tahun',
      'Kerupuk Teripang Pasir',
      'Kue Beras Ketan Hitam',
      'Garam Kristal Pantai Ngurbloat'
    ],
    correct: 0
  },
  {
    artifactType: 'lola',
    typeLabel: '🏺 Tebak Artefak 3D yang Berotasi',
    question: 'Amati cangkang kerucut merah & mutiara 3D di atas! Komoditas berharga apakah yang dijaga lewat Sasi Laut ini?',
    options: [
      'Kerang Lola & Mutiara Kei — Biota bernilai ekonomi tinggi yang dilindungi masa panennya lewat Sasi',
      'Batu Karang Penghias Taman',
      'Umpan Pancing Ikan Lompa',
      'Alat Tukar Kuno Antar Pulau'
    ],
    correct: 0
  }
];

let marenSession = {
  difficulty: 'penjaga',
  timeLeft: 60,
  score: 0,
  streak: 0,
  ainMeter: 0, // 0..100%
  queue: [],
  currentChallenge: null,
  seqExpectedStep: 0
};
let marenTimerInterval = null;

function changeMarenDifficulty(diff) {
  audio.playClick();
  marenSession.difficulty = diff;
  startMarenTimeAttack();
}

function startMarenTimeAttack() {
  clearInterval(marenTimerInterval);
  const diff = document.getElementById('maren-diff-select')?.value || 'penjaga';
  marenSession.difficulty = diff;

  const durationMap = { pemula: 75, penjaga: 60, sesepuh: 45, harian: 60 };
  marenSession.timeLeft = durationMap[diff] || 60;
  marenSession.score = 0;
  marenSession.streak = 0;
  marenSession.ainMeter = 0;

  document.getElementById('maren-gameover-box').classList.add('hidden');
  buildMarenChallengeQueue();
  updateMarenHUD();
  nextMarenChallenge();

  marenTimerInterval = setInterval(() => {
    marenSession.timeLeft--;
    updateMarenHUD();
    if (marenSession.timeLeft <= 0) {
      clearInterval(marenTimerInterval);
      finishMarenTimeAttack();
    }
  }, 1000);
}

function buildMarenChallengeQueue() {
  const combined = [
    ...MAREN_PROVERB_CHALLENGES.map(c => ({ ...c, kind: 'mcq' })),
    ...MAREN_SEQUENCE_CHALLENGES.map(c => ({ ...c, kind: 'sequence' })),
    ...MAREN_ARTIFACT_3D_CHALLENGES.map(c => ({ ...c, kind: 'artifact3d' }))
  ];
  combined.sort(() => Math.random() - 0.5);
  marenSession.queue = combined;
}

function updateMarenHUD() {
  document.getElementById('maren-timer-text').textContent = `${marenSession.timeLeft}s`;
  document.getElementById('maren-streak-text').textContent = `${marenSession.streak}x 🔥`;
  document.getElementById('maren-score-text').textContent = marenSession.score;
  document.getElementById('ain-meter-pct').textContent = `${marenSession.ainMeter}%`;
  document.getElementById('ain-meter-bar').style.width = `${marenSession.ainMeter}%`;
}

function nextMarenChallenge() {
  if (marenSession.queue.length === 0) {
    buildMarenChallengeQueue();
  }
  const ch = marenSession.queue.pop();
  marenSession.currentChallenge = ch;

  document.getElementById('maren-challenge-type').textContent = ch.typeLabel;
  document.getElementById('maren-question-title').textContent = ch.question;

  const artWrap = document.getElementById('artifact-3d-wrapper');
  const seqWrap = document.getElementById('maren-sequence-progress');
  const optArea = document.getElementById('maren-options-area');
  optArea.innerHTML = '';

  if (ch.kind === 'artifact3d') {
    artWrap.classList.remove('hidden');
    seqWrap.classList.add('hidden');
    if (typeof Artifact3DViewer !== 'undefined') {
      setTimeout(() => Artifact3DViewer.showArtifact(ch.artifactType), 30);
    }
    renderMarenMCQOptions(ch, optArea);
  } else if (ch.kind === 'sequence') {
    artWrap.classList.add('hidden');
    seqWrap.classList.remove('hidden');
    marenSession.seqExpectedStep = 0;
    document.getElementById('sequence-step-indicator').textContent = '0 / 4';

    const indexedSteps = ch.steps.map((text, idx) => ({ text, stepIdx: idx }));
    indexedSteps.sort(() => Math.random() - 0.5);

    indexedSteps.forEach(st => {
      const btn = document.createElement('button');
      btn.className = 'quiz-option-card p-3.5 rounded-2xl border-2 border-sand-border bg-white text-left text-xs sm:text-sm font-bold text-slate-800 shadow-sm';
      // Sembunyikan angka urutan di awal agar pemain berpikir menyusun urutan!
      const cleanText = st.text.replace(/^\d+\.\s*/, '');
      btn.textContent = cleanText;
      btn.onclick = () => handleMarenSequenceClick(btn, st.stepIdx, st.text);
      optArea.appendChild(btn);
    });
  } else {
    artWrap.classList.add('hidden');
    seqWrap.classList.add('hidden');
    renderMarenMCQOptions(ch, optArea);
  }
}

function renderMarenMCQOptions(ch, container) {
  const opts = ch.options.map((text, idx) => ({ text, isCorrect: idx === ch.correct }));
  opts.sort(() => Math.random() - 0.5);

  opts.forEach(o => {
    const btn = document.createElement('button');
    btn.className = 'quiz-option-card p-3.5 rounded-2xl border-2 border-sand-border bg-white text-left text-xs sm:text-sm font-bold text-slate-800 shadow-sm';
    btn.textContent = o.text;
    btn.onclick = () => {
      if (o.isCorrect) {
        btn.classList.add('selected-correct');
        rewardMarenSuccess(25);
        setTimeout(() => nextMarenChallenge(), 380);
      } else {
        btn.classList.add('selected-wrong');
        penalizeMarenMistake();
      }
    };
    container.appendChild(btn);
  });
}

function handleMarenSequenceClick(btnEl, stepIdx, fullLabel) {
  if (stepIdx === marenSession.seqExpectedStep) {
    audio.playClick();
    btnEl.disabled = true;
    btnEl.classList.add('selected-correct');
    btnEl.textContent = `✓ ${fullLabel}`;
    marenSession.seqExpectedStep++;
    document.getElementById('sequence-step-indicator').textContent = `${marenSession.seqExpectedStep} / 4`;

    if (marenSession.seqExpectedStep === 4) {
      rewardMarenSuccess(40);
      setTimeout(() => nextMarenChallenge(), 450);
    }
  } else {
    btnEl.classList.add('selected-wrong');
    penalizeMarenMistake();
    setTimeout(() => btnEl.classList.remove('selected-wrong'), 400);
  }
}

function rewardMarenSuccess(basePoints) {
  marenSession.streak++;
  const mult = marenSession.difficulty === 'harian' ? 1.5 : marenSession.difficulty === 'sesepuh' ? 1.4 : 1.0;
  const streakBonus = Math.min(3, 1 + Math.floor(marenSession.streak / 2) * 0.5);
  const pts = Math.round(basePoints * mult * streakBonus);
  marenSession.score += pts;

  marenSession.ainMeter = Math.min(100, marenSession.ainMeter + 20);
  audio.playGong();

  // Jika Meteran Semangat Ain Ni Ain mencapai 100%, picu Kembang Api 3D & Tabuhan Tifa!
  if (marenSession.ainMeter >= 100) {
    audio.playTifaRhythm();
    if (typeof World3D !== 'undefined') {
      World3D.launchFireworks3D();
    }
    marenSession.score += 50; // Bonus Perayaan Ain Ni Ain
    setTimeout(() => {
      marenSession.ainMeter = 20;
      updateMarenHUD();
    }, 900);
  }

  updateMarenHUD();
}

function penalizeMarenMistake() {
  audio.playWrong();
  marenSession.streak = 0;
  marenSession.ainMeter = Math.max(0, marenSession.ainMeter - 10);
  updateMarenHUD();
}

function finishMarenTimeAttack() {
  document.getElementById('maren-options-area').innerHTML = '';
  const box = document.getElementById('maren-gameover-box');
  box.classList.remove('hidden');

  if (marenSession.score > appState.highScores.maren) {
    appState.highScores.maren = marenSession.score;
  }
  if (marenSession.score >= 150) {
    appState.badges.ain = true;
    audio.playFanfare();
    if (typeof World3D !== 'undefined') World3D.launchFireworks3D();
  } else {
    audio.playGong();
  }

  saveAppState();
  document.getElementById('maren-final-summary').textContent = `Skor Akhir Anda: ${marenSession.score} Poin (Rekor Tertinggi: ${appState.highScores.maren} Poin). ${
    appState.badges.ain ? '🏅 Lencana "Duta Ain Ni Ain" telah terbuka!' : 'Capai 150 poin untuk membuka Lencana Duta Ain Ni Ain!'
  }`;
}

// ========================================================
// INISIALISASI UTAMA SAAT DOM SIAP
// ========================================================
document.addEventListener('DOMContentLoaded', () => {
  loadAppState();
  if (typeof World3D !== 'undefined') {
    World3D.init();
  }
  initSplashScreen();

  const btnAudio = document.getElementById('btn-toggle-audio');
  if (btnAudio) {
    btnAudio.addEventListener('click', () => {
      const isOn = audio.toggleMute();
      document.getElementById('audio-icon').textContent = isOn ? '🔊' : '🔇';
      const lbl = document.getElementById('audio-label');
      if (lbl) lbl.textContent = isOn ? 'Suara: Maks (100%)' : 'Suara: Bisu';
      if (isOn) audio.playClick();
    });
  }

  // Registrasi Service Worker (PWA Offline-Ready)
  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
    navigator.serviceWorker.register('./sw.js').catch((err) => {
      console.warn('ServiceWorker registration skipped:', err);
    });
  }
});

// Dukungan Tombol Instal Aplikasi (PWA Install Prompt)
let deferredInstallPrompt = null;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredInstallPrompt = e;
  const installBtn = document.getElementById('btn-install-pwa');
  if (installBtn) {
    installBtn.classList.remove('hidden');
  }
});

window.addEventListener('appinstalled', () => {
  deferredInstallPrompt = null;
  const installBtn = document.getElementById('btn-install-pwa');
  if (installBtn) installBtn.classList.add('hidden');
});

function installPWA() {
  audio.playClick();
  if (!deferredInstallPrompt) return;
  deferredInstallPrompt.prompt();
  deferredInstallPrompt.userChoice.then(() => {
    deferredInstallPrompt = null;
    const installBtn = document.getElementById('btn-install-pwa');
    if (installBtn) installBtn.classList.add('hidden');
  });
}
