import * as THREE from "three";
import { ColorBackground, HemisphereBackground, ImageBackground } from "./background";
import { DepthRenderer } from "./depthRenderer";
import { camera, controls, fractos } from "./renderer";
import { Menger, Sierpinski, Mandelbulb, CustomSDF } from "./sdf";
import { PathTracer } from './pathTracer';
import { RealtimeRenderer } from "./realtimeRenderer";
import Queue from './queue';
import { EdgeRenderer } from "./edgeRenderer";


function expose(types: Record<string, any>) {
    for(const [key, value] of Object.entries(types)) {
        (window as any)[key] = value; 
    }
}

expose({
    THREE, RealtimeRenderer, DepthRenderer, PathTracer,
    EdgeRenderer, Menger, Sierpinski, ColorBackground, HemisphereBackground,
    CustomSDF, ImageBackground, Mandelbulb, Queue, controls, camera, fractos
});