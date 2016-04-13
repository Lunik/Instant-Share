// Get Hash on hashchange
$(window).bind('hashchange', function () {
  getHash()
})

// Get Hash on loading page
$(document).ready(function () {
  initHolder()
  getHash()
})

// Get the hash and start torrent if there is an hash
function getHash () {
  var hash = window.location.hash.substring(1)
  hash = cleanHash(hash)
  window.location.hash = '#' + hash
  if (hash.length > 0) {
    console.log('New Hash: ' + hash)
    var holder = $('.holder')
    holder.css('background', 'no-repeat center url("src/css/dashinfinity.gif")')
    download(hash)
  }
}

// turn magnet into hash
function cleanHash (hash) {
  var r = new RegExp('.*:')
  var r2 = new RegExp('&.*')

  return hash.replace(r, '').replace(r2, '')
}

// Initialise seed torrent
function initHolder () {
  var holder = $('.holder')
  var upload = $('.holder .upload .button')
  var file_name = $('.holder .filename')
  var upload_but = $('.holder .upload-but')
  var state = $('.status')

  if (typeof window.FileReader === 'undefined') {
    state.attr('id', 'fail')
    state.text('Instant Share indisponible')
  } else {
    state.attr('id', 'success')
    state.text('Instant Share disponible')
  }

  holder.on('dragover', function (event) {
    event.preventDefault()
    event.stopPropagation()
    this.id = 'hover'; return false
  })

  holder.on('dragleave', function (event) {
    event.preventDefault()
    event.stopPropagation()
    this.id = ''; return false
  })

  holder.on('drop', function (event) {
    this.id = ''
    event.preventDefault()
    event.stopPropagation()

    var file = event.originalEvent.dataTransfer.files[0]

    seed(file)
  })

  upload.click(function () {
    upload_but.trigger('click')
  })

  upload_but.on('change', function () {
    file_name.text(this.files[0].name)
    seed(this.files[0])
  })
}

function seed (file) {
  console.log(file)
  var client = new WebTorrent()
  client.seed(file, onTorrentSeed)
}

// Initialise event on torrent
function initTorrent (torrent) {
  var holder = $('.holder')
  torrent.on('done', function () {
    console.log('torrent finished downloading')
    holder.css('background', '')
  })

  torrent.on('wire', function (wire) {
    console.log('new peer')
    updatePeer(torrent.numPeers)
  })
}

// Download a torrent
function download (hash) {
  cleanBody()
  var client = new WebTorrent()
  client.download({
    infoHash: hash,
    announce: ['wss://tracker.btorrent.xyz',
      'wss://tracker.fastcast.nz',
      'wss://tracker.openwebtorrent.com',
      'wss://tracker.webtorrent.io']
  }, onTorrentDownload)
}

// Callback on torrent finish
function onTorrentDownload (torrent) {
  console.log('Downloadind ' + torrent.name)

  initTorrent(torrent)

  appendHolder(torrent)
}

// Clean holder body
function cleanBody () {
  $('.holder').html('')
}

// Callback function when torrent is seeding
function onTorrentSeed (torrent) {
  console.log('Seeding ' + torrent.name)
  console.log('Hash: ' + torrent.infoHash)

  initTorrent(torrent)

  appendHolder(torrent)

  prompt('Partager le lien:', document.location.hostname + '/#' + torrent.infoHash)
}

// Show the input with the current url
function showInputUrl (url) {
  $('.url-input').val(url)
  $('.url-input').show()
}

// Show the download button for downloading the file
function showDownloadButton (fileName, url) {
  var but = $('.download-url')
  but.text('Télécharger ' + fileName)
  but.attr('href', url)
  but.attr('download', fileName)
}

// append a torrent to the holder
function appendHolder (torrent) {
  var holder = $('.holder')
  holder.text('')
  torrent.files.forEach(function (file) {
    file.getBlobURL(function (err, url) {
      showDownloadButton(file.name, url)
      showInputUrl(document.location.hostname + '/#' + torrent.infoHash)
      file.appendTo('.holder')
    })
  })
}

// Update value of peer
function updatePeer (peerNum) {
  var peer = $('.peer')
  peer.text('Peers: ' + peerNum)
}
