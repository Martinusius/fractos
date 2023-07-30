// import * as THREE from "three";
// import { createShader, render, renderer, Utils } from "./setup";
// import { SDF } from "./sdf";

// // @ts-ignore
// import realtimeRenderer from "./shaders/depthRenderer.glsl";
// import Queue, { setAutoResize } from "./queue";

// export class DepthRenderer {
//   private shader: THREE.ShaderMaterial;

//   public readonly sdf: SDF;

//   public epsilonScale: number = 0.001;

//   public clock: THREE.Clock;

//   public farIsBlack: boolean = false;

//   constructor(sdf: SDF) {
//     this.sdf = sdf;

//     const size = new THREE.Vector2();
//     renderer.getSize(size);

//     this.clock = new THREE.Clock();

//     this.shader = createShader(realtimeRenderer + sdf.getCode(), {
//       time: { value: 0 },
//       ...Utils.createUniformsFromVariables<DepthRenderer>(this, "epsilonScale", "farIsBlack"),
//       ...Utils.objectToUniforms(this.sdf, "sdf_"),
//     });
//   }

//   start() {
//     setAutoResize(true);

//     Queue.loop(() => {
//       Utils.setUniformsFromObject(this.shader, this.sdf, "sdf_");

//       this.shader.uniforms.time.value = this.clock.getElapsedTime();
//       Utils.setUniformsFromVariables<DepthRenderer>(this.shader, this, "epsilonScale", "farIsBlack");

//       render(this.shader, null);
//     });
//   }
// }
