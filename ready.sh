sudo sh -c "echo '1-2:1.0' > /sys/bus/usb/drivers/pn533/unbind"
systemctl restart pcscd
