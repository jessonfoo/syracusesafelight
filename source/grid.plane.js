import "../node_modules/three/src/Three.js";
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

var fromLL = function ( lng, lat) {
    // derived from https://gist.github.com/springmeyer/871897
    var extent = 20037508.34;

    var x = lng * extent / 180;
    var y = Math.log(Math.tan((90 + lat) * Math.PI / 360)) / (Math.PI / 180);
    y = y * extent / 180;

    return [(x + extent) / (2 * extent), 1 - ((y + extent) / (2 * extent))];
};


export default class GridPlane {

    constructor( image, map, getDeck, getThree ){

        this._map = map;

        this.mapActualParams = {};
        this.mapActualParamsBefore = false;

        this.getThree = getThree;
        this.getCamera = () => {
            return this.getThree().camera;
        };
        this.getDeck = getDeck;

        this.clippingPlane = new THREE.Plane();

        this.clippingPlane.normal.set( 0, 1, 0 );
        this.clippingPlaneConstant = -0.5;
        this.clippingPlaneConstatnFacor = 0.001;
        this.clippingPlane.constant = this.clippingPlaneConstant;

        this.minAlt = 0.17;
        this.maxAltStatic = 350;
        this.altRange = 7;
        this.getNextZoomFactor = () => {
            return this.altRange / (1 + (this._map.transform.zoom - 13) );
        };
        this.distanceFactorMultiplycator = 0.000005; // distance factor from center to edge of point zone
        this.getNextDistanceFactor = () => {
            return this.distanceFactorMultiplycator * this.getNextZoomFactor();
        };
        this.getNextAltitudeFactor = ( ) => {
            return ( 8 + 22 * ( 1 - ( this.getNextZoomFactor() / this.altRange ) ) );
        };
        this.setAltToVert = ( nextZoomFactor, vert ) => {
            if( vert.y > 0 ){
                // vert.y * ( nextZoomFactor * 2 );
                if( vert.y < this.minAlt ){ vert.y = this.minAlt; }
            }
        };

        this.planeNeedsUpdate = false;

        this.getThree().renderer.clippingPlanes = [ this.clippingPlane ];

        this.forsedGeometryUpdate = false;
        this.detalisationFull = false;
        this.detalisationMaxStep = 7;
        this.detalisationCurrentStep = 0;
        this.detalisationMin = 16;
        this.detalisationMax = 128;
        this.materialAlphaDetalisationMin = 0.15;
        this.materialAlphaDetalisationAdd = 0.10;
        this.detalisationFullReset = () => {
            this.material.opacity = this.materialAlphaDetalisationMin;
            this.detalisationFull = false;
            this.detalisationCurrentStep = 0;
        };


        this.planeSizeParams = { width: 100, height: 100 };

        this.centerPosition = false;

        this.geometry = new THREE.PlaneGeometry( 1, 1, 1, 1 );
        this.geometry.rotateX(-Math.PI / 2);

        this.material = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            emissive: 0x33ccff,
            // vertexColors: THREE.VertexColors,
            // side: THREE.FrontSide,
            // side: THREE.BackSide,
            side: THREE.DoubleSide,
            clippingPlanes: [ this.clippingPlane ],
            wireframe: true,
            transparent: true,
            opacity: 0.1
        });

        this.mesh = new THREE.Mesh( this.geometry, this.material );

        let testScaleProjectionFactor = 1;

        this.verticesTestObj = new THREE.Object3D();

        this.initHexagonData( this.getDeck().props.layers[3].state.hexagons );

    }

    getGridFromThisGeometry(){
        let geometry =  new THREE.BufferGeometry().fromGeometry( this.geometry );
        return new THREE.PlaneBufferGeometry( 1, 1, 1, 1 ).toGrid()
    }

    vertices2dPosition( vector3 ){
        this.verticesTestObj.position.copy( vector3 );
        let vector = new THREE.Vector3();
        let widthHalf = 0.5 * window.innerWidth;
        let heightHalf = 0.5 * window.innerHeight;
        this.verticesTestObj.updateMatrixWorld();
        vector.setFromMatrixPosition( this.verticesTestObj.matrixWorld );
        vector.project( this.getCamera() );
        vector.x = ( vector.x * widthHalf ) + widthHalf;
        vector.y = - ( vector.y * heightHalf ) + heightHalf;
        return { x: vector.x, y: vector.y };
    }

    initHexagonData( hxgons, forcedGeometryUpdate = false ){
        this.hexagons = [];
        for ( let i = 0; i < hxgons.length; i++) {
            let coord = hxgons[i];
            let XY = fromLL( coord.centroid[0], coord.centroid[1] );
            this.hexagons.push( {
                xy: new THREE.Vector2( XY[0], XY[1] ),
                lng: coord.centroid[0],
                lat: coord.centroid[1],
                value: coord.points.length
            } );
        }
        if( forcedGeometryUpdate ){
            this.forsedGeometryUpdate = true;
            this.updateGeometry();
        } else {
            this.detalisationFullReset();
        }
        this.renderData();
    }


    eachPoints(callback) {
        if (callback) {
            for (let i = 0; i < this.geometry.vertices.length; i++) {
                callback(i, this.geometry.vertices[i] );
            }
        }
    }

    eachFaces(callback) {
        if (callback) {
            for (let i = 0; i < this.geometry.faces.length; i++) {
                callback(i, this.geometry.faces[i] );
            }
        }
    }

    renderData(){

        let nextZoomFactor = this.getNextZoomFactor();
        let nextAltitudeFactor = this.getNextAltitudeFactor();
        let nextDistanceFactor = this.getNextDistanceFactor();

        this.clippingPlane.constant = this.clippingPlaneConstant - ( this.clippingPlaneConstatnFacor * nextZoomFactor );

        // iterate over all pixels
        this.eachPoints((iterator, vert) => {

            vert.y = 0;

            const nextVertXY = this.vertices2dPosition( vert );
            const latLng = this._map.unproject( nextVertXY );
            const xz_ltc = fromLL( latLng.lng, latLng.lat );

            vert.userData = {
                nextVertXY: nextVertXY,
                latLng: latLng,
                xz_ltc: xz_ltc
            };

            for( let i = 0; i < this.hexagons.length; i++ ){
                let nextDistance = this.hexagons[i].xy.distanceTo( new THREE.Vector2( xz_ltc[0], xz_ltc[1] ) );
                let nextHexDistanceFactor = 1-nextDistance/nextDistanceFactor;
                if( nextDistance < nextDistanceFactor ){
                    vert.y += ( this.hexagons[i].value * nextHexDistanceFactor ) * nextAltitudeFactor;
                }
            }
            if( vert.y < this.minAlt ){ vert.y = this.minAlt; }
        });
        this.geometry.verticesNeedsUpdate = true;

    }

    coordsIsEquals( coord1, coord2 ){
        if( coord1.lat != coord2.lat ){
            return false;
        }
        if( coord1.lng != coord2.lng ){
            return false;
        }
        return true;
    }

    updateGeometry(){

        let maxSize = this.mapActualParams.latRange + this.mapActualParams.lngRange * 500;

        const centerIsEquals = this.mapActualParamsBefore && this.mapActualParams &&
            this.mapActualParamsBefore.center.lat === this.mapActualParams.center.lat &&
            this.mapActualParamsBefore.center.lng === this.mapActualParams.center.lng;

        if( this.forsedGeometryUpdate ){

            this.geometry = new THREE.PlaneGeometry(
                this.planeSizeParams.width * maxSize,
                this.planeSizeParams.height * maxSize,
                this.detalisationMax, this.detalisationMax
            );

            this.lineSegmentsPoints = new THREE.PlaneBufferGeometry(
                this.planeSizeParams.width * maxSize,
                this.planeSizeParams.height * maxSize,
                this.detalisationMax, this.detalisationMax
            ).toGrid();


            this.geometry.rotateX( Math.PI / 2);
            this.mesh.geometry = this.geometry;

            this.forsedGeometryUpdate = false;

            return false;
        }

        if( centerIsEquals && this.detalisationFull ){
            return false;
        }

        if( this.geometry ){
            this.geometry.dispose();
        }


        let sizeRulle = { width: this.detalisationMin, height: this.detalisationMin };

        if( !centerIsEquals ){
            sizeRulle = { width: this.detalisationMin, height: this.detalisationMin };
            this.detalisationFullReset();
        } else {
            if( this.detalisationCurrentStep < this.detalisationMaxStep ){
                const detAlpha = this.detalisationCurrentStep / this.detalisationMaxStep;
                const detDiapason = this.detalisationMax - this.detalisationMin;
                const currentDet = this.detalisationMin + Math.floor( detDiapason * detAlpha );
                sizeRulle = { width: currentDet, height: currentDet };
                this.material.opacity = this.materialAlphaDetalisationMin + this.materialAlphaDetalisationAdd * detAlpha;
                this.detalisationCurrentStep++;
            } else {
                sizeRulle = { width: this.detalisationMax, height: this.detalisationMax };
                this.material.opacity = this.materialAlphaDetalisationMin + this.materialAlphaDetalisationAdd;
                this.detalisationFull = true;
            }
        }

        this.geometry = new THREE.PlaneGeometry(
            this.planeSizeParams.width * maxSize,
            this.planeSizeParams.height * maxSize,
            sizeRulle.width, sizeRulle.height
        );

        this.geometry.rotateX( Math.PI / 2);
        this.mesh.geometry = this.geometry;
    }

    updatePlane( gl, matrix ){

        this.mapGetActualParams();

        // if( this.lastUpdateGridTime &&  Date.now() - this.lastUpdateGridTime < 200 ){
        //     return false;
        // }

        let coord = this.mapGetCenter();

        this.centerPosition = fromLL( coord.lng, coord.lat );
        this.mesh.position.x = this.centerPosition[0];
        this.mesh.position.z = this.centerPosition[1];
        this.updateGeometry();
        this.renderData();

        // this.lastUpdateGridTime = Date.now();
        // RESET GEOMETRY
    }

    mapGetCenter(){
        let coord = this._map.unproject( {
            x: window.innerWidth / 2,
            y: window.innerHeight / 2
        });
        return coord;
    }

    mapGetActualParams(){

        const mapCenter = this.mapGetCenter();
        const leftCorner = this._map.unproject({
            x: 5,
            y: window.innerHeight-5
        });

        const latLng1 = leftCorner;
        const latLng2 = {
            lat: mapCenter.lat + ( mapCenter.lat - latLng1.lat ),
            lng: mapCenter.lng + ( mapCenter.lng - latLng1.lng )
        };

        if( this.mapActualParams.center ){
            this.mapActualParamsBefore = this.mapActualParams;
        }

        this.mapActualParams = this.calculatePoints(
            latLng1,
            latLng2
        );

        if( !this.mapActualParamsBefore ){
            this.mapActualParamsBefore = this.mapActualParams;
        }

        return this.mapActualParams;
    }

    calculatePoints ( point1, point2 ){

        const leftTopCorner = this._map.unproject({ x: window.innerWidth-5, y: 5 });
        const xz_ltc = fromLL( leftTopCorner.lng, leftTopCorner.lat );

        const rightBottomCorner = this._map.unproject({ x: 5, y: window.innerHeight-5 });
        const xz_rbc = fromLL( rightBottomCorner.lng, rightBottomCorner.lat );

        const viewWidth = new THREE.Vector2( xz_ltc[0], xz_ltc[1] ).distanceTo( new THREE.Vector2( xz_rbc[0], xz_rbc[0] ) );

        const latMin = Math.min( point1.lat, point2.lat );
        const latMax = Math.max( point1.lat, point2.lat );
        const latRange = latMax - latMin;
        const lngMin = Math.min( point1.lng, point2.lng );
        const lngMax = Math.max( point1.lng, point2.lng );
        const lngRange = lngMax - lngMin;

        let minCoord = fromLL( lngMin, latMin );
        let maxCoord = fromLL( lngMax, latMax );

        return {
            center: this._map.unproject( {
                x: window.innerWidth / 2,
                y: window.innerHeight / 2
            }),
            xz_ltc: xz_ltc,
            xz_rbc: xz_rbc,
            viewWidth: viewWidth,
            latMin: latMin,
            latMax: latMax,
            lngMin: lngMin,
            lngMax: lngMax,
            min: minCoord,
            max: maxCoord,
            size: [
                maxCoord[0] - minCoord[0],
                maxCoord[1] - minCoord[1]
            ],
            latRange: latRange,
            lngRange: lngRange,
            coords: []
        };

    }

}
