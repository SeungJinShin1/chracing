"""
NFC Reader/Writer handler.

Uses nfcpy to:
- Detect NFC tags and read UID → NFC_TAG event
- Write NDEF URL records (music links) → WRITE_RESULT event

Gracefully handles tag removal during write (edge case).
"""

import asyncio
import logging
import threading
from typing import Callable, Awaitable

logger = logging.getLogger(__name__)

EventCallback = Callable[[dict], Awaitable[None]]

# Try importing nfcpy — may not be available on all systems
try:
    import nfc
    import nfc.ndef

    NFC_AVAILABLE = True
except ImportError:
    NFC_AVAILABLE = False
    logger.warning("nfcpy not installed. NFC features disabled.")


class NFCHandler:
    """
    Manages NFC tag reading and NDEF URL writing.
    Runs in a background thread since nfcpy is blocking.
    """

    def __init__(self, on_event: EventCallback, device: str = "usb"):
        self.on_event = on_event
        self.device = device
        self._loop: asyncio.AbstractEventLoop | None = None
        self._running = True
        self._write_queue: asyncio.Queue = asyncio.Queue()
        self._thread: threading.Thread | None = None

    async def run(self) -> None:
        """Start NFC listener in a background thread."""
        if not NFC_AVAILABLE:
            logger.warning("NFC disabled — nfcpy not available.")
            # Keep coroutine alive so gather() doesn't end
            while self._running:
                await asyncio.sleep(5)
            return

        self._loop = asyncio.get_event_loop()
        self._thread = threading.Thread(target=self._nfc_loop, daemon=True)
        self._thread.start()

        # Keep coroutine alive
        while self._running:
            await asyncio.sleep(1)

    def _nfc_loop(self) -> None:
        """Blocking NFC contact loop (runs in thread)."""
        while self._running:
            try:
                with nfc.ContactlessFrontend(self.device) as clf:
                    logger.info(f"NFC reader connected: {self.device}")
                    while self._running:
                        tag = clf.connect(
                            rdwr={"on-connect": self._on_tag_connect},
                            terminate=lambda: not self._running,
                        )
                        if not tag:
                            break
            except Exception as e:
                logger.error(f"NFC error: {e}")
                if self._running:
                    import time
                    time.sleep(3)

    def _on_tag_connect(self, tag) -> bool:
        """Called when a tag is detected."""
        uid = tag.identifier.hex().upper()
        logger.info(f"NFC tag detected: {uid}")

        # Send NFC_TAG event
        event = {"type": "NFC_TAG", "uid": uid}
        if self._loop:
            asyncio.run_coroutine_threadsafe(self.on_event(event), self._loop)

        # Check if there's a pending write
        try:
            write_data = self._write_queue.get_nowait()
            self._do_write(tag, write_data)
        except asyncio.QueueEmpty:
            pass

        return True  # Keep connection

    def _do_write(self, tag, write_data: dict) -> None:
        """Write NDEF URL to tag. Handle tag removal during write."""
        url = write_data.get("url", "")
        try:
            if not hasattr(tag, "ndef") or tag.ndef is None:
                raise RuntimeError("Tag does not support NDEF")

            record = nfc.ndef.UriRecord(url)
            tag.ndef.records = [record]

            result = {
                "type": "WRITE_RESULT",
                "status": "success",
                "message": f"NDEF 인코딩 성공: {url}",
            }
            logger.info(f"NFC write success: {url}")

        except Exception as e:
            error_msg = str(e)
            if "tag" in error_msg.lower() or "removed" in error_msg.lower():
                msg = "태그가 너무 빨리 분리되었습니다."
            else:
                msg = f"NFC 쓰기 실패: {error_msg}"

            result = {
                "type": "WRITE_RESULT",
                "status": "error",
                "message": msg,
            }
            logger.error(f"NFC write failed: {error_msg}")

        if self._loop:
            asyncio.run_coroutine_threadsafe(self.on_event(result), self._loop)

    async def request_write(self, url: str) -> None:
        """Queue a write request. Next tag touch will execute it."""
        await self._write_queue.put({"url": url})
        logger.info(f"NFC write queued: {url}")

    def stop(self) -> None:
        self._running = False
