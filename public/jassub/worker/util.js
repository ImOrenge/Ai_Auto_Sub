// offset by 1, 0 = 1, to match CSS font-weight values, but dividing by 100 gives the correct index
export const WEIGHT_MAP = [
    'thin',
    'extralight',
    'light',
    'regular', // Normal isn't used
    'medium',
    'semibold',
    'bold',
    'extrabold',
    'black',
    'ultrablack'
];
export const IS_FIREFOX = navigator.userAgent.toLowerCase().includes('firefox');
const a = 'BT601';
const b = 'BT709';
const c = 'SMPTE240M';
const d = 'FCC';
export const LIBASS_YCBCR_MAP = [null, a, null, a, a, b, b, c, c, d, d];
export function _applyKeys(input, output) {
    for (const v of Object.keys(input)) {
        output[v] = input[v];
    }
}
export const _fetch = globalThis.fetch;
export async function fetchtext(url) {
    const res = await _fetch(url);
    return await res.text();
}
//# sourceMappingURL=util.js.map