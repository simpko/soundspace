const socket = io();
const hue = getRandomInt(0, 360);
let recording = false;
let startTime = null;
let song = [];

function playBack() {
  for (let note of song) {
    setTimeout(() => {
      playSound(note.sound);
    }, note.time);
  }
}

function saveSong() {
  let nameInput = document.getElementById('song-name');
  let name = nameInput.value;
  if (name) {
    axios.post('/api/savesong', { name, song })
    .then((res) => {
      console.log(res);
      nameInput.value = '';
    })
    .catch((error) => {
      console.log(error);
    });
  } else {
    alert('song name required!');
  }
}

function closeModal() {
  let modal = document.getElementById('modal');
  modal.style.display = "none";
}

function savePrompt() {
  let modal = document.getElementById('modal');
  modal.style.display = "block";
}

function handleRecord() {
  if (!recording){
    song = [];
    startTime = new Date();
    socket.emit('start record', startTime);
    document.getElementById('record').innerText = 'stop';
  } else {
    savePrompt();
    socket.emit('stop record');
    document.getElementById('record').innerText = 'record';
  }
  recording = !recording;
}

function recordSound(sound) {
  const now = new Date();
  const note = {};
  note.time = now - startTime;
  note.sound = sound;
  song.push(note);
}

function toSpace(id) {
  let slide = document.getElementById('hidden-space');
  let top = document.getElementById('top');
  let bot = document.getElementById('bot');
  slide.classList.toggle('slideRight');
  top.classList.toggle('slideRight');
  bot.classList.toggle('slideRight');
  setTimeout(() => {
    window.location.href = `/space/${id}`;
  }, 950);
}

function toAbout() {
  let slide = document.getElementById('hidden-about');
  let top = document.getElementById('top');
  let bot = document.getElementById('bot');
  slide.classList.toggle('slideUp');
  top.classList.toggle('slideUp');
  bot.classList.toggle('slideUp');
  setTimeout(() => {
    window.location.href = '/about';
  }, 950);
}

function toObservatory() {
  let slide = document.getElementById('hidden-space');
  let top = document.getElementById('top');
  let bot = document.getElementById('bot');
  slide.classList.toggle('slideLeft');
  top.classList.toggle('slideLeft');
  bot.classList.toggle('slideLeft');
  setTimeout(() => {
    window.location.href = `/observatory`;
  }, 950);
}

function toHome() {
  let slide = document.getElementById('hidden-space');
  let top = document.getElementById('top');
  let bot = document.getElementById('bot');
  slide.classList.toggle('slideLeft');
  top.classList.toggle('slideLeft');
  bot.classList.toggle('slideLeft');
  setTimeout(() => {
    window.location.href = '/';
  }, 950);
}

function getRandom(min, max) {
  return Math.random() * (max - min) + min;
}

function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function joinPopup() {
  const joinPopup = document.getElementById('join-popup');
  joinPopup.classList.toggle('show');
  joinPopup.classList.toggle('hide');

  const joinInput = document.getElementById('join-input');
  if (joinPopup.classList.contains('show')) {
    joinInput.focus();
  }
}

function fadeOutAndRemove(el, removeAfter, removeSpeed) {
  const seconds = removeSpeed / 1000;
  el.style.transition = `opacity ${seconds}s ease`;
  setTimeout(() => el.style.opacity = 0, removeAfter);
  setTimeout(() => el.parentNode.removeChild(el), removeAfter+removeSpeed);
}

function appendSpawn(spawnInfo, hue) {
  let top = document.getElementById('top');
  let spawn = document.createElement('img');

  if (spawnInfo.type === 'meteor') {
    // Needed because a meteor is a gif, not a png.
    // Date needed at end to get fresh gif instead of existing one.
    spawn.setAttribute('src', `/static/img/${spawnInfo.type}${spawnInfo.num}.gif?x=${Date.now()}`);
  } else {
    spawn.setAttribute('src', `/static/img/${spawnInfo.type}${spawnInfo.num}.png`);
  }
  spawn.setAttribute('class', 'spawn');
  spawn.style.top = `${spawnInfo.y}vh`;
  spawn.style.left = `${spawnInfo.x}vw`;
  spawn.style.filter = `hue-rotate(${hue}deg)`;
  spawn.style.transform = `scale(${spawnInfo.scale}, ${spawnInfo.scale})`;

  top.appendChild(spawn);
  fadeOutAndRemove(spawn, spawnInfo.upTime, spawnInfo.fadeTime);
}

