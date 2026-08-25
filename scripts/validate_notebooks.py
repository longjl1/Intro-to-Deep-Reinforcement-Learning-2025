#!/usr/bin/env python3
"""Validate repository notebooks without third-party dependencies."""

from __future__ import annotations

import argparse
import ast
import json
import sys
from pathlib import Path


IGNORED_LINE_PREFIXES = ("%", "!")


def notebook_paths(root: Path) -> list[Path]:
    paths = set(root.rglob("*.ipynb")) | set(root.rglob("*.IPYNB"))
    return sorted(path for path in paths if ".ipynb_checkpoints" not in path.parts)


def python_source(cell: dict) -> str:
    source = cell.get("source", [])
    text = source if isinstance(source, str) else "".join(source)
    return "\n".join(
        line
        for line in text.splitlines()
        if not line.lstrip().startswith(IGNORED_LINE_PREFIXES)
    )


def validate(path: Path, root: Path, allow_saved_errors: bool) -> list[str]:
    relative = path.relative_to(root)
    problems: list[str] = []

    try:
        notebook = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, UnicodeDecodeError, json.JSONDecodeError) as exc:
        return [f"{relative}: invalid notebook JSON: {exc}"]

    if notebook.get("nbformat") != 4:
        problems.append(f"{relative}: expected nbformat 4")

    kernelspec = notebook.get("metadata", {}).get("kernelspec", {})
    if not kernelspec.get("name"):
        problems.append(f"{relative}: missing kernelspec metadata")

    for index, cell in enumerate(notebook.get("cells", []), start=1):
        if cell.get("cell_type") == "code":
            source = python_source(cell)
            if source.strip():
                try:
                    ast.parse(source)
                except SyntaxError as exc:
                    problems.append(
                        f"{relative}: cell {index}: Python syntax error: "
                        f"{exc.msg} (line {exc.lineno})"
                    )

        if not allow_saved_errors:
            for output in cell.get("outputs", []):
                if output.get("output_type") == "error":
                    error = output.get("ename", "unknown error")
                    problems.append(f"{relative}: cell {index}: saved {error} output")

    return problems


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--allow-saved-errors",
        action="store_true",
        help="do not fail when a notebook contains a saved exception output",
    )
    args = parser.parse_args()

    root = Path(__file__).resolve().parents[1]
    paths = notebook_paths(root)
    problems = [
        problem
        for path in paths
        for problem in validate(path, root, args.allow_saved_errors)
    ]

    if problems:
        for problem in problems:
            print(f"ERROR: {problem}")
        print(f"\nChecked {len(paths)} notebooks; found {len(problems)} problem(s).")
        return 1

    print(f"Checked {len(paths)} notebooks; all structural checks passed.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
