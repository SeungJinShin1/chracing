"""
Async Serial Reader with auto-reconnect.

Reads STANDBY / START / FINISH text lines from micro:bit USB serial
and invokes a callback with structured JSON events.
"""

import asyncio
import logging
import time
from typing import Callable, Awaitable

import serial

from config import SERIAL_PORT, SERIAL_BAUD, SERIAL_RECONNECT_INTERVAL

logger = logging.getLogger(__name__)

VALID_ACTIONS = {"STANDBY", "START", "FINISH"}

EventCallback = Callable[[dict], Awaitable[None]]


class SerialReader:
    """Non-blocking serial reader with automatic reconnection."""

    def __init__(self, on_event: EventCallback):
        self.on_event = on_event
        self._ser: serial.Serial | None = None
        self._running = True

    async def run(self) -> None:
        """Main loop: connect → read → reconnect on failure."""
        while self._running:
            try:
                await self._connect()
                await self._read_loop()
            except Exception as e:
                logger.warning(f"Serial error: {e}")
            finally:
                self._close()

            if self._running:
                logger.info(
                    f"Reconnecting serial in {SERIAL_RECONNECT_INTERVAL}s..."
                )
                await asyncio.sleep(SERIAL_RECONNECT_INTERVAL)

    async def _connect(self) -> None:
        """Open the serial port (blocking call run in executor)."""
        loop = asyncio.get_event_loop()
        self._ser = await loop.run_in_executor(
            None,
            lambda: serial.Serial(SERIAL_PORT, SERIAL_BAUD, timeout=1),
        )
        logger.info(f"Serial connected: {SERIAL_PORT} @ {SERIAL_BAUD}")

    async def _read_loop(self) -> None:
        """Continuously read lines from serial port."""
        loop = asyncio.get_event_loop()
        while self._running and self._ser and self._ser.is_open:
            raw = await loop.run_in_executor(None, self._ser.readline)
            if not raw:
                continue

            line = raw.decode("utf-8", errors="ignore").strip()
            if not line:
                continue

            action = line.upper()
            if action in VALID_ACTIONS:
                event = {
                    "type": "SENSOR_EVENT",
                    "action": action,
                    "timestamp": int(time.time() * 1000),
                }
                logger.info(f"Sensor event: {action}")
                await self.on_event(event)
            else:
                logger.debug(f"Ignored serial data: {line!r}")

    def _close(self) -> None:
        """Safely close the serial port."""
        if self._ser and self._ser.is_open:
            try:
                self._ser.close()
            except Exception:
                pass
        self._ser = None
        logger.info("Serial port closed.")

    def stop(self) -> None:
        self._running = False
        self._close()
