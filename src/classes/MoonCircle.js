import DisplayCircle from "./DisplayCircle";

export default class MoonCircle extends DisplayCircle {
    constructor(radius, center, options) {
        super(radius, center);

        if (typeof options === "undefined") {
            options = {
                color: 0x070e16,
            };
        }

        this.color = options.color || 0x0000ff;

        this.update();
    }

    update() {
        this.draw();
    }

    draw () {
        super.draw();

        var gr = this.graphics;

        // draw my awesome fill
        gr.beginFill(this.color, 1);
        gr.drawCircle(this.center.x, this.center.y, this.radius);
        gr.endFill();
    }
}