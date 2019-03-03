To get this running:
	 - Plug in the NFC reader
	 - Once active (light shining), > ./ready.sh
	 - node index.js
Feel free to monitor: udevadm monitor

Troubleshooting:
- sudo service <> stop, sudo service <> start instead of sysctl
- On a new box, it's possible pcscd isn't installed (sudo apt-get pcscd, start)
- If getting echo: I/O error, unplug everything, reset computer
- Make sure the regex matches live site/registration