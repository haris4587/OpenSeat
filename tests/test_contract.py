"""Deterministic contract-boundary tests with a small GenLayer runtime stand-in.
Network consensus remains an integration gate; these do not impersonate Studio tests.
"""
import importlib.util
import hashlib
import json
import sys
import types
from pathlib import Path
import pytest

class Runtime:
    def __init__(self):
        self.now = 2_000_000_000
        self.sender = '0x' + '1' * 40
        self.pages = {}
        self.prompt_response = {'eligible': True}
        self.mismatch = False
        self.web_calls = 0
        self.gl = types.SimpleNamespace()
        self.gl.Contract = type('Contract', (), {})
        self.gl.public = types.SimpleNamespace(view=lambda f: f, write=lambda f: f)
        self.gl.message = types.SimpleNamespace(sender_address=self.sender)
        self.gl.UserError = ValueError
        self.gl.vm = types.SimpleNamespace(Return=type('Return', (), {'__init__': lambda s, x: setattr(s, 'calldata', x)}))
        self.gl.vm.run_nondet_unsafe = self.consensus
        self.gl.eq_principle = types.SimpleNamespace(strict_eq=self.strict)
        self.gl.nondet = types.SimpleNamespace(web=types.SimpleNamespace(get=self.get), exec_prompt=self.prompt)
        module = types.ModuleType('genlayer')
        module.gl = self.gl
        module.Address = str
        module.u256 = int
        module.DynArray = list
        module.TreeMap = dict
        sys.modules['genlayer'] = module
        spec = importlib.util.spec_from_file_location('openseat_contract', Path(__file__).resolve().parents[1] / 'contracts/OpenSeat.py')
        self.module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(self.module)
        self.module.time.time = lambda: self.now

    def as_(self, sender):
        self.sender = sender
        self.gl.message.sender_address = sender

    def get(self, url):
        self.web_calls += 1
        status, body = self.pages.get(url, (404, b''))
        return types.SimpleNamespace(status=status, body=body)

    def prompt(self, prompt, response_format='json'):
        return self.prompt_response

    def consensus(self, leader, validator):
        result = leader()
        if self.mismatch: self.prompt_response = {'eligible': not self.prompt_response['eligible']}
        if not validator(self.gl.vm.Return(result)):
            raise ValueError('Validator disagreement')
        return result

    def strict(self, fn):
        a = fn()
        if a != fn(): raise ValueError('Beacon disagreement')
        return a

    def setup(self, seats=1):
        self.contract = self.module.OpenSeat('Builders', 'Show an open-source project and explain your contribution', self.now + 700, self.now + 1400, seats)
        return self.contract

    def apply(self, digit, body=b'My open-source contribution is documented.', change=False):
        wallet = '0x' + digit * 40
        url = 'https://raw.githubusercontent.com/alice/repo/' + 'a' * 40 + '/evidence-' + digit + '.md'
        digest = hashlib.sha256(body).hexdigest()
        self.pages[url] = (200, b'changed' if change else body)
        self.as_(wallet)
        self.contract.apply(url, digest)
        return wallet, url

@pytest.fixture
def rt():
    r = Runtime()
    r.setup()
    return r

def test_permissions_deadlines_and_capacity(rt):
    with pytest.raises(AssertionError, match='Organizer'):
        rt.contract.apply('x', '0' * 64)
    w, _ = rt.apply('2')
    with pytest.raises(AssertionError, match='One application'):
        rt.contract.apply('https://raw.githubusercontent.com/a/b/' + 'a'*40 + '/x', 'a'*64)
    rt.now += 700
    with pytest.raises(AssertionError, match='closed'):
        rt.apply('3')
    rt.as_('0x' + '3'*40)
    with pytest.raises(AssertionError, match='Review first'):
        rt.contract.challenge(w)
    rt.contract.review(w)
    assert rt.contract._record(w)['status'] == 'eligible'
    assert rt.contract._record(w)['reviews'] == 1

