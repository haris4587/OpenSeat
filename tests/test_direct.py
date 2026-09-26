"""Native GenLayer Direct Mode smoke test (requires GenVM runtime dependencies)."""
import time
import os
import pytest

pytestmark = pytest.mark.skipif(os.getenv("GENLAYER_DIRECT") != "1", reason="native GenVM runtime gate: set GENLAYER_DIRECT=1 when runtime artifacts are available")

def test_constructor_and_permissions(direct_deploy, direct_vm, direct_alice):
    now = int(time.time())
    c = direct_deploy('contracts/OpenSeat.py', 'Builders', 'Show an open-source contribution', now + 3600, now + 7200, 2)
    config = c.get_config()
    assert 'Builders' in config
    with direct_vm.prank(direct_alice):
        with pytest.raises(Exception):
            c.apply('https://raw.githubusercontent.com/a/b/main/file.md', '0'*64)
