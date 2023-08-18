import Math2 from "./Math2";

export default class SpaceObject {
    constructor() {
        this.options = {};
        this.uid = Math.floor(Math2.random(10000,99999));

        this.lines = [];
        this.oneLines = [
/*             {
                centerGlobal: {x:0, y:0},
                startRadius: 0,
                length: 5000,
                angle: 0,
                reverse: true,
            } */
        ];    // lines should always be listed clockwise
        this.lineGroups = [];
        /* 
            {
                startRadius: 0,
                startAngle: 0,
                angleStep: 0,
                lines: []
            }
         */
    }

    gatherExportData() {
        return {
            uid: this.uid,
        }
    }

}