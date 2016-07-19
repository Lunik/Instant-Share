var App
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

  // Update the hash
  App.hash = cleanHash(window.location.hash.substring(1))
  $(window).bind('hashchange', function () {
    App.hash = cleanHash(window.location.hash.substring(1))
  })
})()
