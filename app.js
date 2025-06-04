const btnRegister = document.getElementById('btn-register');
const btnLogin = document.getElementById('btn-login');
const btnLogout = document.getElementById('btn-logout');
const btnMine = document.getElementById('btn-mine');
const btnSpin = document.getElementById('btn-spin');
const authSection = document.getElementById('auth-section');
const gameSection = document.getElementById('game-section');
const displayUsername = document.getElementById('display-username');
const coinsEl = document.getElementById('coins');
const gachaResult = document.getElementById('gacha-result');
const inventoryEl = document.getElementById('inventory');

let currentUser = null;
let userData = {
  username: '',
  coins: 0,
  inventory: []
};

// Register user
btnRegister.addEventListener('click', async () => {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const username = document.getElementById('username').value;

  if(!email || !password || !username) return alert('Isi semua field!');

  try {
    const userCredential = await auth.createUserWithEmailAndPassword(email, password);
    currentUser = userCredential.user;
    // Simpan username & data awal ke Firestore
    await db.collection('users').doc(currentUser.uid).set({
      username,
      coins: 5000,  // mulai dengan 5000 coin
      inventory: []
    });
    loadUserData();
  } catch(err) {
    alert(err.message);
  }
});

// Login user
btnLogin.addEventListener('click', async () => {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  if(!email || !password) return alert('Isi semua field!');

  try {
    const userCredential = await auth.signInWithEmailAndPassword(email, password);
    currentUser = userCredential.user;
    loadUserData();
  } catch(err) {
    alert(err.message);
  }
});

// Logout
btnLogout.addEventListener('click', () => {
  auth.signOut();
  currentUser = null;
  authSection.style.display = 'block';
  gameSection.style.display = 'none';
});

// Load data user dari Firestore
async function loadUserData() {
  if(!currentUser) return;
  const doc = await db.collection('users').doc(currentUser.uid).get();
  if(!doc.exists) return alert('User data tidak ditemukan');
  userData = doc.data();
  displayUsername.textContent = userData.username;
  coinsEl.textContent = userData.coins;
  authSection.style.display = 'none';
  gameSection.style.display = 'block';
  renderInventory();
}

// Simpel mining klik dapat 1 coin + bonus dari item (belum dipasang)
btnMine.addEventListener('click', async () => {
  if(userData.coins === undefined) userData.coins = 0;
  userData.coins += 1;
  coinsEl.textContent = userData.coins;
  await updateUserData();
});

// Spin gacha bayar 1000 coin, dapat item random
btnSpin.addEventListener('click', async () => {
  if(userData.coins < 1000) return alert('Coin tidak cukup untuk spin!');
  userData.coins -= 1000;
  coinsEl.textContent = userData.coins;

  const item = spinGacha();
  userData.inventory.push(item);
  gachaResult.textContent = `Kamu mendapatkan: ${item.name} (${item.rarity})`;
  renderInventory();
  await updateUserData();
});

// Update data ke Firestore
async function updateUserData() {
  if(!currentUser) return;
  await db.collection('users').doc(currentUser.uid).update(userData);
}

// Render inventory di halaman
function renderInventory() {
  inventoryEl.innerHTML = '<h3>Inventory:</h3>';
  userData.inventory.forEach((item, index) => {
    const div = document.createElement('div');
    div.textContent = `${item.name} (${item.rarity})`;
    inventoryEl.appendChild(div);
  });
}

// Gacha item list dengan rarity dan rate (simple)
const gachaItems = [
  { name: "Pickaxe Biasa", rarity: "Common", rate: 40, effect: { coinBonus: 1 } },
  { name: "Pickaxe Perak", rarity: "Uncommon", rate: 25, effect: { coinBonus: 3 } },
  { name: "Pickaxe Emas", rarity: "Rare", rate: 15, effect: { coinBonus: 5 } },
  { name: "Energy Drink", rarity: "Uncommon", rate: 10, effect: { speedBoost: 2, duration: 300 } },
  { name: "Lucky Charm", rarity: "Rare", rate: 5, effect: { bonusChance: 0.3 } },
  { name: "Shield", rarity: "Rare", rate: 3, effect: { protectPenalty: true } },
  { name: "Mystery Box", rarity: "Legendary", rate: 1.5, effect: { mystery: true } },
  { name: "Golden Ticket", rarity: "Legendary", rate: 0.5, effect: { bonusCoin: 10000 } },
];

// Fungsi spin gacha random item sesuai rate
function spinGacha() {
  let rand = Math.random() * 100;
  let acc = 0;
  for (const item of gachaItems) {
    acc += item.rate;
    if (rand <= acc) return item;
  }
  return gachaItems[0];
}

// Cek user login state otomatis
auth.onAuthStateChanged(user => {
  if (user) {
    currentUser = user;
    loadUserData();
  } else {
    currentUser = null;
    authSection.style.display = 'block';
    gameSection.style.display = 'none';
  }
});
