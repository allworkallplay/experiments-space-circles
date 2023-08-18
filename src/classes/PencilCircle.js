import Circle from "./Circle";
import DisplayCircle from "./DisplayCircle";
import Math2 from "./Math2";

export default class PencilCircle extends DisplayCircle {

    constructor(radius, center, options=null) {
        super(radius, center, options);

        if (options === null) options = this.options;

        this.options.alpha      = options.alpha || 1;
        this.options.color      = options.color || 0xffffff;

        this.update();
    }

    update() {
        this.draw();
    }

    destroy () {
        super.destroy();
    }

    gatherExportData () {
        var data = super.gatherExportData();

        data.options = this.options;
        
        // group lines
        data.lineGroups = [];
        this.lineGroups.forEach( (v,i,a)=>{
            data.lineGroups.push( {
                startRadius: v.startRadius,
                startAngle: v.startAngle,
                angleStep: v.angleStep,
                length: v.length,
                reverse: v.reverse,
            });
        });

        // single lines
        data.oneLines = [];
        this.oneLines.forEach( (v,i,a)=>{
            data.oneLines.push( {
                centerGlobal: {x:v.centerGlobal.x, y:v.centerGlobal.y},
                startRadius: v.startRadius,
                length: v.length,
                angle: v.angle,
                reverse: v.reverse,
            });
        });

        return data;
    }

    setPositionByAnchor (x, y, angle, distance) {
        super.setPositionByAnchor(x, y, angle, distance);

        this.draw();
    }

    // lines
    addLine ( options, groupObject ) {
        var newLine;
        groupObject = (typeof groupObject === "undefined") ? null : groupObject;

        if (typeof options.centerGlobal === "undefined") {
            options.centerGlobal = {x:this.center.x, y:this.center.y};
        }

        newLine = {
            centerGlobal: {
                x: options.centerGlobal.x,
                y:options.centerGlobal.y
            },
            startRadius: options.radius || 0,
            length: options.length || 5000,
            angle: options.angle,
            reverse: false,
            group: groupObject,
        };

        this.lines.push(newLine);
        if (groupObject !== null) {
            groupObject.lines.push( this.lines[ this.lines.length-1] );
        } else {
            this.oneLines.push( this.lines[ this.lines.length-1 ] );
        }

        return newLine;
    }

    deleteLine ( indexOrLine ) {
        var theline = (typeof indexOrLine === "number") ? this.lines[indexOrLine] : indexOrLine;

        this.oneLines.forEach( (v,i,a)=>{
            if (v === theline) {
                this.oneLines.splice(i,1);
                return false;
            }
            return true;
        });

        this.lines.forEach( (v,i,a)=>{
            if (v === theline) {
                this.lines[i] = null;
                this.lines.splice(i, 1);
                return false;
            }
            return true;
        });
    }

    updateLinesInGroup (group) {
        var i,imax = group.lines.length;
        var line;

        for (i=0;i<imax;i++) {
            // group.lines[i].centerGlobal = radStep * i;
            group.lines[i].startRadius = group.startRadius;
            group.lines[i].angle = group.startAngle + (group.angleStep*i);
            group.lines[i].length = group.length;
            group.lines[i].reverse = group.reverse;
            
        }
    }

    addLinesInPattern ( count ) {
        var i,imax = count;
        var radStep = (Math.PI*2) / count;
        var group = {
            startRadius: 0,
            startAngle: 0,
            angleStep: radStep,
            length: 5000,
            reverse: false,
            lines: [],
        };

        //this.clearLines();

        for (i=0;i<imax;i++) {
            this.addLine({
                angle: radStep * i,
            }, group);
        }

        this.lineGroups.push(group);
    }

    deleteLineGroup ( index ) {
        var group = this.lineGroups[index];
        var i,imax = group.lines.length;

        for (i=0;i<imax;i++) {  // for each line in the group
            this.deleteLine( group.lines[i] );
            group.lines[i] = null;
        }

        group.lines = null;

        this.lineGroups.splice( index, 1 );
    }

    clearLines() {
        //this.oneLines.length = 0;
    }

    // drawing

    draw() {
        super.draw();

        var lineStart = {x:0, y:0};
        var lineEnd = {x:0, y:0};

        if (this.isSelected === false ) {
            this.graphics.clear();
            this.graphics.lineStyle(1, this.options.color, this.options.alpha);
            this.graphics.drawCircle(this.center.x, this.center.y, this.radius);
            // this.graphics.lineStyle(0, 0xFFFFFF, 0);
        }

        /* centerGlobal: {x:0, y:0},
        startRadius: 0,
        length: 100000,
        angle: 0,
        reverse: true, */

        // lines
        // TO-DO: move these point calculations to move/position logic above. store results for faster drawing, maybe? maybe it's better they're here?
        if (this.options.draw.lines === true) {
            // for eachline
            this.lines.forEach( (v,i,a) => {
                // determine start and end points
                v.centerGlobal.x = this.center.x;
                v.centerGlobal.y = this.center.y;
                
                Math2.pointAngleDistance( v.centerGlobal.x, v.centerGlobal.y, v.angle, v.startRadius, lineStart );
                Math2.pointAngleDistance( lineStart.x, lineStart.y, v.angle, v.length, lineEnd );

                // draw line
                this.graphics.lineStyle(1, this.options.color, this.options.alpha);
                this.graphics.moveTo(lineStart.x, lineStart.y);
                this.graphics.lineTo(lineEnd.x, lineEnd.y);

                // draw reverse line
                if (v.reverse === true ) {
                    Math2.pointAngleDistance( v.centerGlobal.x, v.centerGlobal.y, v.angle-Math.PI, v.startRadius, lineStart );
                    Math2.pointAngleDistance( lineStart.x, lineStart.y, v.angle-Math.PI, v.length, lineEnd );
                
                    // draw line
                    this.graphics.lineStyle(1, 0xFFFFFF, 0.2);
                    this.graphics.moveTo(lineStart.x, lineStart.y);
                    this.graphics.lineTo(lineEnd.x, lineEnd.y);
                }
            });
        }

        //this.debugDraw();

        if (this.dragging === true) {
            //this.uiDrawSelected();
        }
    }

    debugDraw() {
        // draw anchor
        if (this.anchor !== null) {
            this.graphics.beginFill(0xFF0000, 1);
            this.graphics.drawCircle(this.anchor.x, this.anchor.y, 5);
            this.graphics.endFill();

            this.graphics.lineStyle(0.5, 0xFFFFFF, 0.1);
            this.graphics.moveTo(this.center.x, this.center.y);
            this.graphics.lineTo(this.anchor.x, this.anchor.y);
            this.graphics.endFill();
        }

        // draw center
        this.graphics.lineStyle(0, 0xFFFFFF, 0);
        this.graphics.beginFill(0x0000FF, 1);
        this.graphics.drawCircle(this.center.x, this.center.y, 5);
        this.graphics.endFill();
    }
}