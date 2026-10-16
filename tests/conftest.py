import os
import pytest

# Ensure testing flag is set before any app module imports
os.environ["TESTING"] = "1"
os.environ["SENTRY_DSN"] = ""
