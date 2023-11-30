document.addEventListener('DOMContentLoaded', function () {
  let guessedCities = [];
  let correctGuesses = 0;
  let gameStarted = false;
  let timeLimit = 0;
  let timer;
  let gameEndedMessageDisplayed = false;
  let startLetterElement = document.getElementById('startLetter');
  let timeLimitElement = document.getElementById('timeLimit');
  let displayCitiesContainer = document.getElementById('displayCitiesContainer');

  function loadCitiesData() {
    const script = document.createElement('script');
    script.src = 'PlacesData.js';
    script.onload = function () {
      loadGameData();
    };
    document.head.appendChild(script);
  }

  loadCitiesData();

  document.getElementById('startBtn').addEventListener('click', startGame);
  document.getElementById('resetBtn').addEventListener('click', resetGame);
  document.getElementById('checkBtn').addEventListener('click', checkGuess);
  document.getElementById('cityInput').addEventListener('keyup', function (event) {
    if (event.key === 'Enter') {
      checkGuess();
    }
  });

  function startGame() {
    resetGame();
    gameStarted = true;
    gameEndedMessageDisplayed = false;
    const startLetter = startLetterElement.value.toLowerCase();
    const timeLimitValue = timeLimitElement.value;
    timeLimit = timeLimitValue > 0 ? timeLimitValue : 0;

    document.getElementById('guessedCitiesList').innerHTML = '';
    document.getElementById('score').innerHTML = '';
    document.getElementById('correctGuesses').innerHTML = '';

    const filteredCities = citiesData.filter(city => city.city.toLowerCase().startsWith(startLetter));
    const randomCity = filteredCities[Math.floor(Math.random() * filteredCities.length)].city.toLowerCase();

    document.getElementById('errorMessage').innerHTML = `<p>Game started! Cities must start with: ${startLetter.toUpperCase()}.</p>`;
    document.getElementById('cityInput').placeholder = `Type place names`;

    if (timeLimit > 0) {
      timer = setInterval(updateTimer, 1000);
    }
  }

  function updateTimer() {
    if (timeLimit >= 0) {
      const minutes = Math.floor(timeLimit / 60);
      const seconds = timeLimit % 60;
      document.getElementById('timer').innerHTML = `<p>Time left: ${minutes} minutes, ${seconds} seconds</p>`;
      timeLimit--;
      if (timeLimit < 0) {
        document.getElementById('timer').innerHTML = '<p>Time left: 0 minutes, 0 seconds</p>';
        endGame();
      } else {
        clearTimeout(timer);
        timer = setTimeout(updateTimer, 1000);
      }
    }
  }

  function resetGame() {
    if (gameStarted && !gameEndedMessageDisplayed) {
      const previousGameInfo = {
        guessedCities: guessedCities,
        correctGuesses: correctGuesses,
      };
      document.getElementById('guessedCitiesList').innerHTML = '<p>Places Named: None</p>';
      document.getElementById('correctGuesses').innerHTML = `<p>Correct Guesses: 0</p>`;
    }

    guessedCities = [];
    correctGuesses = 0;
    gameStarted = false;

    clearInterval(timer);
    timer = undefined;

    document.getElementById('errorMessage').innerHTML = '';
    document.getElementById('timer').innerHTML = '';
    document.getElementById('cityInput').value = '';
    document.getElementById('cityInput').placeholder = 'Type city names';
    saveGameData();
  }

  function checkGuess() {
    setTimeout(() => {
      document.getElementById('errorMessage').innerHTML = '';
    }, 100000);

    if (!gameStarted) {
      document.getElementById('errorMessage').innerHTML = '<p class="error">Start the game first.</p>';
      return;
    }

    if (timeLimit < 0) {
      document.getElementById('errorMessage').innerHTML = '<p class="error">Can\'t enter after time expired</p>';
      return;
    }

    const userInput = document.getElementById('cityInput').value.toLowerCase();
    const guessedCityArray = userInput.split(',').map(city => city.trim());

    let repeatedCities = false;
    let notOnListCities = [];

    guessedCityArray.forEach(guessedCity => {
      const existingGuess = guessedCities.find(city => city.name.toLowerCase() === guessedCity);
      if (existingGuess) {
        document.getElementById('errorMessage').innerHTML = `<p class="error">${guessedCity}: City already guessed</p>`;
        repeatedCities = true;
      } else {
        const cityData = citiesData.find(city => city.city.toLowerCase() === guessedCity);
        if (cityData && cityData.city.toLowerCase().startsWith(startLetterElement.value.toLowerCase())) {
          correctGuesses++;
          guessedCities.push({ name: guessedCity.charAt(0).toUpperCase() + guessedCity.slice(1) });
        } else {
          notOnListCities.push(guessedCity);
        }
      }
    });

    if (notOnListCities.length > 0 && !repeatedCities) {
      document.getElementById('errorMessage').innerHTML = `<p class="error">${notOnListCities.join(', ')}: City not on list or doesn't start with the selected letter</p>`;
    } else {
      document.getElementById('errorMessage').innerHTML = '';
    }

    if (!repeatedCities) {
      document.getElementById('guessedCitiesList').innerHTML = guessedCities.map(city =>
        `<p>${city.name}</p>`
      ).join('');
    }

    document.getElementById('correctGuesses').innerHTML = `<p>Correct Guesses: ${correctGuesses}</p>`;
    document.getElementById('cityInput').value = '';

    if (timeLimit <= 0 && !repeatedCities) {
      resetGame();
    }

    saveGameData();
  }

  function endGame() {
    if (!gameEndedMessageDisplayed) {
      document.getElementById('errorMessage').innerHTML = '<p class="error">Game over! Time limit reached.</p>';
      gameEndedMessageDisplayed = true;
    }
    clearInterval(timer);
  }

  function saveGameData() {
    const gameData = {
      guessedCities: guessedCities,
      correctGuesses: correctGuesses,
      timeLimit: timeLimit,
      gameStarted: gameStarted,
      gameEndedMessageDisplayed: gameEndedMessageDisplayed,
      startLetter: startLetterElement.value,
      timeLimitValue: timeLimitElement.value,
    };
    chrome.storage.sync.set({ 'cityGuessingGameData': gameData }, function () {
      console.log('Game data saved:', gameData);
    });
  }

  function loadGameData() {
    chrome.storage.sync.get('cityGuessingGameData', function (data) {
      const savedGameData = data.cityGuessingGameData;
      if (savedGameData) {
        guessedCities = savedGameData.guessedCities || [];
        correctGuesses = savedGameData.correctGuesses || 0;
        timeLimit = savedGameData.timeLimit || 0;
        gameStarted = savedGameData.gameStarted || false;
        gameEndedMessageDisplayed = savedGameData.gameEndedMessageDisplayed || false;

        startLetterElement.value = savedGameData.startLetter || '';
        timeLimitElement.value = savedGameData.timeLimitValue || '';

        if (gameStarted && timeLimit > 0) {
          timer = setInterval(updateTimer, 1000);
        }

        document.getElementById('guessedCitiesList').innerHTML = guessedCities.map(city =>
          `<p>${city.name}</p>`
        ).join('');

        document.getElementById('correctGuesses').innerHTML = `<p>Correct Guesses: ${correctGuesses}</p>`;
      }
    });
  }

  function toggleMessage() {
    const hiddenMessage = document.getElementById('hiddenMessage');
    hiddenMessage.style.display = (hiddenMessage.style.display === 'none') ? 'block' : 'none';
  }

  document.getElementById('displayCitiesBtn').addEventListener('click', displayRandomCities);

  function displayRandomCities() {
    displayCitiesContainer.innerHTML = '';

    const startLetter = startLetterElement.value.toLowerCase();
    const filteredCities = citiesData.filter(city => city.city.toLowerCase().startsWith(startLetter));

    const randomCities = [];
    for (let i = 0; i < 10; i++) {
      const randomCity = filteredCities[Math.floor(Math.random() * filteredCities.length)].city;
      randomCities.push(randomCity);
    }

    displayCitiesContainer.innerHTML += randomCities.map(city => `<p style="margin: 0px; padding: 2.5px; font-size: 9px;">${city}</p>`).join('');
  }

  document.getElementById('toggleMessageBtn').addEventListener('click', toggleMessage);

  loadGameData();
});