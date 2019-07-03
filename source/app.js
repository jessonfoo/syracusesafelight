/* global window */
import React, { Component } from 'react';
import { render } from 'react-dom';
import { StaticMap } from 'react-map-gl';
import DeckGL, {GeoJsonLayer, HexagonLayer, FlyToInterpolator, LinearInterpolator} from 'deck.gl';
import luxLevelJSON from '../assets/light_level.geojson'
import userRating from '../assets/user_raiting.geojson';
import csvJson from '../assets/csvjson';
import actualCrimeJson from '../assets/actual.crime.json';
import blue from '../assets/blue.geojson';
import buildings_geo from '../assets/buildings.geojson';
import gltf from '../scene.gltf';
import jsonHexagon from '../a';
import './ShaderMaterialExtend.js';

import styles from '../styles.css';
import axios from 'axios';
import h337 from '../node_modules/heatmap.js/build/heatmap';
import dismap from '../dismap.jpg';
import "../node_modules/three/src/Three.js";
import GridPlane from './grid.plane';
import ThreeRenderer from './three.renderer';
import diverging from "d3-scale/src/diverging";

// Set your mapbox token here
const MAPBOX_TOKEN = 'pk.eyJ1IjoidG9kb3JvdiIsImEiOiJjam9wcmJ6M3ExdDFwM3dteXJ3cG56dDh0In0.-F17vlU1uDd2ouy6t1VxpQ'; // eslint-disable-line

const mapbox_tokens = [
    'pk.eyJ1IjoidG9kb3JvdiIsImEiOiJjam9wcmJ6M3ExdDFwM3dteXJ3cG56dDh0In0.-F17vlU1uDd2ouy6t1VxpQ',
    'pk.eyJ1IjoidG9kb3JvdiIsImEiOiJjanAycjl6ODQwOWN3M3BubmVtbXFwcjI0In0.Uf-miF9LqVtdUNM2310bBg',
    'pk.eyJ1IjoidG9kb3JvdiIsImEiOiJjanAycjl3YnEwOWU4M3ZwOGQxbXY4eTF6In0.JVQwLcFtXDoDOJ-zFevZSg',
    'pk.eyJ1IjoidG9kb3JvdiIsImEiOiJjanAycjlwa20wOWRxM3ZwZWE5NnFycms0In0.X07FUTDxQS_4QlvrQM4szw',
    'pk.eyJ1IjoidG9kb3JvdiIsImEiOiJjanAycjlrcngwMjF5M2tsZmZpamc1ZHF6In0.mTJl6Zvi1t9mznFfoJKnYA',
    'pk.eyJ1IjoidG9kb3JvdiIsImEiOiJjanAycXZsdzQwMHJjM3NxZmNwc2pucDUyIn0.zzT-a6gnRC9GjlIkD6C2_w'
];

const transitionInterpolator = new LinearInterpolator(['pitch']);

export function getPeriodsConfigTemplate(){
    return [
        {
            index: 0,
            title: '1-15/11/2017',
            min: [0,11,2017],
            max: [15,11,2017],
            places: [],
        },
        {
            index: 1,
            title: '15-30/11/2017',
            min: [15,11,2017],
            max: [31,11,2017],
            places: [],
        },
        {
            index: 2,
            title: '1-15/12/2017',
            min: [0,12,2017],
            max: [15,12,2017],
            places: [],
        },
        {
            index: 3,
            title: '15-30/12/2017',
            min: [15,12,2017],
            max: [31,12,2017],
            places: [],
        },
        {
            index: 4,
            title: '1-15/01/2018',
            min: [0,1,2018],
            max: [15,1,2018],
            places: [],
        },
        {
            index: 5,
            title: '15-30/01/2018',
            min: [15,1,2018],
            max: [31,1,2018],
            places: [],
        },
        {
            index: 6,
            title: '1-15/02/2018',
            min: [0,2,2018],
            max: [15,2,2018],
            places: [],
        },
        {
            index: 7,
            title: '15-30/02/2018',
            min: [15,2,2018],
            max: [31,2,2018],
            places: [],
        },
        {
            index: 8,
            title: '1-15/03/2018',
            min: [0,3,2018],
            max: [15,3,2018],
            places: [],
        },
        {
            index: 9,
            title: '15-30/03/2018',
            min: [15,3,2018],
            max: [31,3,2018],
            places: [],
        },
        {
            index: 10,
            title: '1-15/04/2018',
            min: [0,4,2018],
            max: [15,4,2018],
            places: [],
        },
        {
            index: 11,
            title: '15-30/04/2018',
            min: [15,4,2018],
            max: [31,4,2018],
            places: [],
        },
    ];
}

export const INITIAL_VIEW_STATE = {
    longitude: -76.134,
    latitude: 43.038,
    zoom: 15,
    maxZoom: 18,
    minZoom: 13,
    pitch: 45,
    bearing: 0,
};

export const OTHER_VIEW_STATE = {
    longitude: -76.1330,
    latitude: 43.0393,
    zoom: 14.7,
    maxZoom: 18,
    minZoom: 13,
    pitch: 0,
    bearing: 0,
};

let currentViewState  = INITIAL_VIEW_STATE;
let otherViewState  = OTHER_VIEW_STATE;

const LIGHT_SETTINGS = {
    lightsPosition: [-0.144528, 49.739968, 8000, -3.807751, 54.104682, 8000],
    ambientRatio: 0.4,
    diffuseRatio: 0.6,
    specularRatio: 0.2,
    lightsStrength: [0.8, 0.0, 0.8, 0.0],
    numberOfLights: 2
};
const colorRange = [
    [1, 152, 189],
    [73, 227, 206],
    [216, 254, 181],
    [254, 237, 177],
    [254, 173, 84],
    [209, 55, 78]
];

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

// converts from WGS84 Longitude, Latitude into a unit vector anchor at the top left as needed for GL JS custom layers
var fromLL = function ( lng, lat) {
    // derived from https://gist.github.com/springmeyer/871897
    var extent = 20037508.34;

    var x = lng * extent / 180;
    var y = Math.log(Math.tan((90 + lat) * Math.PI / 360)) / (Math.PI / 180);
    y = y * extent / 180;

    return [(x + extent) / (2 * extent), 1 - ((y + extent) / (2 * extent))];
};



const building_op_visible = 0.6;
const building_op_hidden = 0;

var sourceLux = null;

export class App extends Component {

