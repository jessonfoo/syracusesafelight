import "../node_modules/three/src/Three.js";
var fromLL = function ( lng, lat) {
    // derived from https://gist.github.com/springmeyer/871897
    var extent = 20037508.34;

    var x = lng * extent / 180;
    var y = Math.log(Math.tan((90 + lat) * Math.PI / 360)) / (Math.PI / 180);
    y = y * extent / 180;

    return [(x + extent) / (2 * extent), 1 - ((y + extent) / (2 * extent))];
};


const getMatrixProjectionByCoords = function( coord, matrix ){

    let translate = fromLL(coord.lng, coord.lat);
    let transform = {
        translateX: translate[0],
        translateY: translate[1],
        translateZ: 0,
        rotateX: Math.PI / 2,
        rotateY: 0,
        rotateZ: 0,
        scale: 10.41843220338983e-8
    };

    var rotationX = new THREE.Matrix4().makeRotationAxis(new THREE.Vector3(1, 0, 0), transform.rotateX);
    var rotationY = new THREE.Matrix4().makeRotationAxis(new THREE.Vector3(0, 1, 0), transform.rotateY);
    var rotationZ = new THREE.Matrix4().makeRotationAxis(new THREE.Vector3(0, 0, 1), transform.rotateZ);

    var m = new THREE.Matrix4().fromArray(matrix);
    var l = new THREE.Matrix4().makeTranslation(transform.translateX, transform.translateY, transform.translateZ)
        .scale(new THREE.Vector3(transform.scale, -transform.scale, transform.scale))
        .multiply(rotationX)
        .multiply(rotationY)
        .multiply(rotationZ);

    return m.multiply(l);
};

export default class ThreeRenderer {

    constructor( map, gl ){

        this._map = map;

        this.gl = gl;

        this.camera = new THREE.Camera();
        this.scene = new THREE.Scene();

        // var directionalLight = new THREE.DirectionalLight(0xcccccc);
        // directionalLight.position.set( 10, 70, 120).normalize();
        // this.scene.add(directionalLight);

        var directionalLight2 = new THREE.DirectionalLight(0xffffff);
        // directionalLight2.position.set( 120, 130, 110).normalize();
        directionalLight2.position.set( 1200, 1300, 1100 );
        this.scene.add(directionalLight2);

        this.renderer = new THREE.WebGLRenderer({
            canvas: map.getCanvas(),
            context: gl
        });

        this.renderer.autoClear = false;

    }

    mapGetCenter(){
        let coord = this._map.unproject( {
            x: window.innerWidth / 2,
            y: window.innerHeight / 2
        });
        return coord;
    }

    updateCameraByTransformData( transform, matrix ){
        let coord = this.mapGetCenter();
        let testMatrix = getMatrixProjectionByCoords( coord, matrix );
        this.camera.projectionMatrix.elements = matrix;
        this.camera.projectionMatrix = testMatrix;
        this.renderer.state.reset();
        this.renderer.render( this.scene, this.camera );
    }

}