function chooseSpawn() {
  let rand = Math.random();
  let type, upTime, fadeTime, num, x, y, scale;

  if (rand < 0.98) {
    type = 'star';
    upTime = 5000;
    fadeTime = 5000;
    num = getRandomInt(1, 3);
    x = getRandom(0, 98);
    y = getRandom(0, 90);
    scale = getRandom(.6, 1);
  } else if (rand < 0.990) {
    type = 'planet';
    upTime = 10000;
    fadeTime = 5000;
    num = getRandomInt(1, 5);
    x = getRandom(0, 90);
    y = getRandom(0, 80);
    scale = getRandom(.8, 1.1);
  } else if (rand < 0.995) {
    type = 'sun';
    upTime = 20000;
    fadeTime = 8000;
    num = 1;
    x = getRandom(0, 80);
    y = getRandom(0, 70);
    scale = getRandom(.6, .8);
  } else if (rand < 0.998) {
    type = 'meteor';
    upTime = 1800;
    fadeTime = 0;
    num = 1;
    x = getRandom(0, 70);
    y = getRandom(0, 50);
    scale = getRandom(1, 2);
  } else {
    type = 'galaxy';
    upTime = 20000;
    fadeTime = 10000;
    num = 1;
    x = getRandom(0, 50);
    y = getRandom(0, 70);
    scale = getRandom(.7, 1);
  }

  return { type, upTime, fadeTime, num, x, y, scale }
}

window.onload = () => {
  let timeout;
  let prompt = true;

  let bot = document.getElementById('bot');
  let topLeft = document.getElementById('top-left');
  let topRight = document.getElementById('top-right');
  document.onmousemove = () => {
    if (!prompt) {
      bot.style.transition = "opacity 1s ease, transform 1s ease-in-out";
      bot.style.opacity = 1;
      topLeft.style.transition = "opacity 1s ease, transform 1s ease-in-out";
      topLeft.style.opacity = 1;
      topRight.style.transition = "opacity 1s ease, transform 1s ease-in-out";
      topRight.style.opacity = 1;
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        bot.style.transition = "opacity 4s ease, transform 1s ease-in-out";
        bot.style.opacity = 0;
        topLeft.style.transition = "opacity 4s ease, transform 1s ease-in-out";
        topLeft.style.opacity = 0;
        if (!recording) {
          topRight.style.transition = "opacity 4s ease, transform 1s ease-in-out";
          topRight.style.opacity = 0;
        }
      }, 5000);
    }
  }

  document.onclick = (event) => {
    const modal = document.getElementById('modal');
    if (event.target === modal) {
      modal.style.display = "none";
      song = [];
    }
  }

  document.onkeypress = (e) => {
    const joinInput = document.getElementById('join-input');
    const modal = document.getElementById('modal');
    if (!(joinInput === document.activeElement) && modal.style.display === 'none') {
      //May want to investigate this conditional, seems to stop sounds sometimes
      const spawnInfo = chooseSpawn();

      switch (e.keyCode) {
        case 97: // a
          socket.emit('handle sound', 'CsM7', spawnInfo, hue);
          break;
        case 98: // b
          socket.emit('handle sound', 'Ebeep', spawnInfo, hue);
          break;
        case 99: // c
          socket.emit('handle sound', 'CM', spawnInfo, hue);
          break;
        case 100: // d
          socket.emit('handle sound', 'FM', spawnInfo, hue);
          break;
        case 101: // e
          socket.emit('handle sound', 'Am', spawnInfo, hue);
          break;
        case 102: // f
          socket.emit('handle sound', 'Abeep', spawnInfo, hue);
          break;
        case 103: // g
          socket.emit('handle sound', 'Gsbeep', spawnInfo, hue);
          break;
        case 104: // h
          socket.emit('handle sound', 'Gbeep', spawnInfo, hue);
          break;
        case 105: // i
          socket.emit('handle sound', 'timer', spawnInfo, hue);
          break;
        case 106: // j
          socket.emit('handle sound', 'Fsbeep', spawnInfo, hue);
          break;
        case 107: // k
          socket.emit('handle sound', 'snare', spawnInfo, hue);
          break;
        case 108: // l
          socket.emit('handle sound', 'bass', spawnInfo, hue);
          break;
        case 109: // m
          socket.emit('handle sound', 'Dbeep', spawnInfo, hue);
          break;
        case 110: // n
          socket.emit('handle sound', 'Efbeep', spawnInfo, hue);
          break;
        case 111: // o
          socket.emit('handle sound', 'hihat', spawnInfo, hue);
          break;
        case 112: // p
          socket.emit('handle sound', 'pew', spawnInfo, hue);
          break;
        case 113: // q
          socket.emit('handle sound', 'GsM7', spawnInfo, hue);
          break;
        case 114: // r
          socket.emit('handle sound', 'Cbeep', spawnInfo, hue);
          break;
        case 115: // s
          socket.emit('handle sound', 'M2', spawnInfo, hue);
          break;
        case 116: // t
          socket.emit('handle sound', 'Bbeep', spawnInfo, hue);
          break;
        case 117: // u
          socket.emit('handle sound', 'Alowbeep', spawnInfo, hue);
          break;
        case 118: // v
          socket.emit('handle sound', 'Fbeep', spawnInfo, hue);
          break;
        case 119: // w
          socket.emit('handle sound', 'M1', spawnInfo, hue);
          break;
        case 120: // x
          socket.emit('handle sound', 'M3', spawnInfo, hue);
          break;
        case 121: // y
          socket.emit('handle sound', 'Bfbeep', spawnInfo, hue);
          break;
        case 122: // z
          socket.emit('handle sound', 'FsM7', spawnInfo, hue);
          break;
        default:
          console.log(e.keyCode);
      }
    } else {
      if (e.keyCode === 13) {
        toSpace(joinInput.value);
      }
    }

    if (prompt) {
      fadeOutAndRemove(document.getElementById('prompt-text'), 10, 2000);
      setTimeout(() => {
        bot.style.opacity = 0;
        topLeft.style.opacity = 0;
        if (!recording) topRight.style.opacity = 0;
      }, 6000);
      prompt = false;
    }

    // Check if the user is logged in by looking for the log out element
    if (document.getElementById('logout')) {
      // Make post request to track taps and let others know taps updated
      axios.post('/api/tap')
      .then((res) => {
        socket.emit('user tap', res.data.taps);
      })
      .catch((error) => {
        console.log(error);
      });
    }
  }
}