    constructor(props) {
        super(props);



        Object.assign( THREE.PlaneBufferGeometry.prototype, {
            toGrid: function() {
                let segmentsX = this.parameters.widthSegments || 1;
                let segmentsY = this.parameters.heightSegments || 1;
                let indices = [];
                for (let i = 0; i < segmentsY + 1; i++) {
                    let index11 = 0;
                    let index12 = 0;
                    for (let j = 0; j < segmentsX; j++) {
                        index11 = (segmentsX + 1) * i + j;
                        index12 = index11 + 1;
                        let index21 = index11;
                        let index22 = index11 + (segmentsX + 1);
                        indices.push(index11, index12);
                        if (index22 < ((segmentsX + 1) * (segmentsY + 1) - 1)) {
                            indices.push(index21, index22);
                        }
                    }
                    if ((index12 + segmentsX + 1) <= ((segmentsX + 1) * (segmentsY + 1) - 1)) {
                        indices.push(index12, index12 + segmentsX + 1);
                    }
                }
                this.setIndex(indices);
                return this;
            }
        });

        this.slidersConfig = false;
        this.slidersAsMap = {};
        this.showPeriods = [true, false, true, false, true, false, true, false, true, false, true, false];

        this.allCrimeData  = actualCrimeJson;
        this.crimeLevelDate  = "";

        this.lampMode = false;
        this.buildings = true;

        this.lampsNames = [];
        this.lampOn = true;

        this.totalSliderDate = 0;
        this.totalSliderPlayer = false;
        this.totalSliderPlayerActive = false;
        this.totalSliderPlayerDelay = 1000;

        this.userRatingDate = 0;
        this.blueFilter = 0;

        this.actual_hexagon_arr = [];
        this.hexagon_arr = [];
        this.crimeLevelDate = 0;
        this.crimeLevelData = [];

        this.crimeOpacity = 0;
        this.building_opacity = building_op_visible;


        this.luxIsVisible = true;
        this.luxLess5IsVisible = true;
        this.lux5to215 = true;
        this.luxLevelJSON = false;
        axios.get( luxLevelJSON ).then( ( result ) => {
            let arrForTest = result.data.features;
            let tempData = result.data;
                tempData.features = [];
            let asMap = {};
            const sortPoint = function( point ){
                point.properties.Longitude = parseFloat( (point.properties.Longitude).toFixed(6 ) );
                point.properties.Latitude = parseFloat( (point.properties.Latitude).toFixed(6 ) );
                point.name = point.properties.Longitude + "|" + point.properties.Latitude;
                if( !(point.name in asMap) ){ asMap[ point.name ] = []; }
                if( asMap[ point.name ].indexOf( point.properties.Lux2_459_ ) == -1 ){
                    asMap[ point.name ].push( point.properties.Lux2_459_ );
                    tempData.features.push( point );
                }
            };
            for( let i = 0; i < arrForTest.length; i++ ){ sortPoint( arrForTest[i] ); }
            this.luxLevelJSON = tempData;
            //console.log(this.luxLevelJSON);
        }, ( reason ) =>{

        } );


        this.rateIsVisible = true;
        this.rateLessThan4 = true;
        this.rate4to5 = true;
        this.rateLevelJSON = false;
        this.lightedZones = false;

        this.colorGroups = {

            invisible: {
                front: [ 0, 0, 0, 0 ],
                back: [ 0, 0, 0, 0 ]
            },

            lux_lessThan5: {
                front: [ 52, 124, 191, 255 ],
                back: [ 52, 124, 191, 55 ]
                // front: [ 0, 255, 0, 255 ],
                // back: [ 0, 255, 0, 55 ]
            },
            lux_lessThan20: {
                front: [ 66, 147, 165, 255 ],
                back: [ 66, 147, 165, 55 ]
            },
            lux_lessThan215: {
                front: [ 91, 189, 179, 255 ],
                back: [ 91, 189, 179, 55 ]
            },
            lux_moreThan215: {
                front: [ 239, 226, 96, 255 ],
                back: [ 239, 226, 96, 55 ]
            },


            rate_lessThan1: {
                front: [ 223, 70, 156, 255 ],
                back: [ 223, 70, 156, 55 ]
            },
            rate_lessThan2: {
                front: [ 212, 95, 163, 255 ],
                back: [ 212, 95, 163, 55 ]
            },
            rate_lessThan3: {
                front: [ 233, 186, 251, 255 ],
                back: [ 233, 186, 251, 55 ]
            },
            rate_lessThan4: {
                front: [ 180, 98, 222, 255 ],
                back: [ 180, 98, 222, 55 ]
            },
            rate_moreThan4: {
                front: [ 114, 59, 196, 255 ],
                back: [ 114, 59, 196, 55 ]
            },

        };

        this.state = {
            time: 0,
            viewState: INITIAL_VIEW_STATE
        };
        this._onLoad = this._onLoad.bind(this);
        this._onViewStateChange = this._onViewStateChange.bind(this);

        this.togglePerspective = this.togglePerspective.bind(this);
        this.set2D = this.set2D.bind(this);
        this.set3D = this.set3D.bind(this);

        this.is2D = false;

        this.mouse_coord = {
            x: 0,
            y: 0
        };


        this.renderer = false;
        this.map = false;
        this.geometry = false;
        this.material = false;
        this.plane = false;
        this.scene = false;

        this.lastCoords = false;

        this.plane = false;
        this.LampThree = false;

        this.periods = {};

        this.lampModel = false;
        this.lightGeometry = false;

        if( !this.lightGeometry ){

            this.lightGeometry = new THREE.Geometry();

            let ring1 = new THREE.RingGeometry( 0.01, 2.2, 32 );
            ring1.rotateX( -Math.PI/2 );
            this.lightGeometry.merge( ring1 );

            let ring2 = new THREE.RingGeometry( 0.01, 3.5, 32 );
            ring2.rotateX( -Math.PI/2 );
            ring2.translate( 0, 0.1, 0.1 );
            this.lightGeometry.merge( ring2 );

            let ring3 = new THREE.RingGeometry( 0.01, 14, 32 );
            ring3.rotateX( -Math.PI/2 );
            ring3.translate( 0, 0.2, 0.1 );
            this.lightGeometry.merge( ring3 );

        }

        this.lightMaterial = new THREE.MeshBasicMaterial({
            color: "#ffffff",
            transparent: true,
            opacity: 0.2
        });

        var loader = new THREE.GLTFLoader();
        loader.load(gltf, ( (gltf) => {

            let exampleModel = gltf.scene.children[0].children[0];
            exampleModel.geometry.rotateX( exampleModel.rotation.x );


            this.lampModel = () => {
                // let geometry = new THREE.BufferGeometry().copy( exampleModel.geometry );
                // let material = new THREE.MeshStandardMaterial().copy( exampleModel.material );
                let nextLampModel = new THREE.Mesh( exampleModel.geometry, exampleModel.material );
                let nextLightModel = new THREE.Mesh( this.lightGeometry, this.lightMaterial );
                nextLightModel.position.set( -1, 0, -1 );
                nextLampModel.add( nextLightModel );

                nextLampModel.scale.set( 2.5,  2.5, 2.5 );

                return nextLampModel;
            };

        }).bind(this));

        this._onMapLoad = this._onMapLoad.bind(this);
        this.getColorByRate = this.getColorByRate.bind(this);
        this.addLamp = this.addLamp.bind(this);
        this.setTooltip = this.setTooltip.bind(this);

        // this.getColorByLuxFront = this.getColorByLuxFront.bind( this );
        // this.getColorByLuxBack = this.getColorByLuxBack.bind( this );

        //this.crimeLevelCreate();
        this.createHexJson();

        setTimeout(() => {

            document.getElementById('deckgl-overlay').addEventListener('click', (e) => {
                if (this.lampMode) {
                    this.addLamp( e.x, e.y );
                    this.lampMode = false;
                    document.getElementById('lampMode').classList.remove('active');
                }
            });

            document.getElementById('deckgl-overlay').addEventListener('mousemove', (e) => {
                this.mouse_coord.x = e.x;
                this.mouse_coord.y = e.y;
            });

            // this.crimeLevelCreate();
        }, 2000);

    }

