// Get Hash on hashchange
$(window).bind(	'hashchange', function () {
  getHash();
});

// Get Hash on loading page
$(document).ready(function () {
  initHolder()
  initInfo()
  getHash()
})

// Get the hash and start torrent if there is an hash
function getHash () {
  var hash = window.location.hash.substring(1);
  hash = cleanHash(hash);
  if (hash.length > 0) {
    console.log('New Hash: ' + hash);
    var $holder = $('.holder');
    $holder.css('background', 'no-repeat center url("src/css/dashinfinity.gif")');
	var $instructions = $('.instructions');
	$instructions.text("Fetching metadata");
    download(hash);
  }
}

// turn magnet into hash
function cleanHash (hash) {
  var r = new RegExp('.*:');
  var r2 = new RegExp('&.*');
  return hash.replace(r, '').replace(r2, '');
}

// Initialise seed torrent
function initHolder () {
  var $holder = $('.holder');
  var $upload = $('.holder .upload .button');
  var $fileName = $('.holder .filename');
  var $uploadBut = $('.holder .upload-but');
  var $state = $('.status');

  if (typeof window.FileReader === 'undefined') {
    $state.attr('id', 'fail');
    $state.text('Instant Share Off-line');
  } else {
    $state.attr('id', 'success');
    $state.text('Instant Share On-line');
  }

  $holder.on('dragover', function (event) {
    event.preventDefault();
    event.stopPropagation();
    this.id = 'hover'; return false;
  });

  $holder.on('dragleave', function (event) {
    event.preventDefault();
    event.stopPropagation();
    this.id = ''; return false;
  });

  $holder.on('drop', function (event) {
    this.id = '';
    event.preventDefault();
    event.stopPropagation();
    var file = event.originalEvent.dataTransfer.files[0];
    seed(file);
  });

  $upload.click(function () {
    $uploadBut.trigger('click');
  });

  $uploadBut.on('change', function () {
    $fileName.text(this.files[0].name);
	$fileName.show();
    seed(this.files[0]);
  });
}

function seed (file) {
	console.log(file);
	var client = new WebTorrent();
	client.seed(file, {
		announce:[
			'ws://tracker.steefmin.xyz',
			'ws://tracker.h.steefmin.xyz:8000',
			'wss://tracker.btorrent.xyz',
			'wss://tracker.fastcast.nz',
			'wss://tracker.openwebtorrent.com',
			'wss://tracker.webtorrent.io'
		]}, onTorrentSeed);
}

// Initialise event on torrent
function initTorrent (torrent, mode) {
  var $holder = $('.holder')
  var $progress = $('.torrent-infos .progress p')
  var $instructions = $('.instructions');


  torrent.on('done', function () {
    console.log('torrent finished downloading')
	updatePeer(torrent.numPeers)
    updateData(torrent.uploaded, torrent.downloaded, torrent.uploadSpeed, torrent.downloadSpeed)
    $holder.css('background', '')
    updatePeer(torrent.numPeers)
    updateData(torrent.uploaded, torrent.downloaded, torrent.uploadSpeed, torrent.downloadspeed)
    appendHolder(torrent)
  })

  torrent.on('infoHash',function () {
    $instructions.text("Seeding");
  });

  torrent.on('metadata', function () {
    $instructions.text("Finding peers");
  });

  torrent.on('wire', function (wire) {
    console.log('new peer: ' + wire.remoteAddress + ':' + wire.remotePort)
    updatePeer(torrent.numPeers)
  })

  torrent.on('download', function (chunkSize) {
    $progress.text(Math.round(torrent.progress * 10000) / 100 + '%')
    updateData(torrent.uploaded, torrent.downloaded, torrent.uploadSpeed, torrent.downloadSpeed)
    updatePeer(torrent.numPeers)
	$instructions.text("Downloading")
  })

  torrent.on('upload', function (data) {
    updateData(torrent.uploaded, torrent.downloaded, torrent.uploadSpeed, torrent.downloadSpeed)
    updatePeer(torrent.numPeers)
	$instructions.text("Uploading")
  })

  torrent.on('noPeers', function () {
	$instructions.text("Seeding");
    $progress.text(Math.round(torrent.progress * 10000) / 100 + '%')
    updateData(torrent.uploaded, torrent.downloaded, torrent.uploadSpeed, torrent.downloadSpeed)
    updatePeer(torrent.numPeers)
    if (mode !== 'seed') {
      console.log('no peers')
      setTimeout(torrent.destroy(), 30000)
      window.location = '#'
    }
  })
}

