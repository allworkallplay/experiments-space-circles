import * as PIXI from 'pixi.js';
import GUI from 'lil-gui';
import PencilCircle from './PencilCircle';
import Math2 from './Math2';
import MoonCircle from './MoonCircle';
import EclipseCircle from './EclipseCircle';

export default class App {

    constructor() {
        this.dom = {
            app: document.getElementById('app'),
        };

        // pixi scene
        this.stageHalf = {width:0, height:0};   // half the stage width and height for easy ref and save calcs
        this.stage = null;  // reference to pixi stage
        this.stageMousePos = {x:0, y:0};    // mouse position relative to stage
        this.main = null;   // main container
        
        // circles management
        this.allCircles = [];
        this.uiActiveObj = null;

        // gui
        this.guiObj = {
            selectedCircleFolder: null,
            linesPatternCount: 4,
        };
    }

    init() {
        this.setupScene();

        this.addGUI();

        this.initComplete();
    }

    initComplete() {
        this.onResize();
        this.update();
    }

    setupScene() {
        this.pixi = new PIXI.Application({
            // width: document.body.width,
            // height: document.body.height,
            antialias: true,
            transparent: false,
            resolution: 1,
            backgroundColor: "#070e16",
            resizeTo: window,
            sharedTicker: true,
            interactive: true,
        });
        this.dom.app.appendChild(this.pixi.view);

        this.stage = this.pixi.stage;

        this.main = new PIXI.Container();
        this.main.eventMode = 'static';
        this.main.hitArea = new PIXI.Rectangle(0, 0, window.innerWidth, window.innerHeight);
        this.pixi.stage.addChild(this.main);

        // circles

        // eclipse circle
        this.eclipsecircle = new EclipseCircle( 200, {x: 1100, y: 650}, {color:"#070e16", glowColor:"#57A7C9"} );
        this.main.addChild(this.eclipsecircle.container);
        // this.main.addChild(this.eclipsecircle.glowContainer);
        this.allCircles.push(this.eclipsecircle);

        //this.pencircle = new PencilCircle(300, {x:1100, y:650}, {color:0xffffff});
        //this.main.addChild(this.pencircle.container);
        //this.allCircles.push(this.pencircle);

        // add a new moon circle
        /* this.mooncircle = new MoonCircle( 500, {x: 1100, y: 650} );
        this.main.addChild(this.mooncircle.container);
        this.allCircles.push(this.mooncircle); */

        // animation frames
        this.pixi.ticker.add(this.update.bind(this));
        this.uiToggleEvents();
    }

    onResize() {
        this.pixi.renderer.resize(window.innerWidth, window.innerHeight);
        this.stageHalf = {width: window.innerWidth / 2, height: window.innerHeight / 2};
        this.main.hitArea = new PIXI.Rectangle(0, 0, window.innerWidth, window.innerHeight);
    }

    update ( time ) {
        this.pixi.renderer.render(this.pixi.stage);
    }


    // EDITING

    addPencilCircle (radius, anchorRef=null) {
        var newCircle;
        var anchorRef = this.uiActiveObj;

        newCircle = new PencilCircle( radius );
        this.main.addChild(newCircle.container);

        if (anchorRef !== null) {   // circle anchored to another
            newCircle.setAnchor(
                {ref: anchorRef, angle:0, type: "perimeter",},
                {
                    type: "perimOuter",
                    angle: 0,
                }
            );

            // tell the circle that will be my anchor that I exist and will be anchording to it
            anchorRef.addAnchoredChild(newCircle);

            newCircle.recalculateAnchorAndPosition();
        } else {    // free floating circle
            newCircle.changeCenter( this.stageMousePos.x, this.stageMousePos.y);
        }

        // this.slaves.push(newCircle);
        this.allCircles.push(newCircle);
    }

