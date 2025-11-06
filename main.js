// Import Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  collection,
  addDoc,
  query,
  where,
  getDocs,
  Timestamp,
  orderBy,
  updateDoc
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

// --- START: YOUR FIREBASE CONFIG ---
const firebaseConfig = {
  apiKey: "AIzaSyBIBz9fvcGh5w3YhTFFrONVveiqCYloeLY",
  authDomain: "pre--parking.firebaseapp.com",
  projectId: "pre--parking",
  storageBucket: "pre--parking.firebasestorage.app",
  messagingSenderId: "852774861925",
  appId: "1:852774861925:web:3c1fb55ea52b78eb161a8c"
};
// --- END: YOUR FIREBASE CONFIG ---

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);


// --- START: HOME PAGE ANIMATION LOGIC ---
function startHomePageAnimation() {
  const scene = document.querySelector('#home-animation-scene');
  if (!scene || scene.dataset.animationStarted) return;
  scene.dataset.animationStarted = 'true';

  const allSlots = scene.querySelectorAll('.slot');
  if (allSlots.length === 0) return; 

  const colors = ['#ff4444', '#44ff44', '#4488ff', '#ffbb33', '#aa66cc', '#00bcd4'];
  const busySlots = new Set();  

  function parkNewCar() {
    const availableSlots = Array.from(allSlots).filter(slot => !busySlots.has(slot));
    if (availableSlots.length === 0) return;

    const slot = availableSlots[Math.floor(Math.random() * availableSlots.length)];
    busySlots.add(slot);  

    const car = document.createElement('div');
    car.className = 'moving-car';
    car.style.background = colors[Math.floor(Math.random() * colors.length)];
    const roof = document.createElement('div');
    roof.className = 'roof';
    car.appendChild(roof);
    scene.appendChild(car); 

    const sceneRect = scene.getBoundingClientRect();
    const slotRect = slot.getBoundingClientRect();
    const isTopSlot = slot.parentElement.classList.contains('top');

    const x = (slotRect.left - sceneRect.left) + (slotRect.width / 2) - 40;
    const y = (slotRect.top - sceneRect.top) + (slotRect.height / 2) - 20;
    
    car.style.setProperty('--x-target', `${x}px`);
    car.style.setProperty('--y-target', `${y}px`);
    
    const animationDuration = '5s';
    const parkAnimation = isTopSlot ? `parkTop ${animationDuration} ease-in-out forwards` : `parkBottom ${animationDuration} ease-in-out forwards`;
    car.style.animation = parkAnimation;

    car.addEventListener('animationend', function parkAndWait() {
      this.removeEventListener('animationend', parkAndWait);
      setTimeout(() => {
        const leaveAnimation = isTopSlot ? `leaveTop ${animationDuration} ease-in-out forwards` : `leaveBottom ${animationDuration} ease-in-out forwards`;
        this.style.animation = leaveAnimation;

        this.addEventListener('animationend', function cleanup() {
          this.removeEventListener('animationend', cleanup);
          if (this.parentNode) {
            this.parentNode.removeChild(this);
          }
          busySlots.delete(slot);  
          setTimeout(parkNewCar, Math.random() * 2000);  
        });
      }, 10000); 
    });
  }

  for (let i = 0; i < 4; i++) { 
    setTimeout(parkNewCar, i * 1500);  
  }
}
// --- END: HOME PAGE ANIMATION LOGIC ---


// DOM Elements
const landingPage = document.getElementById('landing-page');
const appContainer = document.getElementById('app-container');
const btnGetStarted = document.getElementById('btn-get-started');

// App Pages
const authPage = document.getElementById('auth-page');
const detailsPage = document.getElementById('details-page');
const homePage = document.getElementById('home-page');
const bookingPage = document.getElementById('booking-page');
const profilePage = document.getElementById('profile-page'); 
const bookingsPage = document.getElementById('bookings-page'); 

// Header Buttons
const navButtons = document.querySelector('.nav-buttons'); 
const btnLogout = document.getElementById('btn-logout');
const btnProfile = document.getElementById('btn-profile'); 
const btnMyBookings = document.getElementById('btn-my-bookings'); 

// Auth Form
const authForm = document.getElementById('auth-form');
const authTitle = document.getElementById('auth-title');
const authEmail = document.getElementById('auth-email');
const authPassword = document.getElementById('auth-password');
const btnSubmitAuth = document.getElementById('btn-submit-auth');
const btnToggleAuth = document.getElementById('btn-toggle-auth');
const authError = document.getElementById('auth-error');

// Details Form
const detailsForm = document.getElementById('details-form');
const detailsName = document.getElementById('details-name');
const detailsAge = document.getElementById('details-age');
const detailsPlate = document.getElementById('details-plate');
const detailsError = document.getElementById('details-error');
const detailsEmail = document.getElementById('details-email');

// Home Page
const locationGrid = document.querySelector('.location-grid');

// Booking Page
const btnBackHome = document.getElementById('btn-back-home');
const bookingTitle = document.getElementById('booking-title');
const spotGridContainer = document.getElementById('spot-grid-container');
const bookingTimeSelect = document.getElementById('booking-time');
const btnConfirmBooking = document.getElementById('btn-confirm-booking');
const bookingError = document.getElementById('booking-error');

