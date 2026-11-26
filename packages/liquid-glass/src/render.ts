/// <reference types="@webgpu/types" />
import { LENS_REACH } from "./lens";
import { GLASS_SHADER } from "./shader";

export interface GlassGPU {
  device: GPUDevice;
  pipeline: GPURenderPipeline;
  sampler: GPUSampler;
  format: GPUTextureFormat;
}

const LOOK = { dispersion: 0.012, f0: 0.04, specPower: 32, edgeHighlight: 0.8, rimStrength: 0.05, fresnel: 0.3 };
// CSS px; fixed, so big panes keep the same thin edge as small ones.
const THICKNESS = 6;

export async function startGPU(): Promise<GlassGPU | null> {
  if (!("gpu" in navigator)) return null;
  const adapter = await navigator.gpu.requestAdapter();
  if (!adapter) return null;
  const device = await adapter.requestDevice();
  const format = navigator.gpu.getPreferredCanvasFormat();
  const module = device.createShaderModule({ label: "glass", code: GLASS_SHADER });
  const pipeline = device.createRenderPipeline({
    label: "glass",
    layout: "auto",
    vertex: { module, entryPoint: "vert_main" },
    fragment: { module, entryPoint: "frag_main", targets: [{ format }] },
    primitive: { topology: "triangle-list" },
  });
  const sampler = device.createSampler({ minFilter: "linear", magFilter: "linear" });
  return { device, pipeline, sampler, format };
}

// ponytail: GPU resources per call; keep them per pane once anything redraws every frame.
export function drawGlass(
  gpu: GlassGPU,
  canvas: HTMLCanvasElement,
  backdrop: HTMLCanvasElement | null,
  size: { width: number; height: number },
  radius: number,
  dpr: number,
): boolean {
  const { device, pipeline, sampler, format } = gpu;
  const context = canvas.getContext("webgpu");
  if (!context) return false;
  const { width, height } = size;
  canvas.width = width;
  canvas.height = height;
  context.configure({ device, format, alphaMode: "premultiplied" });

  // The binding needs a texture even when the shader never samples it.
  const texture = device.createTexture({
    label: "glass backdrop",
    size: backdrop ? [backdrop.width, backdrop.height] : [1, 1],
    format: "rgba8unorm",
    usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT,
  });
  if (backdrop) device.queue.copyExternalImageToTexture({ source: backdrop }, { texture }, [backdrop.width, backdrop.height]);

  const lens = (LENS_REACH * Math.min(width, height)) / 2;
  // 16 floats: the shader's 13, padded to a 16-byte multiple.
  const uniforms = new Float32Array([
    width, height, Math.min(radius, width / 2, height / 2), lens,
    THICKNESS * dpr, dpr, LOOK.dispersion, LOOK.f0,
    LOOK.specPower, LOOK.edgeHighlight, LOOK.rimStrength, LOOK.fresnel,
    backdrop ? 1 : 0, 0, 0, 0,
  ]);
  const buffer = device.createBuffer({ label: "glass uniforms", size: uniforms.byteLength, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST });
  device.queue.writeBuffer(buffer, 0, uniforms);

  const bindGroup = device.createBindGroup({
    layout: pipeline.getBindGroupLayout(0),
    entries: [
      { binding: 0, resource: { buffer } },
      { binding: 1, resource: sampler },
      { binding: 2, resource: texture.createView() },
    ],
  });
  const encoder = device.createCommandEncoder();
  const pass = encoder.beginRenderPass({
    colorAttachments: [{ view: context.getCurrentTexture().createView(), clearValue: [0, 0, 0, 0], loadOp: "clear", storeOp: "store" }],
  });
  pass.setPipeline(pipeline);
  pass.setBindGroup(0, bindGroup);
  pass.draw(6);
  pass.end();
  device.queue.submit([encoder.finish()]);
  // Freed once the submitted work is done, per the WebGPU spec.
  texture.destroy();
  buffer.destroy();
  return true;
}
