import { Color3 } from '@babylonjs/core/Maths/math.color'

export default function (noa, opts) {
    var scene = noa.rendering.getScene();
    if(opts.fogMode = null){
        scene.fogMode = 2;
    }else{
        scene.fogMode = opts.fogMode;
    }
    if(opts.fogDensity = null){
        scene.fogDensity = 0.01;
    }else{
        scene.fogDensity = opts.fogDensity;
    }
    if(opts.fogStart = null){
        scene.fogStart = 40.0;
    }else{
        scene.fogStart = opts.fogStart;
    }
    if(opts.fogEnd = null){
        scene.fogEnd = 40.0;
    }else{
        scene.fogEnd = opts.fogEnd;
    }
    if(opts.fogColor = null){
        scene.fogColor = new BABYLON.Color3(0.9, 0.9, 0.85);
    }else{
        const fcolor = opts.fogColor;
        scene.fogColor = new BABYLON.Color3(fcolor[0], fcolor[1], fcolor[2]);
    }
}
