/**
 * JEJAK EVAV 3D: THREE.JS WEBGL HUB WORLD & 3D ARTIFACT ENGINE
 * Membangun lingkungan Kepulauan Kei 3D prosedural secara real-time:
 * - Laut jernih dengan gelombang vertex animasi & dasar terumbu karang
 * - Kawanan Ikan Lompa 3D, Teripang, dan Kerang Lola
 * - 3 Pulau Misi dengan Rumah Adat Rahahan, Pohon Kelapa, Bambu Sasi (Hawear), & Suar 3D
 * - Perahu Belang 3D berornamen Merah-Putih-Emas dengan dayung bergerak & riak air
 * - Kembang Api 3D & Tabuhan Tifa di Kampung Maren
 * - Penampil Artefak 3D Berotasi untuk Mode 3
 */

const World3D = {
  scene: null,
  camera: null,
  renderer: null,
  clock: null,
  waterMesh: null,
  waterPositions: null,
  belang: null,
  oars: [],
  flagMesh: null,
  wakeRings: [],
  wakeTimer: 0,
  fishes: [],
  teripangs: [],
  lolas: [],
  hawearPoles: [],
  clouds: [],
  beacons: [],
  palmLeaves: [],
  fireworks: [],
  tifaDrummers: [],

  // Navigasi & Kontrol Perahu Belang
  boatState: {
    x: 0,
    z: 8,
    rotation: 0,
    speed: 0,
    turnSpeed: 0,
    autoTarget: null, // { x, z, islandId }
    nearIsland: null
  },

  keys: {
    forward: false,
    backward: false,
    left: false,
    right: false
  },

  cameraMode: 'cinematic', // 'cinematic', 'explore', 'island1', 'island2', 'island3'
  cinematicAngle: 0,

  islandsData: [
    {
      id: 'island1',
      num: 1,
      name: 'Pulau 1: Balai Adat Larvul Ngabal',
      subtitle: 'Sidang Musyawarah & 22 Studi Kasus Adat',
      x: -52,
      z: -32,
      radius: 16,
      beaconColor: 0xB91C1C
    },
    {
      id: 'island2',
      num: 2,
      name: 'Pulau 2: Teluk Sasi Laut Evav',
      subtitle: 'Simulasi Ekosistem 3D & Cuaca 6 Musim',
      x: 52,
      z: -32,
      radius: 16,
      beaconColor: 0x059669
    },
    {
      id: 'island3',
      num: 3,
      name: 'Pulau 3: Kampung Maren & Ain Ni Ain',
      subtitle: 'Time Attack Simbol, Prosesi & Artefak 3D',
      x: 0,
      z: 52,
      radius: 16,
      beaconColor: 0xD97706
    }
  ],

  init() {
    const container = document.getElementById('webgl-container');
    if (!container || typeof THREE === 'undefined') return;

    this.clock = new THREE.Clock();
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xE0F2FE);
    this.scene.fog = new THREE.FogExp2(0xE0F2FE, 0.0038);

    const w = container.clientWidth || window.innerWidth;
    const h = container.clientHeight || window.innerHeight;

    this.camera = new THREE.PerspectiveCamera(50, w / h, 0.5, 450);
    this.camera.position.set(0, 32, 65);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setSize(w, h);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.innerHTML = '';
    container.appendChild(this.renderer.domElement);

    this.setupLights();
    this.createSeabedAndWater();
    this.createArchipelago();
    this.createUnderwaterBiota();
    this.createBelangBoat();
    this.createSkyClouds();
    this.setupInputs();

    window.addEventListener('resize', () => this.onResize());
    window.addEventListener('orientationchange', () => setTimeout(() => this.onResize(), 120));
    this.animate();
  },

  setupLights() {
    const hemiLight = new THREE.HemisphereLight(0xFFFFFF, 0x0284C7, 0.85);
    hemiLight.position.set(0, 100, 0);
    this.scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0xFFFBEB, 1.15);
    dirLight.position.set(65, 95, 45);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    dirLight.shadow.camera.near = 10;
    dirLight.shadow.camera.far = 260;
    const d = 95;
    dirLight.shadow.camera.left = -d;
    dirLight.shadow.camera.right = d;
    dirLight.shadow.camera.top = d;
    dirLight.shadow.camera.bottom = -d;
    this.scene.add(dirLight);
  },

  createSeabedAndWater() {
    // Dasar Laut Pasir Putih Kei
    const seabedGeo = new THREE.PlaneGeometry(420, 420, 32, 32);
    seabedGeo.rotateX(-Math.PI / 2);
    const seabedMat = new THREE.MeshLambertMaterial({ color: 0xFDE68A });
    const seabed = new THREE.Mesh(seabedGeo, seabedMat);
    seabed.position.y = -4.2;
    seabed.receiveShadow = true;
    this.scene.add(seabed);

    // Permukaan Laut Jernih dengan Gelombang Vertex
    const waterGeo = new THREE.PlaneGeometry(420, 420, 75, 75);
    waterGeo.rotateX(-Math.PI / 2);
    const waterMat = new THREE.MeshPhongMaterial({
      color: 0x0284C7,
      emissive: 0x0369A1,
      emissiveIntensity: 0.15,
      specular: 0xE0F2FE,
      shininess: 70,
      transparent: true,
      opacity: 0.72,
      flatShading: true
    });

    this.waterMesh = new THREE.Mesh(waterGeo, waterMat);
    this.waterMesh.position.y = 0;
    this.scene.add(this.waterMesh);
  },

  createArchipelago() {
    // Buat 3 Pulau Misi Utama
    this.islandsData.forEach(isl => {
      const group = new THREE.Group();
      group.position.set(isl.x, 0, isl.z);

      // Pantai Pasir Putih Hangat
      const sandGeo = new THREE.CylinderGeometry(isl.radius - 1, isl.radius + 4, 3.5, 24);
      const sandMat = new THREE.MeshLambertMaterial({ color: 0xFFFDF7 });
      const sand = new THREE.Mesh(sandGeo, sandMat);
      sand.position.y = -0.8;
      sand.receiveShadow = true;
      group.add(sand);

      // Bukit Hijau Zamrud
      const grassGeo = new THREE.CylinderGeometry(isl.radius - 5, isl.radius - 1.5, 3.2, 20);
      const grassMat = new THREE.MeshLambertMaterial({ color: 0x059669 });
      const grass = new THREE.Mesh(grassGeo, grassMat);
      grass.position.y = 1.6;
      grass.receiveShadow = true;
      grass.castShadow = true;
      group.add(grass);

      // Dermaga Kayu Kecil
      const dockGeo = new THREE.BoxGeometry(3.2, 0.5, 8);
      const dockMat = new THREE.MeshLambertMaterial({ color: 0x78350F });
      const dock = new THREE.Mesh(dockGeo, dockMat);
      const angleToCenter = Math.atan2(-isl.x, -isl.z);
      dock.position.set(Math.sin(angleToCenter) * (isl.radius + 1), 0.7, Math.cos(angleToCenter) * (isl.radius + 1));
      dock.rotation.y = angleToCenter;
      group.add(dock);

      // Pohon Kelapa di sekeliling pulau
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2 + 0.4;
        const r = isl.radius - 6.5;
        const palm = this.createPalmTree();
        palm.position.set(Math.cos(a) * r, 3.0, Math.sin(a) * r);
        palm.rotation.y = Math.random() * Math.PI;
        group.add(palm);
      }

      // Bangunan Khas per Pulau
      if (isl.id === 'island1') {
        // Pulau 1: Rumah Adat Rahahan Agung & Batu Sidang Larvul Ngabal
        const rahahan = this.createRahahanHouse(1.25);
        rahahan.position.set(0, 3.2, -1);
        group.add(rahahan);

        // Lingkaran Batu Musyawarah Saniri
        for (let s = 0; s < 7; s++) {
          const sa = (s / 7) * Math.PI * 2;
          const stone = new THREE.Mesh(
            new THREE.DodecahedronGeometry(0.75, 0),
            new THREE.MeshLambertMaterial({ color: 0xD97706 })
          );
          stone.position.set(Math.cos(sa) * 5.2, 3.5, Math.sin(sa) * 5.2 + 2);
          group.add(stone);
        }
      } else if (isl.id === 'island2') {
        // Pulau 2: Pondok Penjaga Sasi (Bum-it) & Penanda Bambu Sasi (Hawear) di Teluk
        const hut = this.createRahahanHouse(0.85);
        hut.position.set(-2, 3.2, -2);
        group.add(hut);

        // 4 Tiang Bambu Sasi (Hawear) di Perairan Teluk Pulau 2
        for (let h = 0; h < 4; h++) {
          const ha = (h / 4) * Math.PI - 0.3;
          const hawear = this.createHawearPole();
          hawear.position.set(
            isl.x + Math.cos(ha) * (isl.radius + 5.5),
            0,
            isl.z + Math.sin(ha) * (isl.radius + 5.5)
          );
          this.scene.add(hawear);
          this.hawearPoles.push(hawear);
        }
      } else if (isl.id === 'island3') {
        // Pulau 3: Kampung Maren (2 Rumah Adat + Panggung Tifa & Gong)
        const r1 = this.createRahahanHouse(0.95);
        r1.position.set(-4.5, 3.2, -2);
        r1.rotation.y = 0.4;
        group.add(r1);

        const r2 = this.createRahahanHouse(0.95);
        r2.position.set(4.5, 3.2, -2);
        r2.rotation.y = -0.4;
        group.add(r2);

        // Tifa & Gong Adat di Tengah Kampung
        const gongStand = this.createGongAndTifa();
        gongStand.position.set(0, 3.2, 3.5);
        group.add(gongStand);
      }

      // Suar Misi 3D (Beacon) yang Berputar di Atas Pulau
      const beaconGroup = new THREE.Group();
      beaconGroup.position.set(isl.x, 14.5, isl.z);

      const crystalGeo = new THREE.OctahedronGeometry(2.2, 0);
      const crystalMat = new THREE.MeshPhongMaterial({
        color: isl.beaconColor,
        emissive: isl.beaconColor,
        emissiveIntensity: 0.45,
        shininess: 90
      });
      const crystal = new THREE.Mesh(crystalGeo, crystalMat);
      crystal.userData = { islandId: isl.id };
      beaconGroup.add(crystal);

      const ringGeo = new THREE.TorusGeometry(3.4, 0.22, 8, 28);
      ringGeo.rotateX(Math.PI / 2);
      const ringMat = new THREE.MeshBasicMaterial({ color: 0xFFFDF7 });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.userData = { islandId: isl.id };
      beaconGroup.add(ring);

      // Hitbox silinder transparan agar mudah diklik dari jauh
      const hitGeo = new THREE.CylinderGeometry(8, 8, 18, 12);
      const hitMat = new THREE.MeshBasicMaterial({ visible: false });
      const hitMesh = new THREE.Mesh(hitGeo, hitMat);
      hitMesh.position.y = -5;
      hitMesh.userData = { islandId: isl.id };
      beaconGroup.add(hitMesh);

      this.scene.add(beaconGroup);
      this.beacons.push({ group: beaconGroup, crystal, ring, hitMesh, island: isl });
      this.scene.add(group);
    });

    // Pulau-pulau kecil dekoratif tambahan khas gugusan Kei
    const islets = [
      { x: -85, z: 25, r: 9 },
      { x: 85, z: 30, r: 10 },
      { x: 0, z: -78, r: 12 },
      { x: -65, z: 75, r: 8 },
      { x: 70, z: -80, r: 9 }
    ];
    islets.forEach(item => {
      const g = new THREE.Group();
      g.position.set(item.x, 0, item.z);
      const s = new THREE.Mesh(
        new THREE.CylinderGeometry(item.r - 1, item.r + 2.5, 3, 16),
        new THREE.MeshLambertMaterial({ color: 0xFEF9EC })
      );
      s.position.y = -0.8;
      g.add(s);

      const gr = new THREE.Mesh(
        new THREE.ConeGeometry(item.r - 1.5, 4.5, 14),
        new THREE.MeshLambertMaterial({ color: 0x10B981 })
      );
      gr.position.y = 2.2;
      g.add(gr);

      const palm = this.createPalmTree();
      palm.position.set(0, 3.8, 0);
      g.add(palm);
      this.scene.add(g);
    });
  },

  createRahahanHouse(scale = 1) {
    const house = new THREE.Group();
    house.scale.set(scale, scale, scale);

    // Tiang Kolong Rumah Adat
    const poleGeo = new THREE.CylinderGeometry(0.22, 0.22, 1.6, 8);
    const woodMat = new THREE.MeshLambertMaterial({ color: 0x78350F });
    [[-2.2, -1.8], [2.2, -1.8], [-2.2, 1.8], [2.2, 1.8]].forEach(([px, pz]) => {
      const p = new THREE.Mesh(poleGeo, woodMat);
      p.position.set(px, 0.8, pz);
      house.add(p);
    });

    // Dinding Rumah Adat dengan Ornamen Merah-Putih-Emas
    const bodyGeo = new THREE.BoxGeometry(5, 2.4, 4.2);
    const bodyMat = new THREE.MeshLambertMaterial({ color: 0xFEF3C7 });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 2.6;
    body.castShadow = true;
    house.add(body);

    // Sabuk Ornamen Adat Merah & Emas
    const beltGeo = new THREE.BoxGeometry(5.15, 0.4, 4.35);
    const beltMat = new THREE.MeshLambertMaterial({ color: 0xB91C1C });
    const belt = new THREE.Mesh(beltGeo, beltMat);
    belt.position.y = 2.0;
    house.add(belt);

    // Atap Rumbia Tinggi Khas Rahahan Kei
    const roofGeo = new THREE.ConeGeometry(4.4, 3.4, 4);
    roofGeo.rotateY(Math.PI / 4);
    const roofMat = new THREE.MeshLambertMaterial({ color: 0x92400E });
    const roof = new THREE.Mesh(roofGeo, roofMat);
    roof.position.y = 5.4;
    roof.castShadow = true;
    house.add(roof);

    // Puncak Mahkota Emas Atap
    const topGeo = new THREE.SphereGeometry(0.4, 10, 10);
    const topMat = new THREE.MeshLambertMaterial({ color: 0xD97706 });
    const top = new THREE.Mesh(topGeo, topMat);
    top.position.y = 7.2;
    house.add(top);

    return house;
  },

  createPalmTree() {
    const palm = new THREE.Group();
    const trunkGeo = new THREE.CylinderGeometry(0.22, 0.38, 4.5, 7);
    const trunkMat = new THREE.MeshLambertMaterial({ color: 0x854D0E });
    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.position.y = 2.2;
    trunk.rotation.z = 0.08;
    palm.add(trunk);

    const crown = new THREE.Group();
    crown.position.set(-0.2, 4.4, 0);
    const leafGeo = new THREE.ConeGeometry(0.55, 2.6, 5);
    leafGeo.rotateZ(Math.PI / 2);
    const leafMat = new THREE.MeshLambertMaterial({ color: 0x059669 });

    for (let i = 0; i < 6; i++) {
      const leaf = new THREE.Mesh(leafGeo, leafMat);
      const a = (i / 6) * Math.PI * 2;
      leaf.rotation.y = a;
      leaf.rotation.z = -0.35;
      leaf.position.set(Math.cos(a) * 1.1, 0, Math.sin(a) * 1.1);
      crown.add(leaf);
    }
    palm.add(crown);
    this.palmLeaves.push(crown);
    return palm;
  },

  createHawearPole() {
    const group = new THREE.Group();
    // Tiang Bambu Kuning
    const poleGeo = new THREE.CylinderGeometry(0.18, 0.22, 8.5, 8);
    const poleMat = new THREE.MeshLambertMaterial({ color: 0xCA8A04 });
    const pole = new THREE.Mesh(poleGeo, poleMat);
    pole.position.y = 1.5;
    group.add(pole);

    // Janur Daun Kelapa Kuning (Hawear Balwirin)
    const janurGeo = new THREE.ConeGeometry(1.1, 2.5, 6);
    const janurMat = new THREE.MeshLambertMaterial({ color: 0xFACC15 });
    const janur = new THREE.Mesh(janurGeo, janurMat);
    janur.position.y = 4.6;
    group.add(janur);

    // Pita Merah Puncak Hawear
    const tipGeo = new THREE.SphereGeometry(0.35, 8, 8);
    const tipMat = new THREE.MeshBasicMaterial({ color: 0xB91C1C });
    const tip = new THREE.Mesh(tipGeo, tipMat);
    tip.position.y = 5.9;
    group.add(tip);

    return group;
  },

  createGongAndTifa() {
    const group = new THREE.Group();
    const frameMat = new THREE.MeshLambertMaterial({ color: 0xB91C1C });
    const p1 = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 2.6, 8), frameMat);
    p1.position.set(-1.1, 1.3, 0);
    const p2 = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 2.6, 8), frameMat);
    p2.position.set(1.1, 1.3, 0);
    const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 2.6, 8), frameMat);
    bar.rotation.z = Math.PI / 2;
    bar.position.set(0, 2.5, 0);
    group.add(p1, p2, bar);

    // Gong Emas
    const gong = new THREE.Mesh(
      new THREE.CylinderGeometry(0.75, 0.75, 0.18, 16),
      new THREE.MeshPhongMaterial({ color: 0xF59E0B, shininess: 100 })
    );
    gong.rotation.x = Math.PI / 2;
    gong.position.set(0, 1.5, 0);
    group.add(gong);
    this.tifaDrummers.push(gong);

    return group;
  },

  createUnderwaterBiota() {
    // 1. Terumbu Karang Warna-Warni di Dasar Laut & Teluk Sasi
    const coralColors = [0xF43F5E, 0xF59E0B, 0x10B981, 0xA855F7, 0xFB7185];
    for (let i = 0; i < 55; i++) {
      const cGeo = new THREE.DodecahedronGeometry(0.8 + Math.random() * 1.1, 0);
      const cMat = new THREE.MeshLambertMaterial({
        color: coralColors[i % coralColors.length]
      });
      const coral = new THREE.Mesh(cGeo, cMat);
      // Sebagian besar di sekitar Pulau 2 (Teluk Sasi) dan tengah laut
      const nearSasi = i < 25;
      const cx = nearSasi ? 52 + (Math.random() - 0.5) * 45 : (Math.random() - 0.5) * 140;
      const cz = nearSasi ? -32 + (Math.random() - 0.5) * 45 : (Math.random() - 0.5) * 140;
      coral.position.set(cx, -3.7, cz);
      this.scene.add(coral);
    }

    // 2. Kawanan Ikan Lompa 3D (Berenang di bawah permukaan air jernih)
    const fishGeo = new THREE.ConeGeometry(0.32, 1.25, 6);
    fishGeo.rotateX(Math.PI / 2);
    const fishMat = new THREE.MeshPhongMaterial({ color: 0x38BDF8, shininess: 80 });

    for (let i = 0; i < 40; i++) {
      const fish = new THREE.Mesh(fishGeo, fishMat);
      const centerX = i < 24 ? 52 : (Math.random() - 0.5) * 90;
      const centerZ = i < 24 ? -32 : (Math.random() - 0.5) * 90;
      const radius = 17 + Math.random() * 14;
      const angle = Math.random() * Math.PI * 2;
      const speed = 0.6 + Math.random() * 0.7;
      fish.position.set(centerX + Math.cos(angle) * radius, -1.3 - Math.random() * 1.5, centerZ + Math.sin(angle) * radius);
      this.scene.add(fish);
      this.fishes.push({ mesh: fish, centerX, centerZ, radius, angle, speed });
    }

    // 3. Teripang & Kerang Lola 3D di Dasar Teluk Sasi (Pulau 2)
    const teripangGeo = new THREE.CylinderGeometry(0.3, 0.3, 1.3, 8);
    teripangGeo.rotateZ(Math.PI / 2);
    const teripangMat = new THREE.MeshLambertMaterial({ color: 0x451A03 });
    for (let i = 0; i < 16; i++) {
      const tMesh = new THREE.Mesh(teripangGeo, teripangMat);
      const a = (i / 16) * Math.PI * 2;
      const r = 18 + (i % 3) * 4;
      tMesh.position.set(52 + Math.cos(a) * r, -3.8, -32 + Math.sin(a) * r);
      tMesh.rotation.y = Math.random() * Math.PI;
      this.scene.add(tMesh);
      this.teripangs.push(tMesh);
    }

    const lolaGeo = new THREE.ConeGeometry(0.45, 0.85, 8);
    const lolaMat = new THREE.MeshLambertMaterial({ color: 0xB91C1C });
    for (let i = 0; i < 16; i++) {
      const lMesh = new THREE.Mesh(lolaGeo, lolaMat);
      const a = (i / 16) * Math.PI * 2 + 0.2;
      const r = 19 + (i % 2) * 3.5;
      lMesh.position.set(52 + Math.cos(a) * r, -3.7, -32 + Math.sin(a) * r);
      this.scene.add(lMesh);
      this.lolas.push(lMesh);
    }
  },

  // Perahu Belang 3D Khas Kei (Ornamen Merah-Putih-Emas + Dayung Bergerak)
  createBelangBoat() {
    this.belang = new THREE.Group();
    this.belang.position.set(this.boatState.x, 0.35, this.boatState.z);

    // Lambung Utama Perahu (Merah Sirih Pinang & Putih Pasir)
    const hullGeo = new THREE.BoxGeometry(2.1, 0.9, 8.2);
    const hullMat = new THREE.MeshLambertMaterial({ color: 0xB91C1C });
    const hull = new THREE.Mesh(hullGeo, hullMat);
    hull.position.y = 0.25;
    hull.castShadow = true;
    this.belang.add(hull);

    // Garis Sabuk Putih & Emas Khas Belang Evav
    const whiteStripe = new THREE.Mesh(
      new THREE.BoxGeometry(2.18, 0.25, 8.25),
      new THREE.MeshLambertMaterial({ color: 0xFFFDF7 })
    );
    whiteStripe.position.y = 0.45;
    this.belang.add(whiteStripe);

    const goldStripe = new THREE.Mesh(
      new THREE.BoxGeometry(2.2, 0.14, 8.28),
      new THREE.MeshLambertMaterial({ color: 0xD97706 })
    );
    goldStripe.position.y = 0.62;
    this.belang.add(goldStripe);

    // Haluan & Buritan Melengkung Tinggi (Ngit)
    const prowGeo = new THREE.ConeGeometry(0.65, 3.2, 6);
    const prowMat = new THREE.MeshLambertMaterial({ color: 0xB91C1C });
    const frontProw = new THREE.Mesh(prowGeo, prowMat);
    frontProw.position.set(0, 1.4, -4.4);
    frontProw.rotation.x = -0.35;
    this.belang.add(frontProw);

    const backProw = new THREE.Mesh(prowGeo, prowMat);
    backProw.position.set(0, 1.2, 4.4);
    backProw.rotation.x = 0.35;
    this.belang.add(backProw);

    // Mahkota Emas & Bendera Adat di Ujung Haluan
    const finial = new THREE.Mesh(
      new THREE.SphereGeometry(0.32, 8, 8),
      new THREE.MeshLambertMaterial({ color: 0xF59E0B })
    );
    finial.position.set(0, 2.7, -4.9);
    this.belang.add(finial);

    const flagGeo = new THREE.PlaneGeometry(1.3, 0.65);
    const flagMat = new THREE.MeshBasicMaterial({ color: 0xD97706, side: THREE.DoubleSide });
    this.flagMesh = new THREE.Mesh(flagGeo, flagMat);
    this.flagMesh.position.set(0, 2.5, -4.2);
    this.flagMesh.rotation.y = Math.PI / 2;
    this.belang.add(this.flagMesh);

    // Para Pendayung & 8 Dayung Bergerak (4 Kiri, 4 Kanan)
    this.oars = [];
    const oarPositionsZ = [-2.2, -0.7, 0.8, 2.3];
    oarPositionsZ.forEach((pz, idx) => {
      // Pendayung 3D di tengah perahu
      const body = new THREE.Mesh(
        new THREE.CylinderGeometry(0.28, 0.32, 0.9, 8),
        new THREE.MeshLambertMaterial({ color: idx % 2 === 0 ? 0xFFFDF7 : 0xB91C1C })
      );
      body.position.set(0, 1.0, pz);
      this.belang.add(body);

      const head = new THREE.Mesh(
        new THREE.SphereGeometry(0.25, 8, 8),
        new THREE.MeshLambertMaterial({ color: 0x8D5524 })
      );
      head.position.set(0, 1.65, pz);
      this.belang.add(head);

      // Dayung Kiri & Kanan
      [-1, 1].forEach(side => {
        const oarPivot = new THREE.Group();
        oarPivot.position.set(side * 1.1, 0.7, pz);

        const shaft = new THREE.Mesh(
          new THREE.CylinderGeometry(0.06, 0.08, 2.6, 6),
          new THREE.MeshLambertMaterial({ color: 0x78350F })
        );
        shaft.position.set(side * 0.75, -0.5, 0);
        shaft.rotation.z = -side * 0.75;
        oarPivot.add(shaft);

        const blade = new THREE.Mesh(
          new THREE.BoxGeometry(0.25, 0.6, 0.08),
          new THREE.MeshLambertMaterial({ color: 0xF59E0B })
        );
        blade.position.set(side * 1.5, -1.2, 0);
        blade.rotation.z = -side * 0.75;
        oarPivot.add(blade);

        this.belang.add(oarPivot);
        this.oars.push({ pivot: oarPivot, side, phase: idx * 0.5 });
      });
    });

    this.scene.add(this.belang);
  },

  createSkyClouds() {
    const cloudMat = new THREE.MeshLambertMaterial({ color: 0xFFFFFF });
    for (let i = 0; i < 14; i++) {
      const cg = new THREE.Group();
      for (let j = 0; j < 3; j++) {
        const puff = new THREE.Mesh(new THREE.DodecahedronGeometry(3.5 + j * 1.2, 1), cloudMat);
        puff.position.set(j * 3.5, (j % 2) * 0.8, 0);
        cg.add(puff);
      }
      cg.position.set((Math.random() - 0.5) * 260, 36 + Math.random() * 14, (Math.random() - 0.5) * 260);
      this.scene.add(cg);
      this.clouds.push({ mesh: cg, speed: 1.5 + Math.random() * 1.5 });
    }
  },

  spawnWakeRing() {
    const ringGeo = new THREE.RingGeometry(0.6, 1.1, 16);
    ringGeo.rotateX(-Math.PI / 2);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xFFFDF7,
      transparent: true,
      opacity: 0.65,
      side: THREE.DoubleSide
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.position.set(this.boatState.x, 0.15, this.boatState.z);
    this.scene.add(ring);
    this.wakeRings.push({ mesh: ring, scale: 1, alpha: 0.65 });
  },

  // Sinkronisasi Visual Ekosistem 3D Teluk Sasi (Pulau 2)
  updateSasiEcosystem3D(ecoHealth, isSasiClosed) {
    if (!this.waterMesh) return;

    // 1. Kejernihan & Warna Air Laut 3D
    if (ecoHealth >= 70) {
      this.waterMesh.material.color.setHex(0x0284C7); // Biru Laut Jernih
      this.waterMesh.material.opacity = 0.68;
    } else if (ecoHealth >= 45) {
      this.waterMesh.material.color.setHex(0x0E7490);
      this.waterMesh.material.opacity = 0.76;
    } else {
      this.waterMesh.material.color.setHex(0x4D7C5D); // Air Keruh saat Ekosistem Rusak
      this.waterMesh.material.opacity = 0.88;
    }

    // 2. Jumlah Ikan Lompa, Teripang, dan Kerang Lola 3D yang Tampak
    const activeFishCount = Math.max(4, Math.round((ecoHealth / 100) * this.fishes.length));
    this.fishes.forEach((f, idx) => {
      f.mesh.visible = idx < activeFishCount;
    });

    const activeBenthicCount = Math.max(2, Math.round((ecoHealth / 100) * this.teripangs.length));
    this.teripangs.forEach((t, idx) => {
      t.visible = idx < activeBenthicCount;
    });
    this.lolas.forEach((l, idx) => {
      l.visible = idx < activeBenthicCount;
    });

    // 3. Penanda Bambu Sasi (Hawear) Tertancap / Terangkat
    this.hawearPoles.forEach(pole => {
      pole.visible = isSasiClosed;
    });
  },

  // Kembang Api 3D di Kampung Maren (Pulau 3) saat Semangat Ain Ni Ain Penuh
  launchFireworks3D() {
    const colors = [0xF59E0B, 0x10B981, 0x38BDF8, 0xF43F5E, 0xFDE047];
    for (let b = 0; b < 4; b++) {
      setTimeout(() => {
        if (typeof audio !== 'undefined') audio.playFirework();
        const fx = (Math.random() - 0.5) * 24;
        const fy = 16 + Math.random() * 10;
        const fz = 52 + (Math.random() - 0.5) * 16;
        const color = colors[b % colors.length];

        for (let p = 0; p < 24; p++) {
          const pMesh = new THREE.Mesh(
            new THREE.SphereGeometry(0.35, 6, 6),
            new THREE.MeshBasicMaterial({ color })
          );
          pMesh.position.set(fx, fy, fz);
          const theta = Math.random() * Math.PI * 2;
          const phi = Math.random() * Math.PI;
          const speed = 6 + Math.random() * 8;
          this.scene.add(pMesh);
          this.fireworks.push({
            mesh: pMesh,
            vx: Math.sin(phi) * Math.cos(theta) * speed,
            vy: Math.cos(phi) * speed,
            vz: Math.sin(phi) * Math.sin(theta) * speed,
            life: 1.4
          });
        }
      }, b * 350);
    }
  },

  // Navigasi Fast-Travel atau Klik Suar 3D
  sailToIsland(islandId, openImmediately = false) {
    const target = this.islandsData.find(i => i.id === islandId);
    if (!target) return;
    this.cameraMode = 'explore';

    // Titik berlabuh di depan dermaga pulau
    const angleToCenter = Math.atan2(-target.x, -target.z);
    const dockX = target.x + Math.sin(angleToCenter) * (target.radius + 7);
    const dockZ = target.z + Math.cos(angleToCenter) * (target.radius + 7);

    this.boatState.autoTarget = {
      x: dockX,
      z: dockZ,
      islandId: target.id,
      openImmediately
    };
  },

  focusCameraOnIsland(islandId) {
    this.cameraMode = islandId || 'explore';
  },

  setupInputs() {
    // 1. Keyboard WASD & Arrow Keys
    window.addEventListener('keydown', (e) => {
      if (['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) return;
      const k = e.key.toLowerCase();
      if (k === 'w' || e.key === 'ArrowUp') { this.keys.forward = true; this.boatState.autoTarget = null; }
      if (k === 's' || e.key === 'ArrowDown') { this.keys.backward = true; this.boatState.autoTarget = null; }
      if (k === 'a' || e.key === 'ArrowLeft') { this.keys.left = true; this.boatState.autoTarget = null; }
      if (k === 'd' || e.key === 'ArrowRight') { this.keys.right = true; this.boatState.autoTarget = null; }
      if (e.key === 'Enter' && this.boatState.nearIsland && this.cameraMode === 'explore') {
        if (typeof openIslandMission === 'function') openIslandMission(this.boatState.nearIsland.id);
      }
    });

    window.addEventListener('keyup', (e) => {
      const k = e.key.toLowerCase();
      if (k === 'w' || e.key === 'ArrowUp') this.keys.forward = false;
      if (k === 's' || e.key === 'ArrowDown') this.keys.backward = false;
      if (k === 'a' || e.key === 'ArrowLeft') this.keys.left = false;
      if (k === 'd' || e.key === 'ArrowRight') this.keys.right = false;
    });

    // 2. Raycasting Klik pada Suar 3D di Layar
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    this.renderer.domElement.addEventListener('pointerdown', (e) => {
      if (this.cameraMode !== 'explore') return;
      const isRotatedPortrait = window.matchMedia('(max-width: 767px) and (orientation: portrait)').matches;
      if (isRotatedPortrait) {
        // Wadah #app-shell diputar 90deg searah jarum jam saat HP portrait
        mouse.x = (e.clientY / window.innerHeight) * 2 - 1;
        mouse.y = (e.clientX / window.innerWidth) * 2 - 1;
      } else {
        const rect = this.renderer.domElement.getBoundingClientRect();
        mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      }

      raycaster.setFromCamera(mouse, this.camera);
      const clickableMeshes = [];
      this.beacons.forEach(b => clickableMeshes.push(b.crystal, b.ring, b.hitMesh));
      const intersects = raycaster.intersectObjects(clickableMeshes, false);

      if (intersects.length > 0) {
        const hitIslandId = intersects[0].object.userData?.islandId;
        if (hitIslandId) {
          if (typeof audio !== 'undefined') audio.playClick();
          this.sailToIsland(hitIslandId, true);
        }
      }
    });
  },

  setDPad(dir, isPressed) {
    if (this.keys.hasOwnProperty(dir)) {
      this.keys[dir] = isPressed;
      if (isPressed) this.boatState.autoTarget = null;
    }
  },

  onResize() {
    if (!this.camera || !this.renderer) return;
    const container = document.getElementById('webgl-container');
    const w = (container && container.clientWidth) ? container.clientWidth : window.innerWidth;
    const h = (container && container.clientHeight) ? container.clientHeight : window.innerHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  },

  animate() {
    requestAnimationFrame(() => this.animate());
    if (!this.scene || !this.camera || !this.renderer) return;

    const dt = Math.min(this.clock.getDelta(), 0.1);
    const elapsed = this.clock.getElapsedTime();

    // 1. Animasi Gelombang Laut Vertex
    if (this.waterMesh) {
      const pos = this.waterMesh.geometry.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const vx = pos.getX(i);
        const vz = pos.getZ(i);
        const waveY = Math.sin(vx * 0.08 + elapsed * 2.0) * 0.28 + Math.cos(vz * 0.08 + elapsed * 1.6) * 0.25;
        pos.setY(i, waveY);
      }
      pos.needsUpdate = true;
    }

    // 2. Animasi Suar Misi 3D, Daun Kelapa, Awan & Ikan Lompa
    this.beacons.forEach((b, idx) => {
      b.crystal.rotation.y = elapsed * 1.5 + idx;
      b.crystal.position.y = Math.sin(elapsed * 2.5 + idx) * 0.8;
      b.ring.scale.setScalar(1 + Math.sin(elapsed * 3 + idx) * 0.12);
    });

    this.palmLeaves.forEach((crown, idx) => {
      crown.rotation.z = Math.sin(elapsed * 1.6 + idx) * 0.05;
    });

    this.clouds.forEach(c => {
      c.mesh.position.x += c.speed * dt;
      if (c.mesh.position.x > 140) c.mesh.position.x = -140;
    });

    this.fishes.forEach(f => {
      if (!f.mesh.visible) return;
      f.angle += f.speed * dt * 0.5;
      const nx = f.centerX + Math.cos(f.angle) * f.radius;
      const nz = f.centerZ + Math.sin(f.angle) * f.radius;
      f.mesh.lookAt(nx, f.mesh.position.y, nz);
      f.mesh.position.x = nx;
      f.mesh.position.z = nz;
    });

    // 3. Pergerakan Perahu Belang 3D & Dayung
    let isMoving = false;
    if (this.boatState.autoTarget) {
      const dx = this.boatState.autoTarget.x - this.boatState.x;
      const dz = this.boatState.autoTarget.z - this.boatState.z;
      const dist = Math.hypot(dx, dz);

      if (dist > 2.2) {
        const targetAngle = Math.atan2(-dx, -dz);
        // Rotasi mulus menuju target
        let diff = targetAngle - this.boatState.rotation;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        this.boatState.rotation += diff * 5 * dt;

        const moveSpeed = 24;
        this.boatState.x += (dx / dist) * moveSpeed * dt;
        this.boatState.z += (dz / dist) * moveSpeed * dt;
        isMoving = true;
      } else {
        const finishedTarget = this.boatState.autoTarget;
        this.boatState.autoTarget = null;
        if (finishedTarget.openImmediately && typeof openIslandMission === 'function') {
          openIslandMission(finishedTarget.islandId);
        }
      }
    } else if (this.cameraMode === 'explore') {
      // Kontrol Manual WASD / Panah / Virtual D-Pad
      if (this.keys.left) this.boatState.rotation += 1.8 * dt;
      if (this.keys.right) this.boatState.rotation -= 1.8 * dt;

      if (this.keys.forward) {
        this.boatState.speed = THREE.MathUtils.lerp(this.boatState.speed, 22, 4 * dt);
      } else if (this.keys.backward) {
        this.boatState.speed = THREE.MathUtils.lerp(this.boatState.speed, -10, 4 * dt);
      } else {
        this.boatState.speed = THREE.MathUtils.lerp(this.boatState.speed, 0, 5 * dt);
      }

      if (Math.abs(this.boatState.speed) > 0.4) {
        isMoving = true;
        const nx = this.boatState.x - Math.sin(this.boatState.rotation) * this.boatState.speed * dt;
        const nz = this.boatState.z - Math.cos(this.boatState.rotation) * this.boatState.speed * dt;

        // Cek tabrakan daratan pulau agar perahu tidak menembus pulau
        let blocked = false;
        for (const isl of this.islandsData) {
          if (Math.hypot(nx - isl.x, nz - isl.z) < isl.radius + 2.5) {
            blocked = true;
            break;
          }
        }
        if (!blocked) {
          this.boatState.x = THREE.MathUtils.clamp(nx, -145, 145);
          this.boatState.z = THREE.MathUtils.clamp(nz, -145, 145);
        }
      }
    }

    if (this.belang) {
      this.belang.position.x = this.boatState.x;
      this.belang.position.z = this.boatState.z;
      this.belang.position.y = 0.35 + Math.sin(elapsed * 3.2) * 0.14;
      this.belang.rotation.y = this.boatState.rotation;
      this.belang.rotation.x = Math.sin(elapsed * 2.6) * 0.03;

      // Ayunan Dayung Perahu Belang
      const oarSpeed = isMoving ? 9.5 : 2.0;
      const oarAmp = isMoving ? 0.55 : 0.08;
      this.oars.forEach(o => {
        o.pivot.rotation.x = Math.sin(elapsed * oarSpeed + o.phase) * oarAmp;
      });

      // Jejak Riak Air
      if (isMoving) {
        this.wakeTimer += dt;
        if (this.wakeTimer > 0.18) {
          this.wakeTimer = 0;
          this.spawnWakeRing();
        }
      }
    }

    // Update Riak Air (Wake Rings)
    for (let i = this.wakeRings.length - 1; i >= 0; i--) {
      const r = this.wakeRings[i];
      r.scale += dt * 3.2;
      r.alpha -= dt * 0.55;
      r.mesh.scale.setScalar(r.scale);
      r.mesh.material.opacity = Math.max(0, r.alpha);
      if (r.alpha <= 0) {
        this.scene.remove(r.mesh);
        this.wakeRings.splice(i, 1);
      }
    }

    // Update Partikel Kembang Api 3D
    for (let i = this.fireworks.length - 1; i >= 0; i--) {
      const fw = this.fireworks[i];
      fw.mesh.position.x += fw.vx * dt;
      fw.mesh.position.y += fw.vy * dt;
      fw.mesh.position.z += fw.vz * dt;
      fw.vy -= 9.8 * dt;
      fw.life -= dt;
      fw.mesh.scale.setScalar(Math.max(0.1, fw.life));
      if (fw.life <= 0) {
        this.scene.remove(fw.mesh);
        this.fireworks.splice(i, 1);
      }
    }

    // 4. Cek Jarak Perahu dengan 3 Pulau Misi
    let closest = null;
    let minDist = Infinity;
    this.islandsData.forEach(isl => {
      const d = Math.hypot(this.boatState.x - isl.x, this.boatState.z - isl.z);
      if (d < minDist) {
        minDist = d;
        closest = isl;
      }
    });

    const promptBox = document.getElementById('island-proximity-prompt');
    if (closest && minDist < closest.radius + 15 && this.cameraMode === 'explore') {
      this.boatState.nearIsland = closest;
      if (promptBox) {
        promptBox.classList.remove('hidden');
        document.getElementById('proximity-island-name').textContent = closest.name;
        document.getElementById('proximity-island-sub').textContent = closest.subtitle;
      }
    } else {
      this.boatState.nearIsland = null;
      if (promptBox) promptBox.classList.add('hidden');
    }

    // 5. Pergerakan Kamera Dinamis Sesuai Mode
    if (this.cameraMode === 'cinematic') {
      this.cinematicAngle += dt * 0.22;
      this.camera.position.x = Math.sin(this.cinematicAngle) * 78;
      this.camera.position.z = Math.cos(this.cinematicAngle) * 78;
      this.camera.position.y = 32;
      this.camera.lookAt(0, 2, 0);
    } else if (this.cameraMode === 'explore') {
      // Kamera Chase di belakang Perahu Belang
      const camDist = 22;
      const camHeight = 12.5;
      const targetCamX = this.boatState.x + Math.sin(this.boatState.rotation) * camDist;
      const targetCamZ = this.boatState.z + Math.cos(this.boatState.rotation) * camDist;
      this.camera.position.lerp(new THREE.Vector3(targetCamX, camHeight, targetCamZ), 5 * dt);
      this.camera.lookAt(this.boatState.x, 2.2, this.boatState.z);
    } else if (this.cameraMode === 'island1') {
      this.camera.position.lerp(new THREE.Vector3(-36, 16, -12), 4 * dt);
      this.camera.lookAt(-52, 4, -32);
    } else if (this.cameraMode === 'island2') {
      // Kamera menghadap Teluk Sasi agar air laut 3D, ikan lompa, & bambu Hawear tampak jelas
      this.camera.position.lerp(new THREE.Vector3(35, 18, -8), 4 * dt);
      this.camera.lookAt(52, 0, -32);
    } else if (this.cameraMode === 'island3') {
      this.camera.position.lerp(new THREE.Vector3(0, 17, 26), 4 * dt);
      this.camera.lookAt(0, 5, 52);
    }

    this.renderer.render(this.scene, this.camera);
  }
};

