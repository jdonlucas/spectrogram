window.AudioContext = window.AudioContext || window.webkitAudioContext;

var audioContext;
var source;
var spectro;
var songButton;
var drawButton;
var songSelect;
var selectedMedia;

var media = [
  'media/aphex_twins_equation.mp3',
  'media/ethos_final_hope.mp3',
  'media/demo.wav' //demo audio from wavesurfer.js
];

function init() {
  try {
    audioContext = new AudioContext();
  } catch (e) {
    alert('No web audio support in this browser!');
  }

  spectro = Spectrogram(document.getElementById('canvas'), audioContext, {
    canvas: {
      width: function() {
        return window.innerWidth;
      },
      height: 500
    },
    colors: function(steps) {
      var baseColors = [[0,0,255,1], [0,255,255,1], [0,255,0,1], [255,255,0,1], [ 255,0,0,1]];
      var positions = [0, 0.15, 0.30, 0.50, 0.75];

      var scale = new chroma.scale(baseColors, positions)
      .domain([0, steps]);

      var colors = [];

      for (var i = 0; i < steps; ++i) {
        var color = scale(i);
        colors.push(color.hex());
      }

      return colors;
    }
  });

  songButton = document.getElementById('btn-song');
  drawButton = document.getElementById('btn-draw');
  songSelect = document.getElementById('select-song');

  songButton.addEventListener('click', playSong, false);
  drawButton.addEventListener('click', drawSong, false);
  songSelect.addEventListener('change', selectMedia, false);

  selectMedia();
}

function selectMedia() {
  selectedMedia = media[songSelect.value];
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

function drawSong() {
  fetchMedia(function drawSong(songBuffer) {
    spectro.clear();
    spectro.draw(songBuffer);
  });
}

function fetchMedia(callback) {
  var request = new XMLHttpRequest();
  request.open('GET', selectedMedia, true);
  request.responseType = 'arraybuffer';

  request.onload = function fetchedMedia() {
    audioContext.decodeAudioData(request.response, callback);
  };

  request.send();
}

window.addEventListener('load', init, false);
