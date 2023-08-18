export default class Math2 {

    static pointAngleDistance (x, y, angle, distance, returnRef) {
        // angle is in radians
        returnRef.x = x + Math.cos(angle) * distance;
        returnRef.y = y + Math.sin(angle) * distance;
//  console.log("pointAngleDistance: ", x, y, angle, distance, returnRef);
        return returnRef;
    }

    static pointAngle (x1, y1, x2, y2) {
        return Math.atan2(y2 - y1, x2 - x1);
    }

    static random( mn, mx) {
        return Math.random() * (mx-mn) + mn;
    }

    static randomFromArray( arr ) {
        return (Math.floor(Math.random() * arr.length));
    }
}