"""
Bridge Server Configuration.

Override any value via environment variables:
  SERIAL_PORT=COM5 python bridge_server.py
"""

import os

# ---------------------------------------------------------------------------
# Serial (USB micro:bit)
# ---------------------------------------------------------------------------
SERIAL_PORT = os.getenv("SERIAL_PORT", "COM3")
SERIAL_BAUD = int(os.getenv("SERIAL_BAUD", "115200"))
SERIAL_RECONNECT_INTERVAL = float(os.getenv("SERIAL_RECONNECT_INTERVAL", "3.0"))

# ---------------------------------------------------------------------------
# WebSocket
# ---------------------------------------------------------------------------
WS_HOST = os.getenv("WS_HOST", "localhost")
WS_PORT = int(os.getenv("WS_PORT", "8765"))

# ---------------------------------------------------------------------------
# NFC
# ---------------------------------------------------------------------------
NFC_DEVICE = os.getenv("NFC_DEVICE", "usb")  # nfcpy device string