function renderShip(user) {
  const container = document.createElement('div');
  container.className = 'ship-container';
  container.id = `${user.id}-ship`;
  container.style.top = `${user.ship.shipTop}vh`;
  container.style.left = `${user.ship.shipLeft}vw`;

  const text = document.createElement('div');
  text.className = 'ship-text';

  const name = document.createElement('span');
  name.innerText = user.name;
  text.appendChild(name);

  text.appendChild(document.createElement('br'));

  const taps = document.createElement('span');
  taps.id = `${user.id}-ship-taps`;
  taps.innerText = `Taps: ${user.taps}`;
  text.appendChild(taps);

  container.appendChild(text);

  const img = document.createElement('img');
  img.setAttribute('src', `/static/img/ship.gif`);
  img.style.filter = `hue-rotate(${user.ship.hue}deg)`
  container.appendChild(img);

  container.onmouseover = () => {
    text.style.visibility = 'visible';
    text.style.opacity = 1;
  }

  container.onmouseout = () => {
    text.style.visibility = 'hidden';
    text.style.opacity = 0;
  }

  document.getElementById('all-the-ships').appendChild(container);
}

socket.on('connect', () => {
  const spaceCode = window.location.pathname.slice(7);
  const shipTop = getRandomInt(25, 70);
  const shipLeft = getRandomInt(2, 90);
  const shipInfo = { hue, shipTop, shipLeft };

  axios.get('/api/userinfo')
  .then((res) => {
    let userInfo = res.data;

    if (spaceCode.length === 4) {
      console.log(`Joining ${spaceCode}`);
      socket.emit('join room', spaceCode, userInfo, shipInfo);
    } else if (spaceCode.length === 0) {
      console.log(`Joining default`);
      socket.emit('join room', 'default', userInfo, shipInfo);
    }

    if (userInfo !== 'anon') {
      // Make post request to track joins
      axios.post('/api/join')
      .catch((error) => {
        console.log(error);
      });
    }
  })
  .catch((error) => {
    console.log(error);
  });
});

socket.on('handle sound', (sound, spawn, hue) => {
  console.log(`received sound ${sound}`);
  playSound(sound);
  appendSpawn(spawn, hue);
  if (recording) {
    recordSound(sound);
  }
});

socket.on('user tap', (id, taps) => {
  const text = document.getElementById(`${id}-ship-taps`);
  if (text) text.innerText = `Taps: ${taps}`;
});

socket.on('start record', (time) => {
  recording = true;
  startTime = time;
  song = [];
  document.getElementById('record').innerText = 'recording';
  document.getElementById('record').style.cursor = 'default';
  document.getElementById('record').onclick = () => {};
});

socket.on('stop record', () => {
  recording = false;
  document.getElementById('record').innerText = 'record';
  document.getElementById('record').style.cursor = 'pointer';
  document.getElementById('record').onclick = () => {
    handleRecord();
  }
});

socket.on('user join', (users) => {
  for (let user of users) {
    const ship = document.getElementById(`${user.id}-ship`);
    if (!ship) {
      renderShip(user);
    }
  }
});

socket.on('user leave', (id) => {
  const ship = document.getElementById(`${id}-ship`);
  if (ship) ship.parentNode.removeChild(ship);
});