    _onLoad()
    {
        console.log("Loaded");
        this.setState({
          //viewState: INITIAL_VIEW_STATE

          viewState: {
            ...this.state.viewState,
            //bearing,
            //transitionDuration: 1000,
            //transitionInterpolator: new FlyToInterpolator(),
            //onTransitionEnd: this._rotateCamera,
            //transitionInterpolator

          }
        });
    }

    _rotateCamera()
    {
        console.log("What");
    }

    _onViewStateChange({viewState})
    {
        console.log("view state changed");
        console.log(viewState);
        this.setState({viewState});

        //currentViewState = Object.assign({}, viewState);
    }

    togglePerspective(e)
    {
        console.log("togglePerspective");
        if (this.is2D)
        {
            console.log("changing from 2D");
            this.setState({
                viewState: currentViewState,
            });
        }
        else
        {
            console.log("changing from 3D");
            this.setState({
                viewState: otherViewState,
            });
        }

        this.is2D = !this.is2D;
    }

    set2D()
    {
        console.log("changing to 2D");
        this.setState({
            viewState: otherViewState,
        });

        this.is2D = true;
    }

    set3D()
    {
        console.log("changing to 3D");
        this.setState({
            viewState: currentViewState,
        });

        this.is2D = false;
    }

    onEnd()
    {
        console.log("end transit");
    }


    luxLevelsFilter( levelAs255 ){
        if( levelAs255 === -1 ){
            return this.colorGroups.invisible;
        }
        if( this.luxIsVisible ){
            if ( this.luxLess5IsVisible && levelAs255 < 5 ){
                return this.colorGroups.lux_lessThan5;
            } else if( levelAs255 > 5 ){
                if( this.lux5to215 && levelAs255 < 215 ) {
                    if ( levelAs255 < 20 ) {
                        return this.colorGroups.lux_lessThan20;
                    } else {
                        return this.colorGroups.lux_lessThan215;
                    }
                } else if ( levelAs255 > 215 ) {
                    return this.colorGroups.lux_moreThan215;
                } else {
                    return this.colorGroups.invisible;
                }
            } else {
                return this.colorGroups.invisible;
            }
        } else {
            return this.colorGroups.invisible;
        }
    }

    rateLevelsFilter( rate ){

        if( rate === -1 ){
            return this.colorGroups.invisible;
        }

        if( this.rateIsVisible ){
            if( this.rateLessThan4 && rate < 4 ){
                if ( rate <= 1) {
                    return this.colorGroups.rate_lessThan1;
                } else if ( rate <= 2) {
                    return this.colorGroups.rate_lessThan2;
                } else if ( rate <= 3) {
                    return this.colorGroups.rate_lessThan3;
                } else {
                    return this.colorGroups.rate_lessThan4;
                }
            } else if( this.rate4to5 && rate >= 4 ){
                return this.colorGroups.rate_moreThan4;
            } else {
                return this.colorGroups.invisible;
            }
        } else {
            return this.colorGroups.invisible;
        }
    }

    mapGetCenter(){
        let coord = this._map.unproject( {
            x: window.innerWidth / 2,
            y: window.innerHeight / 2
        });
        return coord;
    }
// This is the likely culprit
    presetFeaturesToPeriods( _periodsConfig, _timestamp, _feature  ){
        let timestamp = _timestamp;
        let nextDate = new Date( timestamp );
        //console.log(nextDate)
        nextDate = new Date( nextDate.valueOf() + nextDate.getTimezoneOffset() * 60000 );
        let _year = nextDate.getFullYear();
        let _month = nextDate.getMonth()+1;
        let _day = nextDate.getDate();
        let date = parseInt( timestamp.split(' ')[1] );
        for( let i = 0; i < _periodsConfig.length; i++ ){
            let moreThanMin = _day >= _periodsConfig[i].min[0] && _month >= _periodsConfig[i].min[1] && _year >= _periodsConfig[i].min[2];
            let lessThanMax = _day <= _periodsConfig[i].max[0] && _month <= _periodsConfig[i].max[1] && _year <= _periodsConfig[i].max[2];
            if( moreThanMin && lessThanMax ){
                _feature.period = _periodsConfig[i].index;
                _periodsConfig[i].places.push( _feature );
            }
        }
    }

    createSliders() {}

    createHexJson() {

        let json = [];

        for (let i = 0; i < jsonHexagon.length; i++) {
            json.push( jsonHexagon[i].geometry.coordinates );
        }

        this.hexagon_arr = json;

    }

    componentDidMount() {
        this._animate();
    }

    componentWillUnmount() {
        if (this._animationFrame) {
            window.cancelAnimationFrame(this._animationFrame);
        }
    }

    crimeLevelCreate() {

        let temp_data = [];
        let token_index = 0;
        let last_index = csvJson.length;

        for (let z = 0; z < last_index; z++) {

            if (z % 500 === 0 && z !== 0) {
                token_index++;
            }

            let adress = [];
            let city = csvJson[z].CITY;

            for (let i = 0; i < csvJson[z].ADDRESS.split(' ').length; i++) {
                if (csvJson[z].ADDRESS.split(' ')[i] !== '' && csvJson[z].ADDRESS.split(' ')[i] !== ' ') {
                    adress.push(csvJson[z].ADDRESS.split(' ')[i]);
                }
            }

            let request = '';
            for (let i = 0; i < adress.length; i++) {
                request += adress[i] + '%20';
            }
            request += city + '.json';

            axios.get('https://api.mapbox.com/geocoding/v5/mapbox.places/' + request + '?access_token=' + mapbox_tokens[token_index] + '&cachebuster=1543433283183&autocomplete=false&country=us')
                .then((response) => {
                    temp_data.push({
                        type: "Feature",
                        original: csvJson[z],
                        geometry: {
                            type: "Point",
                            coordinates: [response.data.features[0].center[0], response.data.features[0].center[1]],
                            id: z
                        }
                    });

                    if (z === last_index - 1) {
                        this.crimeLevelData = temp_data;
                    }

                })

        }


    }

    _animate() {
        const {
            loopLength = 1800, // unit corresponds to the timestamp in source data
            animationSpeed = 30 // unit time per second
        } = this.props;
        const timestamp = Date.now() / 1000;
        const loopTime = loopLength / animationSpeed;

        this.setState({
            time: ((timestamp % loopTime) / loopTime) * loopLength
        });
        this._animationFrame = window.requestAnimationFrame(this._animate.bind(this));
    }

    hideLamps() {

        for (let i = 0; i < this.lampsNames.length; i++) {
            if (this.lampOn) {
                this._map.setLayoutProperty(this.lampsNames[i], 'visibility', 'none');
            } else {
                this._map.setLayoutProperty(this.lampsNames[i], 'visibility', 'visible');
            }
        }

        this.lampOn = !this.lampOn;

    }



