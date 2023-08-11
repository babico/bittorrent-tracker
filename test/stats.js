import Client from '../index.js'
import commonTest from './common.js'
import fixtures from 'webtorrent-fixtures'
import get from 'simple-get'
import test from 'tape'
import jsdom from 'jsdom'

const peerId = Buffer.from('-WW0091-4ea5886ce160')
const unknownPeerId = Buffer.from('01234567890123456789')

function parseHtml (html) {
  const dom = new jsdom.JSDOM(html)

  return {
    torrents: parseInt(dom.window.document.getElementById('torrents').textContent),
    activeTorrents: parseInt(dom.window.document.getElementById('activeTorrents').textContent),
    peersAll: parseInt(dom.window.document.getElementById('peersAll').textContent),
    peersSeederOnly: parseInt(dom.window.document.getElementById('peersSeederOnly').textContent),
    peersLeecherOnly: parseInt(dom.window.document.getElementById('peersLeecherOnly').textContent),
    peersSeederAndLeecher: parseInt(dom.window.document.getElementById('peersSeederAndLeecher').textContent),
    peersIPv4: parseInt(dom.window.document.getElementById('peersIPv4').textContent),
    peersIPv6: parseInt(dom.window.document.getElementById('peersIPv6').textContent)
  }
}

test('server: get empty stats', t => {
  t.plan(11)

  commonTest.createServer(t, 'http', (server, announceUrl) => {
    const url = announceUrl.replace('/announce', '/stats')

    get.concat(url, (err, res, data) => {
      t.error(err)

      const stats = parseHtml(data.toString())
      t.equal(res.statusCode, 200)
      t.equal(stats.torrents, 0)
      t.equal(stats.activeTorrents, 0)
      t.equal(stats.peersAll, 0)
      t.equal(stats.peersSeederOnly, 0)
      t.equal(stats.peersLeecherOnly, 0)
      t.equal(stats.peersSeederAndLeecher, 0)
      t.equal(stats.peersIPv4, 0)
      t.equal(stats.peersIPv6, 0)

      server.close(() => { t.pass('server closed') })
    })
  })
})

test('server: get empty stats with json header', t => {
  t.plan(11)

  commonTest.createServer(t, 'http', (server, announceUrl) => {
    const opts = {
      url: announceUrl.replace('/announce', '/stats'),
      headers: {
        accept: 'application/json'
      },
      json: true
    }

    get.concat(opts, (err, res, stats) => {
      t.error(err)

      t.equal(res.statusCode, 200)
      t.equal(stats.torrents, 0)
      t.equal(stats.activeTorrents, 0)
      t.equal(stats.peersAll, 0)
      t.equal(stats.peersSeederOnly, 0)
      t.equal(stats.peersLeecherOnly, 0)
      t.equal(stats.peersSeederAndLeecher, 0)
      t.equal(stats.peersIPv4, 0)
      t.equal(stats.peersIPv6, 0)

      server.close(() => { t.pass('server closed') })
    })
  })
})

test('server: get empty stats on stats.json', t => {
  t.plan(11)

  commonTest.createServer(t, 'http', (server, announceUrl) => {
    const opts = {
      url: announceUrl.replace('/announce', '/stats.json'),
      json: true
    }

    get.concat(opts, (err, res, stats) => {
      t.error(err)

      t.equal(res.statusCode, 200)
      t.equal(stats.torrents, 0)
      t.equal(stats.activeTorrents, 0)
      t.equal(stats.peersAll, 0)
      t.equal(stats.peersSeederOnly, 0)
      t.equal(stats.peersLeecherOnly, 0)
      t.equal(stats.peersSeederAndLeecher, 0)
      t.equal(stats.peersIPv4, 0)
      t.equal(stats.peersIPv6, 0)

      server.close(() => { t.pass('server closed') })
    })
  })
})

test('server: get leecher stats.json', t => {
  t.plan(11)

  commonTest.createServer(t, 'http', (server, announceUrl) => {
    // announce a torrent to the tracker
    const client = new Client({
      infoHash: fixtures.leaves.parsedTorrent.infoHash,
      announce: announceUrl,
      peerId,
      port: 6881
    })
    client.on('error', err => { t.error(err) })
    client.on('warning', err => { t.error(err) })

    client.start()

    server.once('start', () => {
      const opts = {
        url: announceUrl.replace('/announce', '/stats.json'),
        json: true
      }

      get.concat(opts, (err, res, stats) => {
        t.error(err)

        t.equal(res.statusCode, 200)
        t.equal(stats.torrents, 1)
        t.equal(stats.activeTorrents, 1)
        t.equal(stats.peersAll, 1)
        t.equal(stats.peersSeederOnly, 0)
        t.equal(stats.peersLeecherOnly, 1)
        t.equal(stats.peersSeederAndLeecher, 0)
        t.equal(stats.clients.WebTorrent['0.91'], 1)

        client.destroy(() => { t.pass('client destroyed') })
        server.close(() => { t.pass('server closed') })
      })
    })
  })
})

test('server: get leecher stats.json (unknown peerId)', t => {
  t.plan(11)

  commonTest.createServer(t, 'http', (server, announceUrl) => {
    // announce a torrent to the tracker
    const client = new Client({
      infoHash: fixtures.leaves.parsedTorrent.infoHash,
      announce: announceUrl,
      peerId: unknownPeerId,
      port: 6881
    })
    client.on('error', err => { t.error(err) })
    client.on('warning', err => { t.error(err) })

    client.start()

    server.once('start', () => {
      const opts = {
        url: announceUrl.replace('/announce', '/stats.json'),
        json: true
      }

      get.concat(opts, (err, res, stats) => {
        t.error(err)

        t.equal(res.statusCode, 200)
        t.equal(stats.torrents, 1)
        t.equal(stats.activeTorrents, 1)
        t.equal(stats.peersAll, 1)
        t.equal(stats.peersSeederOnly, 0)
        t.equal(stats.peersLeecherOnly, 1)
        t.equal(stats.peersSeederAndLeecher, 0)
        t.equal(stats.clients.unknown['01234567'], 1)

        client.destroy(() => { t.pass('client destroyed') })
        server.close(() => { t.pass('server closed') })
      })
    })
  })
})
