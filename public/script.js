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
  } else {
    document.getElementById('weatherResult').innerHTML = `
      <div dir="rtl">
        📍 עיר: ${data.city} <br>
        🌡️ טמפרטורה: ${data.temperature}°${data.unit} <br>
        ☁️ תיאור: ${data.description} <br>
        <img src="https://openweathermap.org/img/wn/${data.icon}@2x.png">
      </div>
    `;
  }
}

// Load search history
async function loadHistory() {
  const token = localStorage.getItem('token');

  if (!token) {
    document.getElementById('historyResult').textContent = 'You must log in first';
    return;
  }

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
    document.getElementById('hideHistoryBtn').style.display = 'inline-block';
  } else {
    let html = '<div dir="rtl"><h3>📜 היסטוריית חיפושים שלי</h3><ul style="list-style: none; padding: 0;">';
    
    data.history.forEach(search => {
      const date = new Date(search.createdAt).toLocaleString('he-IL');
      html += `
        <li style="border: 1px solid #ccc; margin: 10px; padding: 10px; border-radius: 5px;">
          📍 <b>${search.city}</b> - ${search.temperature}°C<br>
          ☁️ ${search.description}<br>
          🕐 ${date}
        </li>
      `;
    });
    
    html += '</ul></div>';
    document.getElementById('historyResult').innerHTML = html;
    document.getElementById('hideHistoryBtn').style.display = 'inline-block';
  }
}

// Hide search history
function hideHistory() {
  document.getElementById('historyResult').innerHTML = '';
  document.getElementById('hideHistoryBtn').style.display = 'none';
}

