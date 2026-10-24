/* Level 30 cosmetics only. No persistence, account access, file-input listeners or app mutations.
 * Parent owns unlock/writer checks, async slot/profile affinity and checked settings commits.
 * validate()/validateDataUrl() are synchronous structure/header checks, not full raster decoders.
 * prepareFile() always decodes locally and creates a fresh, metadata-free JPEG from pixels.
 */
(function (root, factory) {
  'use strict';
  const api = factory(root);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.BOCustomImages = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (root) {
  'use strict';
  const constants = Object.freeze({
    VERSION: 1, UNLOCK_LEVEL: 30,
    MAX_INPUT_BYTES: 12 * 1024 * 1024, MAX_SOURCE_PIXELS: 24000000, MAX_SOURCE_SIDE: 8192,
    MAX_DATA_URL_CHARS: 60000, BACKGROUND_MAX_SIDE: 1280, CARD_BACK_MAX_SIDE: 512,
    DECODE_TIMEOUT_MS: 15000
  });
  const kinds = ['background', 'cardBack', 'faceCard'];
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  const mimeNames = ['image/jpeg', 'image/png', 'image/webp'];
  const supportedMessage = 'Choose a JPEG, PNG or WebP image. SVG, GIF and HEIC are not supported; convert them to a static image first.';
  function defaults() { return {version: 1, background: null, cardBack: null}; }
  function fail(message) { throw new Error(message); }
  function unlocked(level) { return Number.isSafeInteger(level) && level >= constants.UNLOCK_LEVEL; }
  function maxSide(kind) { return kind === 'background' ? constants.BACKGROUND_MAX_SIDE : constants.CARD_BACK_MAX_SIDE; }
  function dimensions(width, height, side, pixels) {
    if (!Number.isSafeInteger(width) || !Number.isSafeInteger(height) || width < 1 || height < 1 || width > side || height > side) fail('Image dimensions exceed the ' + side.toLocaleString('en-US') + ' px per-side limit or are invalid.');
    if (width * height > pixels) fail('Image exceeds the 24 MP source-pixel limit. Choose a smaller image.');
  }
  function u16be(b, p) { return b[p] * 256 + b[p + 1]; }
  function u32be(b, p) { return (b[p] * 0x1000000 + b[p + 1] * 0x10000 + b[p + 2] * 256 + b[p + 3]) >>> 0; }
  function u32le(b, p) { return (b[p] + b[p + 1] * 256 + b[p + 2] * 0x10000 + b[p + 3] * 0x1000000) >>> 0; }
  function u24le(b, p) { return b[p] + b[p + 1] * 256 + b[p + 2] * 0x10000; }
  function text(b, p, n) { let out = ''; for (let i = p; i < p + n; i++) out += String.fromCharCode(b[i]); return out; }
  // PNG chunks are checked as bytes, including CRCs; no compressed pixels are expanded here.
  const crcTable = new Uint32Array(256);
  for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1)); crcTable[n] = c >>> 0; }
  function crc32(b, start, end) { let c = 0xffffffff; for (let p = start; p < end; p++) c = (c >>> 8) ^ crcTable[(c ^ b[p]) & 255]; return (c ^ 0xffffffff) >>> 0; }
  function pngInfo(b, stored) {
    if (b.length < 45 || b[0] !== 137 || text(b, 1, 7) !== 'PNG\r\n\x1a\n') fail('Invalid or corrupt PNG image.');
    let p = 8, width = 0, height = 0, seenHeader = false, seenData = false, dataEnded = false, seenPalette = false;
    while (p < b.length) {
      if (p + 12 > b.length) fail('Truncated PNG image.');
      const length = u32be(b, p), type = text(b, p + 4, 4), end = p + 8 + length;
      if (end + 4 > b.length || !/^[A-Za-z]{4}$/.test(type) || crc32(b, p + 4, end) !== u32be(b, end)) fail('Invalid PNG chunk or checksum.');
      if (!seenHeader && type !== 'IHDR') fail('PNG image header is missing.');
      if (type === 'IHDR') {
        if (seenHeader || p !== 8 || length !== 13) fail('Invalid PNG image header.');
        width = u32be(b, p + 8); height = u32be(b, p + 12); seenHeader = true;
        const depth = b[p + 16], color = b[p + 17], depths = {0:[1,2,4,8,16],2:[8,16],3:[1,2,4,8],4:[8,16],6:[8,16]};
        if (!depths[color] || !depths[color].includes(depth) || b[p + 18] !== 0 || b[p + 19] !== 0 || b[p + 20] > 1) fail('Unsupported PNG image header.');
      } else if (type === 'acTL' || type === 'fcTL' || type === 'fdAT') fail('Animated images are not supported. Choose a static JPEG, PNG or WebP.');
      else if (type === 'PLTE') { if (seenPalette || seenData || !length || length > 768 || length % 3) fail('Invalid PNG palette.'); seenPalette = true; }
      else if (type === 'IDAT') { if (dataEnded) fail('Invalid PNG data order.'); seenData = true; }
      else if (type === 'IEND') { if (length || !seenData || end + 4 !== b.length) fail('Incomplete PNG image or trailing data.'); return {mime: 'image/png', width, height}; }
      else {
        if (type[0] === type[0].toUpperCase()) fail('Unsupported PNG image chunk.');
        if (stored && !['sRGB','gAMA','cHRM','tRNS'].includes(type)) fail('Stored images must be re-encoded without private metadata.');
      }
      if (seenData && type !== 'IDAT') dataEnded = true;
      p = end + 4;
    }
    fail('Incomplete PNG image.');
  }
  function jpegInfo(b, stored) {
    if (b.length < 16 || b[0] !== 255 || b[1] !== 216 || b[b.length - 2] !== 255 || b[b.length - 1] !== 217) fail('Invalid or incomplete JPEG image.');
    let p = 2, width = 0, height = 0, frame = false;
    while (p < b.length - 2) {
      if (b[p++] !== 255) fail('Invalid JPEG marker.');
      while (b[p] === 255) p++;
      const marker = b[p++];
      if (!marker || marker === 216 || marker === 217 || marker === 1 || marker >= 208 && marker <= 215 || p + 2 > b.length) fail('Invalid JPEG image header.');
      const length = u16be(b, p), end = p + length;
      if (length < 2 || end > b.length - 2) fail('Truncated JPEG image.');
      if (stored && (marker >= 225 && marker <= 239 || marker === 254)) fail('Stored images must be re-encoded without private metadata.');
      if ([192,193,194].includes(marker)) {
        if (frame || length < 11 || b[p + 2] !== 8) fail('Unsupported JPEG image frame.');
        const components = b[p + 7];
        if (![1,3,4].includes(components) || length !== 8 + 3 * components) fail('Invalid JPEG image frame.');
        height = u16be(b, p + 3); width = u16be(b, p + 5); frame = true;
      } else if (marker >= 192 && marker <= 207 && ![196,200,204].includes(marker)) fail('Unsupported JPEG image frame.');
      if (marker === 218) {
        if (!frame || length < 6 || length !== 6 + 2 * b[p + 2] || end >= b.length - 2) fail('Incomplete JPEG image scan.');
        // Entropy decoding belongs to the browser. The first frame supplies predecode bounds.
        return {mime: 'image/jpeg', width, height};
      }
      p = end;
    }
    fail('JPEG image has no pixel scan.');
  }
  function webpInfo(b, stored) {
    if (b.length < 26 || text(b, 0, 4) !== 'RIFF' || text(b, 8, 4) !== 'WEBP' || u32le(b, 4) !== b.length - 8) fail('Invalid or incomplete WebP image.');
    let p = 12, width = 0, height = 0, canvasWidth = 0, canvasHeight = 0, images = 0, extended = false;
    while (p < b.length) {
      if (p + 8 > b.length) fail('Truncated WebP image.');
      const type = text(b, p, 4), length = u32le(b, p + 4), start = p + 8, end = start + length;
      if (end + (length % 2) > b.length) fail('Invalid WebP chunk size.');
      if (type === 'ANIM' || type === 'ANMF') fail('Animated images are not supported. Choose a static JPEG, PNG or WebP.');
      if (type === 'VP8X') {
        if (extended || p !== 12 || length !== 10 || b[start] & 193 || b[start + 1] || b[start + 2] || b[start + 3]) fail('Invalid WebP image header.');
        if (b[start] & 2) fail('Animated images are not supported. Choose a static JPEG, PNG or WebP.');
        if (stored && b[start] & 44) fail('Stored images must be re-encoded without private metadata.');
        canvasWidth = u24le(b, start + 4) + 1; canvasHeight = u24le(b, start + 7) + 1; extended = true;
      } else if (type === 'VP8 ') {
        if (length < 10 || b[start] & 1 || text(b, start + 3, 3) !== '\x9d\x01\x2a') fail('Invalid WebP pixel header.');
        width = (b[start + 6] + 256 * b[start + 7]) & 16383; height = (b[start + 8] + 256 * b[start + 9]) & 16383; images++;
      } else if (type === 'VP8L') {
        if (length < 5 || b[start] !== 47) fail('Invalid lossless WebP pixel header.');
        const bits = u32le(b, start + 1); if (bits >>> 29) fail('Unsupported lossless WebP version.');
        width = (bits & 16383) + 1; height = ((bits >>> 14) & 16383) + 1; images++;
      } else if (stored && type !== 'ALPH') fail('Stored images must be re-encoded without private metadata.');
      p = end + (length % 2);
    }
    if (images !== 1 || !width || !height || extended && (canvasWidth !== width || canvasHeight !== height)) fail('WebP dimensions or pixel data are invalid.');
    return {mime: 'image/webp', width, height};
  }
  function rasterInfo(bytes, stored) {
    if (bytes[0] === 137) return pngInfo(bytes, stored);
    if (bytes[0] === 255 && bytes[1] === 216) return jpegInfo(bytes, stored);
    if (text(bytes, 0, 4) === 'RIFF') return webpInfo(bytes, stored);
    fail(supportedMessage);
  }
  function base64Bytes(payload) {
    if (!payload || payload.length % 4 || !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(payload)) fail('Invalid base64 image.');
    const pad = payload.endsWith('==') ? 2 : payload.endsWith('=') ? 1 : 0;
    if (pad === 2 && alphabet.indexOf(payload[payload.length - 3]) & 15 || pad === 1 && alphabet.indexOf(payload[payload.length - 2]) & 3) fail('Non-canonical base64 image.');
    const bytes = new Uint8Array(payload.length / 4 * 3 - pad);
    let out = 0;
    for (let p = 0; p < payload.length; p += 4) {
      const n = (alphabet.indexOf(payload[p]) << 18) | (alphabet.indexOf(payload[p + 1]) << 12) | (Math.max(0, alphabet.indexOf(payload[p + 2])) << 6) | Math.max(0, alphabet.indexOf(payload[p + 3]));
      if (out < bytes.length) bytes[out++] = (n >>> 16) & 255;
      if (out < bytes.length) bytes[out++] = (n >>> 8) & 255;
      if (out < bytes.length) bytes[out++] = n & 255;
    }
    return bytes;
  }
  function validateDataUrl(value, kind = 'background') {
    try {
      if (!kinds.includes(kind) || typeof value !== 'string' || value.length > constants.MAX_DATA_URL_CHARS) return false;
      const match = /^data:(image\/(?:jpeg|png|webp));base64,/.exec(value);
      if (!match) return false;
      const info = rasterInfo(base64Bytes(value.slice(match[0].length)), true);
      if (info.mime !== match[1]) return false;
      dimensions(info.width, info.height, maxSide(kind), maxSide(kind) ** 2);
      return true;
    } catch (_) { return false; }
  }
  function validatedValue(value) {
    try {
      if (!value || typeof value !== 'object' || Object.getPrototypeOf(value) !== Object.prototype) return null;
      const keys = Reflect.ownKeys(value), fields = {};
      if (![3,4].includes(keys.length) || !['version','background','cardBack'].every(key => keys.includes(key)) || keys.some(key => !['version','background','cardBack','faceCard'].includes(key))) return null;
      for (const key of keys) {
        const descriptor = Object.getOwnPropertyDescriptor(value, key);
        if (!descriptor || !descriptor.enumerable || !Object.hasOwn(descriptor, 'value')) return null;
        fields[key] = descriptor.value;
      }
      if (!keys.includes('faceCard')) fields.faceCard = null;
      if (fields.version !== 1 || !kinds.every(kind => fields[kind] === null || validateDataUrl(fields[kind], kind))) return null;
      // Presentation consumes only this fresh descriptor snapshot, never untrusted getters
      // or a Proxy's get trap after validating different bytes in getOwnPropertyDescriptor.
      return fields;
    } catch (_) { return null; }
  }
  function validate(value) { return validatedValue(value) !== null; }
  // Decoder lifetime is bounded. Late ImageBitmaps are closed even after a timeout.
  function decode(blob) {
    return new Promise((resolve, reject) => {
      let done = false, timer = null, image = null, objectURL = null;
      const cleanup = () => {
        if (timer !== null) root.clearTimeout(timer);
        timer = null;
        if (image) { image.onload = null; image.onerror = null; image.removeAttribute('src'); image = null; }
        if (objectURL !== null) { root.URL.revokeObjectURL(objectURL); objectURL = null; }
      };
      const finish = (error, result) => {
        if (done) { result?.close?.(); return; }
        done = true;
        // Keep a successful Image's pixels alive until the caller has drawn them.
        if (result && result === image) {
          if (timer !== null) root.clearTimeout(timer); timer = null;
          image.onload = null; image.onerror = null;
          resolve({source: result, close: cleanup});
        } else {
          cleanup();
          if (error) reject(error); else resolve({source: result, close: () => result.close()});
        }
      };
      timer = root.setTimeout(() => finish(new Error('Image decoding timed out. Try a smaller or different image.')), constants.DECODE_TIMEOUT_MS);
      try {
        if (typeof root.createImageBitmap === 'function') {
          Promise.resolve(root.createImageBitmap(blob)).then(bitmap => finish(null, bitmap), () => finish(new Error('This image could not be decoded. Try a different JPEG, PNG or WebP.')));
        } else {
          if (typeof root.Image !== 'function' || !root.URL?.createObjectURL) fail('Image decoding is unavailable in this browser.');
          image = new root.Image(); objectURL = root.URL.createObjectURL(blob);
          image.onload = () => finish(null, image);
          image.onerror = () => finish(new Error('This image could not be decoded. Try a different JPEG, PNG or WebP.'));
          image.src = objectURL;
        }
      } catch (_) { finish(new Error('This image could not be decoded. Try a different JPEG, PNG or WebP.')); }
    });
  }
  function canvas(width, height) {
    const node = root.document.createElement('canvas'); node.width = width; node.height = height;
    const context = node.getContext('2d', {alpha: false});
    if (!context) { node.width = 0; node.height = 0; fail('Image processing is unavailable in this browser.'); }
    context.imageSmoothingEnabled = true; context.imageSmoothingQuality = 'high';
    context.fillStyle = '#102b30'; context.fillRect(0, 0, width, height);
    return {node, context};
  }
  function stripNativeJpegMetadata(value) {
    // Chrome writes a constant ICC APP2 profile even for a fresh sRGB canvas. Remove all
    // APP/COM segments from this newly encoded JPEG, never reuse original file segments.
    const prefix = 'data:image/jpeg;base64,';
    if (!value.startsWith(prefix)) fail('This browser cannot encode a safe JPEG image.');
    const binary = root.atob(value.slice(prefix.length));
    const bytes = Uint8Array.from(binary, char => char.charCodeAt(0));
    jpegInfo(bytes, false);
    const parts = [binary.slice(0, 2)];
    let p = 2;
    while (p < bytes.length - 2) {
      const start = p++;
      while (bytes[p] === 255) p++;
      const marker = bytes[p++], end = p + u16be(bytes, p);
      if (marker === 218) { parts.push(binary.slice(start)); break; }
      if (!(marker >= 224 && marker <= 239 || marker === 254)) parts.push(binary.slice(start, end));
      p = end;
    }
    return prefix + root.btoa(parts.join(''));
  }
  async function prepareFile(file, kind) {
    if (!kinds.includes(kind)) fail('Choose background, cardBack or faceCard as the image kind.');
    if (!file || typeof file.arrayBuffer !== 'function' || !Number.isSafeInteger(file.size) || file.size < 1) fail('Choose a non-empty JPEG, PNG or WebP image.');
    if (file.size > constants.MAX_INPUT_BYTES) fail('Image is too large. Choose a file up to 12 MB.');
    if (file.type && !mimeNames.includes(file.type)) fail(supportedMessage);
    let bytes;
    try { bytes = new Uint8Array(await file.arrayBuffer()); } catch (_) { fail('The selected image could not be read. Please select it again.'); }
    if (bytes.length !== file.size || bytes.length > constants.MAX_INPUT_BYTES) fail('Image size changed or exceeds 12 MB. Select the image again.');
    const info = rasterInfo(bytes, false);
    if (file.type && file.type !== info.mime) fail('The image contents do not match its declared format. Choose a valid JPEG, PNG or WebP.');
    dimensions(info.width, info.height, constants.MAX_SOURCE_SIDE, constants.MAX_SOURCE_PIXELS);
    if (!root.document?.createElement || typeof root.Blob !== 'function') fail('Image processing requires a browser with canvas support.');
    const decoded = await decode(new root.Blob([bytes], {type: info.mime}));
    const canvases = [];
    try {
      const source = decoded.source, width = source.naturalWidth || source.width, height = source.naturalHeight || source.height;
      dimensions(width, height, constants.MAX_SOURCE_SIDE, constants.MAX_SOURCE_PIXELS);
      if (!(width === info.width && height === info.height || width === info.height && height === info.width)) fail('Decoded image dimensions do not match its header. Choose a different image.');
      const target = maxSide(kind), ratio = Math.min(1, target / Math.max(width, height));
      const targetWidth = Math.max(1, Math.round(width * ratio)), targetHeight = Math.max(1, Math.round(height * ratio));
      // One intermediate half-step improves large downscales without allocating a second full source raster.
      const stepRatio = Math.min(1, target * 2 / Math.max(width, height));
      let current = canvas(Math.max(1, Math.round(width * stepRatio)), Math.max(1, Math.round(height * stepRatio))); canvases.push(current.node);
      current.context.drawImage(source, 0, 0, current.node.width, current.node.height);
      if (current.node.width !== targetWidth || current.node.height !== targetHeight) {
        const smaller = canvas(targetWidth, targetHeight); canvases.push(smaller.node);
        smaller.context.drawImage(current.node, 0, 0, targetWidth, targetHeight); current.node.width = 0; current.node.height = 0; current = smaller;
      }
      for (let step = 0; step < 10; step++) {
        for (const quality of [0.86, 0.74, 0.62, 0.5, 0.38]) {
          const result = stripNativeJpegMetadata(current.node.toDataURL('image/jpeg', quality));
          if (result.length <= constants.MAX_DATA_URL_CHARS && validateDataUrl(result, kind)) return result;
        }
        const width = Math.max(1, Math.floor(current.node.width * 0.8)), height = Math.max(1, Math.floor(current.node.height * 0.8));
        const smaller = canvas(width, height); canvases.push(smaller.node);
        smaller.context.drawImage(current.node, 0, 0, width, height); current.node.width = 0; current.node.height = 0; current = smaller;
      }
      fail('The image could not be made small enough. Try a simpler or smaller image.');
    } catch (error) {
      if (error instanceof Error && /^(?:Image |The image |Decoded image |This browser)/.test(error.message)) throw error;
      fail('Image processing failed. Try a smaller or different JPEG, PNG or WebP.');
    } finally {
      decoded.close();
      for (const node of canvases) { node.width = 0; node.height = 0; }
    }
  }
  function settingsHTML(options = {}) {
    const active = unlocked(options.level), value = validatedValue(options.value) || {...defaults(), faceCard: null}, busy = options.busy === true || kinds.includes(options.busy);
    const cards = kinds.map(kind => {
      const name = kind === 'background' ? 'Background image' : kind === 'faceCard' ? 'Face-card photo (J, Q, K)' : 'Card-back image', selected = active && value[kind] !== null;
      const id = 'custom-image-' + kind;
      const status = busy && (options.busy === true || options.busy === kind) ? 'Processing image on this device…' : !active ? 'Unlocks at Level 30' : selected ? 'Custom image selected' : 'Using the normal appearance';
      return '<div class="custom-images-item"><div class="custom-images-preview custom-images-preview--' + kind + '">' + (selected ? '<img src="' + value[kind] + '" alt="Custom ' + (kind === 'background' ? 'background' : kind === 'faceCard' ? 'face-card' : 'card-back') + ' preview" decoding="async">' : '<span aria-hidden="true">' + (kind === 'background' ? '▧' : '♠') + '</span>') + '</div><div class="custom-images-controls"><label for="' + id + '">' + name + '</label><input id="' + id + '" type="file" accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp" data-custom-image-input="' + kind + '" aria-describedby="' + id + '-status custom-images-help custom-images-privacy"' + (!active || busy ? ' disabled' : '') + '><p id="' + id + '-status" class="custom-images-status" role="status" aria-live="polite">' + status + '</p><button type="button" class="custom-images-remove" data-custom-image-remove="' + kind + '" aria-label="Remove ' + name.toLowerCase() + '"' + (!active || busy || !selected ? ' disabled' : '') + '>Remove</button></div></div>';
    }).join('');
    return '<section class="custom-images" aria-labelledby="custom-images-title" aria-busy="' + busy + '"><h3 id="custom-images-title">Custom images <span>· Level 30 cosmetics</span></h3><p class="custom-images-intro">' + (active ? 'Make this table yours. Your face-card photo replaces the central art on Jacks, Queens and Kings. Ranks, suits, modifiers and gameplay stay unchanged. Card-back art applies only to hidden cards.' : 'Reach actual Player Level 30 to choose your own background, playing-card back and face-card photo. Earlier rewards stay active.') + '</p><div class="custom-images-grid">' + cards + '</div><p id="custom-images-help" class="custom-images-help">JPEG, PNG or WebP · up to 12 MB and 24 MP (8,192 px per side). Images are resized, compressed and stripped of metadata. Backgrounds fit within 1,280 px; card backs and face-card photos within 512 px. Each image is compressed to about 45 KB or less; detailed images may be resized further.</p><p id="custom-images-privacy" class="custom-images-privacy">Images are processed on this device. No automatic external upload. Selected images are included in JSON exports and manual cloud saves; saving to cloud uploads them to your account. Only choose images you are comfortable including in those saves.</p></section>';
  }
  function apply(value, level) {
    const body = root.document?.body;
    if (!body) return false;
    const checked = unlocked(level) ? validatedValue(value) : null, active = checked !== null;
    for (const kind of kinds) {
      const image = active ? checked[kind] : null, background = kind === 'background';
      const flag = background ? 'custom-images-background' : kind === 'faceCard' ? 'custom-images-face-card' : 'custom-images-card-back';
      const variable = background ? '--bo-custom-background-image' : kind === 'faceCard' ? '--bo-custom-face-card-image' : '--bo-custom-card-back-image';
      body.classList.toggle(flag, image !== null);
      if (image !== null) body.style.setProperty(variable, 'url("' + image + '")'); else body.style.removeProperty(variable);
    }
    return !!active;
  }
  return Object.freeze({defaults, validate, validateDataUrl, prepareFile, settingsHTML, apply, constants});
});
