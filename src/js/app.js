$(window).bind('hashchange', function(){
  getHash()
})

$(document).ready(function(){
  initSeed()
  getHash()
})

function getHash(){
  var hash = window.location.hash.substring(1);
  if(hash.length > 0){
    console.log("New Hash: "+hash)
    download(hash);
  }
}

function initTorrent(torrent){
  var holder = document.getElementsByClassName('holder')[0];
  torrent.on('done', function(){
    console.log('torrent finished downloading');
    holder.style.background = ""
  })

  torrent.on('wire', function (wire) {
    console.log('new peer');
    updatePeer(torrent.numPeers)
  })
}

function download(hash){
  cleanBody()
  var client = new WebTorrent()
  client.download({
    infoHash: hash,
    announce: ["wss://tracker.btorrent.xyz",
    "wss://tracker.fastcast.nz",
    "wss://tracker.openwebtorrent.com",
    "wss://tracker.webtorrent.io"]
  }, onTorrentDownload)
}

function onTorrentDownload(torrent){
  var holder = document.getElementsByClassName('holder')[0];
  holder.style.background =  'no-repeat center url("src/css/dashinfinity.gif")';
  console.log("Downloadind "+torrent.name)

  initTorrent(torrent)

  appendHolder(torrent)
}

function cleanBody(){
  $('.download').html('')
}

function initSeed(){
  var holder = document.getElementsByClassName('holder')[0];
  var state = document.getElementsByClassName('status')[0];

  if (typeof window.FileReader === 'undefined') {
    state.id = 'fail';
    state.innerHTML = 'Instant Share indisponible';
  } else {
    state.id = 'success';
    state.innerHTML = 'Instant Share disponible';
  }

  holder.ondragover = function () { this.id = 'hover'; return false; };
  holder.ondragend = function () { this.id = ''; return false; };
  holder.ondrop = function (e) {
    this.id = '';
    e.preventDefault();

    var file = e.dataTransfer.files[0]

    console.log(file);
    var client = new WebTorrent()
    client.seed(file,onTorrentSeed);
  };
}

function onTorrentSeed(torrent){
  window.location.hash = "#"+torrent.infoHash
  var holder = document.getElementsByClassName('holder')[0];
  console.log("Seeding "+torrent.name)
  console.log("Hash: "+torrent.infoHash)

  initTorrent(torrent)

  appendHolder(torrent)

  prompt('Partager le lien:',document.location.hostname+"/#"+torrent.infoHash)
}

function showInputUrl(url){
  document.getElementsByClassName('url-input')[0].value = url;
  document.getElementsByClassName('url-input')[0].hidden = false
}

function showDownloadButton(fileName, url){
  var but = document.getElementsByClassName('download-url')[0]
  but.innerHTML = "Télécharger "+fileName
  but.href = url
  but.download = fileName
}

function appendHolder(torrent){
  var holder = document.getElementsByClassName('holder')[0];
  holder.innerHTML = ""
  torrent.files.forEach(function(file){
    file.getBlobURL(function (err, url) {
      holder.onclick = function(){ window.open(url,'_blank')}
      showDownloadButton(file.name, url)
      showInputUrl(document.location.hostname+"/#"+torrent.infoHash)
      file.appendTo(holder)
    })
  })
}

function updatePeer(peerNum){
  var peer = document.getElementsByClassName('peer')[0]
  peer.innerHTML = "Peers: "+peerNum;
}