// Profile Page
const btnBackHomeProfile = document.getElementById('btn-back-home-profile');
const profileForm = document.getElementById('profile-form');
const profileEmail = document.getElementById('profile-email');
const profileName = document.getElementById('profile-name');
const profileAge = document.getElementById('profile-age');
const profilePlate = document.getElementById('profile-plate');
const profileError = document.getElementById('profile-error');

// My Bookings Page
const btnBackHomeBookings = document.getElementById('btn-back-home-bookings');
const bookingListContainer = document.getElementById('booking-list-container');

// App State
let isSignUp = false;
let currentUser = null;
let currentBooking = {
  locationId: null,
  spotNumber: null,
};

// --- Page Navigation ---
const pages = [authPage, detailsPage, homePage, bookingPage, profilePage, bookingsPage]; 

function showPage(pageToShow) {
  landingPage.classList.add('hidden');
  appContainer.classList.remove('hidden');

  pages.forEach(page => page.classList.add('hidden'));
  
  if (pageToShow) {
    pageToShow.classList.remove('hidden');
  }

  // --- START: UPDATED LOGIC ---
  // Hide nav buttons on auth and details pages
  if (pageToShow === authPage || pageToShow === detailsPage) {
    navButtons.classList.add('hidden');
  } else {
    navButtons.classList.remove('hidden');
  }
  // --- END: UPDATED LOGIC ---

  if (pageToShow === homePage) {
    homePage.style.opacity = 0;
    homePage.style.animation = 'fadeIn 0.5s ease-in-out forwards';
    startHomePageAnimation();
  }
}

// --- 1. Landing Page ---
btnGetStarted.addEventListener('click', () => {
  if (currentUser) {
    showPage(homePage);
  } else {
    showPage(authPage);
  }
});

// --- 2. Authentication Logic ---
onAuthStateChanged(auth, async (user) => {
  if (user) {
    currentUser = user;
    const userDocRef = doc(db, 'users', user.uid);
    const userDocSnap = await getDoc(userDocRef);

    if (userDocSnap.exists()) {
      showPage(homePage);
    } else {
      detailsEmail.value = user.email; 
      showPage(detailsPage);
    }
  } else {
    currentUser = null;
    appContainer.classList.add('hidden');
    landingPage.classList.remove('hidden');
    navButtons.classList.add('hidden'); // Also hide nav on logout
  }
});

btnToggleAuth.addEventListener('click', () => {
  isSignUp = !isSignUp;
  authTitle.innerText = isSignUp ? 'Sign Up' : 'Login';
  btnSubmitAuth.innerText = isSignUp ? 'Sign Up' : 'Login';
  btnToggleAuth.innerText = isSignUp ? 'Login' : 'Sign Up';
  authError.innerText = '';
});

authForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = authEmail.value;
  const password = authPassword.value;
  authError.innerText = '';

  try {
    if (isSignUp) {
      await createUserWithEmailAndPassword(auth, email, password);
    } else {
      await signInWithEmailAndPassword(auth, email, password);
    }
  } catch (error) {
    console.error(error);
    // This is where "auth/invalid-login-credentials" is handled
    authError.innerText = error.message.replace('Firebase: ', '');
  }
});

btnLogout.addEventListener('click', async () => {
  await signOut(auth);
});

// --- 3. User Details Logic ---
detailsForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  detailsError.innerText = '';

  if (!currentUser) {
    detailsError.innerText = 'No user is logged in.';
    return;
  }

  const userData = {
    name: detailsName.value,
    age: Number(detailsAge.value),
    plate: detailsPlate.value,
    email: currentUser.email,
  };

  try {
    await setDoc(doc(db, 'users', currentUser.uid), userData);
    showPage(homePage);
  } catch (error) {
    console.error(error);
    detailsError.innerText = 'Failed to save details. Please try again.';
  }
});

// --- 4. Home Page (Location Selection) ---
locationGrid.addEventListener('click', (e) => {
  const card = e.target.closest('.location-card');
  if (card) {
    const locationId = card.dataset.locationId;
    const spots = Number(card.dataset.spots);
    const name = card.querySelector('h3').innerText;
    
    currentBooking.locationId = locationId;
    loadBookingPage(locationId, name, spots);
  }
});

// --- 5. Booking Page Logic ---
async function loadBookingPage(locationId, name, totalSpots) {
  bookingTitle.innerText = `Select Spot at ${name}`;
  spotGridContainer.innerHTML = ''; 
  bookingError.innerText = '';
  currentBooking.spotNumber = null;
  btnConfirmBooking.disabled = true;

  const now = Timestamp.now();
  const bookingsRef = collection(db, 'bookings');
  const q = query(
    bookingsRef,
    where('locationId', '==', locationId),
    where('endTime', '>', now) 
  );

  const querySnapshot = await getDocs(q);
  const bookedSpots = new Set();
  querySnapshot.forEach((doc) => {
    bookedSpots.add(doc.data().spotNumber);
  });

  for (let i = 1; i <= totalSpots; i++) {
    const spot = document.createElement('div');
    spot.classList.add('spot');
    spot.innerText = i;
    spot.dataset.spotNumber = i;

    if (bookedSpots.has(i)) {
      spot.classList.add('booked');
    } else {
      spot.addEventListener('click', handleSpotClick);
    }
    
    spotGridContainer.appendChild(spot);
  }

  showPage(bookingPage);
}

