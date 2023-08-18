import Circle from "./Circle";
import * as PIXI from "pixi.js";

export default class DisplayCircle extends Circle {
    constructor(radius, center, options=null) {
        super(radius, center);

        // set some defaults
        this.options.draw = {
            lines: false,
            circles: true,
            debug: false,
        };
        this.options.color = "#ffffff";

        // pick up user-passed options
        if (options !== null) {
            this.options.color = (typeof options.color !== "undefined") ? options.color : this.options.color;
        }

        this.graphics = new PIXI.Graphics();
        this.container = new PIXI.Container();
        this.container.addChild(this.graphics);

        this.dragging = false;
        this.isSelected = false;    // is this circle selected and the current subject of gui/ui changes?
        this.dragOffset = {x:0, y:0};
    }

    gatherExportData () {
        var data = super.gatherExportData();

        return data;
    }

    destroy () {
        super.destroy();

        this.dragging = false;
        this.isSelected = false;

        this.container.parent.removeChild(this.container);
        this.graphics.destroy();
        this.container.destroy();
    }

    // ui

    onDragStart (event) {
        this.dragging = true;
        this.dragOffset.x = this.center.x - event.global.x;
        this.dragOffset.y = this.center.y - event.global.y;
    }

    onDragEnd (event) {
        this.dragging = false;
        this.dragOffset.x = 0;
        this.dragOffset.y = 0;
    }

    onDragMove (event) {
        if (this.dragging) {
            if (this.anchored === true) {
                this.changeAnchorAngleFromPoint( event.global.x+this.dragOffset.x, event.global.y+this.dragOffset.y );
            } else if (this.anchored === false ) {
                this.changeCenter( event.global.x+this.dragOffset.x, event.global.y+this.dragOffset.y );
            }
            //this.update();
        }
    }

    // drawing

    draw () {
        var gr = this.graphics;
        gr.clear();

        if ( this.isSelected === true ) {
            gr.lineStyle(2, 0x4285f4, 0.5);
            gr.drawCircle(this.center.x, this.center.y, this.radius);
            gr.lineStyle(0, 0xFFFFFF, 0);
        }
    }
}