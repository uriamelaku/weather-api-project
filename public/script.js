// Register new user
async function register() {
  // Get values from input fields
  const username = document.getElementById('regUsername').value;
  const password = document.getElementById('regPassword').value;

  // Send registration request to server
  const res = await fetch('/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });

  // Parse server response
  const data = await res.json();

  // Show success or error message
  document.getElementById('regMsg').textContent =
    data.message || data.error;
}

// Logout user
function logout() {
  localStorage.removeItem('token');
  window.location.href = 'login.html';
}

// Login user
async function login() {
  // Get values from input fields
  const username = document.getElementById('loginUsername').value;
  const password = document.getElementById('loginPassword').value;

  // Send login request to server
  const res = await fetch('/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });

  // Parse server response
  const data = await res.json();

  // If token received, save it and redirect
  if (data.token) {
    localStorage.setItem('token', data.token);
    window.location.href = 'weather.html';
  } else {
    // Show error message
    document.getElementById('loginMsg').textContent = data.error;
  }
}

// Fetch weather data
async function getWeather() {
  // Get city name from input
  const city = document.getElementById('cityInput').value;

  // Clear all other sections
  document.getElementById('historyResult').innerHTML = '';
  document.getElementById('favoritesResult').innerHTML = '';
  document.getElementById('hideHistoryBtn').style.display = 'none';
  document.getElementById('deleteHistoryBtn').style.display = 'none';
  document.getElementById('addFavBtn').style.display = 'none';

  // Get token from localStorage
  const token = localStorage.getItem('token');

  // User must be logged in
  if (!token) {
    document.getElementById('weatherResult').textContent =
      'You must log in first';
    return;
  }

  // Send weather request with JWT token
  const res = await fetch(
    `/weather?city=${encodeURIComponent(city)}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  );

  // Parse server response
  const data = await res.json();

  // Handle error or display weather data
  if (data.error) {
    document.getElementById('weatherResult').textContent = data.error;
    document.getElementById('addFavBtn').style.display = 'none';
  } else {
    // שמור את שם העיר לשימוש בפונקציית "הוסף למועדפים"
    window.currentCity = data.city;
    
    document.getElementById('weatherResult').innerHTML = `
      <div dir="rtl">
        📍 עיר: ${data.city} <br>
        🌡️ טמפרטורה: ${data.temperature}°${data.unit} <br>
        ☁️ תיאור: ${data.description} <br>
        <img src="https://openweathermap.org/img/wn/${data.icon}@2x.png">
      </div>
    `;
    
    // הצג את כפתור "הוסף למועדפים"
    document.getElementById('addFavBtn').style.display = 'inline-block';
  }
}

// Load search history
async function loadHistory() {
  const token = localStorage.getItem('token');

  if (!token) {
    document.getElementById('historyResult').textContent = 'You must log in first';
    return;
  }

  // Clear all other sections
  document.getElementById('weatherResult').innerHTML = '';
  document.getElementById('favoritesResult').innerHTML = '';
  document.getElementById('addFavBtn').style.display = 'none';

  const res = await fetch('/history', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  const data = await res.json();

  if (data.error) {
    document.getElementById('historyResult').textContent = data.error;
  } else if (!data.history || data.history.length === 0) {
    document.getElementById('historyResult').innerHTML = '<p>אין עדיין היסטוריית חיפושים</p>';
    document.getElementById('hideHistoryBtn').style.display = 'none';
    document.getElementById('deleteHistoryBtn').style.display = 'none';
  } else {
    let html = '<div dir="rtl"><h3>📜 היסטוריית חיפושים שלי</h3><ul style="list-style: none; padding: 0;">';
    
    data.history.forEach(search => {
      const date = new Date(search.createdAt).toLocaleString('he-IL');
      html += `
        <li style="border: 1px solid #ccc; margin: 10px; padding: 10px; border-radius: 5px; display: flex; justify-content: space-between; align-items: center;">
          <div>
            📍 <b>${search.city}</b> - ${search.temperature}°C<br>
            ☁️ ${search.description}<br>
            🕐 ${date}
          </div>
          <button onclick="deleteHistoryItem('${search._id}')" style="background-color: #FF6B6B; color: white; border: none; padding: 8px 12px; border-radius: 4px; cursor: pointer;">
            ❌ מחק
          </button>
        </li>
      `;
    });
    
    html += '</ul></div>';
    document.getElementById('historyResult').innerHTML = html;
    document.getElementById('hideHistoryBtn').style.display = 'inline-block';
    document.getElementById('deleteHistoryBtn').style.display = 'inline-block';
  }
}

// Hide search history
function hideHistory() {
  document.getElementById('historyResult').innerHTML = '';
  document.getElementById('hideHistoryBtn').style.display = 'none';
  document.getElementById('deleteHistoryBtn').style.display = 'none';
}

// Delete single history item
async function deleteHistoryItem(id) {
  const token = localStorage.getItem('token');

  if (!token) {
    alert('אנא התחבר קודם');
    return;
  }

  const res = await fetch(`/history/${id}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  const data = await res.json();
  await loadHistory(); // רענן את ההיסטוריה
}

// Delete all history
async function deleteAllHistory() {
  const token = localStorage.getItem('token');

  if (!token) {
    alert('אנא התחבר קודם');
    return;
  }

  if (!confirm('האם אתה בטוח שברצונך למחוק את כל ההיסטוריה?')) {
    return;
  }

  const res = await fetch('/history', {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  const data = await res.json();
  alert(data.message || data.error);
  await loadHistory(); // רענן את ההיסטוריה
}

// Add city to favorites
async function addToFavorites() {
  const city = window.currentCity;
  const token = localStorage.getItem('token');

  if (!city || !token) {
    alert('אנא בדוק מזג אוויר קודם');
    return;
  }

  const res = await fetch('/favorites', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ city })
  });

  const data = await res.json();

  if (data.message) {
    alert(data.message);
    document.getElementById('addFavBtn').style.display = 'none';
  } else {
    alert(data.error);
  }
}

// Load favorites
async function loadFavorites() {
  const token = localStorage.getItem('token');

  if (!token) {
    document.getElementById('favoritesResult').textContent = 'You must log in first';
    return;
  }

  // Clear all other sections
  document.getElementById('weatherResult').innerHTML = '';
  document.getElementById('historyResult').innerHTML = '';
  document.getElementById('hideHistoryBtn').style.display = 'none';
  document.getElementById('deleteHistoryBtn').style.display = 'none';
  document.getElementById('addFavBtn').style.display = 'none';

  const res = await fetch('/favorites', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  const data = await res.json();

  if (data.error) {
    document.getElementById('favoritesResult').textContent = data.error;
  } else if (!data.favorites || data.favorites.length === 0) {
    document.getElementById('favoritesResult').innerHTML = '<p>אין עדיין מועדפים</p>';
  } else {
    let html = '<div dir="rtl"><h3>⭐ המועדפים שלי</h3><div style="display: grid; gap: 10px;">';
    
    data.favorites.forEach(fav => {
      html += `
        <div style="border: 2px solid #FFD700; margin: 10px; padding: 10px; border-radius: 5px; display: flex; justify-content: space-between; align-items: center;">
          <button onclick="searchFavorite('${fav.city}')" style="background-color: #87CEEB; color: white; border: none; padding: 8px 12px; border-radius: 4px; cursor: pointer;">
            🔍 ${fav.city}
          </button>
          <button onclick="removeFavorite('${fav.city}')" style="background-color: #FF6B6B; color: white; border: none; padding: 8px 12px; border-radius: 4px; cursor: pointer;">
            ❌ הסר
          </button>
        </div>
      `;
    });
    
    html += '</div></div>';
    document.getElementById('favoritesResult').innerHTML = html;
  }
}

// Search for a favorite city
function searchFavorite(city) {
  document.getElementById('cityInput').value = city;
  getWeather();
  document.getElementById('favoritesResult').innerHTML = '';
}

// Remove from favorites
async function removeFavorite(city) {
  const token = localStorage.getItem('token');

  if (!token) {
    alert('אנא התחבר קודם');
    return;
  }

  const res = await fetch(`/favorites/${encodeURIComponent(city)}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  const data = await res.json();
  alert(data.message || data.error);
  loadFavorites(); // רענן את הרשימה
}