function handleSpotClick(e) {
  const selectedSpot = e.target;
  const spotNumber = Number(selectedSpot.dataset.spotNumber);

  const allSpots = spotGridContainer.querySelectorAll('.spot');
  allSpots.forEach(spot => {
    if (spot !== selectedSpot) {
      spot.classList.remove('selected');
    }
  });

  if (selectedSpot.classList.toggle('selected')) {
    currentBooking.spotNumber = spotNumber;
    btnConfirmBooking.disabled = false;
  } else {
    currentBooking.spotNumber = null;
    btnConfirmBooking.disabled = true;
  }
}

btnBackHome.addEventListener('click', () => {
  showPage(homePage);
});

btnConfirmBooking.addEventListener('click', async () => {
  bookingError.innerText = '';
  if (!currentBooking.spotNumber || !currentBooking.locationId || !currentUser) {
    bookingError.innerText = 'An error occurred. Please try again.';
    return;
  }

  const hours = Number(bookingTimeSelect.value);
  const startTime = Timestamp.now();
  const endTime = new Timestamp(startTime.seconds + (hours * 60 * 60), startTime.nanoseconds);

  const bookingData = {
    userId: currentUser.uid,
    locationId: currentBooking.locationId,
    spotNumber: currentBooking.spotNumber,
    startTime: startTime,
    endTime: endTime,
  };

  try {
    const docRef = await addDoc(collection(db, 'bookings'), bookingData);
    console.log("Booking successful with ID: ", docRef.id);
    
    alert(`Booking confirmed for Spot ${currentBooking.spotNumber} at ${currentBooking.locationId} for ${hours} hour(s)!`);
    showPage(homePage); 

  } catch (error) {
    console.error("Booking failed: ", error);
    bookingError.innerText = 'Booking failed. The spot might have just been taken.';
    const locationCard = document.querySelector(`[data-location-id="${currentBooking.locationId}"]`);
    loadBookingPage(currentBooking.locationId, locationCard.querySelector('h3').innerText, Number(locationCard.dataset.spots));
  }
});


// --- 6. Profile Page Logic ---
btnProfile.addEventListener('click', async () => {
  if (!currentUser) return; 
  
  profileError.innerText = '';
  const userDocRef = doc(db, 'users', currentUser.uid);
  const userDocSnap = await getDoc(userDocRef);

  if (userDocSnap.exists()) {
    const data = userDocSnap.data();
    profileEmail.value = data.email;
    profileName.value = data.name;
    profileAge.value = data.age;
    profilePlate.value = data.plate;
  } else {
    profileError.innerText = "Could not find user data.";
  }

  showPage(profilePage);
});

profileForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  profileError.innerText = '';
  if (!currentUser) return;

  const userData = {
    name: profileName.value,
    age: Number(profileAge.value),
    plate: profilePlate.value,
  };

  try {
    const userDocRef = doc(db, 'users', currentUser.uid);
    await updateDoc(userDocRef, userData);
    alert('Profile updated successfully!');
    showPage(homePage);
  } catch (error) {
    console.error(error);
    profileError.innerText = "Failed to update profile.";
  }
});

btnBackHomeProfile.addEventListener('click', () => {
  showPage(homePage);
});


// --- 7. My Bookings Page Logic ---
btnMyBookings.addEventListener('click', async () => {
  if (!currentUser) return; 

  bookingListContainer.innerHTML = '<p>Loading your bookings...</p>';
  showPage(bookingsPage);

  try {
    const q = query(
      collection(db, 'bookings'), 
      where('userId', '==', currentUser.uid),
      orderBy('startTime', 'desc') // Show most recent first
    );
    
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      bookingListContainer.innerHTML = '<p>You have no past or active bookings.</p>';
      return;
    }

    bookingListContainer.innerHTML = ''; // Clear loading message
    querySnapshot.forEach(doc => {
      const booking = doc.data();
      const startTime = booking.startTime.toDate().toLocaleString();
      const endTime = booking.endTime.toDate().toLocaleString();

      const card = document.createElement('div');
      card.className = 'booking-card';
      // Capitalize locationId
      const locationName = booking.locationId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      card.innerHTML = `
        <h3>${locationName}</h3>
        <p><strong>Spot:</strong> ${booking.spotNumber}</p>
        <p><strong>From:</strong> ${startTime}</p>
        <p><strong>To:</strong> ${endTime}</p>
      `;
      bookingListContainer.appendChild(card);
    });

  } catch (error) {
    console.error(error);
    bookingListContainer.innerHTML = '<p class="error-message">Failed to load bookings.</p>';
  }
});

btnBackHomeBookings.addEventListener('click', () => {
  showPage(homePage);
});