// Download a torrent
function download (hash) {
	cleanBody();
	var client = new WebTorrent();
	client.add({
		infoHash: hash,
        announce:[
			'ws://tracker.steefmin.xyz',
			'ws://tracker.h.steefmin.xyz:8000',
			'wss://tracker.btorrent.xyz',
			'wss://tracker.fastcast.nz',
			'wss://tracker.openwebtorrent.com',
			'wss://tracker.webtorrent.io'
        ]}, onTorrentDownload);
}

// Callback on torrent finish
function onTorrentDownload (torrent) {
  console.log('Downloading ' + torrent.name);
  initTorrent(torrent);
  appendHolder(torrent);
  destroy(torrent);
}

// Clean holder body
function cleanBody () {
  $('.holder').html('');
}

// Callback function when torrent is seeding
function onTorrentSeed (torrent) {
  console.log('Seeding ' + torrent.name);
  console.log('Hash: ' + torrent.infoHash);
  updatePeer(torrent.numPeers);
  initTorrent(torrent);
  appendHolder(torrent);
  prompt('Share this link:', document.location.hostname + '/#' + torrent.infoHash);
  destroy(torrent);
}

// Attempt to shutdown gracefully
function destroy(torrent) {
  window.addEventListener('beforeunload', function (e) {
	torrent.destroy(console.log('torrent destroyed'));
  });
}

// Show the input with the current url
function showInputUrl (url) {
  $('.url-input').val(url);
  $('.share-link').show();
}

// Show the download button for downloading the file
function showDownloadButton (fileName, url) {
  var $but = $('.download-url');
  $but.text('Download ' + fileName);
  $but.attr('href', url);
  $but.attr('download', fileName);
}

// append a torrent to the holder
function appendHolder (torrent) {
  var $holder = $('.holder');
  $holder.text('');
  torrent.files.forEach(function (file) {
    file.appendTo('.holder');
    file.getBlobURL(function (err, url) {
      if (err) {
        console.log(err);
      }
      showDownloadButton(file.name, url);
      showInputUrl(document.location.hostname + '/#' + torrent.infoHash);
    });
  });
}
// initialize values for torrent info
function initInfo() {
	updateData(0,0,0,0);
	updatePeer(0);
}

// initialize values for torrent info
function initInfo () {
  updateData(0, 0, 0, 0)
  updatePeer(0)
}

// bytes to formated data
function formatData (bytes) {
  var sizes = ['B', 'kB', 'MB', 'GB', 'TB'];
  if (bytes === 0) return '0 B';
  var i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)), 10);
  return Math.round(bytes / Math.pow(1024, i), 2) + ' ' + sizes[i];
}

// bits to formated speed
function formatSpeed (bits) {
  var sizes = ['b/s', 'kb/s', 'Mb/s', 'Gb/s', 'Tb/s'];
  if (bits === 0) return '0 b/s';
  var i = parseInt(Math.floor(Math.log(bits) / Math.log(1024)), 10);
  return Math.round(bits / Math.pow(1024, i), 2) + ' ' + sizes[i];
}

// Update value of peer
function updatePeer (peerNum) {
  var $peer = $('.torrent-infos .peer p');
  $peer.text(peerNum);
}

// update the value of downloaded bytes
function updateData (upBytes, downBytes, upSpeed, downSpeed) {
  var $upData = $('.torrent-infos .uploaded-data p')
  $upData.text(formatData(upBytes) + ' @' + formatSpeed(upSpeed))
  var $downData = $('.torrent-infos .downloaded-data p')
  $downData.text(formatData(downBytes) + ' @' + formatSpeed(downSpeed))
}
