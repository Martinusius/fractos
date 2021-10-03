import * as THREE from "three";
import { ColorBackground, HemisphereBackground, ImageBackground } from "./background";
import { camera, controls, fractos } from "./renderer";
import { DepthRenderer } from "./depthRenderer";
import { Menger, Sierpinski, Mandelbulb, CustomSDF } from "./sdf";
import { PathTracer } from './pathTracer';
import { RealtimeRenderer } from "./realtimeRenderer";
import Queue from './queue';
import { EdgeRenderer } from "./edgeRenderer";
import { OrbitSampler, OrbitMapping } from "./orbit";



function expose(types: Record<string, any>) {
    for(const [key, value] of Object.entries(types)) {
        (window as any)[key] = value; 
    }
}

expose({
    THREE, RealtimeRenderer, DepthRenderer, PathTracer,
    EdgeRenderer, Menger, Sierpinski, ColorBackground, HemisphereBackground,
    CustomSDF, ImageBackground, Mandelbulb, Queue, OrbitSampler, OrbitMapping, controls, camera, fractos
});