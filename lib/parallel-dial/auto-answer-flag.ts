/** Module flags — parallel/power dialer auto-answers bridged inbound WebRTC legs. */
let parallelAutoAnswer = false;
let powerAutoAnswer = false;

export function setParallelAutoAnswer(enabled: boolean) {
  parallelAutoAnswer = enabled;
}

export function setPowerAutoAnswer(enabled: boolean) {
  powerAutoAnswer = enabled;
}

export function shouldParallelAutoAnswer() {
  return parallelAutoAnswer;
}

/** True when a server-bridged dialer leg should auto-accept in the browser. */
export function shouldBridgeAutoAnswer() {
  return parallelAutoAnswer || powerAutoAnswer;
}
