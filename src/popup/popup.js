import { readTurnedOff, writeTurnedOff } from '../adapters/powerSwitch.js'

const switchInput = document.getElementById('power-switch')
const stateText = document.getElementById('power-state')

function show(isTurnedOff) {
  switchInput.checked = !isTurnedOff
  stateText.textContent = isTurnedOff ? '꺼짐' : '켜짐'
}

// 열린 탭들은 저장소의 알림을 듣고 따라온다. 팝업은 값을 쓰기만 하면 된다.
switchInput.addEventListener('change', () => {
  const isTurnedOff = !switchInput.checked
  show(isTurnedOff)
  writeTurnedOff(isTurnedOff)
})

show(await readTurnedOff())
