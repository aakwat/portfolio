/*
 * Liquid glass shader, adapted from https://github.com/arya3d/liquid-glass-webgpu
 * Copyright (c) 2026 arya3d. MIT License: https://opensource.org/license/mit
 * Changes: works in canvas pixels for any pane size, normals come from the lens height (so the rim catches light),
 * output is premultiplied alpha so the page shows past the rounded corners, and refraction 0 draws only the
 * light on the glass, for panes whose backdrop the GPU cannot see.
 */
export const GLASS_SHADER = /* wgsl */ `
struct Glass {
    size: vec2f,
    radius: f32,
    lens: f32,
    thickness: f32,
    pixel: f32,
    dispersion: f32,
    f0: f32,
    spec_power: f32,
    edge_highlight: f32,
    rim_strength: f32,
    fresnel: f32,
    refraction: f32,
};

@group(0) @binding(0) var<uniform> glass: Glass;
@group(0) @binding(1) var backdrop_sampler: sampler;
@group(0) @binding(2) var backdrop: texture_2d<f32>;

const VIEW = vec3f(0.0, 0.0, 1.0);
const KEY_LIGHT = vec3f(0.3, -0.5, 1.0);
const FACE_ON_SPREAD_CUT = 0.909;
const RIM_POWER = 3.0;
const SPECULAR_ON_RING = 0.5;
const RING_WIDTH = 1.5;
const RING_STRENGTH = 0.5;

@vertex
fn vert_main(@builtin(vertex_index) i: u32) -> @builtin(position) vec4f {
    var corners = array<vec2f, 6>(
        vec2(-1.0, -1.0), vec2(1.0, -1.0), vec2(1.0, 1.0),
        vec2(-1.0, -1.0), vec2(-1.0, 1.0), vec2(1.0, 1.0),
    );
    return vec4(corners[i], 0.0, 1.0);
}

// Inigo Quilez's rounded box: negative inside, positive outside.
fn edge_distance(p: vec2f) -> f32 {
    let from_corner = abs(p) - glass.size * 0.5 + glass.radius;
    let outside = length(max(from_corner, vec2f(0.0)));
    let inside = min(max(from_corner.x, from_corner.y), 0.0);
    return outside + inside - glass.radius;
}

// 0 at the edge, 1 on the flat top; the 0.25 power keeps the top flat and the rim steep.
fn lens_height(d: f32) -> f32 {
    return pow(saturate(-d / glass.lens), 0.25);
}

fn coverage(d: f32, feather: f32) -> f32 {
    return saturate(-d / feather);
}

fn surface_normal(p: vec2f) -> vec3f {
    let e = vec2f(1.0, 0.0);
    let dx = lens_height(edge_distance(p + e.xy)) - lens_height(edge_distance(p - e.xy));
    let dy = lens_height(edge_distance(p + e.yx)) - lens_height(edge_distance(p - e.yx));
    return normalize(vec3f(-dx, -dy, 2.0 / glass.thickness));
}

fn sample_backdrop(p: vec2f) -> vec4f {
    return textureSampleLevel(backdrop, backdrop_sampler, p / glass.size + 0.5, 0.0);
}

// Each channel reads closer to the centre near the rim, blue a little more than red.
fn refract_backdrop(p: vec2f, bend: f32, spread: f32) -> vec3f {
    let lookup = p * sin(bend);
    let offset = lookup * spread;
    let red = sample_backdrop((p - offset) * sin(bend * 0.98)).r;
    let green = sample_backdrop(lookup).g;
    let blue = sample_backdrop((p + offset) * sin(bend * 1.02)).b;
    return vec3f(red, green, blue);
}

@fragment
fn frag_main(@builtin(position) coord: vec4f) -> @location(0) vec4f {
    let p = coord.xy - glass.size * 0.5;
    let d = edge_distance(p);
    let mask = coverage(d, glass.pixel);
    if (mask <= 0.0) {
        return vec4f(0.0);
    }

    let normal = surface_normal(p);
    let facing = max(dot(normal, VIEW), 0.0);
    let fresnel = glass.f0 + (1.0 - glass.f0) * pow(1.0 - facing, 5.0);

    let feather = RING_WIDTH * glass.pixel;
    let ring = coverage(d - glass.pixel, feather) - coverage(d, feather);
    let edge_light = ring * RING_STRENGTH * (1.0 + fresnel * glass.edge_highlight);
    let halfway = normalize(normalize(KEY_LIGHT) + VIEW);
    let shine = pow(max(dot(normal, halfway), 0.0), glass.spec_power) * ring * SPECULAR_ON_RING;
    let rim = pow(1.0 - facing, RIM_POWER) * mask * glass.rim_strength;
    let opacity = smoothstep(0.0, 1.0, mask);

    if (glass.refraction < 0.5) {
        // White light only, over whatever CSS shows beneath.
        let light = min((edge_light + shine + rim) * (1.0 + fresnel * glass.fresnel), 1.0) * opacity;
        return vec4f(light, light, light, light);
    }

    let bend = lens_height(d) * 1.57;
    let spread = glass.dispersion * (1.0 - facing * FACE_ON_SPREAD_CUT);
    let refracted = refract_backdrop(p, bend, spread);
    let lit = (refracted + edge_light + shine + rim) * (1.0 + fresnel * glass.fresnel);
    // Premultiplied: colour may not exceed alpha.
    return vec4f(min(lit, vec3f(1.0)) * opacity, opacity);
}
`;
