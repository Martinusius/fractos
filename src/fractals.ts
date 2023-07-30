import SDF from "./sdf";

export class Menger extends SDF {
  public constructor(public readonly iterations: number) {
    super(`
      cube();
      for (let i = 0; i < ${iterations}; i++) {
          scale(1 / 3);
          translate(0, 0, -1 / 3);
          mirror(0, 0, 1);
          translate(0, 0, 1 / 3);

          translate(-2 / 3, 2 / 3, 0);

          mirror(0, -1, 1);
          mirror(1, 0, 1);
          mirror(0, 0, -1);
          mirror(1, 0, 0);
          mirror(0, -1, 0);
      }
    `);
  }
}

export class Sierpinski extends SDF {
  public constructor(public readonly iterations: number) {
    super(`
        tetrahedron();

        for (let i = 0; i < ${iterations}; i++) {
            translate(-1, -1, -1);
            
            scale(1 / 2);
            
            translate(1, 1, 1);
        }
    `);
  }
}
