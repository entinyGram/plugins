# Voice Changer

Changes your voice in voice messages, video messages and calls: deep, high, girl or robot.

`entinygram.voice-changer` · version `0.1.0` · requires `entinygram.sdk >=0.4.1`

The preset is in **Settings → Behavior → Calls**, or on the plugin's own page. It is off by default, and while it is off nothing is hooked.

Hooks `AudioRecord.read(ByteBuffer, …)`, which every recording and call path reads the microphone through, and changes the PCM chunk in place inside a routine, so no JS runs per audio chunk. Deep and high use a two-tap delay-line pitch shifter, robot is a ring modulator.