    addEclipseCircle (radius) {
        var newCircle;

        newCircle = new EclipseCircle( radius );
        this.main.addChild(newCircle.container);

        newCircle.changeCenter( this.stageMousePos.x, this.stageMousePos.y);

        this.allCircles.push(newCircle);
    }

    addMoonCircle () {
        var circle
    }

    addLinesPattern() {
        var obj = this.uiActiveObj || null;
        
        if (obj !== null) {
            obj.addLinesInPattern( this.guiObj.linesPatternCount );
        }
        
        // make sure line drawing is turned on if it's off
        obj.options.draw.lines = true;
        obj.changed();

        this.guiSetSelectedCircleControls( obj );
    }

    addSingleLine() {
        var obj = this.uiActiveObj || null;
        
        if (obj !== null) {
            obj.addLine( {
                angle: Math2.random(0, 6.28319),
            });
        }

        // make sure line drawing is turned on if it's off
        obj.options.draw.lines = true;
        obj.changed();
        
        this.guiSetSelectedCircleControls( obj );
    }

    deleteSelectedObject () {
        if (this.uiActiveObj !== null) {
            this.uiActiveObj.destroy();

            this.allCircles.forEach( (v,i,a) => {
                if (v === this.uiActiveObj) {
                    a.splice(i, 1);
                }
            });

            this.uiActiveObj = null;    // setting null here makes uiCLearActiveSelection() not try to redraw the object we just deleted
        }

        this.uiClearActiveSelection();
    }

    deleteSingleLine ( index ) {
        this.uiActiveObj.deleteLine( index );
        this.uiActiveObj.changed();
        this.uiClearActiveSelection();
    }

    deleteLineGroup ( groupIndex ) {
        this.uiActiveObj.deleteLineGroup( groupIndex );
        this.uiActiveObj.changed();
        this.uiClearActiveSelection();
    }

    // UI

    uiToggleEvents () {
        this.mainMouseDownHandlerRef = this.uiMouseDown.bind(this);
        this.mainMouseUpHandlerRef = this.uiMouseUp.bind(this);
        this.mainMouseMoveHandlerRef = this.uiMouseMove.bind(this);

        this.main.on('mousedown', this.mainMouseDownHandlerRef);
        this.main.on('mouseup', this.mainMouseUpHandlerRef);

        this.stage.eventMode = 'static';
        this.stage.on("mousemove", this.uiStageMouseMove.bind(this));

        document.addEventListener('keydown', this.uiOnKeyDown.bind(this));
    }

    uiMouseDown (e) {
        var clicked = this.uiWhichCircleClicked(e.global.x, e.global.y);
        
        if (clicked !== null) {
            if (this.uiActiveObj !== null && this.uiActiveObj !== clicked) {  // already a selected obj and it's not the one we just clicked on, we clicked on a new obj
                this.uiClearActiveSelection();
                this.uiSetActiveSelection( clicked );
            } else if ( this.uiActiveObj === null ) {    // no selected obj, we clicked on a new obj
                this.uiSetActiveSelection( clicked );
            }

            if (this.uiActiveObj != null) {
                this.main.on('mousemove', this.mainMouseMoveHandlerRef);
                this.uiActiveObj.onDragStart(e);
            }
        } else {    // user clicked outside of anything selectable
            this.uiClearActiveSelection();
        }
    }

    uiMouseUp (e) {
        this.main.off('mousemove', this.mainMouseMoveHandlerRef);
        
        // if (this.uiActiveObj) {
        //     this.uiActiveObj.onDragEnd(e);
        //     this.uiActiveObj.update();
        //     this.uiActiveObj = null;
        //     this.guiRemoveAllControls( this.gui.selectedCircleFolder );
        // }
    }

    uiMouseMove (e) {
        if (this.uiActiveObj) {
            this.uiActiveObj.onDragMove(e);
        }
    }

    uiStageMouseMove (e) {
        this.stageMousePos.x = e.global.x;
        this.stageMousePos.y = e.global.y;
    }

