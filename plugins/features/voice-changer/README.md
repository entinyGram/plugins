# voice changer

changes your voice in voice messages, video messages and calls.

| | |
| :--- | :--- |
| id | `entinygram.voice-changer` |
| version | `1.2.0` |
| status | active |
| grants | `unsafe.jvm`, `unsafe.xposed` |

## settings

page: `Settings → Plugins → Voice Changer`. off by default, nothing is hooked while it is off.

| preset | method |
| :--- | :--- |
| deep, high | two-tap delay-line pitch shifter |
| girl | pitch shift |
| robot | ring modulator |

| scope | applies to |
| :--- | :--- |
| everywhere | messages and calls |
| messages | voice and video messages only |
| calls | calls only |

## how it works

a routine hooks `AudioRecord.read(ByteBuffer, …)`, which every recording and call path reads the microphone through, and changes the pcm chunk in place. no js runs per audio chunk.
