/** Module flag — parallel dialer auto-answers bridged inbound WebRTC legs. */
let parallelAutoAnswer = false;

export function setParallelAutoAnswer(enabled: boolean) {
  parallelAutoAnswer = enabled;
}

export function shouldParallelAutoAnswer() {
  return parallelAutoAnswer;
}