    setTooltip(info) {
        console.log("!", info);
        console.log(this.slidersAsMap[ "slider-userrate" ].activePeriod.places);
        let tooltip = document.getElementById('tooltip');
        let info_block = document.getElementById('info-block');
        let timestamp = document.getElementById('timestamp');
        let comment = document.getElementById('comment');

        if (info) {
            if ( info.properties.rate ) {
                let rateColor = this.rateLevelsFilter( info.properties.rate );
                if( rateColor.front[3] === 0 ){
                    tooltip.style.display = 'none';
                    info_block.style.display = 'none';
                } else {
                    tooltip.innerHTML = 'Rating: ' + info.properties.rate;
                    tooltip.style.display = 'block';
                    tooltip.style.top = this.mouse_coord.y + 0 + 'px';
                    tooltip.style.left = this.mouse_coord.x + 0 + 'px';
                    info_block.style.display = 'block';
                    if ( info.properties.comments ) {
                        comment.innerHTML = info.properties.comments;
                    } else {
                        comment.innerHTML = 'no comments';
                    }
                    timestamp.innerHTML = info.properties.timestamp;
                }
            }
        } else {
            tooltip.style.display = 'none';
            info_block.style.display = 'none';
        }

    }

    setTooltipLux(info) {
        console.log("!", info);
        let tooltip = document.getElementById('tooltip');
        let info_block = document.getElementById('info-block');
        let timestamp = document.getElementById('timestamp');
        let comment = document.getElementById('comment');

        if (info) {
            if ( info.properties.Lux2_459_ !== undefined ) {
                /*
                let rateColor = this.rateLevelsFilter( info.properties.rate );
                if( rateColor.front[3] === 0 ){
                    tooltip.style.display = 'none';
                    info_block.style.display = 'none';
                } else {
                    */
                    tooltip.innerHTML = 'Lux: ' + info.properties.Lux2_459_.toFixed(2);
                    tooltip.style.display = 'block';
                    tooltip.style.top = this.mouse_coord.y + 0 + 'px';
                    tooltip.style.left = this.mouse_coord.x + 0 + 'px';

                    /*
                    info_block.style.display = 'block';
                    if ( info.properties.comments ) {
                        comment.innerHTML = info.properties.comments;
                    } else {
                        comment.innerHTML = 'no comments';
                    }
                    timestamp.innerHTML = info.properties.timestamp;

                }
                */
            }
        } else {
            tooltip.style.display = 'none';
            info_block.style.display = 'none';
        }

    }

    addListenerToController( listenerName, callback ){
        let controller = this._deck.viewManager.controllers["default-view"];
        if( controller && listenerName in controller ){
            let tmpListener = controller[ listenerName ];
            controller[ listenerName ] = function(){
                tmpListener.apply( this, arguments );
                callback( arguments );
            }
        }
    }

    addListenerToDeck( listenerName, callback ){
        let controller = this._deck;
        if( controller && listenerName in controller ){
            let tmpListener = controller[ listenerName ];
            controller[ listenerName ] = function(){
                tmpListener.apply( this, arguments );
                callback( arguments );
            }
        }
    }

    _onMapLoad() {

        const map = this._map;
        const deck = this._deck;
        this.getController = () => {
            return this._deck.viewManager.controllers["default-view"];
        };



        map.addSource('light', {
            "type": "geojson",
            "data": sourceLux
        });

            //console.log(JSON.stringify(sourceLux));
       map.addLayer({
            "id": "light-heat",
            "type": "heatmap",
            "source": "light",
            'layout': {
                "visibility": "none",
            },


            "paint": {
                "heatmap-opacity": .6,
                // Increase the heatmap weight based on frequency and property magnitude
                "heatmap-weight": [
        'interpolate', ['linear'], ['zoom'],
        13, ['/' ,['number', ["get", "Lux2_459_"], 0],80/2],
        15, ['/' ,['number', ["get", "Lux2_459_"], 0],30/1],
        18, ['/' ,['number', ["get", "Lux2_459_"], 0],1/1],
      ],

                "heatmap-color": [
                    "interpolate",
                    ["linear"],
                    ["heatmap-density"],
                    0, "rgba(0,0,255,0)",
                    0.2, "rgba(255,255,255,0.2)",
                    0.4, "rgba(255,255,255,0.4)",
                    0.6, "rgba(255,255,255,0.6)",
                    0.8, "rgba(255,255,255,0.8)",
                    1, "rgba(255,255,255,1)"
                ],


            }
        }, 'waterway-label');


    }

    _onClick(info) {
    }

    addLamp( x, y ) {

        const self = this;
        const map = this._map;

        let coord = map.unproject({x: x, y: y});
        let translate = fromLL(coord.lng, coord.lat);
        let transform = {
            translateX: translate[0],
            translateY: translate[1],
            translateZ: 0,
            rotateX: Math.PI / 2,
            rotateY: 0,
            rotateZ: 0,
            scale: 5.41843220338983e-8
        };

        let id = Math.random() * 10;

        this.lampsNames.push( id );

        let nextLampLayer = false;

        if( !self.LampThree ){

            nextLampLayer = map.addLayer({
                id: id,
                type: 'custom',
                // onAdd: function (map, gl) {
                onAdd: function ( ___map, gl) {

                    self.LampThree = new ThreeRenderer( ___map, gl );

                    self.LampThree.startConfig = {
                        coord: coord,
                        translate: translate
                    };

                    self.LampThree.getLayer = () => {
                        return nextLampLayer;
                    };

                    self.LampThree.scene.add( self.lampModel() );

                },
                render: function ( gl, matrix ) {

                    var rotationX = new THREE.Matrix4().makeRotationAxis(new THREE.Vector3(1, 0, 0), transform.rotateX);
                    var rotationY = new THREE.Matrix4().makeRotationAxis(new THREE.Vector3(0, 1, 0), transform.rotateY);
                    var rotationZ = new THREE.Matrix4().makeRotationAxis(new THREE.Vector3(0, 0, 1), transform.rotateZ);

                    var m = new THREE.Matrix4().fromArray(matrix);
                    var l = new THREE.Matrix4().makeTranslation(transform.translateX, transform.translateY, transform.translateZ)
                        .scale(new THREE.Vector3(transform.scale, -transform.scale, transform.scale))
                        .multiply(rotationX)
                        .multiply(rotationY)
                        .multiply(rotationZ);

                    self.LampThree.camera.projectionMatrix.elements = matrix;
                    self.LampThree.camera.projectionMatrix = m.multiply(l);
                    self.LampThree.renderer.state.reset();
                    self.LampThree.renderer.render( self.LampThree.scene, self.LampThree.camera);

                    self._map.triggerRepaint();
                },
            }, 'waterway-label');



        } else {

            let nextMesh = self.lampModel();

            let nextMeshOffset = {
                x: self.LampThree.startConfig.translate[0] - translate[0],
                z: self.LampThree.startConfig.translate[1] - translate[1],
            };

            let mapOffsetFactor = 18450000;

            nextMesh.position.setX(  -nextMeshOffset.x * mapOffsetFactor );
            nextMesh.position.setZ( -nextMeshOffset.z * mapOffsetFactor );


            // TRY TO ADD LAMP TO READY SCENE
            self.LampThree.scene.add( nextMesh );


        }


    }

    getColorByLux( Lux2_459_ ) {
        return this.luxLevelsFilter( Lux2_459_ );
    }

    getColorByRate( sliderName, d ) {
        let activePeriod = this.slidersAsMap[ sliderName ].activePeriod;
        let nextPeriodPlaces = activePeriod.places;
        let checked = false;
        if ( nextPeriodPlaces.length > 0 ) {
            for (let i = 0; i < nextPeriodPlaces.length; i++) {
                if ( d.id === nextPeriodPlaces[i].id ) {
                    checked = true;
                }
            }
        }

        checked =true;
        let nextRate = d.properties.rate;
        if ( !checked ) {
            nextRate = -1;
        }
        return this.rateLevelsFilter( nextRate );
    }

