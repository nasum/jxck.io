const log   = console.log.bind(console)
const info  = console.info.bind(console)
const warn  = console.warn.bind(console)
const error = console.error.bind(console)

const $ = document.querySelector.bind(document)
const ws = new WS('ws://localhost:9000')

const constraint = {audio: false, video: true}
const id = btoa(Math.random()*1000)
const rtc  = new RTC(id)

ws.on('open', (e) => {
  $('#id').textContent = ws.id
  $('#call').addEventListener('click', async (e) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraint)
      info('1. addStream()')
      // ここで negotiation needed が発火する
      stream.getTracks().forEach((track) => {
        rtc.addTrack(track, stream)
      })
      $('#local').srcObject = stream
    } catch (err) {
      error(err)
    }
  })
})

rtc.on('icecandidate', (candidate) => {
  info('7. ice candidate は無視')
})

rtc.on('negotiationneeded', async () => {
  try {
    info('2. onnegotiationneeded が発生したらネゴシエーションする')
    info('3. offer を作成')
    const option = {
      offerToReceiveAudio: 1,
      offerToReceiveVideo: 1,
    }
    const offer = await rtc.createOffer(option)
    console.log('client offer', offer.sdp)
    ws.emit('offer', offer)
    // ここで setLocalDescription はしない
  } catch (err) {
    error(err)
  }
})

rtc.on('iceconnectionstatechange', (state) => {
  info(state)
})

rtc.on('addstream', (stream) => {
  info('addstream', stream)
  $('#remote').srcObject = stream
})

rtc.on('track', (e) => {
  info('track', e.streams)
  $('#remote').srcObject = e.streams[0]
})

ws.on('offer', async ({to, sdp}) => {
  try {
    if (to !== ws.id) return

    console.log('server offer', sdp.sdp)

    info('5. offer を受信')

    await rtc.setRemoteDescription(sdp)
    info('5. answer を作成')
    rtcSessionDescription = await rtc.createAnswer()
    console.log('client answer', rtcSessionDescription.sdp)

    info('6. answer を local に適用')
    await rtc.setLocalDescription(rtcSessionDescription)

    info('6. answer を送信')
    ws.emit('answer', rtc.localDescription)
  } catch (err) {
    error(err)
  }
})

ws.on('answer', ({to, sdp}) => {
  try {
    if (to !== ws.id) return

    info('6. answer を受信')
    console.log('server answer', sdp.sdp)

    await = rtc.setRemoteDescription(sdp)
  } catch (err) {
    error(err)
  }
})
