// based on https://www.npmjs.com/package/asearch

const INITPAT = 0x80000000;
const MAXCHAR = 0x10000;
const isupper = (c: number) => c >= 0x41 && c <= 0x5a;
const islower = (c: number) => c >= 0x61 && c <= 0x7a;
const tolower = (c: number) => (isupper(c) ? c + 0x20 : c);
const toupper = (c: number) => (islower(c) ? c - 0x20 : c);

export function Asearch(source: string) {
  const shiftpat: Record<number, number> = [];
  let epsilon = 0;
  let acceptpat = 0;
  let mask = INITPAT;
  for (let i = 0; i < MAXCHAR; i++) {
    shiftpat[i] = 0;
  }
  for (const i of unpack(source)) {
    if (i === 0x20) {
      epsilon |= mask;
    } else {
      shiftpat[i] |= mask;
      shiftpat[toupper(i)] |= mask;
      shiftpat[tolower(i)] |= mask;
      mask = mask >>> 1;
    }
  }
  acceptpat = mask;

  function getState(state: number[], str = "") {
    for (const c of unpack(str)) {
      mask = shiftpat[c];
      function tick(prev: number, curr: number) {
        return (curr & epsilon) | ((curr & mask) >>> 1) | (prev >>> 1) | prev;
      }
      for (let i = state.length - 1; i > 0; i--) {
        state[i] = tick(state[i - 1], state[i]);
      }
      state[0] = (state[0] & epsilon) | ((state[0] & mask) >>> 1);

      for (let i = 1; i < state.length; i++) {
        state[i] |= state[i - 1] >>> 1;
      }

      // ambig = 3
      //   i3 = (i3 & epsilon) | ((i3 & mask) >>> 1) | (i2 >>> 1) | i2;
      //   i2 = (i2 & epsilon) | ((i2 & mask) >>> 1) | (i1 >>> 1) | i1;
      //   i1 = (i1 & epsilon) | ((i1 & mask) >>> 1) | (i0 >>> 1) | i0;
      //   i0 = (i0 & epsilon) | ((i0 & mask) >>> 1);
      //   i1 |= i0 >>> 1;
      //   i2 |= i1 >>> 1;
      //   i3 |= i2 >>> 1;
    }
    return state;
  }

  function unpack(str: string) {
    const bytes = [];
    for (const c of str.split("")) {
      const code = c.charCodeAt(0);
      bytes.push(code);
    }
    return bytes;
  }

  function match(str: string, ambig = 0) {
    const INITSTATE = Array.from({ length: ambig + 1 }, () => 0);
    INITSTATE[0] = INITPAT;
    const state = getState(INITSTATE, str);
    if (ambig >= INITSTATE.length) {
      ambig = INITSTATE.length - 1;
    }
    const matched = (state[ambig] & acceptpat) !== 0;

    const stateLen = Math.clz32(acceptpat) + 1;
    return {
      matched,
      bits: state.map((s) => toBitArray(s)),
    };
  }

  match.source = source;

  return match;
}

export function toBitArray(n: number, len = 32) {
  return Array.from({ length: len }, (_, i) => !!(n & (1 << (31 - i))));
}
