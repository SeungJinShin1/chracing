"""
CH Racing — Local Bridge Server

WebSocket server (ws://localhost:8765) that bridges:
  - USB Serial (micro:bit sensors) → Frontend
  - NFC Reader/Writer ↔ Frontend

Usage:
  python bridge_server.py
  SERIAL_PORT=COM5 python bridge_server.py
"""

import asyncio
import json
import logging
import signal

import websockets

from config import WS_HOST, WS_PORT, NFC_DEVICE
from serial_reader import SerialReader
from nfc_handler import NFCHandler

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("bridge")

# ---------------------------------------------------------------------------
# Connected clients
# ---------------------------------------------------------------------------
connected_clients: set[websockets.WebSocketServerProtocol] = set()


async def broadcast(event: dict) -> None:
    """Send a JSON event to ALL connected WebSocket clients."""
    if not connected_clients:
        return

    message = json.dumps(event, ensure_ascii=False)
    disconnected = set()

    for ws in connected_clients:
        try:
            await ws.send(message)
        except websockets.ConnectionClosed:
            disconnected.add(ws)

    connected_clients.difference_update(disconnected)


# ---------------------------------------------------------------------------
# WebSocket handler (per-client)
# ---------------------------------------------------------------------------
nfc_handler: NFCHandler | None = None


async def ws_handler(websocket: websockets.WebSocketServerProtocol) -> None:
    """Handle a single WebSocket client connection."""
    connected_clients.add(websocket)
    remote = websocket.remote_address
    logger.info(f"Client connected: {remote} (total: {len(connected_clients)})")

    try:
        async for raw_message in websocket:
            try:
                data = json.loads(raw_message)
                msg_type = data.get("type")

                if msg_type == "WRITE_NFC" and nfc_handler:
                    url = data.get("url", "")
                    if url:
                        await nfc_handler.request_write(url)
                        logger.info(f"WRITE_NFC requested: {url}")
                    else:
                        await websocket.send(json.dumps({
                            "type": "WRITE_RESULT",
                            "status": "error",
                            "message": "URL이 비어있습니다.",
                        }))
                else:
                    logger.debug(f"Unknown message type: {msg_type}")

            except json.JSONDecodeError:
                logger.warning(f"Invalid JSON from client: {raw_message!r}")

    except websockets.ConnectionClosed:
        pass
    finally:
        connected_clients.discard(websocket)
        logger.info(f"Client disconnected: {remote} (total: {len(connected_clients)})")


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
async def main() -> None:
    global nfc_handler

    logger.info(f"Starting Bridge Server on ws://{WS_HOST}:{WS_PORT}")

    # Create hardware handlers
    serial_reader = SerialReader(on_event=broadcast)
    nfc_handler = NFCHandler(on_event=broadcast, device=NFC_DEVICE)

    # Graceful shutdown
    stop_event = asyncio.Event()

    def _signal_handler():
        logger.info("Shutdown signal received")
        serial_reader.stop()
        nfc_handler.stop()
        stop_event.set()

    loop = asyncio.get_event_loop()
    for sig in (signal.SIGINT, signal.SIGTERM):
        try:
            loop.add_signal_handler(sig, _signal_handler)
        except NotImplementedError:
            # Windows doesn't support add_signal_handler
            pass

    # Start everything concurrently
    async with websockets.serve(ws_handler, WS_HOST, WS_PORT):
        logger.info(f"WebSocket server listening on ws://{WS_HOST}:{WS_PORT}")

        await asyncio.gather(
            serial_reader.run(),
            nfc_handler.run(),
            stop_event.wait(),
            return_exceptions=True,
        )

    logger.info("Bridge server stopped.")


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.info("Bridge server interrupted by user.")
