// DOM elements
const authSection = document.getElementById('auth-section');
const gameSection = document.getElementById('game-section');
const usernameInput = document.getElementById('username');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const btnRegister = document.getElementById('btn-register');
const btnLogin = document.getElementById('btn-login');
const userDisplay = document.getElementById('user-display');
const coinsEl = document.getElementById('coins');
const btnMine = document.getElementById('btn-mine');
const btnStartAuto = document.getElementById('btn-start-auto');
const btnStopAuto = document.getElementById('btn-stop-auto');
const btnGacha = document.getElementById('btn-gacha');
const gachaResult = document.getElementById('gacha-result');
const inventoryEl = document.getElementById('inventory');
const leaderboardEl = document.querySelector('#leaderboard ul');
const btnLogout = document.getElementById('btn-logout');

let miningInterval = null;
let userData = null;

// Helper: Save user data to Firestore
async function saveUserData() {
  if (!userData || !userData.uid) return;
  await db.collection('users').doc(userData.uid).set(userData);
}

// Helper: Load user data from Firestore
async function loadUserData(uid) {
  const doc = await db.collection('users').doc(uid).get();
  if (doc.exists) {
    return doc.data();
  } else {
    // Data awal
    return {
      uid,
      username: '',
      coins: 0,
      inventory: [],
      level: 1,
      totalCoinsMined: 0,
      lastDailyReward: 0
    };
  }
}

// Generate random integer in range inclusive
function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Gacha items list
const gachaItems = [
  { id: 'pickaxe_common', name: 'Pickaxe (Common)', rarity: 'Common', chance: 50, effect: { coinBonus: 1 }},
  { id: 'pickaxe_rare', name: 'Pickaxe (Rare)', rarity: 'Rare', chance: 30, effect: { coinBonus: 3 }},
  { id: 'pickaxe_epic', name: 'Pickaxe (Epic)', rarity: 'Epic', chance: 15, effect: { coinBonus: 7 }},
  { id: 'pickaxe_legendary', name: 'Pickaxe (Legendary)', rarity: 'Legendary', chance: 5, effect: { coinBonus: 15 }},
  { id: 'energy_drink', name: 'Energy Drink', rarity: 'Common', chance: 50, effect: { speedBonus: 10 }},
  { id: 'golden_shovel', name: 'Golden Shovel', rarity: 'Epic', chance: 10, effect: { coinBonus: 10 }},
];

// Calculate cumulative chances for gacha
function pickGachaItem() {
  const totalChance = gachaItems.reduce((acc, i) => acc + i.chance, 0);
  let rand = Math.random() * totalChance;
  for (const item of gachaItems) {
    if (rand < item.chance) return item;
    rand -= item.chance;
  }
  return gachaItems[0];
}

// Update inventory UI
function updateInventory() {
  inventoryEl.innerHTML = '';
  userData.inventory.forEach(item => {
    const invDiv = document.createElement('div');
    invDiv.textContent = `${item.name} (${item.rarity})`;
    inventoryEl.appendChild(invDiv);
  });
}

// Update coins and display
function updateDisplay() {
  coinsEl.textContent = `Coins: ${userData.coins}`;
  userDisplay.textContent = userData.username;
  updateInventory();
}

// Mining logic (bonus dari items)
function calculateBonusCoin() {
  let bonus = 0;
  userData.inventory.forEach(item => {
    if (item.effect && item.effect.coinBonus) {
      bonus += item.effect.coinBonus;
    }
  });
  return bonus;
}

// Mining click
btnMine.addEventListener('click', () => {
  const bonus = calculateBonusCoin();
  userData.coins += 1 + bonus;
  userData.totalCoinsMined += 1 + bonus;
  updateDisplay();
  saveUserData();
});

// Auto mining interval
btnStartAuto.addEventListener('click', () => {
  if (miningInterval) clearInterval(miningInterval);
  miningInterval = setInterval(() => {
    const bonus = calculateBonusCoin();
    userData.coins += 1 + bonus;
    userData.totalCoinsMined += 1 + bonus;
    updateDisplay();
    saveUserData();
  }, 60000); // 1 menit
  btnStartAuto.style.display = 'none';
  btnStopAuto.style.display = 'block';
});
btnStopAuto.addEventListener('click', () => {
  clearInterval(miningInterval);
  miningInterval = null;
  btnStartAuto.style.display = 'block';
  btnStopAuto.style.display = 'none';
});

// Gacha spin cost 1000 coin
btnGacha.addEventListener('click', () => {
  if (userData.coins < 1000) {
    alert('Coin tidak cukup untuk gacha!');
    return;
  }
  userData.coins -= 1000;
  const item = pickGachaItem();

  // Cek apakah sudah punya item, jika tidak tambahkan
  const found = userData.inventory.find(i => i.id === item.id);
  if (!found) userData.inventory.push(item);

  gachaResult.textContent = `Kamu mendapatkan: ${item.name} [${item.rarity}]!`;
  updateDisplay();
  saveUserData();
});

// Register user
btnRegister.addEventListener('click', async () => {
  const username = usernameInput.value.trim();
  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();
  if (!username || !email || !password) {
    alert('Semua field harus diisi!');
    return;
  }
  try {
    const userCredential = await auth.createUserWithEmailAndPassword(email, password);
    const uid = userCredential.user.uid;
    // Simpan username di firestore
    userData = {
      uid,
      username,
      coins: 0,
      inventory: [],
      level: 1,
      totalCoinsMined: 0,
      lastDailyReward: 0,
    };
    await saveUserData();
    alert('Register berhasil! Silakan login.');
  } catch (error) {
    alert(error.message);
  }
});

// Login user
btnLogin.addEventListener('click', async () => {
  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();
  if (!email || !password) {
    alert('Email dan password harus diisi!');
    return;
  }
  try {
    const userCredential = await auth.signInWithEmailAndPassword(email, password);
    const uid = userCredential.user.uid;
    userData = await loadUserData(uid);
    if (!userData.username) userData.username = usernameInput.value.trim() || 'User';
    updateDisplay();
    authSection.style.display = 'none';
    gameSection.style.display = 'block';
    startLeaderboardListener();
  } catch (error) {
    alert(error.message);
  }
});

// Logout
btnLogout.addEventListener('click', async () => {
  await auth.signOut();
  userData = null;
  authSection.style.display = 'block';
  gameSection.style.display = 'none';
  miningInterval && clearInterval(miningInterval);
  miningInterval = null;
});

// Leaderboard realtime update
function startLeaderboardListener() {
  db.collection('users')
    .orderBy('coins', 'desc')
    .limit(10)
    .onSnapshot(snapshot => {
      leaderboardEl.innerHTML = '';
      snapshot.forEach(doc => {
        const data = doc.data();
        const li = document.createElement