// ========================================================
// PENAMPIL ARTEFAK 3D BEROTASI (UNTUK PULAU 3: TEBAK ARTEFAK)
// ========================================================
const Artifact3DViewer = {
  scene: null,
  camera: null,
  renderer: null,
  currentMesh: null,
  isInitialized: false,

  init() {
    const canvas = document.getElementById('artifact-3d-canvas');
    if (!canvas || typeof THREE === 'undefined') return;
    if (this.isInitialized) return;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xE0F2FE);

    this.camera = new THREE.PerspectiveCamera(42, canvas.clientWidth / canvas.clientHeight, 0.1, 100);
    this.camera.position.set(0, 2.5, 7.2);
    this.camera.lookAt(0, 0.4, 0);

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.renderer.setSize(canvas.clientWidth || 320, canvas.clientHeight || 200);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

    const amb = new THREE.HemisphereLight(0xFFFFFF, 0x0284C7, 0.9);
    const dir = new THREE.DirectionalLight(0xFFFBEB, 1.1);
    dir.position.set(5, 10, 7);
    this.scene.add(amb, dir);

    this.isInitialized = true;
    this.animate();
  },

  showArtifact(type) {
    if (!this.isInitialized) this.init();
    if (!this.scene) return;

    if (this.currentMesh) {
      this.scene.remove(this.currentMesh);
    }

    const group = new THREE.Group();

    if (type === 'belang') {
      // Miniatur Perahu Belang 3D
      const hull = new THREE.Mesh(
        new THREE.BoxGeometry(1.1, 0.55, 3.8),
        new THREE.MeshLambertMaterial({ color: 0xB91C1C })
      );
      const stripe = new THREE.Mesh(
        new THREE.BoxGeometry(1.15, 0.18, 3.85),
        new THREE.MeshLambertMaterial({ color: 0xFFFDF7 })
      );
      stripe.position.y = 0.15;
      const prow1 = new THREE.Mesh(
        new THREE.ConeGeometry(0.35, 1.5, 6),
        new THREE.MeshLambertMaterial({ color: 0xD97706 })
      );
      prow1.position.set(0, 0.7, -1.9);
      const prow2 = prow1.clone();
      prow2.position.set(0, 0.7, 1.9);
      group.add(hull, stripe, prow1, prow2);
    } else if (type === 'rahahan') {
      // Miniatur Rumah Adat Rahahan 3D
      const h = World3D.createRahahanHouse(0.45);
      h.position.y = -1.3;
      group.add(h);
    } else if (type === 'hawear') {
      // Miniatur Janur Sasi Hawear 3D
      const pole = new THREE.Mesh(
        new THREE.CylinderGeometry(0.14, 0.16, 3.4, 8),
        new THREE.MeshLambertMaterial({ color: 0xCA8A04 })
      );
      const janur = new THREE.Mesh(
        new THREE.ConeGeometry(0.95, 2.0, 6),
        new THREE.MeshLambertMaterial({ color: 0xFACC15 })
      );
      janur.position.y = 0.9;
      const tip = new THREE.Mesh(
        new THREE.SphereGeometry(0.28, 8, 8),
        new THREE.MeshLambertMaterial({ color: 0xB91C1C })
      );
      tip.position.y = 1.95;
      group.add(pole, janur, tip);
    } else if (type === 'tifa') {
      // Tifa & Gong Perunggu 3D
      const tifa = new THREE.Mesh(
        new THREE.CylinderGeometry(0.55, 0.38, 2.2, 14),
        new THREE.MeshLambertMaterial({ color: 0x78350F })
      );
      tifa.rotation.z = 0.35;
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(0.56, 0.08, 8, 18),
        new THREE.MeshLambertMaterial({ color: 0xD97706 })
      );
      ring.rotation.x = Math.PI / 2;
      ring.rotation.y = 0.35;
      ring.position.set(-0.35, 0.9, 0);
      group.add(tifa, ring);
    } else if (type === 'enbal') {
      // Cetakan Batu & Gepe Enbal Tradisional 3D
      const plate = new THREE.Mesh(
        new THREE.CylinderGeometry(1.4, 1.2, 0.35, 18),
        new THREE.MeshLambertMaterial({ color: 0x92400E })
      );
      const bread1 = new THREE.Mesh(
        new THREE.BoxGeometry(1.1, 0.18, 1.1),
        new THREE.MeshLambertMaterial({ color: 0xFFFDF7 })
      );
      bread1.position.y = 0.28;
      const bread2 = bread1.clone();
      bread2.position.set(0.2, 0.45, -0.15);
      bread2.rotation.y = 0.4;
      group.add(plate, bread1, bread2);
    } else {
      // Kerang Lola & Mutiara Laut Kei 3D
      const shell = new THREE.Mesh(
        new THREE.ConeGeometry(1.2, 2.2, 12),
        new THREE.MeshPhongMaterial({ color: 0xB91C1C, shininess: 90 })
      );
      const pearl = new THREE.Mesh(
        new THREE.SphereGeometry(0.42, 16, 16),
        new THREE.MeshPhongMaterial({ color: 0xFFFDF7, shininess: 120 })
      );
      pearl.position.set(1.1, -0.6, 0.5);
      group.add(shell, pearl);
    }

    this.currentMesh = group;
    this.scene.add(group);
  },

  animate() {
    requestAnimationFrame(() => this.animate());
    if (!this.renderer || !this.scene || !this.camera) return;
    const canvas = this.renderer.domElement;
    if (canvas && canvas.clientWidth > 0 && canvas.width !== canvas.clientWidth) {
      this.renderer.setSize(canvas.clientWidth, canvas.clientHeight || 190, false);
      this.camera.aspect = canvas.clientWidth / (canvas.clientHeight || 190);
      this.camera.updateProjectionMatrix();
    }
    if (this.currentMesh) {
      this.currentMesh.rotation.y += 0.018;
    }
    this.renderer.render(this.scene, this.camera);
  }
};