    showLux( type ) {
        let availableTypes = {
            luxIsVisible: 0,
            luxLess5IsVisible: 1,
            lux5to215: 2,
        };
        if( type in availableTypes ){ this[ type ] = !this[ type ]; }
    }

    switchRate( type ) {
        let availableTypes = {
            rateIsVisible: 0,
            rateLessThan4: 1,
            rate4to5: 2
        };
        if( type in availableTypes ){ this[ type ] = !this[ type ]; }
    }

    showCrime() {
        if (this.crimeOpacity === 0) {
            this.createHexJson();
            this.crimeOpacity = 0.35;
            this._map.triggerRepaint();
        } else {
            this.crimeOpacity = 0;
        }
        this.updatePlane();
        this.plane.renderData();
    }

    createPlane( map, gl ){
        this.map = map;
        this.threeRenderer = new ThreeRenderer( map, gl );

        this.plane = new GridPlane(
            this.heatmapCanvas,
            this.map,
            ()=>{ return this._deck;  },
            ()=>{  return this.threeRenderer; }
        );

        this.threeRenderer.scene.add( this.plane.mesh );
        setTimeout( () => {
            this.slidersAsMap[ "slider-crimelevel" ]
                .slider.onSliderInput({
                    target: {
                        value: 0
                    }
                });
        }, 150 );
        window.plane = this.plane;
        window.app = this;

    }

    updatePlane() {

        const _map = this._map;

        let coord = this.mapGetCenter();
        let translate = fromLL( coord.lng, coord.lat );

        let transform = {
            translateX: translate[0],
            translateY: translate[1],
            translateZ: 0,
            rotateX: Math.PI / 2,
            rotateY: 0,
            rotateZ: 0,
            scale: 10.41843220338983e-8
        };

        if( !this.plane ) {

            _map.addLayer({

                id: 'grid',
                type: 'custom',

                updateTriggers: {
                    getFillColor: this.hexagon_arr,
                    crimeOpacity: this.crimeOpacity
                },

                onAdd: ( map, gl ) => {
                    this.createPlane( map, gl );
                },

                render: ( gl, matrix ) => {
                    if ( this.crimeOpacity != 0 || this.plane.planeNeedsUpdate ) {
                        this.lastCoords = coord;
                        this.threeRenderer.updateCameraByTransformData( transform, matrix );
                        this.updatePlane();
                        this.plane.updatePlane( gl, matrix );
                        this.map.triggerRepaint();
                    }
                },

            }, 'waterway-label');

            _map.on( "change", ( arg1, arg2, arg3 ) => {

            } );

        }


    }

    getPlaces()
    {
        //
        //console.log("periods", this.periods);
        //throw new Error("YAY");
        let places = [];
        let periods = this.periods[ "slider-userrate" ];

        //for (let periodIndex in period)
        for (let periodIndex = 0; periodIndex < periods.length; periodIndex++)
        {
            let showPeriod = this.showPeriods[periodIndex];
            if (showPeriod)
            {
                let period = periods[periodIndex];

                for (let placeIndex = 0; placeIndex < period.places.length; placeIndex++)
                {
                    let place = period.places[placeIndex];
                    places.push(place);
                }

            }
        }
        //console.log(places.length)
        return places;
    }

    generateLayers(){


        const self = this;

        const {
            viewState,
            baseMap = true
        } = this.props;

        let _luxLevelJSON = this.luxLevelJSON || luxLevelJSON.data;

        sourceLux = _luxLevelJSON;

        let _userRating = userRating;
        if( this.slidersAsMap[ "slider-userrate" ] ){
            _userRating = {
                "type": "FeatureCollection",
                    "crs": {
                    "type": "name",
                        "properties": {
                        "name": "EPSG:4326"
                    }
                },
                //"features": this.slidersAsMap[ "slider-userrate" ].activePeriod.places
                "features": this.getPlaces()//[]//this.slidersAsMap[ "slider-userrate" ].activePeriod.places

                // "features": (function()
                // {
                    // let results = [];
                    // for (let periodKey in _App.periods[ this.key ])
                    // {
                        // let period = _App.periods[ this.key ][periodKey];
                        // for (let place in period.places)
                        // {
                            // results.push(place);
                        // }
                    // }
                    // return results;
                // })()

            };
        }

        const layers = [

            new GeoJsonLayer({
                id: 'luxLevel-layer',
                data: _luxLevelJSON,
                pickable: true,
                stroked: false,
                filled: true,
                extruded: true,
                getFillColor: ( arg ) => {
                    return self.getColorByLux( arg.properties.Lux2_459_ ).front;
                },
                updateTriggers: {
                    getFillColor: [
                        this.luxIsVisible,
                        this.luxLess5IsVisible,
                        this.lux5to215
                    ],
                },
                //onHover: (arg) => {},
                onHover: ({object}) => this.setTooltipLux(object),
                getRadius: 3,
                getLineWidth: 1,
                getElevation: 30,
            }),

            new GeoJsonLayer({
                id: 'userRaiting-layer',
                data: _userRating,
                pickable: true,
                stroked: false,
                filled: true,
                extruded: true,
                getFillColor: (arg) => {
                    return self.getColorByRate( "slider-userrate", arg ).front;
                },
                updateTriggers: {
                    getFillColor: [
                        this.userRatingDate,
                        this.rateIsVisible,
                        this.rate4to5,
                        this.rateLessThan4
                    ],
                },
                getRadius: 3,
                getLineWidth: 1,
                getElevation: 30,
                onHover: ({object}) => this.setTooltip(object)
            }),

            new GeoJsonLayer({
                id: 'blue-layer',
                data: blue,
                pickable: true,
                stroked: false,
                filled: true,
                extruded: true,
                getFillColor: [255, 255, 255, this.blueFilter],
                updateTriggers: {
                    getFillColor: this.blueFilter,
                },
                getRadius: 4,
                getLineWidth: 1,
                getElevation: 30,
            }),

            // HEATMAP
            new HexagonLayer({
                id: 'heatmap',
                colorRange,
                coverage: 0.01,
                data: this.hexagon_arr,
                updateTriggers: {
                    getFillColor: this.hexagon_arr,
                    crimeOpacity: this.crimeOpacity
                },
                elevationRange: [0, 150],
                elevationScale: 10,
                extruded: true,
                getPosition: d => d,
                lightSettings: LIGHT_SETTINGS,
                opacity: this.crimeOpacity,
                radius: 30,
                upperPercentile: 100,
            }),



            // TEST OVERDRAW
            new GeoJsonLayer({
                id: 'luxLevel-layer2',
                data: _luxLevelJSON,
                pickable: true,
                stroked: false,
                filled: true,
                extruded: true,
                getFillColor: (arg) => {
                    return self.getColorByLux( arg.properties.Lux2_459_ ).back;
                },
                //onHover: ( arg ) => {},
                onHover: ({object}) => this.setTooltipLux(object),
                updateTriggers: {
                    getFillColor: [
                        this.luxIsVisible,
                        this.luxLess5IsVisible,
                        this.lux5to215
                    ],
                },
                getRadius: 5,
                getLineWidth: 7,
                getElevation: 30,
            }),

            new GeoJsonLayer({
                id: 'userRaiting-layer2',
                data: _userRating,
                pickable: true,
                stroked: false,
                filled: true,
                extruded: true,
                getFillColor: (arg) => {
                    return self.getColorByRate( "slider-userrate", arg ).back;
                },
                updateTriggers: {
                    getFillColor: [
                        this.userRatingDate,
                        this.rateIsVisible,
                        this.rate4to5,
                        this.rateLessThan4
                    ],
                },
                getRadius: 5,
                getLineWidth: 1,
                getElevation: 30,
                onHover: ({object}) => this.setTooltip(object)
            }),

            new GeoJsonLayer({
                id: 'buildings_geo',
                data: buildings_geo,
                extruded: true,
                getFillColor: [255, 255, 255, 255],
                getRadius: 4,
                getLineWidth: 1,
                getElevation: f => f.properties.MEAN,
                opacity: this.building_opacity,
            }),
        ];

        return layers;

    }

