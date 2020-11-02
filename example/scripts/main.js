import {Spectrogram} from '../../spectrogram.js';

window.AudioContext = window.AudioContext || window.webkitAudioContext;

let audioContext;
let source;
let spectro;
let songButton;
let drawButton;
let songSelect;
let selectedMedia;

function init() {
  try {
    audioContext = new AudioContext();
  } catch (e) {
    alert('No web audio support in this browser!');
  }

  spectro = new Spectrogram(document.getElementById('canvas'), audioContext, {
    canvas: {
      width: function () {
        return window.innerWidth;
      },
      height: 500
    },
    colors: function (steps) {
      const baseColors = [[0, 0, 255, 1], [0, 255, 255, 1], [0, 255, 0, 1], [255, 255, 0, 1], [255, 0, 0, 1]];
      const positions = [0, 0.15, 0.30, 0.50, 0.75];

      const scale = new chroma.scale(baseColors, positions)
        .domain([0, steps]);

      const colors = [];

      for (let i = 0; i < steps; ++i) {
        const color = scale(i);
        colors.push(color.hex());
      }

      return colors;
    }
  });

  document.querySelectorAll("button").forEach(button => {
    const audio = button.previousElementSibling;
    if (!(audio instanceof HTMLAudioElement)) {
      return;
    }

    button.addEventListener('click', drawSong.bind(null, audio.src));
  })
}

function playSong() {
  if (songButton.textContent !== "Stop song") {
    songButton.textContent = "Stop song";
    fetchMedia(function playSong(songBuffer) {
      source = audioContext.createBufferSource();
      source.buffer = songBuffer;
      source.connect(audioContext.destination);
      source.start();
      spectro.drawPlayhead();
    })
  } else {
    songButton.textContent = "Play song";
    source.stop()
    spectro.stopDrawingPlayhead();
  }
}

async function drawSong(audioURI) {
  const songBuffer = await fetchMedia(audioURI);
  spectro.clear();
  spectro.draw(songBuffer);
}

async function fetchMedia(audioURI) {
  const response = await fetch(audioURI);
  if (!response.ok) {
    throw new Error("HTTP error, status = " + response.status);
  }

  const arrayBuffer = await response.arrayBuffer();
  return new Promise((resolve, reject) => {
    audioContext.decodeAudioData(arrayBuffer, resolve, reject);
  });
}

window.addEventListener('load', init, false);
