import DisplayCircle from "./DisplayCircle";
import * as PIXI from "pixi.js";
import {GlowFilter} from "pixi-filters";
import { BlurFilter } from "pixi.js";

export default class EclipseCircle extends DisplayCircle {
    constructor(radius, center, options=null) {
        super(radius, center, options);

        if (options === null) options = this.options;

        this.options.glowColor      = options.glowColor || 0xffffff; 
        this.options.glowAlpha      = options.glowAlpha || 0.2;
        this.options.glowRadius     = options.glowRadius || 0.2;
        this.options.coronaStrength = options.coronaStrength || 0.5;
        this.options.coronaSize     = options.coronaSize || 0.01;
        this.options.quality        = options.quality || 15;

        // this.color = options.color || 0x070e90;

        this.glowBlurFilter = new BlurFilter(600, this.options.quality, 2 );
        this.glowContainer = new PIXI.Container();
        this.glowContainer.graphics = new PIXI.Graphics();
        this.glowContainer.addChildAt(this.glowContainer.graphics);
        this.glowContainer.alpha = this.options.glowAlpha;
        this.glowContainer.filters = [
            this.glowBlurFilter,
        ];
        this.container.addChildAt(this.glowContainer,0);

        this.coronaBlurFilter = new BlurFilter(200, this.options.quality, 2 );
        this.coronaContainer = new PIXI.Container();
        this.coronaContainer.graphics = new PIXI.Graphics();
        this.coronaContainer.addChildAt(this.coronaContainer.graphics);
        this.coronaContainer.alpha = this.options.glowAlpha;
        this.coronaContainer.filters = [
            this.coronaBlurFilter
        ];
        this.container.addChildAt(this.coronaContainer,0);
        
        this.coronaContainer.cacheAsBitmap = true;
        this.glowContainer.cacheAsBitmap = true;

        this.update();
    }

    update() {
        this.coronaContainer.cacheAsBitmap = false;
        this.glowContainer.cacheAsBitmap = false;

        this.draw();

        this.coronaContainer.cacheAsBitmap = true;
        this.glowContainer.cacheAsBitmap = true;
    }

    gatherExportData () {
        var data = super.gatherExportData();

        data.options = this.options;

        return data;
    }

    destroy () {
        super.destroy();

        this.glowContainer.graphics.destroy();
        this.glowContainer.destroy();
        this.coronaContainer.graphics.destroy();
        this.coronaContainer.destroy();
    }

    // dragging
    onDragStart (event) {
        super.onDragStart(event);

        this.coronaContainer.filters = [  ];
        this.glowContainer.filters = [  ];

        this.coronaContainer.cacheAsBitmap = false;
        this.glowContainer.cacheAsBitmap = false;
    }

    onDragEnd (event) {
        super.onDragEnd(event);

        console.log("drag end");

        this.coronaContainer.filters = [ this.coronaBlurFilter ];
        this.glowContainer.filters = [ this.glowBlurFilter ];
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

    //

    draw () {
        super.draw();

        var gr = this.graphics;

        // draw my awesome fill
        gr.beginFill(this.options.color, 1);
        gr.drawCircle(this.center.x, this.center.y, this.radius);
        gr.endFill();

        // draw basic circle for glow
        gr = this.glowContainer.graphics;
        gr.clear();
        gr.beginFill(this.options.glowColor, 1);
        gr.drawCircle(this.center.x, this.center.y, this.radius*(1+this.options.glowRadius));
        gr.endFill();

        this.glowContainer.alpha = this.options.glowAlpha;

        // draw 2nd basic circle for glow
        gr = this.coronaContainer.graphics;
        gr.clear();
        gr.beginFill(this.options.glowColor, 1);
        gr.drawCircle(this.center.x, this.center.y, this.radius*(1+this.options.coronaSize));
        gr.endFill();

        this.coronaContainer.alpha = this.options.coronaStrength;
    }
}