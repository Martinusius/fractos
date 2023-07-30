// @ts-ignore
import functions from "./sdf.glsl";
import { v4 } from "uuid";

function limitEval(code: string, fnOnStop: Function, opt_timeoutInMS: number) {
  let id = Math.random() + 1,
    blob = new Blob(
      ["onmessage=function(a){a=a.data;postMessage({i:a.i+1});postMessage({r:eval.call(this,a.c),i:a.i});};"],
      { type: "text/javascript" }
    ),
    myWorker = new Worker(URL.createObjectURL(blob));

  function onDone(argument: any) {
    URL.revokeObjectURL(blob as any);

    // @ts-ignore
    fnOnStop(argument);
  }

  myWorker.onmessage = function (data) {
    data = data.data as any;
    if (data) {
      if ((data as any).i === id) {
        id = 0;

        // @ts-ignore
        //console.log(data.r);

        // @ts-ignore
        onDone(data.r);
      } else if ((data as any).i === id + 1) {
        setTimeout(function () {
          if (id) {
            myWorker.terminate();

            // @ts-ignore
            onDone(undefined);
          }
        }, opt_timeoutInMS || 1000);
      }
    }
  };

  myWorker.postMessage({ c: code, i: id });
}

function iteratize(steps: string[]) {
  const stepIndices: Record<string, number> = {};
  const stepNames: string[] = [];

  let i = 0;
  let string = "";

  steps.forEach((step) => {
    if (stepIndices[step] === undefined) {
      stepIndices[step] = i++;
      stepNames.push(step);
    }

    string += String.fromCharCode(stepIndices[step] + 65);
  });

  function convertBack(string: string) {
    let result = "";

    for (let i = 0; i < string.length; i++) {
      if (string[i] === "@") result += "@";
      else result += stepNames[string.charCodeAt(i) - 65] + "\n";
    }

    return result;
  }

  let stepsString;

  for (let i = 32; i > 1; i--) {
    const matches = string.match(new RegExp(`(.+)(?=\\1{${i}})`, "g"));

    if (matches) {
      const otherSteps = convertBack(string.replace(new RegExp(`(${matches[0]}){${i + 1}}`, "g"), "@"));

      const uuid = v4();

      stepsString = otherSteps.replace(
        "@",
        `/* BEGIN ITERATION ${uuid} */ for(int i = 0; i < ${i + 1}; i++) {\n${convertBack(
          matches[0]
        )}\n} /* END ITERATION ${uuid} */\n`
      );

      break;
    }
  }

  const success = stepsString !== undefined;

  if (!stepsString) stepsString = convertBack(string);

  const array = stepsString.split("\n");

  return {
    success,
    steps: array.slice(0, array.length - 1),
  };
}

export class UncompiledSDF {
  constructor(public readonly instructions: string[]) {}
}

class SDF {
  public readonly glsl: string;
  public readonly stepCount: number;

  private static stripFunction(code: Function) {
    const codeStr = code.toString();
    return codeStr.slice(codeStr.indexOf("{") + 1, codeStr.lastIndexOf("}"));
  }

  static createInSandbox(code: string | Function) {
    if (code instanceof Function) code = SDF.stripFunction(code);

    return new Promise<SDF>((resolve) => {
      limitEval(
        `${functions} ;; ${code} ;;  _STEPS`,
        (code: string[]) => {
          resolve(new SDF(new UncompiledSDF(code)));
        },
        100
      );
    });
  }

  constructor(code: string | UncompiledSDF | Function = "") {
    if (code instanceof Function) code = SDF.stripFunction(code);

    const steps =
      code instanceof UncompiledSDF
        ? code.instructions.reverse()
        : eval(`${functions} ;; ${code} ;;  _STEPS`).reverse();

    let iteratization = { success: true, steps };

    while ((iteratization = iteratize(iteratization.steps)).success);

    this.stepCount = iteratization.steps.length;

    this.glsl = `
    
    uniform int iterations;
    uniform float step;

    float sdf(vec3 z) {
      SDF data = SDF(z, 1.0);

      float dist = 1000.0;

      float steps = ${iteratization.steps.length}.0;
      
      ${iteratization.steps.join(";\n") + ";\n"}

      return dist;
    }`;
  }
}

export default SDF;
