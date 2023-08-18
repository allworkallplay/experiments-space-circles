import SpaceObject from './SpaceObject';
import Math2 from './Math2';
import signal from 'signal-js/src';
import * as PIXI from 'pixi.js';

export default class Circle extends SpaceObject {

    /**
     * 
     * @param {*} radius - radius of the circle 
     */
    constructor (radius, center) {
        super();
        this.signal = new signal();

        this.radius = radius;
        this.center = (typeof center === "undefined") ? {x: 0, y: 0} : center;

        this.anchored = false;  // is this circle following another circle and treating it as an anchor?
        this.anchor = null;
        this.orient = null;

        this.anchoredChildren = []; // what circles are anchored to me?

        // event bindings reference
        this.events = {
            eventAnchorChanged_bind: this.eventAnchorChanged.bind(this),
        };
    }

    gatherExportData () {
        var data = super.gatherExportData();

        data.radius = this.radius;
        data.center = this.center;
        data.anchored = this.anchored;
        data.anchor = {
            refUid: (this.anchor !== null) ? this.anchor.ref.uid : null,
            angle: (this.anchor !== null) ? this.anchor.angle : null,
            distance: (this.anchor !== null) ? this.anchor.distance : null,
            type: (this.anchor !== null) ? this.anchor.type : null,
        }
        data.orient = this.orient;

        return data;
    }

    destroy () {
        // remove me as a child from my anchor
        if (this.anchor !== null && typeof this.anchor.ref !== "undefined") {
            this.anchor.ref.removeAnchoredChild( this );
        }

        // remove my anchor children
        if (this.anchoredChildren.length > 0) {
            this.anchoredChildren.forEach( (child, i, a) => {
                child.removeAnchor();
            });
        }
    }

    setAnchor (anchor, orientation) {
        /*
        anchor: {
            ref: Circle,
            angle: Number,
            distance: Number,
            type: String,   // [center, perimeter, custom]

            // anchor will be given internally an x, y position of the anchor in global coordinates
        */

        /*
        orientation: {
            type: String,   // [center, perimOuter, perimInner, perimCenter, custom]
            angle: Number,
            distance: Number,
        */

        this.anchor = anchor;
        this.orient = orientation;
        this.anchored = true;

        this.recalculateAnchorAndPosition();

        // listen to anchor changes
        this.anchor.ref.signal.on('changed', this.events.eventAnchorChanged_bind);
    }

    eventAnchorChanged () {
        this.recalculateAnchorAndPosition();
        this.update();
    }

    addAnchoredChild ( obj ) {
        this.anchoredChildren.push( obj );
    }

    removeAnchor () {
        if (this.anchor !== null) {
            this.anchored = false;
            if (typeof this.anchor.ref !== "undefined") {
                this.anchor.ref.signal.off('changed', this.events.eventAnchorChanged_bind);
                this.anchor.ref = null;
            }
            this.anchor = null;
            this.orient = null;
        }
    }

    removeAnchoredChild ( obj ) {       // this isnt, and probanly shouldnt be used.
        this.anchoredChildren.forEach( (child, i, a) => {
            if (child === obj) {
                console.log("child found, remove", i);
                obj.removeAnchor();
                this.anchoredChildren.splice(i, 1);
            }
        });
    }

    /**
     * Updates the global coordinates of this circle's anchor point based on the wherever the anchoring circle is located in the world
     * If my anchoring circle moves, or the anchor point within it that I follow (like it's angle), this lets me know where it's at
     */
    updateAnchorFromRef () {
        var ref = this.anchor.ref;
        var anchorPosition = {x:0, y:0}; // position of anchor point relative to the center of our reference Circle
        var anchorDistance; // distance of anchor point relative to the center of our reference Circle

        if (this.anchor.type === "center") {
            this.anchor.x = ref.center.x;
            this.anchor.y = ref.center.y;
            this.anchor.distance = 0;
        } else if (this.anchor.type === "custom") {

        } else {    // perimeter
            Math2.pointAngleDistance(ref.center.x, ref.center.y, this.anchor.angle, ref.radius, anchorPosition);
            this.anchor.x = anchorPosition.x;
            this.anchor.y = anchorPosition.y;
            this.anchor.distance = ref.radius/2;
        }
    }

    /**
     * Updates the global coordinates of this circle's center point based on the anchor circle and my relationship to it (orient)
     */
    updatePositionFromAnchor () {
        switch (this.orient.type) {
            case "center":
                this.center.x = this.anchor.x;
                this.center.y = this.anchor.y;
                break;
            case "custom":
                break;
            case "perimOuter":
                this.orient.distance = this.radius;
                Math2.pointAngleDistance(this.anchor.x, this.anchor.y, this.anchor.angle, this.orient.distance, this.center);
                break;
            case "perimCenter":
                this.orient.distance = 0;
                Math2.pointAngleDistance(this.anchor.x, this.anchor.y, this.orient.angle, this.orient.distance, this.center);
                break;
            case "perimInner":
                this.orient.distance = -this.radius;
                Math2.pointAngleDistance(this.anchor.x, this.anchor.y, this.anchor.angle, this.orient.distance, this.center);
                break;
            default:
                break;
        }
        
        this.changed();
    }

    recalculateAnchorAndPosition() {
        this.updateAnchorFromRef();
        this.updatePositionFromAnchor();
    }

    changeAnchorAngleFromPoint (x, y) {
        var angle = Math2.pointAngle(this.anchor.ref.center.x, this.anchor.ref.center.y, x, y);
        this.anchor.angle = angle;
        this.updateAnchorFromRef();
        this.updatePositionFromAnchor();
    }

    changeCenter( x, y ) {
        // typicall used by non-anchored circles
        this.center.x = x;
        this.center.y = y;

        this.changed();
    }

    // math
    isPointInside (x, y) {
        if ((x - this.center.x) * (x - this.center.x) +
            (y - this.center.y) * (y - this.center.y) <= this.radius * this.radius)
            return true;
        else
            return false;
    }


    // status

    changed () {
        this.draw();
        this.signal.emit('changed');
    }

    get area () {
        return Math.PI * this.radius * this.radius;
    }

}