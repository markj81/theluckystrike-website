// Profile-photo shader — powered by vgpu (https://vgpu.sh), a WebGPU
// library. Renders the hero portrait through a fullscreen fragment effect:
// animated film grain, a cursor-driven liquid ripple, and chromatic
// aberration keyed off the same ripple. Falls back silently to the plain
// <img> when WebGPU, the image, or reduced-motion isn't available.

const VGPU_CDN = 'https://esm.sh/vgpu@0.3.1';

const SHADER_SOURCE = /* wgsl */ `
  struct Params {
    time: f32,
    hover: f32,
    mouseX: f32,
    mouseY: f32,
    imgAspect: f32,
    canvasAspect: f32,
  }

  @group(0) @binding(0) var<uniform> params: Params;
  @group(0) @binding(1) var photo: texture_2d<f32>;
  @group(0) @binding(2) var samp: sampler;

  fn hash(p: vec2f) -> f32 {
    return fract(sin(dot(p, vec2f(12.9898, 78.233))) * 43758.5453123);
  }

  // Emulates CSS object-fit: cover for a square canvas over a
  // non-square source image.
  fn coverUv(uv: vec2f) -> vec2f {
    var scale = vec2f(1.0, 1.0);
    if (params.canvasAspect > params.imgAspect) {
      scale.y = params.imgAspect / params.canvasAspect;
    } else {
      scale.x = params.canvasAspect / params.imgAspect;
    }
    return (uv - 0.5) * scale + 0.5;
  }

  @fragment fn fs_main(@location(0) uv: vec2f) -> @location(0) vec4f {
    let baseUv = coverUv(uv);
    let mouse = vec2f(params.mouseX, params.mouseY);
    let toMouse = baseUv - mouse;
    let dist = length(toMouse);
    let dir = toMouse / max(dist, 0.0001);

    // Liquid/glass ripple radiating from the cursor, eased in and
    // out with params.hover so it settles when the pointer leaves.
    let ripple = sin(dist * 42.0 - params.time * 3.2) * exp(-dist * 5.5) * params.hover * 0.028;
    let duv = baseUv + dir * ripple;

    // Chromatic aberration scales with the same ripple, so the
    // channel split intensifies exactly where the glass distorts.
    let ca = dir * (abs(ripple) * 2.4 + params.hover * 0.0022);

    let r = textureSampleLevel(photo, samp, duv + ca, 0.0).r;
    let g = textureSampleLevel(photo, samp, duv, 0.0).g;
    let b = textureSampleLevel(photo, samp, duv - ca, 0.0).b;
    var color = vec3f(r, g, b);

    // Always-on animated film grain.
    let grain = hash(uv * 900.0 + params.time * 60.0) - 0.5;
    color += grain * 0.045;

    return vec4f(color, 1.0);
  }
`;

async function initHeroPhotoShader() {
  const visual = document.querySelector('.hero-visual');
  const img = visual?.querySelector('.hero-image');
  if (!visual || !img) return;
  if (!navigator.gpu) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  try {
    await new Promise((resolve, reject) => {
      if (img.complete && img.naturalWidth) { resolve(); return; }
      img.addEventListener('load', resolve, { once: true });
      img.addEventListener('error', reject, { once: true });
    });

    const [{ init, effect, surface, sampler, frameLoop, clock }, bitmap] = await Promise.all([
      import(/* @vite-ignore */ VGPU_CDN),
      createImageBitmap(img),
    ]);

    const gpu = await init();

    const canvas = document.createElement('canvas');
    canvas.className = 'hero-image-shader';
    canvas.setAttribute('aria-hidden', 'true');
    img.insertAdjacentElement('afterend', canvas);

    const canvasSurface = surface(gpu, canvas, { dpr: [1, 2] });

    const texture = gpu.device.createTexture({
      size: [bitmap.width, bitmap.height],
      format: 'rgba8unorm',
      usage: ['texture_binding', 'copy_dst', 'render_attachment'],
      label: 'hero-photo',
    });
    gpu.gpu.queue.copyExternalImageToTexture(
      { source: bitmap },
      { texture: texture.gpu },
      [bitmap.width, bitmap.height]
    );

    const photoEffect = effect(gpu, SHADER_SOURCE, {
      label: 'hero-photo-shader',
      set: {
        params: {
          time: 0,
          hover: 0,
          mouseX: 0.5,
          mouseY: 0.5,
          imgAspect: bitmap.width / bitmap.height,
          canvasAspect: canvasSurface.size[0] / canvasSurface.size[1],
        },
        photo: texture.view,
        samp: sampler(gpu, {
          minFilter: 'linear',
          magFilter: 'linear',
          addressModeU: 'clamp-to-edge',
          addressModeV: 'clamp-to-edge',
        }),
      },
    });

    canvasSurface.onResize(({ width, height }) => {
      photoEffect.set({ params: { canvasAspect: width / height } });
    });

    const mouse = { x: 0.5, y: 0.5 };
    let hoverTarget = 0;
    let hover = 0;

    visual.addEventListener('pointermove', (e) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = (e.clientX - rect.left) / rect.width;
      mouse.y = (e.clientY - rect.top) / rect.height;
      hoverTarget = 1;
    });
    visual.addEventListener('pointerleave', () => { hoverTarget = 0; });

    const time = clock(gpu);

    function tick(frame) {
      hover += (hoverTarget - hover) * 0.09;
      photoEffect.set({
        params: { time: time.time, hover, mouseX: mouse.x, mouseY: mouse.y },
      });
      frame.pass(canvasSurface, photoEffect);
    }

    let handle = frameLoop(gpu, tick);

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        handle.stop();
      } else {
        handle = frameLoop(gpu, tick);
      }
    });

    visual.classList.add('shader-active');
  } catch (err) {
    // WebGPU unsupported, adapter denied, image blocked, CDN unreachable, etc.
    // The static <img> is already in the DOM and fully visible — no fallback
    // wiring needed.
    console.warn('[hero-shader] falling back to static image:', err);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initHeroPhotoShader);
} else {
  initHeroPhotoShader();
}