    HTML_getLuxButtons(){
        return (
            <div>
                <span className='title'>Lux Level</span>
                <button onClick={() => {
                    this.showLux( 'luxLess5IsVisible' );
                }}>{'Hide/Show < 5'}</button>
                <button onClick={() => {
                    this.showLux( 'lux5to215' );
                }}>{'Hide/Show 5 - 215'}</button>
                <button className='allbutton' onClick={() => {
                    this.showLux( 'luxIsVisible' );
                }}>Hide/Show All</button>
                <button onClick={() => {

                    if (this.lightedZones){
                        this._map.setLayoutProperty('light-heat', 'visibility', 'none');
                    } else {
                        this._map.setLayoutProperty('light-heat', 'visibility', 'visible');
                    };
                    this.lightedZones = !this.lightedZones;

                }}>Lighted Zones</button>
            </div>
        );
    }

    HTML_getRateButtons(){
        return (
            <div>
                <span className='title'>User Rating</span>
                <button onClick={() => {
                    this.switchRate( 'rateLessThan4' );
                }}>{'Hide/Show < 4'}</button>
                <button onClick={() => {
                    this.switchRate( 'rate4to5' );
                }}>{'Hide/Show 4 and 5'}</button>
                <button className='allbutton' onClick={() => {
                    this.switchRate('rateIsVisible')
                }}>Hide/Show All</button>

            </div>
        );
    }

    HTML_getLampButtons(){

        let lampModeStatus = this.lampMode ? "active" : "inactive";

        return (
            <div>
                <span className='title'>Proposed Intervention</span>
                <button id='lampMode' className={`lampMode-${lampModeStatus}`} onClick={() => {
                    this.lampMode = !this.lampMode;
                }}>
                    Lamp Add
                </button>
                <button className='allbutton' onClick={() => {
                    this.hideLamps();
                }}>
                    Hide/Show Lamps
                </button>
            </div>
        );
    }

    HTML_getUncategorizedButtons(){
        return (
            <div>

                <span className='title'>Crime Levels</span>
                <button  className='allbutton' onClick={() => {
                    this.showCrime();
                }}>Hide/Show Crime Level
                </button>

                <span className='title'>Physical Attributes</span>
                <button  className='allbutton' onClick={() => {
                    if (this.buildings){
                        this._map.setLayoutProperty('3d-buildings', 'visibility', 'none');
                        this.building_opacity = building_op_hidden;
                    } else {
                        this._map.setLayoutProperty('3d-buildings', 'visibility', 'visible');
                        this.building_opacity = building_op_visible;
                    };
                    this.buildings = !this.buildings;
                }}>
                    Hide/Show Buildings
                </button>
                <button  className='allbutton' onClick={() => {
                    if (this.blueFilter === 0) {
                        this.blueFilter = 255;
                    } else {
                        this.blueFilter = 0;
                    }
                }}>
                    Hide/Show Blue Lamps
                </button>

            </div>
        );
    }

    HTML_getViewModeButtons() {
        const active = (active) => (active) ? "currentMode" : "";
        const class2D = "viewModeButton mode2D " + active(this.is2D);
        const class3D = "viewModeButton mode3D " + active(!this.is2D);
        return (
            <React.Fragment>
                <button className={class2D} onClick={this.set2D}>
                    <div className="img"></div>
                    2D
                </button>
                <button className={class3D} onClick={this.set3D}>
                    <div className="img"></div>
                    3D
                </button>
            </React.Fragment>
        );
    }

    HTML_getButtonsTable(){
        return (
            <React.Fragment>
                <div className="luxLevelFilter">
                    { this.HTML_getLuxButtons() }
                    { this.HTML_getRateButtons() }
                    { this.HTML_getUncategorizedButtons() }
                    { this.HTML_getLampButtons() }
                </div>
                { this.HTML_getViewModeButtons() }
            </React.Fragment>
        );
    }

    HTML_getInfoBlock(){
        return (
            <div id='info-block' className='info-block'>
                <span id='key'>Time: </span>
                <span className='value' id="timestamp">12/12/12</span>
                <span id='key'>Comment: </span>
                <span className='value' id="comment">here is dangerous</span>
            </div>
        );
    }


    HTML_getMapTitleBlock(){
        return (
            <div className="map-overlay title-features"><h2>Syracuse University Campus Lighting and Safety Map</h2>
                <div id="pd">
                    <p>Data collected 2017-2018</p>
                </div>
                <p>
                Syracuse University School of Architecture and School of Information Studies
                <br/>
                <br/>
                Grant Funding&#8203; by Syracuse University Campus as Lab for Sustainability
                <br/>
                <br/>
                <span style={{ color: "#f8f8f8" }} >_____________________________________</span>
                <br/>
                </p>
                <p>
                    <a href="About.html" target="_blank">
                        <span style={{ color: "#f8f8f8" }} > About the Project </span>
                    </a>
                </p>
            </div>
        );
    }

    getSliderConfig(){
        return this.slidersConfig;
    }

