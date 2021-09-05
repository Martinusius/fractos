import * as THREE from "three";
import { ColorBackground, HemisphereBackground, ImageBackground } from "./background";
import { RealtimeRenderer } from "./realtimeRenderer";
import { camera, controls, fractos } from "./renderer";
import { Menger, Sierpinski, Mandelbulb } from "./sdf";
import Queue from './queue';

function expose(types: Record<string, any>) {
    for(const [key, value] of Object.entries(types)) {
        (window as any)[key] = value; 
    }
}


expose({ THREE, RealtimeRenderer, Menger, Sierpinski, ColorBackground, HemisphereBackground, ImageBackground, Mandelbulb, Queue, controls, camera, fractos });