    uiOnKeyDown (e) {
        // console.log("key down",e);

        switch(e.code) {
            case "KeyA":
                this.addPencilCircle( Math2.random(20, 200) );
                this.uiClearActiveSelection();
                break;

            case "KeyE":
                this.addEclipseCircle( Math2.random(20, 200) );
                this.uiClearActiveSelection();
                break;
            
            case "KeyD":
                this.deleteSelectedObject();
                // this.uiClearActiveSelection();
            break;
        }
    }

    uiWhichCircleClicked (x, y) {
        var clicked = null;
        this.allCircles.forEach( (circle) => {
            if(circle.isPointInside(x, y)) {
                if (clicked == null || circle.radius < clicked.radius) {
                    clicked = circle;
                }
            }
        });

        return clicked;
    }

    uiClearActiveSelection () {
        if (this.uiActiveObj !== null) {
            this.uiActiveObj.isSelected = false;
            this.uiActiveObj.update();
            this.uiActiveObj = null;
        }

        this.guiRemoveAllControls( this.guiObj.selectedCircleFolder );
    }

    uiSetActiveSelection ( obj ) {
        this.uiActiveObj = obj;

        if (this.uiActiveObj !== null ) {
            this.uiActiveObj.isSelected = true;
            this.uiActiveObj.update();
            this.guiSetSelectedCircleControls(this.uiActiveObj);
        }
    }

    // File Operations

    fileExport () {
        var data = this.fileGatherData();
        var json = JSON.stringify(data);

        console.log(data, json);

        var blob = new Blob([json], {type: "text/json;charset=utf-8"});
        this.fileSaveAs(blob, "circles.json");
    }

    fileGatherData () {
        var data = {};

        // through all circles and gather data
        data.circles = {
            list:[]
        };
        this.allCircles.forEach( (v,i,a) => {
            data.circles.list.push( v.gatherExportData() );
        });

        return data;
    }

    fileSaveAs (blob, file="space.json") {
        var blobUrl = URL.createObjectURL(blob);
        var link = document.createElement("a");

        link.href = blobUrl;
        link.download = file;

        document.body.appendChild(link);

        link.dispatchEvent(
            new MouseEvent('click', {
                bubbles: true,
                cancelable: true,
                view: window
            })
        );

        document.body.removeChild(link);
    }

    // GUI
    //

    addGUI() {
        var f;
        this.gui = new GUI();

        this.guiObj.selectedCircleFolder = this.gui.addFolder('Selected Circle');

        f = this.gui.addFolder('File');
        f.add( this, 'fileExport').name('Export File');
    }

