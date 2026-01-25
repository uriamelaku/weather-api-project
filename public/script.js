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
