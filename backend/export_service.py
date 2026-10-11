"""Project export service — builds cyberstream-project.zip from the live source.

Whitelist strategy: only walk approved roots, apply exclusion rules, prevent
path traversal, never include secrets (.env / credentials). Streams the archive.
"""
from __future__ import annotations

import os
import tempfile
import zipfile
import logging
from pathlib import Path
from typing import List, Tuple

logger = logging.getLogger("cyberstream.export")

APP_ROOT = Path(__file__).parent.parent          # /app
STAGING = APP_ROOT / "cyberstream_export"        # generated monorepo extras
LIVE_BACKEND = APP_ROOT / "backend"
LIVE_FRONTEND = APP_ROOT / "frontend"

EXCLUDE_DIRS = {"node_modules", ".venv", "venv", "__pycache__", ".git", "build",
                "dist", ".pytest_cache", ".mypy_cache", "coverage", ".cache"}
EXCLUDE_FILES = {".env", ".env.local", ".env.production", "cookies.txt"}
EXCLUDE_SUFFIX = {".pyc", ".pyo", ".log", ".key", ".pem", ".crt"}


def _allowed(path: Path) -> bool:
    parts = set(path.parts)
    if parts & EXCLUDE_DIRS:
        return False
    if path.name in EXCLUDE_FILES:
        return False
    if path.suffix in EXCLUDE_SUFFIX:
        return False
    return True


# (source root, arc prefix inside zip)
def _roots() -> List[Tuple[Path, str]]:
    roots = []
    if STAGING.exists():
        roots.append((STAGING, "cyberstream"))
    roots.append((LIVE_BACKEND, "cyberstream/backend"))
    roots.append((LIVE_FRONTEND, "cyberstream/frontend"))
    return roots


def _collect(mode: str) -> List[Tuple[Path, str]]:
    """Return list of (absolute file path, arcname). mode: complete|source|docs."""
    files: List[Tuple[Path, str]] = []
    seen = set()
    for root, prefix in _roots():
        if not root.exists():
            continue
        for dirpath, dirnames, filenames in os.walk(root):
            dirnames[:] = [d for d in dirnames if d not in EXCLUDE_DIRS]
            dp = Path(dirpath)
            for fn in filenames:
                fpath = (dp / fn).resolve()
                # path traversal guard: must stay within an allowed root
                if not any(str(fpath).startswith(str(r.resolve())) for r, _ in _roots()):
                    continue
                if not _allowed(fpath):
                    continue
                rel = fpath.relative_to(root)
                arcname = f"{prefix}/{rel.as_posix()}"
                if mode == "docs" and not (arcname.endswith(".md") or "/docs/" in arcname):
                    continue
                if mode == "source" and arcname.endswith(".md") and prefix == "cyberstream":
                    # source-only keeps code + configs, skips top-level docs
                    if rel.parts and rel.parts[0].endswith(".md"):
                        continue
                if arcname in seen:
                    continue
                seen.add(arcname)
                files.append((fpath, arcname))
    return files


def build_archive(mode: str = "complete") -> Path:
    files = _collect(mode)
    tmp = tempfile.NamedTemporaryFile(prefix="cyberstream_", suffix=".zip", delete=False)
    tmp.close()
    with zipfile.ZipFile(tmp.name, "w", zipfile.ZIP_DEFLATED, compresslevel=6) as zf:
        for fpath, arcname in files:
            try:
                zf.write(fpath, arcname)
            except Exception as e:
                logger.warning(f"skip {fpath}: {e}")
    return Path(tmp.name)


def estimate_size(mode: str = "complete") -> dict:
    files = _collect(mode)
    total = 0
    for f, _ in files:
        try:
            total += f.stat().st_size
        except Exception:
            pass
    return {"file_count": len(files), "raw_bytes": total,
            "estimated_zip_bytes": int(total * 0.4)}