    initSliderConfig(){

        let _App = this;

        function tabconfigSwitcher(){
            let _sliderConfig = _App.getSliderConfig() || [];
            for( let i = 0; i < _sliderConfig.length; i++ ){
                if( _sliderConfig[i] === this ){
                    _sliderConfig[i].isActive = true;
                } else {
                    _sliderConfig[i].isActive = false;
                }
            }
        }

        function HTML_tab( obj, i ){
            let tabName = this.key;
            let title = this.title;
            let tabOnClick = this.tabOnClick;
            let iterator = i;
            let isActive = this.isActive ? "active" : "inactive";
            return (
                <div className={`slider-tab ${ isActive }`} data-tabtarget={ tabName } onClick={ tabOnClick.bind( this ) } key={iterator}>
                    { title }
                </div>
            );
        }

        function HTML_Slider( obj, i ){
            let iterator = i;
            let tabName = this.key;
            let title = this.title;
            let activeTitle = this.activeTitle;
            //console.log("who?", this)
            let currentValue = this.currentValue;
            let showPeriods = _App.showPeriods;
            let isActive = this.isActive ? "active" : "hidden";

            let sliderMinVal = this.sliderMinVal;
            let sliderMaxVal = this.sliderMaxVal;
            let sliderCurrentVal = this.sliderCurrentVal;
            let onSliderInput = ( event ) => {
                this.onSliderInput( event );
            };
            let text_hide = "Pause";
            let text_show = "Play";

            let onCheck = function(e)
            {
                showPeriods[e.target.name] = !showPeriods[e.target.name];
            }

            let checkAll = (event) => {
              console.log(event.target.innerHTML);
                if(document.getElementById(tabName).style.visibility=='hidden' || !document.getElementById(tabName).style.visibility){
                    document.getElementById(tabName).style.visibility='visible';
                    event.target.innerHTML = text_hide;
                    this.onSliderInput({
                        target: {
                            value: 0
                        }
                    });

                } else{
                    document.getElementById(tabName).style.visibility='hidden';
                    event.target.innerHTML = text_show;
                    this.onSliderInput({
                        target: {
                            value: 12
                        }
                    });
                }



            }
            return (
                <div className={`slider-block ${ tabName } ${ isActive }`} key={iterator}>
                    <span className='slider-title-main'>{ title }</span>
                    <div id={ tabName }>
                        <span className="slider-title" >{ activeTitle }</span>
                        <div className="slider-container">
                            <span className="slider-min" id={`${ tabName }-min`}>{ sliderMinVal }</span>
                            <span className="slider-max" id={`${ tabName }-max`}>{ sliderMaxVal }</span>
                            <input className="slider-range" onChange={ onSliderInput } onInput={ onSliderInput } id={`${ tabName }-input`} type="range" name="volume" min="0" max="11" value={`${ currentValue }`}/>
                            {/*<button onClick={_App.togglePerspective}>{ _App.is2D ? 'View in 3D' : 'View in 2D'}</button>*/}
                        </div>

                    </div>
                </div>
            );
        }

        // TODO EPIC SLIDERS CONFIG
        if( !this.slidersConfig ){

            this.slidersConfig = this.slidersConfig ? this.slidersConfig : [

                {
                    key: "slider-total",
                    isActive: true,
                    title: "User Rating and Crime level",
                    activeTitle: "1-15/11/2017",
                    currentValue: "0",
                    tabOnClick: tabconfigSwitcher,
                    HTML_tab: HTML_tab,
                    sliderMinVal: "Nov 2017",
                    sliderMaxVal: "April 2018",
                    sliderCurrentVal: "1-15/11/2017",
                    onSliderInput: function( e ){
                        //console.log(e.target);
                        let periodIndex = e.target.value;
                        if( _App.periods[ this.key ][ periodIndex ] )
                        {
                            _App.totalSliderDate = periodIndex;
                            this.currentValue = periodIndex;
                            this.activeTitle = _App.periods[ this.key ][ _App.totalSliderDate ].title;

                            const NUM_PERIODS = 12; //this should be above the class declaration! and replace all other instances of "12" with this.
                            //clear all periods
                            for (let i = 0; i < NUM_PERIODS; i++)
                            {
                                _App.showPeriods[i] = false;
                            }

                            //from Nick: If you want to see only the current period and no others, enable this instead of the below loop.
                            _App.showPeriods[periodIndex] = true;

                            //from Nick: If you want to see all the periods up to the present, enable this instead of the above line.
                            /*
                            for (let i = 0; i < parseInt(periodIndex); i++)
                            {
                                _App.showPeriods[i] = true;
                            }
                            */

                            _App.slidersAsMap[ this.key ].activePeriod = _App.periods[ this.key ][ _App.totalSliderDate ];
                            _App.slidersAsMap[ "slider-userrate" ].slider.onSliderInput( e );
                            _App.slidersAsMap[ "slider-crimelevel" ].slider.onSliderInput( e );
                        }
                    },
                    HTML_slider: HTML_Slider,
                    init: function(){
                        const currentSliderUID = this.key;
                        _App.periods[ currentSliderUID ] = getPeriodsConfigTemplate();

                    }
                },

                {
                    key: "slider-userrate",
                    isActive: false,
                    title: "User Rating",
                    activeTitle: "any",
                    currentValue: "0",
                    tabOnClick: tabconfigSwitcher,
                    HTML_tab: HTML_tab,
                    sliderMinVal: "Nov 2017",
                    sliderMaxVal: "April 2018",
                    sliderCurrentVal: "1-15/11/2017",
                    onSliderInput: function( e ){

                        if( _App.periods[ this.key ][ e.target.value ] ){
                            _App.userRatingDate = 9;//e.target.value;
                            this.currentValue = 9;//e.target.value;
                            this.activeTitle = _App.periods[ this.key ][ _App.userRatingDate ].title;
                            _App.slidersAsMap[ this.key ].activePeriod = _App.periods[ this.key ][ _App.userRatingDate ];
                        }
                    },
                    HTML_slider: HTML_Slider,
                    init: function(){
                        const currentSliderUID = this.key;
                        _App.periods[ currentSliderUID ] = getPeriodsConfigTemplate();
                        axios.get( userRating ).then((result) => {
                            let tempData = result.data;
                            _App.rateLevelJSON = tempData;
                            for (let i = 0; i < tempData.features.length; i++) {
                                _App.presetFeaturesToPeriods(
                                    _App.periods[ currentSliderUID ],
                                    tempData.features[i].properties.timestamp,
                                    tempData.features[i]
                                );
                            }
                        });
                    }
                },

                {
                    key: "slider-crimelevel",
                    isActive: false,
                    title: "Crime level",
                    activeTitle: "any",
                    currentValue: "0",
                    tabOnClick: tabconfigSwitcher,
                    HTML_tab: HTML_tab,
                    sliderMinVal: "Nov 2017",
                    sliderMaxVal: "April 2018",
                    sliderCurrentVal: "1-15/11/2017",
                    onSliderInput: function( e ){
                        if( !_App.plane ){
                            return false;
                        }
                        if( _App.periods[ this.key ][ e.target.value ] ){
                            _App.crimeLevelDate = e.target.value;
                            this.currentValue = e.target.value;
                            this.activeTitle = _App.periods[ this.key ][ _App.crimeLevelDate ].title;
                            _App.slidersAsMap[ this.key ].activePeriod = _App.periods[ this.key ][ _App.crimeLevelDate ];
                            let jsonHexagon = _App.slidersAsMap[ this.key ].activePeriod.places;
                            let json = [];
                            for (let i = 0; i < jsonHexagon.length; i++) {
                                json.push( jsonHexagon[i].geometry.coordinates );
                            }
                            _App.hexagon_arr = json;
                            setTimeout( () => {
                                _App.plane.initHexagonData(
                                    _App._deck.props.layers[3].state.hexagons,
                                    true
                                );
                            }, 30 );
                        }
                    },
                    HTML_slider: HTML_Slider,
                    init: function(){
                        const currentSliderUID = this.key;
                        _App.periods[ currentSliderUID ] = getPeriodsConfigTemplate();
                        for (let i = 0; i < _App.allCrimeData.length; i++) {
                            _App.presetFeaturesToPeriods(
                                _App.periods[ currentSliderUID ],
                                _App.allCrimeData[i].original.DATE,
                                _App.allCrimeData[i]
                            );
                        }
                        _App.slidersAsMap[ this.key ].activePeriod = _App.periods[ this.key ][0];
                    }
                }
            ];

            for( let i = 0; i < this.slidersConfig.length; i++ ){
                _App.slidersAsMap[ this.slidersConfig[i].key ] =  { slider: this.slidersConfig[i] };
                if( this.slidersConfig[i].init ){
                    this.slidersConfig[i].init();
                    if( _App.periods[ this.slidersConfig[i].key ] ){
                        _App.slidersAsMap[ this.slidersConfig[i].key ].periods = _App.periods[ this.slidersConfig[i].key ];
                        _App.slidersAsMap[ this.slidersConfig[i].key ].activePeriod = _App.periods[ this.slidersConfig[i].key ][0];
                    }
                }
            }

        }

        return this.slidersConfig;
    }