    guiSetSelectedCircleControls( circle ) {
        // add controls for adjust circle.andchor.angle, circle.radius, circle.color. circle.anchor.type
        var f = this.guiObj.selectedCircleFolder;
        this.guiRemoveAllControls(f);

        f.add( circle, 'radius', 10, 2000 ).step(1).onChange( this.guiUpdateSelectedObject.bind(this) );
        f.addColor( circle.options, 'color' ).onChange( this.guiUpdateSelectedObject.bind(this) );
        if (circle.anchored === true) {
            //f.add( circle.anchor, 'angle', {min:0, max:6.28319} );
            f.add( circle.anchor, 'type', ['center', 'perimeter'] );
            f.add( circle.orient, 'type', ['perimOuter','perimInner','perimCenter'] ).onChange( this.guiUpdateSelectedObject.bind(this) );
        }

        //
        if (circle.constructor.name === "PencilCircle") {
            f.add( circle.options, 'alpha', 0,1 ).step(0.01).onChange( this.guiUpdateSelectedObject.bind(this) );
        }

        // eclipse circles
        if (circle.constructor.name === "EclipseCircle") {
            f.addColor( circle.options, 'glowColor' ).onChange( this.guiUpdateSelectedObject.bind(this) );
            f.add( circle.options, 'glowAlpha', 0,1 ).step(0.01).onChange( this.guiUpdateSelectedObject.bind(this) );
            f.add( circle.options, 'glowRadius', 0,3 ).step(0.1).onChange( this.guiUpdateSelectedObject.bind(this) );
            f.add( circle.options, 'coronaStrength', 0,1 ).step(0.01).onChange( this.guiUpdateSelectedObject.bind(this) );
            f.add( circle.options, 'coronaSize', 0,1 ).step(0.01).onChange( this.guiUpdateSelectedObject.bind(this) );
        }

        // drawing
        f.add( circle.options.draw, 'lines').onChange( this.guiUpdateSelectedObject.bind(this) );

        // lines
        f.add( this.guiObj, 'linesPatternCount', 0, 100).name('Lines Pattern Count');
        f.add( this, 'addSingleLine').name('Add Single Line');
        f.add( this, 'addLinesPattern').name('Add Lines Pattern');

        // line patterns
        var linef;
        circle.lineGroups.forEach( (v,i,a) => {
            linef = f.addFolder('Line Group ' + i);
            linef.add( circle.lineGroups[i], 'startAngle', 0, 6.28).step(0.001).onChange( this.guiUpdateLineGroup.bind(this,i) );
            linef.add( circle.lineGroups[i], 'length', 0, 8000).onChange( this.guiUpdateLineGroup.bind(this,i) );
            linef.add( circle.lineGroups[i], 'startRadius', 0, 1000).step(0.001).onChange( this.guiUpdateLineGroup.bind(this,i) );
            linef.add( circle.lineGroups[i], 'reverse').onChange( this.guiUpdateLineGroup.bind(this,i) );
            linef.add( this, 'guiDeleteLineGroup').name('Delete Line Group '+i).onChange( this.deleteLineGroup.bind(this,i) );
        });

        // single lines
        var linef;
        circle.oneLines.forEach( (v,i,a) => {
            linef = f.addFolder('Line ' + i);
            linef.add( circle.oneLines[i], 'angle', 0, 6.28).step(0.001).onChange( this.guiUpdateSelectedObject.bind(this) );
            linef.add( circle.oneLines[i], 'length', 0, 8000).onChange( this.guiUpdateSelectedObject.bind(this) );
            linef.add( circle.oneLines[i], 'startRadius', 0, 1000).step(0.001).onChange( this.guiUpdateSelectedObject.bind(this) );
            linef.add( circle.oneLines[i], 'reverse').onChange( this.guiUpdateSelectedObject.bind(this) );
            linef.add( this, 'guiDeleteLine').name('Delete Line '+i).onChange( this.deleteSingleLine.bind(this,i) );
            linef.close();
        });
    }

    guiRemoveAllControls( folder ) {
        var controllers = folder.controllersRecursive();
        var folders = folder.foldersRecursive();

        if (controllers.length > 0) {
            var i,imax = controllers.length;

            for(i=imax-1;i>=0;i--) {    // go backwards through the array so we can remove items without messing up the index
                controllers[i].destroy();
            }
        }

        if (folders.length > 0) {
            var i,imax = folders.length;

            for(i=imax-1;i>=0;i--) {    // go backwards through the array so we can remove items without messing up the index
                folders[i].destroy();
            }
        }
    }

    guiUpdateSelectedObject() {
        if (this.uiActiveObj.anchored === true) {
            this.uiActiveObj.recalculateAnchorAndPosition();
            this.uiActiveObj.changed();
        } else {
            this.uiActiveObj.changed();
        }
    }

    guiUpdateLineGroup(groupIndex) {
        if (this.uiActiveObj !== null) {
            this.uiActiveObj.updateLinesInGroup( this.uiActiveObj.lineGroups[groupIndex]);
            this.uiActiveObj.changed();
        }
    }

    guiDeleteLineGroup(e) { // i'm here just so a change event can be called
    }

    guiDeleteLine(index) {

    }
}