var App = {}
;(function () {
  App.Trackers = [
    'ws://torrent.lunik.xyz:8000',
    'udp://torrent.lunik.xyz:8000',
    'http://torrent.lunik.xyz:8000/announce',
    'wss://tracker.webtorrent.io',
    'udp://tracker.internetwarriors.net:1337',
    'udp://tracker.leechers-paradise.org:6969',
    'udp://tracker.coppersurfer.tk:6969',
    'udp://exodus.desync.com:6969',
    'wss://tracker.btorrent.xyz',
    'wss://tracker.openwebtorrent.com',
    'wss://tracker.fastcast.nz'
  ]

  /**
   * Format module
   * @constructor
  */
  function _Format () {}

  /**
   * Clean the hash and turn magnet to hash
   * @param {string} hash - The hash or magnet
   * @return {string} - The clean hash
  */
  _Format.prototype.hash = function (hash) {
    var r = new RegExp('.*:')
    var r2 = new RegExp('&.*')
    return hash.replace(r, '').replace(r2, '')
  }

  /**
   * Turn bytes into B, MB, KB, ...
   * @param {int} bytes - Number of bytes
   * @return {string} - Formated data
  */
  _Format.prototype.data = function(bytes){
    var sizes = ['B', 'kB', 'MB', 'GB', 'TB']
    if (bytes === 0) {
      return '0 B'
    }
    var i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)), 10)
    return Math.round(bytes / Math.pow(1024, i), 2) + ' ' + sizes[i]
  }

  /**
   * Turn bits into b/s, mb/s, KB, ...
   * @param {int} bits - Number of bits
   * @return {string} - Formated data
  */
  _Format.prototype.speed = function(bits){
    var sizes = ['b/s', 'kb/s', 'Mb/s', 'Gb/s', 'Tb/s']
    if (bits === 0) {
      return '0 b/s'
    }
    var i = parseInt(Math.floor(Math.log(bits) / Math.log(1024)), 10)
    return Math.round(bits / Math.pow(1024, i), 2) + ' ' + sizes[i]
  }

  App.Format = new _Format()

  // Update the hash
  App.hash = App.Format.hash(window.location.hash.substring(1))
  $(window).bind('hashchange', function () {
    App.hash = App.Format.hash(window.location.hash.substring(1))
  })

  App.vue = new Vue({
    el: 'body',
    data: {
      app: {
        state: 'success',
        message: 'Instant Share disponible'
      },
      holder: {
        state: '',
        fileName: ''
      },
      torrent: {
        state: '',
        peer: 0,
        progress: 0,
        sup: App.Format.speed(0),
        sdown: App.Format.speed(0),
        up: App.Format.data(0),
        down: App.Format.data(0)
      }
    }
  })

  App.setStatus = function(status){
    if(status){
      App.vue.$data.app.state = 'success'
      App.vue.$data.app.message = 'Instant Share disponible'
    } else {
      App.vue.$data.app.state = 'fail'
      App.vue.$data.app.message = 'Instant Share indisponible'
    }
  }

  App.checkStatus = function(){
    if (typeof window.FileReader === 'undefined') {
      App.setStatus(false)
      return false
    } else {
      App.setStatus(true)
      return true
    }
  }

  App.setFileName = function(name){
    App.vue.$data.holder.fileName = name
  }

  App.initHolder = function(){
    var $holder = $('.holder')
    var $upload = $('.holder .upload .button')
    var $uploadBut = $('.holder .upload-but')

    $holder.on('dragover', function (event) {
      event.preventDefault()
      event.stopPropagation()
      App.vue.$data.holder.state = 'hover'
    })

    $holder.on('dragleave', function (event) {
      event.preventDefault()
      event.stopPropagation()
      App.vue.$data.holder.state = ''
    })

    $holder.on('drop', function (event) {
      event.preventDefault()
      event.stopPropagation()
      App.vue.$data.holder.state = ''
      var file = event.originalEvent.dataTransfer.files[0]
      App.setFileName(file.name)
      //seed(file)
    })

    $upload.click(function () {
      $uploadBut.trigger('click')
    })

    $uploadBut.on('change', function () {
      App.setFileName(this.files[0].name)
      //seed(this.files[0])
    })
  }

  App.setTorrentStatus = function(status){
    App.vue.$data.torrent.state = status
  }

  App.setTorrentData = function(data){
    for(var key in data){
      App.vue.$data.torrent[key] = data[key]
    }
  }

  App.initTorrent = function(torrent){
    torrent.on('metadata', function () {
      App.setFileName(torrent.name)
    })

    torrent.on('ready', function () {
      //appendHolder(torrent)
    })

    torrent.on('download', function (chunkSize) {
      App.setTorrentData({
        progress: Math.round(torrent.progress * 100),
        down: App.Format.data(torrent.downloaded),
        sdown: App.Format.speed(torrent.downloadSpeed)
      })
      App.setTorrentStatus('Downloading')
    })

    torrent.on('wire', function (wire) {
      App.setTorrentData({
        peer: torrent.numPeers
      })
    })

    torrent.on('done', function () {
      App.setTorrentData({
        peer: torrent.numPeers,
        progress: Math.round(torrent.progress * 100),
        up: App.Format.data(torrent.uploaded),
        down: App.Format.data(torrent.downloaded),
      })
    })

    torrent.on('upload', function (data) {
      App.setTorrentData({
        up: App.Format.data(torrent.uploaded),
        sup: App.Format.speed(torrent.uploadSpeed),
      })
      App.setTorrentStatus('Uploading')
    })

    torrent.on('noPeers', function () {
      App.setTorrentData({
        peer: torrent.numPeers
      })
      App.setTorrentStatus('Seeding')
    })
  }

  App.main = function(){
    if(App.checkStatus()){
      App.initHolder()
    }
  }

  App.main()
})()