    getSlidersConfig(){
        return this.slidersConfig || this.initSliderConfig();
    }

    playTotalSliderStep(){
        if( !this.totalSliderPlayerActive ){
            this.stopTotalSlider();
        }
        this.totalSliderPlayer = setTimeout( () => {
            let totalPeriods = this.slidersAsMap[ "slider-total" ].periods.length;
            if( this.totalSliderDate >= totalPeriods ){
                 this.stopTotalSlider();
            } else if( this.totalSliderDate < totalPeriods ) {
                this.slidersAsMap[ "slider-total" ].slider.onSliderInput({
                    target: {
                        value: this.totalSliderDate
                    }
                });
                this.totalSliderDate++;
                this.playTotalSliderStep();
            }
        }, this.totalSliderPlayerDelay );
    }

    playTotalSlider(){
        if(!this.totalSliderPlayerActive){
            this.totalSliderPlayerActive = true;
            this.totalSliderDate = 0;
            this.playTotalSliderStep();
        }
    }

    stopTotalSlider(){
        if( this.totalSliderPlayer ){
            this.totalSliderPlayerActive = false;
            this.totalSliderDate = 0;
            this.slidersAsMap[ "slider-total" ].slider.onSliderInput({
                target: {
                    value: this.totalSliderDate
                }
            });
            clearTimeout( this.totalSliderPlayer );
        }
    }

    HTML_getSliders(){

        let slidersConfig = this.getSlidersConfig();

        const getTabs = () => {
            return slidersConfig.map( ( obj, iterator ) => obj.HTML_tab( obj, iterator ) )
        };

        const getSliders = () => {
            return slidersConfig.map( ( obj, iterator ) => obj.HTML_slider( obj, iterator ) )
        };

        const tabs =  slidersConfig.map( ( obj, iterator ) => obj.HTML_tab( obj, iterator ) );
        const sliders = slidersConfig.map( ( obj, iterator ) => obj.HTML_slider( obj, iterator ) );

        let playStopClasses = this.totalSliderPlayerActive ? {
            play: "inactive",
            stop: "inactive"
            // stop: "active"
        } :  {
            // play: "active",
            play: "inactive",
            stop: "inactive"
        };

        return (
            <div className='sliders'>
                <div className="slider-tabs">
                    { tabs }
                </div>
                { sliders }
                <button className={`button-${ playStopClasses.play }`} onClick={() => {
                    this.playTotalSlider();
                }}> play </button>
                <button className={`button-${ playStopClasses.stop }`} onClick={() => {
                    this.stopTotalSlider();
                }}> stop </button>
            </div>
        );

    }

    HTML_getDeckGL(){

        const self = this;

        const {
            viewState,
            baseMap = true
        } = this.props;

        const layers = this.generateLayers();
        // const layers = this.LAYERS;

        return (
            <div>
                <DeckGL
                    initialViewState={ INITIAL_VIEW_STATE }
                    ref={ref => {
                        this._deck = ref && ref.deck;
                    }}
                    layers={layers}
                    viewState={this.state.viewState}
                    controller={true}
                    onClick={this._onClick.bind(this)}
                    onViewStateChange={this._onViewStateChange}
                    onLoad={this._onLoad}
                    >
                    <StaticMap
                        ref={ref => {
                            this._map = ref && ref.getMap();
                        }}
                        mapStyle="mapbox://styles/todorov/cjp9uvs0g61552stmb6982ojb"
                        mapboxApiAccessToken={'pk.eyJ1IjoidG9kb3JvdiIsImEiOiJjam9wcmJ6M3ExdDFwM3dteXJ3cG56dDh0In0.-F17vlU1uDd2ouy6t1VxpQ'}
                        onLoad={this._onMapLoad}
                        onClick={this._onClick.bind(this)}
                    />
                </DeckGL>
            </div>
        );
    }

    HTML_getLegend(){
        return (
            <div>
                <table className="legend1">
                    <tbody>
                    <tr>
                        <th></th>
                        <th align="left">Lux</th>
                        <th align="left">Light Quality</th>
                    </tr>

                    <tr>
                        <td><span style={{ backgroundColor: "hsl(204, 100%, 37%)" }}></span></td>
                        <td>0-5</td>
                        <td>Dark zone/Unsafe</td>
                    </tr>

                    <tr>
                        <td><span style={{ backgroundColor: "hsl(188, 100%, 31%)" }}></span></td>
                        <td>5-20</td>
                        <td>Properly Lit</td>
                    </tr>

                    <tr>
                        <td><span style={{ backgroundColor: "hsl(176, 100%, 36%)" }}></span></td>
                        <td>20-215</td>
                        <td>Very Well Lit</td>
                    </tr>
                    <tr>
                        <td><span style={{ backgroundColor: "hsl(55, 86%, 56%)" }}></span></td>
                        <td>&gt;215</td>
                        <td>Light pollution zone</td>
                    </tr>
                    </tbody>
                </table>
                <table className="legend2">
                    <tbody>
                    <tr>
                        <th></th>
                        <th align="left">Rating</th>
                        <th align="left">Safety Quality</th>
                    </tr>

                    <tr>
                        <td><span style={{ backgroundColor: "hsl(326, 86%, 53%)" }} ></span></td>
                        <td style={{ width: "39px" }}>1</td>
                        <td style={{ width: "106px" }}>Unsafe</td>
                    </tr>

                    <tr>
                        <td><span style={{ backgroundColor: "hsl(326, 63%, 67%)" }}></span></td>
                        <td>2</td>
                        <td>Somewhat Unsafe</td>
                    </tr>

                    <tr>
                        <td><span style={{ backgroundColor: "hsl(289, 100%, 84%)" }}></span></td>
                        <td>3</td>
                        <td style={{ width: "106px" }}>Don't Know </td>
                    </tr>

                    <tr>
                        <td><span style={{ backgroundColor: "hsl(284, 71%, 59%)" }}></span></td>
                        <td>4</td>
                        <td>Somewhat Safe</td>
                    </tr>

                    <tr>
                        <td><span style={{ backgroundColor: "hsl(268, 67%, 46%)" }}></span></td>
                        <td>5</td>
                        <td>Very Safe</td>
                    </tr>

                    </tbody>
                </table>
            </div>


        );

    }

    render() {
        return (
            <div>
                { this.HTML_getMapTitleBlock() }
                { this.HTML_getButtonsTable() }
                { this.HTML_getLegend() }
                { this.HTML_getInfoBlock() }
                { this.HTML_getSliders() }
                <div className='tooltip' id='tooltip'></div>
                { this.HTML_getDeckGL() }

            </div>
        );
    }
}

export function renderToDOM(container) {
    render(<App/>, container);
}