def test_unavailable_changed_and_oversized_fail_closed(rt):
    a, au = rt.apply('2')
    b, bu = rt.apply('3', change=True)
    c, cu = rt.apply('4')
    rt.pages[cu] = (200, b'x' * 16385)
    rt.pages[au] = (503, b'')
    rt.now += 700
    for w in (a,b,c): rt.contract.review(w)
    assert [rt.contract._record(w)['status'] for w in (a,b,c)] == ['unavailable','changed','unavailable']
    assert len(rt.contract.history) == 6

def test_validator_disagreement_reverts_review(rt):
    w, _ = rt.apply('2')
    rt.now += 700
    rt.mismatch = True
    with pytest.raises(ValueError, match='disagreement'): rt.contract.review(w)
    assert rt.contract._record(w)['reviews'] == 0

def test_challenge_limits_no_organizer_override(rt):
    w, _ = rt.apply('2')
    rt.now += 700
    rt.contract.review(w)
    rt.as_('0x' + '1'*40)
    rt.contract.challenge(w)
    with pytest.raises(AssertionError, match='limit'): rt.contract.challenge(w)
    rt.as_('0x' + '3'*40)
    with pytest.raises(AssertionError, match='Only applicant'): rt.contract.challenge(w)
    rt.as_(w)
    rt.contract.challenge(w)
    assert rt.contract._record(w)['reviews'] == 3
    rt.now += 700
    with pytest.raises(AssertionError, match='window'): rt.contract.challenge(w)

def test_oversubscription_deterministic_late_beacon_and_any_finalizer(rt):
    wallets = [rt.apply(x)[0] for x in '234']
    rt.now += 700
    for w in wallets: rt.contract.review(w)
    rt.now += 700
    with pytest.raises(AssertionError, match='Beacon not due'): rt.contract.finalize()
    rt.now += 200
    # drand randomness is SHA-256(signature), checked by contract.
    signature = '11' * 96
    randomness = hashlib.sha256(bytes.fromhex(signature)).hexdigest()
    round_number = json.loads(rt.contract.get_config())['beacon_round']
    beacon = 'https://drand.cloudflare.com/' + rt.module.CHAIN + '/public/' + str(round_number)
    rt.pages[beacon] = (200, json.dumps({'round': round_number, 'signature': signature, 'randomness': randomness}).encode())
    rt.as_('0x' + '9'*40)
    rt.contract.finalize()
    expected = sorted(wallets, key=lambda w: (hashlib.sha256(bytes.fromhex(randomness) + w.lower().encode()).hexdigest(), w.lower()))[0]
    assert list(rt.contract.winners) == [expected]
    assert rt.contract.finalized and rt.contract.seed == randomness
    with pytest.raises(AssertionError, match='Already'): rt.contract.finalize()

def test_beacon_unavailable_and_tampered_cannot_finalize(rt):
    rt.now += 1600
    with pytest.raises(ValueError): rt.contract.finalize()
    round_number = json.loads(rt.contract.get_config())['beacon_round']
    beacon = 'https://drand.cloudflare.com/' + rt.module.CHAIN + '/public/' + str(round_number)
    rt.pages[beacon] = (200, json.dumps({'round': round_number, 'signature': '11'*96, 'randomness': '00'*32}).encode())
    with pytest.raises(ValueError, match='digest'): rt.contract.finalize()
    assert not rt.contract.finalized

def test_invalid_pinned_url_and_nonmutable_rules(rt):
    rt.as_('0x'+'2'*40)
    with pytest.raises(AssertionError, match='pinned'):
        rt.contract.apply('https://raw.githubusercontent.com/alice/repo/main/a.md', '0'*64)
    assert rt.contract.rules_sha256 == hashlib.sha256(rt.contract.rules.encode()).hexdigest()


def test_review_cannot_run_before_application_deadline(rt):
    wallet, _ = rt.apply('2')
    rt.as_('0x' + '9' * 40)
    with pytest.raises(AssertionError, match='Outside review window'):
        rt.contract.review(wallet)
    assert rt.contract._record(wallet)['reviews'] == 0
    assert len(rt.contract.history) == 1
